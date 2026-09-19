import { describe, expect, it } from 'vitest';
import {
  dropperLengths,
  dropperPositionsM,
  maxParabolaSagM,
  parabolaSagM,
  type DropperInput,
} from './index';

/**
 * 2026-09-19 修复批 D 口径更正后的回归表（与站点 /calculator/dropper/ 同步）。
 *
 * 新口径（物理推导 + 站内 design/dropper-layout.wiki 双证）：
 *   承力索下垂使吊弦变短、接触线（相对水平）下垂使吊弦变长，l = C − f_m + f_c。
 *   f_m(x) = 4·f_m_max·x(L−x)/L²，f_m_max = w·L²/(8·T_m)，w = q_c + q_m；
 *   f_c(x) = 4·f_c_max·x(L−x)/L²，f_c_max = q_c·L²/(8·T_c)。
 *   旧实现把承力索/接触线弛度角色写反（简单模式 l=H−f_c、弹性模式 l=H−f_c+f_m），已废弃。
 *
 * 锚点输入：H=1.4、Tc=13、qc=0.0135、Tm=15、qm=0.0105、L=60、d=6
 *   w      = 0.0135+0.0105        = 0.024 kN/m
 *   f_m_max= 0.024×3600/(8×15)    = 0.72 m
 *   f_c_max= 0.0135×3600/(8×13)   = 0.46730769 m
 *   跨中简单模式 l = 1.4−0.72                     = 0.68 m
 *   跨中弹性模式 l = 1.4−0.72+0.46730769          = 1.14730769 m
 *
 * f_m(x) = 0.0008·x(60−x)（4×0.72/3600），f_c(x) = 0.000519230769…·x(60−x)
 * 期望值全部由脚本按上式逐点生成（/tmp/dcalc/dropper.mjs），非手算。
 */
const INPUT: DropperInput = {
  suspension: 'simple',
  spanM: 60,
  contactTensionKN: 13,
  structureHeightM: 1.4,
  contactLoadKNPerM: 0.0135,
  dropperSpacingM: 6,
  messenger: { tensionKN: 15, loadKNPerM: 0.0105 },
};

/** 简单链形：l = H − f_m（4 位小数，脚本逐点生成） */
const SIMPLE_TABLE = [
  { i: 0, x: 0, fm: 0.0, l: 1.4 },
  { i: 1, x: 6, fm: 0.2592, l: 1.1408 },
  { i: 2, x: 12, fm: 0.4608, l: 0.9392 },
  { i: 3, x: 18, fm: 0.6048, l: 0.7952 },
  { i: 4, x: 24, fm: 0.6912, l: 0.7088 },
  { i: 5, x: 30, fm: 0.72, l: 0.68 },
  { i: 6, x: 36, fm: 0.6912, l: 0.7088 },
  { i: 7, x: 42, fm: 0.6048, l: 0.7952 },
  { i: 8, x: 48, fm: 0.4608, l: 0.9392 },
  { i: 9, x: 54, fm: 0.2592, l: 1.1408 },
  { i: 10, x: 60, fm: 0.0, l: 1.4 },
] as const;

/** 弹性链形：l = H − f_m + f_c（4 位小数，脚本逐点生成） */
const ELASTIC_TABLE = [
  { i: 0, x: 0, l: 1.4 },
  { i: 1, x: 6, l: 1.3090 },
  { i: 2, x: 12, l: 1.2383 },
  { i: 3, x: 18, l: 1.1877 },
  { i: 4, x: 24, l: 1.1574 },
  { i: 5, x: 30, l: 1.1473 },
  { i: 6, x: 36, l: 1.1574 },
  { i: 7, x: 42, l: 1.1877 },
  { i: 8, x: 48, l: 1.2383 },
  { i: 9, x: 54, l: 1.3090 },
  { i: 10, x: 60, l: 1.4 },
] as const;

describe('dropper - 简单链形（总荷载口径）回归', () => {
  it('复现 11 个吊弦点的承力索弛度与吊弦长度', () => {
    const r = dropperLengths(INPUT);

    expect(r.count).toBe(11);
    expect(r.points).toHaveLength(SIMPLE_TABLE.length);

    r.points.forEach((p, i) => {
      const row = SIMPLE_TABLE[i];
      if (!row) throw new Error(`缺少第 ${i} 行期望值`);
      expect(p.index).toBe(row.i);
      expect(p.positionM).toBeCloseTo(row.x, 9);
      expect(p.messengerSagM).toBeCloseTo(row.fm, 9);
      expect(p.dropperLengthM).toBeCloseTo(row.l, 9);
    });
  });

  it('锚点：f_m_max=0.72、跨中最短吊弦 0.68', () => {
    const r = dropperLengths(INPUT);
    expect(r.maxSagM).toBeCloseTo(0.72, 9);
    expect(r.shortestDropperM).toBeCloseTo(0.68, 9);
  });

  it('最短吊弦位于跨中，两端吊弦等于结构高度', () => {
    const r = dropperLengths(INPUT);
    const shortest = r.points.reduce((a, b) =>
      a.dropperLengthM <= b.dropperLengthM ? a : b,
    );
    expect(shortest.positionM).toBeCloseTo(INPUT.spanM / 2, 9);
    expect(r.points[0]?.dropperLengthM).toBeCloseTo(1.4, 12);
    expect(r.points[10]?.dropperLengthM).toBeCloseTo(1.4, 12);
  });
});

