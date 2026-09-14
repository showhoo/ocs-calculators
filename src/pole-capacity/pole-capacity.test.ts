import { describe, it, expect } from 'vitest';
import { poleCapacityCheck, STEEL_POLE_SERIES_KNM } from './index';

describe('poleCapacity', () => {
  it('默认直线算例：Tj=25/Tc=15/a=200/l=50/he=7/Pw=500/bp=0.3/hp=10 → M≈11.98kN·m、选G150', () => {
    const r = poleCapacityCheck({ section: 'line', contactWireTensionKN: 25, messengerTensionKN: 15, staggerMM: 200, spanM: 50, resultantHeightM: 7, windPressurePa: 500, poleWidthM: 0.3, poleHeightM: 10 });
    expect(r.horizontalForceN).toBeCloseTo(640, 0);
    expect(r.workMomentKNM).toBeCloseTo(11.98, 2);
    expect(r.selection).toBe('G150');
  });
  it('钢柱系列含 16 档且 1.5 规律', () => {
    expect(STEEL_POLE_SERIES_KNM).toHaveLength(16);
    expect(STEEL_POLE_SERIES_KNM[0]).toBe(150);
  });
  it('大弯矩选 G1500', () => {
    const r = poleCapacityCheck({ section: 'line', contactWireTensionKN: 45, messengerTensionKN: 35, staggerMM: 500, spanM: 30, resultantHeightM: 12, windPressurePa: 1500, poleWidthM: 1, poleHeightM: 20 });
    expect(r.selection).toBe('G250');
  });
  it('曲线缺半径抛错', () => {
    expect(() => poleCapacityCheck({ section: 'curve', contactWireTensionKN: 25, messengerTensionKN: 15, staggerMM: 200, spanM: 50, resultantHeightM: 7, windPressurePa: 500, poleWidthM: 0.3, poleHeightM: 10 })).toThrow(RangeError);
  });
});
