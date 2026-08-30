import { describe, expect, it } from 'vitest';
import {
  AIR_DENSITY_KG_PER_M3,
  windClearanceCheck,
  windDeflectionM,
  windLoadNPerM,
  type WindClearanceInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/wind/ 已发布的输出：
 *   单位风荷载 p = 8.2687 N/m
 *   风偏 b       = 0.2862 m
 *   风偏+拉出值  = 0.5862 m
 *   结论：合格
 *
 * ⚠️ 参数推断说明：
 * 输出只锁定以下乘积关系 —— d·α = 0.015（在 v=30、θ=90、ρ=1.225 下），
 * 以及 L²/T = 0.276888（在 p=8.2687 下）。此处取
 *   v=30 m/s、θ=90°、d=12.5 mm、α=1.2（站点自述"圆柱形常取 1.2"）、
 *   T=13 kN、L=60 m、a=0.3 m、限界=0.6 m，
 * 可复现站点全部输出。若站点实际默认值不同（例如 d=12、α=1.25），输出不变。
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

describe('wind - 与站点已发布输出回归', () => {
  it('单位风荷载 p = 8.26875 N/m', () => {
    const p = windLoadNPerM(SITE_INPUT);
    // 手算：0.5 × 1.225 × 30² × 0.0125 × 1.2 = 8.26875
    expect(p).toBeCloseTo(8.26875, 5);
  });

  it('跨中风偏 b = 0.286225 m', () => {
    const p = windLoadNPerM(SITE_INPUT);
    const b = windDeflectionM(p, SITE_INPUT.spanM, SITE_INPUT.tensionKN);
    // 手算：8.26875 × 3600 / (8 × 13000) = 0.286225
    expect(b).toBeCloseTo(0.286225, 5);
  });

  it('整组校验结果与站点一致', () => {
    const r = windClearanceCheck(SITE_INPUT);
    expect(r.windLoadNPerM).toBeCloseTo(8.2687, 3);
    expect(r.deflectionM).toBeCloseTo(0.2862, 3);
    expect(r.totalOffsetM).toBeCloseTo(0.5862, 3);
    expect(r.passes).toBe(true);
  });

  it('限界富余量为正且数值正确', () => {
    const r = windClearanceCheck(SITE_INPUT);
    expect(r.marginM).toBeCloseTo(0.6 - 0.586225, 5);
    expect(r.marginM).toBeGreaterThan(0);
  });
});

describe('wind - 纯公式校验', () => {
  it('风向与线路平行时（θ=0° 与 180°）不产生风偏', () => {
    for (const angle of [0, 180]) {
      const p = windLoadNPerM({ ...SITE_INPUT, windAngleDeg: angle });
      expect(p).toBeCloseTo(0, 12);
      expect(windClearanceCheck({ ...SITE_INPUT, windAngleDeg: angle }).deflectionM).toBeCloseTo(0, 12);
    }
  });

  it('sin²θ 关于 90° 对称：θ 与 180−θ 结果相同', () => {
    const a = windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 60 });
    const b = windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 120 });
    expect(a).toBeCloseTo(b, 12);
  });

  it('θ=60° 时风荷载为垂直工况的 3/4', () => {
    const vertical = windLoadNPerM(SITE_INPUT);
    const at60 = windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 60 });
    // sin²60° = (√3/2)² = 0.75
    expect(at60).toBeCloseTo(vertical * 0.75, 9);
  });

  it('风速为 0 时无风偏，判为合格', () => {
    const r = windClearanceCheck({ ...SITE_INPUT, windSpeedMPerS: 0 });
    expect(r.windLoadNPerM).toBeCloseTo(0, 12);
    expect(r.deflectionM).toBeCloseTo(0, 12);
    expect(r.totalOffsetM).toBeCloseTo(SITE_INPUT.staggerM, 12);
    expect(r.passes).toBe(true);
  });

  it('风偏与跨距平方成正比', () => {
    const p = windLoadNPerM(SITE_INPUT);
    const b40 = windDeflectionM(p, 40, SITE_INPUT.tensionKN);
    const b60 = windDeflectionM(p, 60, SITE_INPUT.tensionKN);
    expect(b60).toBeCloseTo(b40 * (60 / 40) ** 2, 9);
  });

  it('限界收紧到风偏+拉出值之内时判为超限', () => {
    const r = windClearanceCheck({ ...SITE_INPUT, clearanceLimitM: 0.5 });
    expect(r.totalOffsetM).toBeGreaterThan(0.5);
    expect(r.passes).toBe(false);
    expect(r.marginM).toBeLessThan(0);
  });

  it('恰好等于限界时判为合格（判据为 ≤）', () => {
    // 限界取实际计算出的 b+a，避免浮点字面量与计算值相差 1 ULP 导致误判
    const limit = windClearanceCheck(SITE_INPUT).totalOffsetM;
    const r = windClearanceCheck({ ...SITE_INPUT, clearanceLimitM: limit });
    expect(r.passes).toBe(true);
    expect(r.marginM).toBeCloseTo(0, 9);
  });

  it('支持自定义空气密度', () => {
    const rho2 = AIR_DENSITY_KG_PER_M3 * 2;
    const pDefault = windLoadNPerM(SITE_INPUT);
    const pDoubled = windLoadNPerM({ ...SITE_INPUT, airDensityKgPerM3: rho2 });
    expect(pDoubled).toBeCloseTo(pDefault * 2, 9);
  });
});

describe('wind - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => windLoadNPerM({ ...SITE_INPUT, windSpeedMPerS: -1 })).toThrow(RangeError);
    expect(() => windLoadNPerM({ ...SITE_INPUT, wireDiameterMM: 0 })).toThrow(RangeError);
    expect(() => windLoadNPerM({ ...SITE_INPUT, dragCoefficient: -1 })).toThrow(RangeError);
    expect(() => windLoadNPerM({ ...SITE_INPUT, windAngleDeg: 200 })).toThrow(RangeError);
    expect(() => windLoadNPerM({ ...SITE_INPUT, windAngleDeg: -5 })).toThrow(RangeError);
    expect(() => windLoadNPerM({ ...SITE_INPUT, airDensityKgPerM3: 0 })).toThrow(RangeError);
    expect(() => windDeflectionM(8, 60, 0)).toThrow(RangeError);
    expect(() => windDeflectionM(8, 0, 13)).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, staggerM: -0.1 })).toThrow(RangeError);
    expect(() => windClearanceCheck({ ...SITE_INPUT, clearanceLimitM: 0 })).toThrow(RangeError);
  });
});