describe('dropper - 弹性链形回归', () => {
  const ELASTIC: DropperInput = {
    ...INPUT,
    suspension: 'elastic',
  };

  it('复现 11 个吊弦点：l = H − f_m + f_c', () => {
    const r = dropperLengths(ELASTIC);
    r.points.forEach((p, i) => {
      const row = ELASTIC_TABLE[i];
      if (!row) throw new Error(`缺少第 ${i} 行期望值`);
      expect(p.dropperLengthM).toBeCloseTo(row.l, 4);
    });
  });

  it('锚点：跨中弹性模式 l = 1.14730769', () => {
    const r = dropperLengths(ELASTIC);
    expect(r.shortestDropperM).toBeCloseTo(1.1473076923076924, 9);
    expect(r.maxSagM).toBeCloseTo(0.72 - 0.46730769230769226, 9);
  });

  it('弹性链形各点接触线弛度为 f_c(x)，使吊弦比简单链形长', () => {
    const simple = dropperLengths(INPUT);
    const elastic = dropperLengths(ELASTIC);
    elastic.points.forEach((p, i) => {
      const s = simple.points[i];
      if (!s) throw new Error('结果缺失');
      // 两端 f_c = 0，两种悬挂吊弦长度相同；跨内 f_c > 0 使吊弦更长
      if (p.positionM > 0 && p.positionM < INPUT.spanM) {
        expect(p.contactSagM).toBeGreaterThan(0);
        expect(p.dropperLengthM).toBeGreaterThan(s.dropperLengthM);
      } else {
        expect(p.contactSagM).toBe(0);
        expect(p.dropperLengthM).toBeCloseTo(s.dropperLengthM, 12);
      }
    });
  });

  it('f_c(x) = 4·f_c_max·x(L−x)/L²，f_c_max = q_c·L²/(8·T_c)', () => {
    const r = dropperLengths(ELASTIC);
    const p6 = r.points[1];
    if (!p6) throw new Error('结果缺失');
    // f_c(6) = 0.0135×3600/104 × 4×6×54/3600 = 0.46730769×0.36 = 0.16823077
    expect(p6.contactSagM).toBeCloseTo(0.1682307692307692, 9);
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

  it('承力索总荷载弛度：w = q_c + q_m = 0.024 → f_m_max = 0.72', () => {
    expect(maxParabolaSagM(60, 0.024, 15)).toBeCloseTo(0.72, 9);
  });

  it('吊弦点位含两端且等间距', () => {
    const pts = dropperPositionsM(60, 6);
    expect(pts).toEqual([0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60]);
  });

  it('弛度与吊弦长度关于跨中对称', () => {
    const r = dropperLengths(INPUT);
    const n = r.points.length;
    for (let i = 0; i < n; i++) {
      const left = r.points[i];
      const right = r.points[n - 1 - i];
      if (!left || !right) throw new Error('结果缺失');
      expect(left.messengerSagM).toBeCloseTo(right.messengerSagM, 12);
      expect(left.dropperLengthM).toBeCloseTo(right.dropperLengthM, 12);
    }
  });
});

describe('dropper - 口径性质（2026-09-19 更正）', () => {
  it('简单链形也产生承力索弛度（总荷载口径）', () => {
    const r = dropperLengths(INPUT);
    for (const p of r.points) {
      if (p.positionM > 0 && p.positionM < INPUT.spanM) {
        expect(p.messengerSagM).toBeGreaterThan(0);
      }
      expect(p.contactSagM).toBe(0);
    }
  });

  it('Tc → ∞ 时弹性链形退化为简单链形', () => {
    const elastic = dropperLengths({ ...INPUT, suspension: 'elastic', contactTensionKN: 1e9 });
    const simple = dropperLengths(INPUT);
    elastic.points.forEach((p, i) => {
      const s = simple.points[i];
      if (!s) throw new Error('结果缺失');
      expect(p.dropperLengthM).toBeCloseTo(s.dropperLengthM, 6);
    });
  });

  it('弹性链形缺承力索参数或参数非正时抛错', () => {
    const noMessenger = { ...INPUT, suspension: 'elastic' } as unknown as DropperInput;
    delete (noMessenger as { messenger?: unknown }).messenger;
    expect(() => dropperLengths(noMessenger)).toThrow(RangeError);
    expect(() =>
      dropperLengths({
        ...INPUT,
        messenger: { tensionKN: 0, loadKNPerM: 0.0105 },
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
    expect(() => dropperLengths({ ...INPUT, messenger: { tensionKN: -1, loadKNPerM: 0.01 } })).toThrow(RangeError);
    expect(() => parabolaSagM(90, 60, 0.0135, 13)).toThrow(RangeError);
    expect(() => parabolaSagM(6, 60, 0.0135, 0)).toThrow(RangeError);
  });
});
