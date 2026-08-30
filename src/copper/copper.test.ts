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
 * 本表已与站点 `/calculator/assets/calc-core.js` 的 COPPER_TABLE 逐项比对一致。
 *
 * 历史注记（真实根因，2026-08-31 由站点维护者定位并修复）：
 * 站点渲染输出曾显示"载流量 43/56 A"，是**显示层 fmt() 的真实 bug**，不是笔误、
 * 也不是浏览器缓存。旧实现 `s.replace(/\.?0+$/, '')` 本意剥小数尾零，
 * 但对 d=0 的整数档会把有效数字的尾零一并剥掉：430→43、560→56、100→1、20→2。
 * 同页表格直接输出原始值、不经 fmt，所以"表格对、结果错"。
 * 修复：`if (d === 0) return s;` 提前返回，且正则改为 `(\.\d*?)0+$` 要求有小数点。
 * 该 bug 自 R38 载流量修正上线起存在（此前该字段显示"待核实"，修正后才可见）。
 * 同款地雷在 dropper / wear / wind 三台一并排除。
 *
 * **方法论教训**：数据层正确 ≠ 渲染正确。核对数值时必须同时验证数据源与显示层，
 * 只查其一会导致误判（本仓库曾据此错误撤回过一次结论）。
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

  it('载流量 430/560 A，与服务端 COPPER_TABLE 一致', () => {
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

  it('note 字段标明各行实际取自标准的哪一行', () => {
    // 站点型号代码与标准型号不同名：CTHM→CTMH、CTHA→CTA、CTHS→CTS
    expect(TB2809_WIRE_PARAMS['CTHM-120'].note).toContain('CTMH');
    expect(TB2809_WIRE_PARAMS['CTHA-120'].note).toContain('CTA');
    expect(TB2809_WIRE_PARAMS['CTHS-150'].note).toContain('CTS');
    for (const [, p] of Object.entries(TB2809_WIRE_PARAMS)) {
      expect(p.note.length).toBeGreaterThan(0);
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
