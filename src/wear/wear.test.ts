import { describe, expect, it } from 'vitest';
import {
  nominalSectionMM2,
  sectionFromDiameterMM2,
  wearRatio,
  type WearInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/wear/ 已发布的输出：
 *   残截面积 A = 108 mm²，磨耗率 η = 10%，建议：可继续使用
 *
 * 参数反推：η = 10% 且 A = 108 → A₀ = 120 mm²（CTHM-120 标称截面）。
 */
const SITE_INPUT: WearInput = {
  mode: 'area',
  originalSectionMM2: 120,
  residualSectionMM2: 108,
};

describe('wear - 与站点已发布输出回归', () => {
  it('η = 10%，判为可继续使用', () => {
    const r = wearRatio(SITE_INPUT);
    expect(r.wearPercent).toBeCloseTo(10, 9);
    expect(r.residualSectionMM2).toBe(108);
    expect(r.sectionLossMM2).toBeCloseTo(12, 9);
    expect(r.verdict).toBe('keep');
  });

  it('型号带出标称截面', () => {
    expect(nominalSectionMM2('CTHM-120')).toBe(120);
    expect(nominalSectionMM2('CTHM-150')).toBe(150);
    expect(nominalSectionMM2('CTHA-120')).toBe(120);
    expect(nominalSectionMM2('CTHS-150')).toBe(150);
  });
});

describe('wear - 判定准则', () => {
  it('η 恰好等于 20% 判可继续使用（准则为 > 20% 才更换）', () => {
    const r = wearRatio({ mode: 'area', originalSectionMM2: 100, residualSectionMM2: 80 });
    expect(r.wearPercent).toBeCloseTo(20, 9);
    expect(r.verdict).toBe('keep');
  });

  it('η > 20% 判建议更换', () => {
    const r = wearRatio({ mode: 'area', originalSectionMM2: 100, residualSectionMM2: 79.9 });
    expect(r.wearPercent).toBeGreaterThan(20);
    expect(r.verdict).toBe('replace');
  });

  it('支持自定义阈值', () => {
    const r = wearRatio({ ...SITE_INPUT, replacementThresholdPercent: 5 });
    expect(r.thresholdPercent).toBe(5);
    expect(r.verdict).toBe('replace');
  });

  it('无磨耗时 η = 0', () => {
    const r = wearRatio({ mode: 'area', originalSectionMM2: 120, residualSectionMM2: 120 });
    expect(r.wearPercent).toBeCloseTo(0, 12);
    expect(r.verdict).toBe('keep');
  });
});

describe('wear - 残径换算', () => {
  it('A = π·d²/4', () => {
    // 手算：π × 12² / 4 = 113.0973
    expect(sectionFromDiameterMM2(12)).toBeCloseTo(113.0973, 4);
    // 直径减半，面积变为 1/4
    expect(sectionFromDiameterMM2(6)).toBeCloseTo(sectionFromDiameterMM2(12) / 4, 9);
  });

  it('残径模式：换算后参与磨耗率计算', () => {
    // 残径 11.6834 mm → A ≈ 107.24 mm² → η ≈ 10.6%
    const d = Math.sqrt((108 * 4) / Math.PI);
    const r = wearRatio({ mode: 'residual-diameter', originalSectionMM2: 120, residualDiameterMM: d });
    expect(r.residualSectionMM2).toBeCloseTo(108, 6);
    expect(r.wearPercent).toBeCloseTo(10, 6);
  });

  it('残径换算与残截面积模式结果一致', () => {
    const d = Math.sqrt((108 * 4) / Math.PI);
    const byArea = wearRatio({ mode: 'area', originalSectionMM2: 120, residualSectionMM2: 108 });
    const byDia = wearRatio({ mode: 'residual-diameter', originalSectionMM2: 120, residualDiameterMM: d });
    expect(byDia.wearPercent).toBeCloseTo(byArea.wearPercent, 9);
  });
});

describe('wear - 输入校验', () => {
  it('残截面积大于原截面积抛错', () => {
    expect(() => wearRatio({ mode: 'area', originalSectionMM2: 120, residualSectionMM2: 121 })).toThrow(RangeError);
  });

  it('非法参数抛 RangeError', () => {
    expect(() => wearRatio({ mode: 'area', originalSectionMM2: 0, residualSectionMM2: 10 })).toThrow(RangeError);
    expect(() => wearRatio({ mode: 'area', originalSectionMM2: 120, residualSectionMM2: 0 })).toThrow(RangeError);
    expect(() => wearRatio({ mode: 'area', originalSectionMM2: 120, residualSectionMM2: -5 })).toThrow(RangeError);
    expect(() => sectionFromDiameterMM2(0)).toThrow(RangeError);
    expect(() => wearRatio({ ...SITE_INPUT, replacementThresholdPercent: 0 })).toThrow(RangeError);
  });
});
