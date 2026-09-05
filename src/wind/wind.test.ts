import { describe, expect, it } from 'vitest';
import {
  windClearanceCheck,
  windDeflectionM,
  windLoadNPerM,
  type WindClearanceInput,
} from './index';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 windDeflection() 源码公式
 * 按页面默认输入算出：
 *   v=30 m/s、θ=90°、d=12.5 mm、α=1.2、T=13 kN、L=60 m、a=0.3 m、限界=0.6 m
 *
 *   p      = 0.5·1.225·30²·0.0125·1.2·sin²90° = 8.26875 N/m
 *   b      = 8.26875·60²/(8·13000)            = 0.2862259615384615 m
 *   b + a                                     = 0.5862259615384615 m ≤ 0.6 m → 合格
 */
const SITE_INPUT: WindClearanceInput = {
  windSpeedMPerS: 30,
  windAngleDeg: 90,
  wireDiameterMM: 12.5,
  dragCoefficient: 1.2,
  tensionKN: 13,
  spanM: 60,
  staggerM: 0.3,
  clearanceLimitM: 0.6,
};

describe('wind - 站点默认输入', () => {
  it('单位风荷载 p = ½·ρ·v²·d·α·sin²θ', () => {
    expect(windLoadNPerM(SITE_INPUT)).toBeCloseTo(8.268749999999999, 12);
  });

  it('限界校验各分量与结论', () => {
    const r = windClearanceCheck(SITE_INPUT);
    expect(r.windLoadNPerM).toBeCloseTo(8.268749999999999, 12);
    expect(r.deflectionM).toBeCloseTo(0.2862259615384615, 12);
    expect(r.totalOffsetM).toBeCloseTo(0.5862259615384615, 12);
    expect(r.marginM).toBeCloseTo(0.013774038461538463, 12);
    expect(r.passes).toBe(true);
  });
});

describe('wind - 物理性质', () => {
  it('θ = 0°（风顺线路）风荷载为零', () => {
    expect(windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 0 })).toBe(0);
  });

  it('θ = 45° 风荷载为 90° 的一半（sin²45° = 0.5）', () => {
    expect(windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 45 })).toBeCloseTo(
      4.1343749999999995,
      12,
    );
  });

  it('θ = 180° 风荷载为零', () => {
    expect(windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 180 })).toBeCloseTo(0, 12);
  });

  it('风荷载与风速平方成正比', () => {
    expect(windLoadNPerM({ ...SITE_INPUT, windSpeedMPerS: 60 })).toBeCloseTo(
      windLoadNPerM(SITE_INPUT) * 4,
      12,
    );
  });

  it('张力越大跨中风偏越小（T 翻倍 → b 减半）', () => {
    const heavy = windDeflectionM(windLoadNPerM(SITE_INPUT), 60, 26);
    const base = windDeflectionM(windLoadNPerM(SITE_INPUT), 60, 13);
    expect(heavy).toBeCloseTo(base / 2, 12);
  });

  it('超限时 passes 为 false 且 margin 为负', () => {
    const r = windClearanceCheck({ ...SITE_INPUT, staggerM: 0.45 });
    expect(r.passes).toBe(false);
    expect(r.marginM).toBeLessThan(0);
  });

  it('总偏移恰好等于限界允许值时判为合格（≤）', () => {
    const r = windClearanceCheck(SITE_INPUT);
    const atLimit = windClearanceCheck({ ...SITE_INPUT, clearanceLimitM: r.totalOffsetM });
    expect(atLimit.passes).toBe(true);
    expect(atLimit.marginM).toBeCloseTo(0, 12);
  });

  it('自定义空气密度参与计算', () => {
    const withRho = windLoadNPerM({ ...SITE_INPUT, airDensityKgPerM3: 1.0 });
    expect(withRho).toBeCloseTo(windLoadNPerM(SITE_INPUT) / 1.225, 12);
  });
});

describe('wind - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => windClearanceCheck({ ...SITE_INPUT, windSpeedMPerS: -1 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, windAngleDeg: 181 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, windAngleDeg: -1 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, wireDiameterMM: 0 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, dragCoefficient: 0 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, airDensityKgPerM3: 0 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, tensionKN: 0 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, spanM: 0 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, staggerM: -0.1 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, clearanceLimitM: 0 })).toThrow(RangeError);
  });
});
