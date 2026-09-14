import { describe, it, expect } from 'vitest';
import { sagMM, tensionFromSagKN, maxSpanFromSagM } from './index';

describe('sag', () => {
  it('默认示例：g=10.6 N/m、l=50m、T=25kN → f≈132.5mm', () => {
    const f = sagMM({ tensionKN: 25, spanM: 50, weightNPerM: 10.6 });
    expect(f).toBeCloseTo(132.5, 1);
  });
  it('反算张力与正算一致', () => {
    const f = sagMM({ tensionKN: 25, spanM: 50, weightNPerM: 10.6 });
    const t = tensionFromSagKN(10.6, 50, f);
    expect(t).toBeCloseTo(25, 0);
  });
  it('最大跨距：T=25kN、f=150mm、g=10.6 → 53.2m', () => {
    expect(maxSpanFromSagM(10.6, 25, 150)).toBeCloseTo(53.2, 1);
  });
  it('零张力抛错', () => {
    expect(() => sagMM({ tensionKN: 0, spanM: 50, weightNPerM: 10.6 })).toThrow(RangeError);
  });
});
