import { describe, expect, it } from 'vitest';
import {
  ampacityDeratingFactor,
  deratedAmpacityA,
  shortCircuitCheck,
  shortCircuitMinSectionMM2,
} from './index';
import { findAmpacityA, TB2809_AMPACITY_A } from '../data/tb2809-ampacity';

/**
 * 站点 https://www.itswe.com/calculator/ampacity/ 已发布的输出：
 *   载流量修正系数 = 0.938，修正后载流量 = 562.8 A，最小热稳截面 = 114.8 mm²，
 *   拟选截面判定 = 未判定
 *
 * 载流量反推：562.8 / 0.938 ≈ 600 → I₀ = 600 A；
 * √((Tmax−Ta)/(Tmax−25)) = 0.938083 → (Tmax−Ta)/(Tmax−25) = 0.88，
 * 取 Tmax = 150 ℃（铜合金）→ Ta = 40 ℃。完全吻合。
 *
 * 热稳定反推：站点自身注明"热稳定系数 C 属设计输入（站内未录入数值，待核实）"，
 * 因此仅 S_min = 114.8 被锁定。取 Ik=25 kA、tk=0.5 s、C=154 A·√s/mm²
 * （25000×√0.5/154 = 114.79）复现该值；C 与 I_k 请按设计手册与供电计算书核对。
 */
const SITE_DERATING = {
  baseAmpacityA: 600,
  maxAllowedTempDegC: 150,
  ambientTempDegC: 40,
};

describe('ampacity - 与站点已发布输出回归', () => {
  it('载流量修正系数 = 0.938083', () => {
    // 手算：√((150−40)/(150−25)) = √(110/125) = √0.88 = 0.9380832
    expect(ampacityDeratingFactor(SITE_DERATING)).toBeCloseTo(0.9380832, 6);
  });

  it('修正后载流量 = 562.85 A', () => {
    // 600 × 0.9380832 = 562.8499
    expect(deratedAmpacityA(SITE_DERATING)).toBeCloseTo(562.8499, 3);
  });

  it('最小热稳截面 = 114.79 mm²', () => {
    // 25000 × √0.5 / 154 = 114.789
    expect(shortCircuitMinSectionMM2(25, 0.5, 154)).toBeCloseTo(114.789, 2);
  });

  it('未填拟选截面时判定为 not-assessed', () => {
    const r = shortCircuitCheck({
      shortCircuitCurrentKA: 25,
      clearingTimeS: 0.5,
      thermalCoefficientC: 154,
      selectedSectionMM2: null,
    });
    expect(r.verdict).toBe('not-assessed');
    expect(r.minSectionMM2).toBeCloseTo(114.789, 2);
  });
});

describe('ampacity - 载流量修正性质', () => {
  it('环境温度等于基准温度时系数为 1', () => {
    const f = ampacityDeratingFactor({
      baseAmpacityA: 600,
      maxAllowedTempDegC: 150,
      ambientTempDegC: 25,
    });
    expect(f).toBeCloseTo(1, 12);
  });

  it('环境温度升高系数单调下降', () => {
    const f35 = ampacityDeratingFactor({ ...SITE_DERATING, ambientTempDegC: 35 });
    const f40 = ampacityDeratingFactor(SITE_DERATING);
    const f45 = ampacityDeratingFactor({ ...SITE_DERATING, ambientTempDegC: 45 });
    expect(f35).toBeGreaterThan(f40);
    expect(f40).toBeGreaterThan(f45);
  });

  it('支持自定义基准环境温度', () => {
    // 基准 40℃、实际 40℃ → 系数 1
    const f = ampacityDeratingFactor({
      baseAmpacityA: 600,
      maxAllowedTempDegC: 150,
      ambientTempDegC: 40,
      baseAmbientTempDegC: 40,
    });
    expect(f).toBeCloseTo(1, 12);
  });

  it('环境温度达到允许温度时抛错', () => {
    expect(() =>
      ampacityDeratingFactor({ ...SITE_DERATING, ambientTempDegC: 150 }),
    ).toThrow(RangeError);
    expect(() =>
      ampacityDeratingFactor({ ...SITE_DERATING, ambientTempDegC: 160 }),
    ).toThrow(RangeError);
  });
});

