import { describe, it, expect } from 'vitest';
import { creepageCheck, CREEPAGE_FLOOR_GENERAL, CREEPAGE_FLOOR_VCUT } from './index';

describe('creepage', () => {
  it('一般区段底线 1400', () => {
    expect(CREEPAGE_FLOOR_GENERAL).toBe(1400);
    expect(CREEPAGE_FLOOR_VCUT).toBe(1600);
  });
  it('1399 不合格、1400 合格', () => {
    expect(creepageCheck({ creepageMM: 1399 }).passes).toBe(false);
    expect(creepageCheck({ creepageMM: 1400 }).passes).toBe(true);
  });
  it('V 形天窗 1600 底线', () => {
    expect(creepageCheck({ creepageMM: 1599, scenario: 'vcut' }).passes).toBe(false);
    expect(creepageCheck({ creepageMM: 1600, scenario: 'vcut' }).passes).toBe(true);
  });
  it('比距三档按 29kV 折算', () => {
    const r = creepageCheck({ creepageMM: 1500 });
    expect(r.uscdBands[0]?.mm).toBe(696);
  });
  it('苛刻档折算不泄漏 Infinity', () => {
    const r = creepageCheck({ creepageMM: 1500 });
    expect(r.uscdBands[2]?.mm).toBe(1392);
    expect(Number.isFinite(r.uscdBands[2]?.mm ?? NaN)).toBe(true);
  });
});
