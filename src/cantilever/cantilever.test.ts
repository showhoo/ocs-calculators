import { describe, it, expect } from 'vitest';
import { cantileverCut } from './index';

describe('cantilever', () => {
  it('默认示例：h=1.8/d=1.5/Δc=0.15/yd=1.2 → 全2.343/下料2.193/定位1.562', () => {
    const r = cantileverCut({ verticalOffsetM: 1.8, horizontalProjectionM: 1.5, endDeductionM: 0.15, regHeightM: 1.2 });
    expect(r.fullLengthM).toBeCloseTo(2.343, 3);
    expect(r.cutLengthM).toBeCloseTo(2.193, 3);
    expect(r.regulatorPosM).toBeCloseTo(1.562, 3);
  });
  it('无端部扣减', () => {
    const r = cantileverCut({ verticalOffsetM: 3, horizontalProjectionM: 4 });
    expect(r.fullLengthM).toBeCloseTo(5, 3);
    expect(r.cutLengthM).toBeCloseTo(5, 3);
    expect(r.regulatorPosM).toBeNull();
  });
  it('y_d > h 抛错', () => {
    expect(() => cantileverCut({ verticalOffsetM: 1.8, horizontalProjectionM: 1.5, regHeightM: 2 })).toThrow(RangeError);
  });
  it('负竖直距抛错', () => {
    expect(() => cantileverCut({ verticalOffsetM: -1, horizontalProjectionM: 1.5 })).toThrow(RangeError);
  });
});
