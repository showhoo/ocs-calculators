import { describe, expect, it } from 'vitest';
import { crossSpanAnalyze, type CrossSpanNodeInput } from './index';

/**
 * 站点 https://www.itswe.com/calculator/cross-span/ 参考默认示范（负载计算法）：
 *   N=5、a=5、L=30、l₁=15、f_max=3、J=65、q₀=1.8、n=1、g_c=0.615、P=0
 *
 *   Q   = 65 + 1·1.8·5 + 0 + 0.615·5 = 77.075 kg；ΣQ = 385.375
 *   f   = [1.667, 2.667, 3, 2.667, 1.667]
 *   b_i = [5.1, 5.011, 5.011, 5.1]；端段 5.278 + 5.278；Σb = 30.778
 *   H   = M(l₁)/f_max = 578.06 kg；H' = 963.44 kg
 */
const DEFAULT: CrossSpanNodeInput = {
  nodeCount: 5,
  spacingM: 5,
  spanTotalM: 30,
  lowPointFromLeftM: 15,
  maxSagM: 3,
  nodeLoadKg: 65,
  suspensionWeightKgPerM: 1.8,
  suspensionGroups: 1,
  cableWeightKgPerM: 0.615,
  insulatorDistributedKg: 0,
};

describe('cross-span - 默认示例', () => {
  it('节点垂直负载 Q_i = J + n·q₀·a + P + g_c·a', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.nodeQ).toHaveLength(5);
    for (const q of r.nodeQ) expect(q).toBeCloseTo(77.075, 12);
    expect(r.totalLoadKg).toBeCloseTo(385.375, 12);
  });

  it('节点位置 x_i = a·(i+1)，从 a 到末节点', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.nodeX).toEqual([5, 10, 15, 20, 25]);
  });

  it('节点弛度呈对称抛物线分布', () => {
    const r = crossSpanAnalyze(DEFAULT);
    const expected = [1.667, 2.667, 3, 2.667, 1.667];
    r.nodeSag.forEach((f, i) => {
      const e = expected[i];
      if (e === undefined) throw new Error('缺少期望弛度');
      expect(f).toBeCloseTo(e, 3);
    });
  });

  it('分段索长与支柱锚固段', () => {
    const r = crossSpanAnalyze(DEFAULT);
    const seg = [5.1, 5.011, 5.011, 5.1];
    r.segmentLength.forEach((b, i) => {
      const e = seg[i];
      if (e === undefined) throw new Error('缺少期望分段索长');
      expect(b).toBeCloseTo(e, 3);
    });
    expect(r.endLeftM).toBeCloseTo(5.278, 3);
    expect(r.endRightM).toBeCloseTo(5.278, 3);
  });

  it('总索长 Σb = 30.778', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.totalLengthM).toBeCloseTo(30.778, 3);
  });

  it('水平张力精确式 H = 578.06，简化式 H′ = 963.44', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.horizontalForceKg).toBeCloseTo(578.06, 2);
    expect(r.horizontalForceSimpleKg).toBeCloseTo(963.44, 2);
  });
});

describe('cross-span - 数值性质', () => {
  it('最低点在跨中时弛度关于跨中对称', () => {
    const r = crossSpanAnalyze(DEFAULT);
    const n = r.nodeSag.length;
    for (let i = 0; i < n; i++) {
      const left = r.nodeSag[i];
      const right = r.nodeSag[n - 1 - i];
      if (left === undefined || right === undefined) throw new Error('缺少弛度');
      expect(left).toBeCloseTo(right, 12);
    }
  });

  it('最低点偏移时最大弛度落在 l₁ 一侧', () => {
    // 最低点在左半跨，f 峰值节点位置应靠近 l₁
    const r = crossSpanAnalyze({ ...DEFAULT, lowPointFromLeftM: 10 });
    let maxF = -Infinity;
    let maxX = -1;
    r.nodeSag.forEach((f, i) => {
      if (f === undefined) throw new Error('缺少弛度');
      if (f > maxF) {
        maxF = f;
        const x = r.nodeX[i];
        if (x !== undefined) maxX = x;
      }
    });
    expect(maxX).toBeCloseTo(10, 9);
  });

  it('负载越重则节点负载与水平张力越大', () => {
    const heavier = crossSpanAnalyze({ ...DEFAULT, nodeLoadKg: 100 });
    const base = crossSpanAnalyze(DEFAULT);
    expect(heavier.nodeQ[0]).toBeGreaterThan(base.nodeQ[0] ?? 0);
    expect(heavier.totalLoadKg).toBeGreaterThan(base.totalLoadKg);
    expect(heavier.horizontalForceKg).toBeGreaterThan(base.horizontalForceKg);
  });

  it('节点数增加且间距不变时节点数成正比', () => {
    const r = crossSpanAnalyze({ ...DEFAULT, nodeCount: 4 });
    expect(r.nodeX).toHaveLength(4);
    expect(r.nodeX).toEqual([5, 10, 15, 20]);
    expect(r.segmentLength).toHaveLength(3);
  });

  it('水平张力简化式为精确式的对照值（默认对称时 H′>H）', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.horizontalForceSimpleKg).toBeGreaterThan(r.horizontalForceKg);
  });
});

describe('cross-span - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => crossSpanAnalyze({ ...DEFAULT, nodeCount: 1 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, nodeCount: 1.5 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, spacingM: 0 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, spanTotalM: -10 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, lowPointFromLeftM: 0 })).toThrow(
      RangeError,
    );
    expect(() => crossSpanAnalyze({ ...DEFAULT, lowPointFromLeftM: 30 })).toThrow(
      RangeError,
    );
    expect(() => crossSpanAnalyze({ ...DEFAULT, maxSagM: 0 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, nodeLoadKg: -5 })).toThrow(RangeError);
    expect(() => crossSpanAnalyze({ ...DEFAULT, suspensionGroups: 0 })).toThrow(
      RangeError,
    );
    expect(() => crossSpanAnalyze({ ...DEFAULT, cableWeightKgPerM: -1 })).toThrow(
      RangeError,
    );
    expect(() => crossSpanAnalyze({ ...DEFAULT, insulatorDistributedKg: -1 })).toThrow(
      RangeError,
    );
  });

  it('末节点超出跨距时抛错', () => {
    expect(() => crossSpanAnalyze({ ...DEFAULT, nodeCount: 8 })).toThrow(RangeError);
  });

  it('直线等布置下两支柱端索长对称', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.endLeftM).toBeCloseTo(r.endRightM, 12);
  });
});