describe('ampacity - 热稳定校核', () => {
  it('拟选截面大于最小截面判合格', () => {
    const r = shortCircuitCheck({
      shortCircuitCurrentKA: 25,
      clearingTimeS: 0.5,
      thermalCoefficientC: 154,
      selectedSectionMM2: 120,
    });
    expect(r.verdict).toBe('pass');
  });

  it('拟选截面小于最小截面判不合格', () => {
    const r = shortCircuitCheck({
      shortCircuitCurrentKA: 25,
      clearingTimeS: 0.5,
      thermalCoefficientC: 154,
      selectedSectionMM2: 95,
    });
    expect(r.verdict).toBe('fail');
  });

  it('恰好等于最小截面判合格（判据为 ≥）', () => {
    const min = shortCircuitMinSectionMM2(25, 0.5, 154);
    const r = shortCircuitCheck({
      shortCircuitCurrentKA: 25,
      clearingTimeS: 0.5,
      thermalCoefficientC: 154,
      selectedSectionMM2: min,
    });
    expect(r.verdict).toBe('pass');
  });

  it('切除时间越长所需截面越大', () => {
    const s02 = shortCircuitMinSectionMM2(25, 0.2, 154);
    const s05 = shortCircuitMinSectionMM2(25, 0.5, 154);
    const s10 = shortCircuitMinSectionMM2(25, 1.0, 154);
    expect(s02).toBeLessThan(s05);
    expect(s05).toBeLessThan(s10);
    // 与 √t 成正比
    expect(s10).toBeCloseTo(s05 * Math.sqrt(2), 9);
  });
});

describe('ampacity - TB/T 2809-2017 表5 数据', () => {
  it('数据集非空且每种材质都有条目', () => {
    expect(TB2809_AMPACITY_A.length).toBeGreaterThan(50);
    const types = new Set(TB2809_AMPACITY_A.map((e) => e.type));
    for (const t of ['CT', 'CTA', 'CTS', 'CTSM', 'CTSH', 'CTM', 'CTMM', 'CTMH', 'CTCZ'] as const) {
      expect(types.has(t), `缺少 ${t}`).toBe(true);
    }
  });

  it('抽查处与标准表一致', () => {
    // CTA-120 室内 95℃ = 360 A
    expect(findAmpacityA({ type: 'CTA', crossSectionMM2: 120, condition: 'indoor-95' })).toBe(360);
    // CTA-150 室外 150℃ = 785 A
    expect(findAmpacityA({ type: 'CTA', crossSectionMM2: 150, condition: 'outdoor-150' })).toBe(785);
    // CTMH-120 室外 95℃ = 410 A
    expect(findAmpacityA({ type: 'CTMH', crossSectionMM2: 120, condition: 'outdoor-95' })).toBe(410);
  });

  it('纯铜不考核 150℃ 工况（返回 null）', () => {
    expect(findAmpacityA({ type: 'CT', crossSectionMM2: 120, condition: 'indoor-150' })).toBeNull();
    expect(findAmpacityA({ type: 'CT', crossSectionMM2: 150, condition: 'outdoor-150' })).toBeNull();
  });

  it('铜铬锆无 120 mm² 规格（返回 undefined）', () => {
    expect(findAmpacityA({ type: 'CTCZ', crossSectionMM2: 120, condition: 'indoor-95' })).toBeUndefined();
    expect(findAmpacityA({ type: 'CTCZ', crossSectionMM2: 150, condition: 'outdoor-150' })).toBe(710);
  });

  it('无此规格返回 undefined（区别于 null 的"不考核"）', () => {
    // 铜铬锆没有 120 mm² 规格
    expect(findAmpacityA({ type: 'CTCZ', crossSectionMM2: 120, condition: 'indoor-95' })).toBeUndefined();
    // CT-150 存在，但其 150℃ 工况不考核 → null 而非 undefined
    expect(findAmpacityA({ type: 'CT', crossSectionMM2: 150, condition: 'outdoor-150' })).toBeNull();
  });
});

describe('ampacity - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => ampacityDeratingFactor({ ...SITE_DERATING, baseAmpacityA: 0 })).toThrow(RangeError);
    expect(() =>
      ampacityDeratingFactor({ ...SITE_DERATING, maxAllowedTempDegC: 20 }),
    ).toThrow(RangeError);
    expect(() => shortCircuitMinSectionMM2(0, 0.5, 154)).toThrow(RangeError);
    expect(() => shortCircuitMinSectionMM2(25, 0, 154)).toThrow(RangeError);
    expect(() => shortCircuitMinSectionMM2(25, 0.5, 0)).toThrow(RangeError);
  });
});
