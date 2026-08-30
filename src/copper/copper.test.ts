import { describe, expect, it } from 'vitest';
import {
  COPPER_ALPHA_PER_DEG_C,
  resistanceAtTempOhmPerKm,
  TB2809_WIRE_PARAMS,
  wireLookup,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/copper/ 已发布的输出（CTHM-120）：
 *   单位重量 1082 kg/km，总重量 1082 kg，r₂₀ = 0.2113 Ω/km，r_T = 0.2113 Ω/km
 *
 * 参数反推：r_T = r₂₀ → T = 20 ℃；总重量 = 单位重量 → l = 1 km。
 *
 * ⚠️ 站点输出"载流量 150℃（室内/室外）43/56 A"与其内置参数表 430/560 A
 * 相差 10 倍，疑为站点显示层笔误。本库按标准表值 430/560 实现。
 */
const SITE_INPUT = { model: 'CTHM-120' as const, lengthKm: 1, ambientTempDegC: 20 };

describe('copper - 与站点已发布输出回归', () => {
  it('CTHM-120 / 1 km / 20℃', () => {
    const r = wireLookup(SITE_INPUT);
    expect(r.unitWeightKgPerKm).toBe(1082);
    expect(r.totalWeightKg).toBeCloseTo(1082, 9);
    expect(r.r20OhmPerKm).toBeCloseTo(0.2113, 9);
    expect(r.rTOhmPerKm).toBeCloseTo(0.2113, 9);
  });

  it('载流量按标准表值 430/560 A（站点显示 43/56 疑为笔误）', () => {
    const r = wireLookup(SITE_INPUT);
    expect(r.ampacityIndoor150A).toBe(430);
    expect(r.ampacityOutdoor150A).toBe(560);
  });
});

describe('copper - 参数表完整性', () => {
  it('6 个型号齐全且数值合理', () => {
    const models = Object.keys(TB2809_WIRE_PARAMS);
    expect(models).toHaveLength(6);
    for (const [, p] of Object.entries(TB2809_WIRE_PARAMS)) {
      expect(p.unitWeightKgPerKm).toBeGreaterThan(1000);
      expect(p.r20OhmPerKm).toBeGreaterThan(0.1);
      expect(p.ampacityOutdoor150A).toBeGreaterThan(p.ampacityIndoor150A);
    }
  });

  it('150 mm² 单位重量约为 120 mm² 的 1.25 倍', () => {
    const w120 = TB2809_WIRE_PARAMS['CTHM-120'].unitWeightKgPerKm;
    const w150 = TB2809_WIRE_PARAMS['CTHM-150'].unitWeightKgPerKm;
    expect(w150 / w120).toBeCloseTo(150 / 120, 1);
  });

  it('电阻与截面成反比（同材质）', () => {
    const r120 = TB2809_WIRE_PARAMS['CTHM-120'].r20OhmPerKm;
    const r150 = TB2809_WIRE_PARAMS['CTHM-150'].r20OhmPerKm;
    // 同材质下 r × A 近似为常数
    expect(r120 * 120).toBeCloseTo(r150 * 150, 1);
  });

  it('载流量与 TB/T 2809-2017 表5 150℃ 口径一致', () => {
    // 铜银 120：室内 515、室外 680
    expect(TB2809_WIRE_PARAMS['CTHA-120'].ampacityIndoor150A).toBe(515);
    expect(TB2809_WIRE_PARAMS['CTHA-120'].ampacityOutdoor150A).toBe(680);
    // 铜锡 150：室外 790
    expect(TB2809_WIRE_PARAMS['CTHS-150'].ampacityOutdoor150A).toBe(790);
  });
});

describe('copper - 电阻温度修正', () => {
  it('r_T = r₂₀·[1 + α(T−20)]', () => {
    // 手算：0.2113 × (1 + 0.00393 × 20) = 0.2113 × 1.0786 = 0.2279082
    expect(resistanceAtTempOhmPerKm(0.2113, 40)).toBeCloseTo(0.2279082, 6);
  });

  it('T = 20℃ 时不修正', () => {
    expect(resistanceAtTempOhmPerKm(0.2113, 20)).toBeCloseTo(0.2113, 12);
  });

  it('温度降低电阻下降', () => {
    expect(resistanceAtTempOhmPerKm(0.2113, -20)).toBeLessThan(0.2113);
  });

  it('支持自定义温度系数', () => {
    const r = resistanceAtTempOhmPerKm(0.2, 30, 0.004);
    expect(r).toBeCloseTo(0.2 * 1.04, 12);
  });

  it('全长电阻 = 单位电阻 × 长度', () => {
    const r = wireLookup({ ...SITE_INPUT, lengthKm: 2.5 });
    expect(r.totalWeightKg).toBeCloseTo(1082 * 2.5, 9);
    expect(r.totalResistanceOhm).toBeCloseTo(r.rTOhmPerKm * 2.5, 9);
  });

  it('默认温度系数为 0.00393 /℃', () => {
    expect(COPPER_ALPHA_PER_DEG_C).toBeCloseTo(0.00393, 9);
  });
});

describe('copper - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => wireLookup({ ...SITE_INPUT, lengthKm: 0 })).toThrow(RangeError);
    expect(() => wireLookup({ ...SITE_INPUT, lengthKm: -1 })).toThrow(RangeError);
    expect(() => wireLookup({ ...SITE_INPUT, ambientTempDegC: 100 })).toThrow(RangeError);
    expect(() => wireLookup({ ...SITE_INPUT, ambientTempDegC: -50 })).toThrow(RangeError);
    expect(() => resistanceAtTempOhmPerKm(0, 20)).toThrow(RangeError);
  });
});
