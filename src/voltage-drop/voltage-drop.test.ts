import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MIN_END_VOLTAGE_V,
  voltageDropCheck,
  type VoltageDropInput,
} from './index';
import { resistanceAtTempOhmPerKm } from '../common/resistance';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 voltageDrop() 源码公式
 * 按页面默认输入（U₀=27500 V、I=600 A、r₂₀=0.2211 Ω/km、L=25 km、T=40 ℃、
 * α=0.00270 即 CTMH-120 镁合金真值）算出（脚本 /tmp/dcalc/alpha.mjs，非手算）。
 *
 * 2026-09-19 修复批 D：per-alloy α 实装——默认工况 r₂₀=0.2211 为 CTMH-120，
 * 温修按镁合金真值 α=0.00270（旧版统一纯铜 0.00393 系「纯铜近似」，已废弃）。
 *
 *   r_T  = 0.2211·[1+0.00270·20] = 0.2330394 Ω/km
 *   ΔU   = 600 × 0.2330394 × 25 = 3495.591 V
 *   Uend = 27500 − 3495.591     = 24004.409 V
 *   压降率                        = 3495.591/27500×100 = 12.71124 %
 */
const SITE_INPUT: VoltageDropInput = {
  busVoltageV: 27500,
  currentA: 600,
  r20OhmPerKm: 0.2211,
  feederLengthKm: 25,
  tempDegC: 40,
  alphaPerDegC: 0.0027,
};

describe('voltage-drop - 与站点源码公式回归', () => {
  it('r_T、ΔU、末端电压与压降率（CTMH α=0.00270）', () => {
    const r = voltageDropCheck(SITE_INPUT);
    expect(r.rTOhmPerKm).toBeCloseTo(0.2330394, 10);
    expect(r.voltageDropV).toBeCloseTo(3495.591, 6);
    expect(r.endVoltageV).toBeCloseTo(24004.409, 6);
    expect(r.dropPercent).toBeCloseTo(12.71124, 9);
  });

  it('末端电压满足 25kV 体系下限', () => {
    const r = voltageDropCheck(SITE_INPUT);
    expect(DEFAULT_MIN_END_VOLTAGE_V).toBe(20000);
    expect(r.passes).toBe(true);
  });

  it('缺省 α 为纯铜 0.00393（无型号场景）；显式传 α 时按真值', () => {
    // 缺省（纯铜）：0.2211·[1+0.00393·20] = 0.23847846
    const { alphaPerDegC: _omit, ...pureCu } = SITE_INPUT;
    expect(voltageDropCheck(pureCu).rTOhmPerKm).toBeCloseTo(0.23847846, 10);
    // 银合金 CTAH：0.1481·[1+0.0038·20] = 0.1593556
    expect(
      voltageDropCheck({ ...SITE_INPUT, r20OhmPerKm: 0.1481, alphaPerDegC: 0.0038 }).rTOhmPerKm,
    ).toBeCloseTo(0.1593556, 10);
    // 锡合金 CTS：0.1545·[1+0.0032·20] = 0.164388
    expect(
      voltageDropCheck({ ...SITE_INPUT, r20OhmPerKm: 0.1545, alphaPerDegC: 0.0032 }).rTOhmPerKm,
    ).toBeCloseTo(0.164388, 10);
  });
});

describe('voltage-drop - 公式性质', () => {
  it('r_T = r₂₀·[1+α(T−20)]', () => {
    expect(resistanceAtTempOhmPerKm(0.2211, 40)).toBeCloseTo(0.23847846, 10);
    // T = 20℃ 不修正
    expect(resistanceAtTempOhmPerKm(0.2211, 20)).toBeCloseTo(0.2211, 12);
  });

  it('ΔU 与电流、长度均成正比', () => {
    const base = voltageDropCheck(SITE_INPUT);
    expect(voltageDropCheck({ ...SITE_INPUT, currentA: 1200 }).voltageDropV).toBeCloseTo(
      base.voltageDropV * 2,
      6,
    );
    expect(
      voltageDropCheck({ ...SITE_INPUT, feederLengthKm: 50 }).voltageDropV,
    ).toBeCloseTo(base.voltageDropV * 2, 6);
  });

  it('并联 n 路时电压损失按 1/n 折减', () => {
    const single = voltageDropCheck(SITE_INPUT);
    const double = voltageDropCheck({ ...SITE_INPUT, parallelCount: 2 });
    expect(double.rTOhmPerKm).toBeCloseTo(single.rTOhmPerKm / 2, 12);
    expect(double.voltageDropV).toBeCloseTo(single.voltageDropV / 2, 6);
    expect(double.endVoltageV).toBeGreaterThan(single.endVoltageV);
  });

  it('末端电压 = U₀ − ΔU', () => {
    const r = voltageDropCheck(SITE_INPUT);
    expect(r.endVoltageV).toBeCloseTo(SITE_INPUT.busVoltageV - r.voltageDropV, 9);
  });

  it('供电臂过长会跌破末端电压下限', () => {
    const r = voltageDropCheck({ ...SITE_INPUT, feederLengthKm: 55 });
    expect(r.passes).toBe(false);
  });

  it('支持自定义末端电压限值', () => {
    // 提高到 25000 V 则默认工况不合格
    expect(voltageDropCheck({ ...SITE_INPUT, minEndVoltageV: 25000 }).passes).toBe(false);
    // 降低到 20000 V 以下则合格
    expect(voltageDropCheck({ ...SITE_INPUT, minEndVoltageV: 20000 }).passes).toBe(true);
  });

  it('温度升高电阻增大、压降增大', () => {
    const cold = voltageDropCheck({ ...SITE_INPUT, tempDegC: -20 });
    const hot = voltageDropCheck({ ...SITE_INPUT, tempDegC: 80 });
    expect(hot.voltageDropV).toBeGreaterThan(cold.voltageDropV);
    expect(hot.endVoltageV).toBeLessThan(cold.endVoltageV);
  });
});

describe('voltage-drop - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => voltageDropCheck({ ...SITE_INPUT, busVoltageV: 0 })).toThrow(RangeError);
    expect(() => voltageDropCheck({ ...SITE_INPUT, currentA: 0 })).toThrow(RangeError);
    expect(() => voltageDropCheck({ ...SITE_INPUT, r20OhmPerKm: 0 })).toThrow(RangeError);
    expect(() => voltageDropCheck({ ...SITE_INPUT, feederLengthKm: 0 })).toThrow(RangeError);
    expect(() => voltageDropCheck({ ...SITE_INPUT, parallelCount: 0 })).toThrow(RangeError);
    expect(() => voltageDropCheck({ ...SITE_INPUT, parallelCount: 1.5 })).toThrow(RangeError);
  });
});
