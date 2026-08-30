import { describe, expect, it } from 'vitest';
import { icingCheck, type IcingCheckInput } from './index';
import { iceLoadNPerM } from '../common/ice';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 icingCheck() 源码公式
 * 按页面默认输入算出。页面传参做单位换算：
 *   d: in-d / 1000（mm→m）、b: in-b / 1000（mm→m）、T: in-T * 1000（kN→N）
 *
 * 默认输入：d=12.5 mm、b=5 mm、T=13 kN、l=50 m、g_self=10.61 N/m、ρ=900 kg/m³
 *
 *   g_ice  = 900·9.81·π·0.005·(0.0125+0.005) = 2.4269981346226253 N/m
 *   g_tot  = 10.61 + g_ice                   = 13.036998134622625 N/m
 *   f₀     = 10.61·50²/(8·13000)             = 0.2550480769230769 m
 *   f_ice  = g_tot·50²/(8·13000)             = 0.3133893782361208 m
 *   增幅                                      = 22.874628978535583 %
 */
const SITE_INPUT: IcingCheckInput = {
  wireDiameterM: 12.5 / 1000,
  iceThicknessM: 5 / 1000,
  tensionN: 13 * 1000,
  spanM: 50,
  selfWeightNPerM: 10.61,
};

describe('icing - 与站点源码公式回归', () => {
  it('冰重、总荷载与无冰/覆冰弛度', () => {
    const r = icingCheck(SITE_INPUT);
    expect(r.iceLoadNPerM).toBeCloseTo(2.4269981346226253, 12);
    expect(r.totalLoadNPerM).toBeCloseTo(13.036998134622625, 12);
    expect(r.sagNoIceM).toBeCloseTo(0.2550480769230769, 12);
    expect(r.sagWithIceM).toBeCloseTo(0.3133893782361208, 12);
  });

  it('弛度增幅与重覆冰判定', () => {
    const r = icingCheck(SITE_INPUT);
    expect(r.growthPercent).toBeCloseTo(22.874628978535583, 9);
    expect(r.heavy).toBe(false);
  });
});

describe('icing - 公式性质', () => {
  it('g_ice = ρ·g₀·π·b·(d+b)', () => {
    // 手算：900 × 9.81 × π × 0.005 × 0.0175
    expect(iceLoadNPerM({ wireDiameterM: 0.0125, iceThicknessM: 0.005 })).toBeCloseTo(
      900 * 9.81 * Math.PI * 0.005 * 0.0175,
      12,
    );
  });

  it('无冰时冰重为 0，覆冰弛度等于无冰弛度', () => {
    const r = icingCheck({ ...SITE_INPUT, iceThicknessM: 0 });
    expect(r.iceLoadNPerM).toBe(0);
    expect(r.totalLoadNPerM).toBeCloseTo(SITE_INPUT.selfWeightNPerM, 12);
    expect(r.sagWithIceM).toBeCloseTo(r.sagNoIceM, 12);
    expect(r.growthPercent).toBeCloseTo(0, 12);
  });

  it('冰重随覆冰厚度超线性增长（含 b² 项）', () => {
    const b5 = icingCheck({ ...SITE_INPUT, iceThicknessM: 0.005 }).iceLoadNPerM;
    const b10 = icingCheck({ ...SITE_INPUT, iceThicknessM: 0.01 }).iceLoadNPerM;
    // 翻倍厚度时，(d+b) 也增大，故增幅大于 2 倍
    expect(b10 / b5).toBeGreaterThan(2);
  });

  it('冰重超过自重时判为重覆冰', () => {
    const r = icingCheck({ ...SITE_INPUT, iceThicknessM: 0.03 });
    expect(r.iceLoadNPerM).toBeGreaterThan(SITE_INPUT.selfWeightNPerM);
    expect(r.heavy).toBe(true);
  });

  it('弛度增幅等于荷载增幅', () => {
    const r = icingCheck(SITE_INPUT);
    const loadGrowth = (r.totalLoadNPerM / SITE_INPUT.selfWeightNPerM - 1) * 100;
    expect(r.growthPercent).toBeCloseTo(loadGrowth, 9);
  });

  it('冰密度可自定义', () => {
    const light = icingCheck({ ...SITE_INPUT, iceDensityKgPerM3: 450 });
    const r = icingCheck(SITE_INPUT);
    expect(light.iceLoadNPerM).toBeCloseTo(r.iceLoadNPerM / 2, 12);
  });

  it('张力越大弛度越小', () => {
    const r = icingCheck({ ...SITE_INPUT, tensionN: 26 * 1000 });
    const base = icingCheck(SITE_INPUT);
    expect(r.sagWithIceM).toBeCloseTo(base.sagWithIceM / 2, 12);
  });
});

describe('icing - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => icingCheck({ ...SITE_INPUT, wireDiameterM: 0 })).toThrow(RangeError);
    expect(() => icingCheck({ ...SITE_INPUT, iceThicknessM: -0.001 })).toThrow(RangeError);
    expect(() => icingCheck({ ...SITE_INPUT, tensionN: 0 })).toThrow(RangeError);
    expect(() => icingCheck({ ...SITE_INPUT, spanM: 0 })).toThrow(RangeError);
    expect(() => icingCheck({ ...SITE_INPUT, selfWeightNPerM: 0 })).toThrow(RangeError);
    expect(() => icingCheck({ ...SITE_INPUT, iceDensityKgPerM3: 0 })).toThrow(RangeError);
  });
});
