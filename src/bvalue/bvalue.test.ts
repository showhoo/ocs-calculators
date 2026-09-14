import { describe, it, expect } from 'vitest';
import { bValue } from './index';

describe('bValue', () => {
  it('默认示例：CTAH-120、L=800m、1:3、Δt=70℃、T=25kN', () => {
    const r = bValue({ minBMM: 300, ratio: 3, expansionCoeff: 1.7e-5, halfSpanMM: 800000, maxTempC: 60, targetTempC: -10, tensionKN: 25 });
    expect(r.stretchMM).toBeCloseTo(952, 0);
    expect(r.strokeMM).toBeCloseTo(2856, 0);
    expect(r.bMM).toBeCloseTo(3156, 0);
    expect(r.weightKg).toBeCloseTo(850, 0);
  });
  it('传动比 1:2 坠砣为张力一半', () => {
    const r = bValue({ minBMM: 300, ratio: 2, expansionCoeff: 1.7e-5, halfSpanMM: 800000, maxTempC: 60, targetTempC: -10, tensionKN: 20 });
    expect(r.weightKg).toBeCloseTo(1020, 0);
  });
  it('无张力时不输出重量', () => {
    const r = bValue({ minBMM: 300, ratio: 3, expansionCoeff: 1.7e-5, halfSpanMM: 800000, maxTempC: 60, targetTempC: -10 });
    expect(r.weightKg).toBeNull();
  });
  it('负 b_min 抛错', () => {
    expect(() => bValue({ minBMM: -1, ratio: 3, expansionCoeff: 1.7e-5, halfSpanMM: 800000, maxTempC: 60, targetTempC: -10 })).toThrow(RangeError);
  });
});
