import { describe, it, expect } from 'vitest';
import { anchorLengthCheck } from './index';

describe('anchorLength', () => {
  it('直线默认算例：L=800/l=60/c=1.5/g_j=0.0132/α=1.7e-5/Δt=40/T=20 → T_jd≈1.771kN、占8.9%', () => {
    const r = anchorLengthCheck({ section: 'line', ratedTensionKN: 20, halfSpanM: 800, spanM: 60, dropperLengthM: 1.5, wireWeightKNPerM: 0.0132, expansionCoeff: 1.7e-5, tempDeltaC: 40 });
    expect(r.deltaN).toBeCloseTo(1771, 0);
    expect(r.ratio).toBeCloseTo(0.885, 2);
    expect(r.passes).toBe(true);
  });
  it('曲线定位器项：d=1/T=20/R=1000 → 20N', () => {
    const r = anchorLengthCheck({ section: 'curve', ratedTensionKN: 20, curveRadiusM: 1000, regulatorLengthM: 1, regulatorCount: 1 });
    expect(r.deltaN).toBeCloseTo(20, 0);
  });
  it('直线超限：L=2000 → 占额 5.8 倍 → 超限判不合格', () => {
    const r = anchorLengthCheck({ section: 'line', ratedTensionKN: 20, halfSpanM: 2000, spanM: 60, dropperLengthM: 1.5, wireWeightKNPerM: 0.0132, expansionCoeff: 1.7e-5, tempDeltaC: 40 });
    expect(r.deltaN).toBeCloseTo(11609, 0);
    expect(r.passes).toBe(false);
  });
  it('零额定张力抛错', () => {
    expect(() => anchorLengthCheck({ section: 'line', ratedTensionKN: 0 })).toThrow(RangeError);
  });
  it('曲线缺半径抛错', () => {
    expect(() => anchorLengthCheck({ section: 'curve', ratedTensionKN: 20, regulatorLengthM: 1 })).toThrow(RangeError);
  });
});
