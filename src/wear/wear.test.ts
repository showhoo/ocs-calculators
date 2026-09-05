import { describe, expect, it } from 'vitest';
import { sectionFromDiameterMM2, wearRatio, type WearByAreaInput } from './index';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 wearRate() 源码公式
 * 独立算出：η = (A₀ − A) / A₀ × 100%，η > 20%（严格大于）判为更换。
 *
 * 磨耗率页默认 A₀ = 120 mm²（CTHM-120 标称截面）。
 * 残径模式按 A = π·d²/4 换算。
 */
const SITE_INPUT: WearByAreaInput = {
  mode: 'area',
  originalSectionMM2: 120,
  residualSectionMM2: 100,
};

describe('wear - 站点默认口径（A₀ = 120 mm²）', () => {
  it('磨耗率 η = (A₀ − A)/A₀ × 100%', () => {
    const r = wearRatio(SITE_INPUT);
    expect(r.originalSectionMM2).toBe(120);
    expect(r.residualSectionMM2).toBe(100);
    expect(r.sectionLossMM2).toBe(20);
    expect(r.wearPercent).toBeCloseTo(16.666666666666664, 12);
    expect(r.thresholdPercent).toBe(20);
    expect(r.verdict).toBe('keep');
  });

  it('η 恰好等于阈值 20% 时仍判 keep（严格大于才更换）', () => {
    const r = wearRatio({ ...SITE_INPUT, residualSectionMM2: 96 });
    expect(r.wearPercent).toBeCloseTo(20, 12);
    expect(r.verdict).toBe('keep');
  });

  it('η 超过阈值判 replace', () => {
    const r = wearRatio({ ...SITE_INPUT, residualSectionMM2: 95 });
    expect(r.wearPercent).toBeCloseTo(20.833333333333336, 12);
    expect(r.verdict).toBe('replace');
  });

  it('自定义更换阈值', () => {
    const r = wearRatio({ ...SITE_INPUT, residualSectionMM2: 96, replacementThresholdPercent: 25 });
    expect(r.thresholdPercent).toBe(25);
    expect(r.verdict).toBe('keep');
    const strict = wearRatio({
      ...SITE_INPUT,
      residualSectionMM2: 96,
      replacementThresholdPercent: 15,
    });
    expect(strict.verdict).toBe('replace');
  });
});

describe('wear - 残径模式', () => {
  it('残径换算 A = π·d²/4', () => {
    expect(sectionFromDiameterMM2(12)).toBeCloseTo(113.09733552923255, 12);
  });

  it('残径模式先换算再计算磨耗率', () => {
    const r = wearRatio({
      mode: 'residual-diameter',
      originalSectionMM2: 120,
      residualDiameterMM: 11,
    });
    expect(r.residualSectionMM2).toBeCloseTo(95.03317777109125, 12);
    expect(r.wearPercent).toBeCloseTo(20.805685190757295, 10);
    expect(r.verdict).toBe('replace');
  });
});

describe('wear - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => wearRatio({ ...SITE_INPUT, originalSectionMM2: 0 })).toThrow(RangeError);
    expect(() => wearRatio({ ...SITE_INPUT, residualSectionMM2: 0 })).toThrow(RangeError);
    expect(() =>
      wearRatio({ ...SITE_INPUT, originalSectionMM2: 100, residualSectionMM2: 101 }),
    ).toThrow(RangeError);
    expect(() =>
      wearRatio({ mode: 'residual-diameter', originalSectionMM2: 120, residualDiameterMM: 0 }),
    ).toThrow(RangeError);
    expect(() => wearRatio({ ...SITE_INPUT, replacementThresholdPercent: 0 })).toThrow(RangeError);
    expect(() => wearRatio({ ...SITE_INPUT, replacementThresholdPercent: -5 })).toThrow(RangeError);
  });
});
