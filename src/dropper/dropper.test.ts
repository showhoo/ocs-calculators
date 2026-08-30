import { describe, expect, it } from 'vitest';
import {
  dropperLengths,
  dropperPositionsM,
  maxParabolaSagM,
  parabolaSagM,
  type DropperInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/dropper/ 已发布的输出表（简单链形悬挂）。
 *
 * 跨距 L=60 m、结构高度 H=1.4 m、吊弦间距 d=6 m → 11 个计算点。
 *
 * ⚠️ 关于 T_c 与 q_c 的取值：站点输出只确定了比值 q_c/T_c = 1.03846e-3 /m。
 * 此处取 T_c = 13 kN、q_c = 0.0135 kN/m（满足该比值且为合理工程量级），
 * 可逐位复现站点全部 11 行输出。若站点实际默认值不同，请提 issue 告知，
 * 公式本身不受影响。
 */
const INPUT: DropperInput = {
  suspension: 'simple',
  spanM: 60,
  contactTensionKN: 13,
  structureHeightM: 1.4,
  contactLoadKNPerM: 0.0135,
  dropperSpacingM: 6,
};

/** 站点输出表（弛度 4 位小数，吊弦长度 4 位小数） */
const PUBLISHED_TABLE = [
  { i: 0, x: 0, f: 0.0, l: 1.4 },
  { i: 1, x: 6, f: 0.1682, l: 1.2318 },
  { i: 2, x: 12, f: 0.2991, l: 1.1009 },
  { i: 3, x: 18, f: 0.3925, l: 1.0075 },
  { i: 4, x: 24, f: 0.4486, l: 0.9514 },
  { i: 5, x: 30, f: 0.4673, l: 0.9327 },
  { i: 6, x: 36, f: 0.4486, l: 0.9514 },
  { i: 7, x: 42, f: 0.3925, l: 1.0075 },
  { i: 8, x: 48, f: 0.2991, l: 1.1009 },
  { i: 9, x: 54, f: 0.1682, l: 1.2318 },
  { i: 10, x: 60, f: 0.0, l: 1.4 },
] as const;

describe('dropper - 与站点已发布输出表回归', () => {
  it('复现 11 个吊弦点的弛度与吊弦长度', () => {
    const r = dropperLengths(INPUT);

    expect(r.count).toBe(11);
    expect(r.points).toHaveLength(PUBLISHED_TABLE.length);

    r.points.forEach((p, i) => {
      const row = PUBLISHED_TABLE[i];
      if (!row) throw new Error(`缺少第 ${i} 行期望值`);
      expect(p.index).toBe(row.i);
      expect(p.positionM).toBeCloseTo(row.x, 9);
      expect(p.contactSagM).toBeCloseTo(row.f, 4);
      expect(p.dropperLengthM).toBeCloseTo(row.l, 4);
    });
  });

  it('最大弛度与最短吊弦与站点一致', () => {
    const r = dropperLengths(INPUT);
    expect(r.maxSagM).toBeCloseTo(0.4673, 4);
    expect(r.shortestDropperM).toBeCloseTo(0.9327, 4);
  });

  it('最短吊弦位于跨中', () => {
    const r = dropperLengths(INPUT);
    const shortest = r.points.reduce((a, b) =>
      a.dropperLengthM <= b.dropperLengthM ? a : b,
    );
    expect(shortest.positionM).toBeCloseTo(INPUT.spanM / 2, 9);
  });
});

describe('dropper - 纯公式校验', () => {
  it('f(x) = q·x·(L−x)/(2·T)', () => {
    // 手算：0.0135 × 6 × 54 / (2 × 13) = 4.374 / 26 = 0.1682308
    expect(parabolaSagM(6, 60, 0.0135, 13)).toBeCloseTo(0.1682308, 6);
  });

  it('两端弛度为 0', () => {
    expect(parabolaSagM(0, 60, 0.0135, 13)).toBe(0);
    expect(parabolaSagM(60, 60, 0.0135, 13)).toBe(0);
  });

  it('跨中弛度等于 q·L²/(8·T)', () => {
    expect(maxParabolaSagM(60, 0.0135, 13)).toBeCloseTo(
      parabolaSagM(30, 60, 0.0135, 13),
      12,
    );
  });

  it('吊弦点位含两端且等间距', () => {
    const pts = dropperPositionsM(60, 6);
    expect(pts).toEqual([0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60]);
  });

  it('弛度关于跨中对称', () => {
    const r = dropperLengths(INPUT);
    const n = r.points.length;
    for (let i = 0; i < n; i++) {
      const left = r.points[i];
      const right = r.points[n - 1 - i];
      if (!left || !right) throw new Error('结果缺失');
      expect(left.contactSagM).toBeCloseTo(right.contactSagM, 12);
      expect(left.dropperLengthM).toBeCloseTo(right.dropperLengthM, 12);
    }
  });
});

describe('dropper - 弹性链形悬挂', () => {
  const ELASTIC: DropperInput = {
    ...INPUT,
    suspension: 'elastic',
    messenger: { tensionKN: 20, loadKNPerM: 0.008 },
  };

  it('弹性链形计入承力索弛度：l = H − f_c + f_m', () => {
    const r = dropperLengths(ELASTIC);
    for (const p of r.points) {
      const expected = INPUT.structureHeightM - p.contactSagM + p.messengerSagM;
      expect(p.dropperLengthM).toBeCloseTo(expected, 12);

      // 两端支承点处承力索弛度为 0，跨内才为正
      if (p.positionM > 0 && p.positionM < INPUT.spanM) {
        expect(p.messengerSagM).toBeGreaterThan(0);
      } else {
        expect(p.messengerSagM).toBe(0);
      }
    }
  });

  it('跨内吊弦比简单链形长，两端支承点两者相同', () => {
    const simple = dropperLengths(INPUT);
    const elastic = dropperLengths(ELASTIC);
    elastic.points.forEach((p, i) => {
      const s = simple.points[i];
      if (!s) throw new Error('结果缺失');

      // 支承点处接触线与承力索弛度均为 0，两种悬挂的吊弦长度都等于结构高度
      if (p.positionM > 0 && p.positionM < INPUT.spanM) {
        expect(p.dropperLengthM).toBeGreaterThan(s.dropperLengthM);
      } else {
        expect(p.dropperLengthM).toBeCloseTo(s.dropperLengthM, 12);
      }
    });
  });

  it('简单链形恒不产生承力索弛度', () => {
    const r = dropperLengths(INPUT);
    for (const p of r.points) {
      expect(p.messengerSagM).toBe(0);
    }
  });

  it('弹性链形缺承力索参数时抛错', () => {
    expect(() =>
      dropperLengths({ ...INPUT, suspension: 'elastic' }),
    ).toThrow(RangeError);
    expect(() =>
      dropperLengths({
        ...INPUT,
        suspension: 'elastic',
        messenger: { tensionKN: 0, loadKNPerM: 0.008 },
      }),
    ).toThrow(RangeError);
  });
});

describe('dropper - 输入校验', () => {
  it('吊弦间距不能整除跨距时抛错', () => {
    expect(() => dropperPositionsM(60, 7)).toThrow(RangeError);
    expect(() => dropperLengths({ ...INPUT, dropperSpacingM: 7 })).toThrow(RangeError);
  });

  it('结构高度不足导致吊弦长度非正时抛错', () => {
    expect(() =>
      dropperLengths({ ...INPUT, structureHeightM: 0.3 }),
    ).toThrow(RangeError);
  });

  it('非法参数抛 RangeError', () => {
    expect(() => dropperLengths({ ...INPUT, spanM: 0 })).toThrow(RangeError);
    expect(() => dropperLengths({ ...INPUT, contactTensionKN: -1 })).toThrow(RangeError);
    expect(() => dropperLengths({ ...INPUT, contactLoadKNPerM: 0 })).toThrow(RangeError);
    expect(() => dropperLengths({ ...INPUT, structureHeightM: -0.5 })).toThrow(RangeError);
    expect(() => parabolaSagM(90, 60, 0.0135, 13)).toThrow(RangeError);
    expect(() => parabolaSagM(6, 60, 0.0135, 0)).toThrow(RangeError);
  });
});
