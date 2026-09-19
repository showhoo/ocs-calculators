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
 *
 * 布设口径（2026-09-19 修订）：节点对称布设 x₁=(L−(N−1)a)/2、x_i=x₁+(i−1)a，
 * 约束 L>(N−1)a，与站点页面内联实现逐行对齐。本例 L=30、N=5、a=5 时
 * x₁=(30−20)/2=5，对称布设与旧 npm 口径 x=a·(i+1) 数值恰好重合，
 * 上述期望值在两种口径下相同，故保留。
 * 旧 npm 布设（x=a·(i+1)、约束 N·a<L）系 0.2.0 新增模块时「期望值由公式独立
 * 算出」的产物，与站点不一致；依 README「与站点实现的同步政策」（新增 8 模块
 * 以站点 online 页面公式为基准）改写为站点模型，旧口径测试已随本修订废弃。
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

  it('节点对称布设：x₁=(L−(N−1)a)/2，x_i=x₁+(i−1)a（本例与旧口径重合）', () => {
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

/**
 * 审计回归算例（2026-09-19 第 1 波审计定案，锁定站点对称布设行为）：
 *   N=5、a=5、L=60、l₁=30、f_max=6、J=65、q₀=0.615、n=2、g_c=0.615、P=50
 *
 * 布设：spanNeed=(5−1)×5=20 < 60；x₁=(60−20)/2=20 → x = 20/25/30/35/40
 * 负载：Q = 65 + 2·0.615·5 + 50 + 0.615·5 = 124.225 kg；ΣQ = 621.125 kg
 * 弛度：f = 6·(1−((x−30)/30)²) = [5.3333, 5.8333, 6, 5.8333, 5.3333]
 * 张力：R_l = 621.125×(60−30)/60 = 310.5625；
 *       M(l₁) = 310.5625×30 − 124.225×(30−20) − 124.225×(30−25) = 7453.5
 *       H = 7453.5/6 = 1242.25 kg（与审计给定值一致；按站点 index.html 内联
 *       实现逐行复算相符，无需容差折让）；简化式 H′ = 621.125×30/12 = 1552.8125 kg
 * 索长：b_i = [5.025, 5.002778, 5.002778, 5.025]；端段 20.711111×2；Σb = 61.477778
 */
describe('cross-span - 审计回归（站点对称布设 N=5 L=60）', () => {
  const AUDIT: CrossSpanNodeInput = {
    nodeCount: 5,
    spacingM: 5,
    spanTotalM: 60,
    lowPointFromLeftM: 30,
    maxSagM: 6,
    nodeLoadKg: 65,
    suspensionWeightKgPerM: 0.615,
    suspensionGroups: 2,
    cableWeightKgPerM: 0.615,
    insulatorDistributedKg: 50,
  };

  it('节点位置 x = 20/25/30/35/40', () => {
    const r = crossSpanAnalyze(AUDIT);
    expect(r.nodeX).toEqual([20, 25, 30, 35, 40]);
  });

  it('节点负载 Q = 124.225 kg，ΣQ = 621.125 kg', () => {
    const r = crossSpanAnalyze(AUDIT);
    for (const q of r.nodeQ) expect(q).toBeCloseTo(124.225, 12);
    expect(r.totalLoadKg).toBeCloseTo(621.125, 12);
  });

  it('水平张力 H = 1242.25 kg（力矩平衡精确式）', () => {
    const r = crossSpanAnalyze(AUDIT);
    expect(r.horizontalForceKg).toBeCloseTo(1242.25, 9);
    expect(r.horizontalForceSimpleKg).toBeCloseTo(1552.8125, 9);
  });

  it('分段索长与总索长', () => {
    const r = crossSpanAnalyze(AUDIT);
    const seg = [5.025, 5.002778, 5.002778, 5.025];
    r.segmentLength.forEach((b, i) => {
      const e = seg[i];
      if (e === undefined) throw new Error('缺少期望分段索长');
      expect(b).toBeCloseTo(e, 6);
    });
    expect(r.endLeftM).toBeCloseTo(20.711111, 6);
    expect(r.endRightM).toBeCloseTo(20.711111, 6);
    expect(r.totalLengthM).toBeCloseTo(61.477778, 6);
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

  it('节点数变化时按对称布设重排（N=4：x₁=(30−15)/2=7.5）', () => {
    const r = crossSpanAnalyze({ ...DEFAULT, nodeCount: 4 });
    expect(r.nodeX).toHaveLength(4);
    expect(r.nodeX).toEqual([7.5, 12.5, 17.5, 22.5]);
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

  it('L ≤ (N−1)·a 时抛错（站点口径：L 应大于 (N−1)×a）', () => {
    // N=5、a=5 → (N−1)·a=20：L=20 恰好等于布设所需长度，抛错
    expect(() => crossSpanAnalyze({ ...DEFAULT, spanTotalM: 20 })).toThrow(RangeError);
    // N=8、a=5 → 35 > L=30，同样抛错
    expect(() => crossSpanAnalyze({ ...DEFAULT, nodeCount: 8 })).toThrow(RangeError);
    // 站点对称布设放宽后 L=21 即可容纳（旧口径 N·a=25 < 21 不成立，会误抛）
    const r = crossSpanAnalyze({ ...DEFAULT, spanTotalM: 21 });
    expect(r.nodeX).toEqual([0.5, 5.5, 10.5, 15.5, 20.5]);
  });

  it('直线等布置下两支柱端索长对称', () => {
    const r = crossSpanAnalyze(DEFAULT);
    expect(r.endLeftM).toBeCloseTo(r.endRightM, 12);
  });
});