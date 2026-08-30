import { describe, expect, it } from 'vitest';
import {
  assessContactForce,
  referenceTargetForceN,
  statisticalForcesN,
  type ContactForceInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/force/ 已发布的输出：
 *   F_max = 275 N，F_min = 125 N，F_ref(AC) = 188.8 N，偏差 = +11.2 N
 *   上限/下限判定均为"未判定"
 *
 * 参数反推：Fmax/Fmin 对称 → Fm = 200 N，3σ = 75 → σ = 25 N；
 * Fref = 188.8 → 0.00097·v² = 118.8 → v = 350 km/h（0.00097×122500 = 118.825）。
 * 验收上下限未填，与"未判定"一致。
 */
const SITE_INPUT: ContactForceInput = {
  meanForceN: 200,
  stdDevN: 25,
  speedKmH: 350,
  maxLimitN: null,
  minLimitN: null,
};

describe('force - 与站点已发布输出回归', () => {
  it('Fmax = 275 N，Fmin = 125 N', () => {
    const r = assessContactForce(SITE_INPUT);
    expect(r.maxForceN).toBeCloseTo(275, 9);
    expect(r.minForceN).toBeCloseTo(125, 9);
  });

  it('AC 体系 Fref = 188.825 N，偏差 +11.175 N', () => {
    const r = assessContactForce(SITE_INPUT);
    // 0.00097 × 350² + 70 = 118.825 + 70 = 188.825
    expect(r.referenceTargetN).toBeCloseTo(188.825, 6);
    expect(r.meanDeviationN).toBeCloseTo(11.175, 6);
  });

  it('未填限值时判定为 not-assessed', () => {
    const r = assessContactForce(SITE_INPUT);
    expect(r.maxVerdict).toBe('not-assessed');
    expect(r.minVerdict).toBe('not-assessed');
  });
});

describe('force - 参考目标力', () => {
  it('EN 50367 表6 示例：v=200 km/h 时 AC 为 108.8 N', () => {
    // 0.00097 × 40000 + 70 = 38.8 + 70 = 108.8
    expect(referenceTargetForceN(200, 'ac')).toBeCloseTo(108.8, 6);
  });

  it('三种供电制式的常数项', () => {
    expect(referenceTargetForceN(0, 'ac')).toBeCloseTo(70, 12);
    expect(referenceTargetForceN(0, 'dc3kv')).toBeCloseTo(110, 12);
    expect(referenceTargetForceN(0, 'dc15kv')).toBeCloseTo(140, 12);
  });

  it('DC 体系常数与 TSI ENE 2011/274/EU 一致', () => {
    expect(referenceTargetForceN(350, 'dc3kv')).toBeCloseTo(228.825, 6);
    expect(referenceTargetForceN(350, 'dc15kv')).toBeCloseTo(258.825, 6);
  });

  it('速度平方关系', () => {
    const v100 = referenceTargetForceN(100, 'ac');
    const v200 = referenceTargetForceN(200, 'ac');
    // 二次项部分应为 4 倍
    expect(v200 - 70).toBeCloseTo((v100 - 70) * 4, 6);
  });
});

describe('force - 统计评价', () => {
  it('零标准差时 Fmax = Fmin = Fm', () => {
    const { maxN, minN } = statisticalForcesN(200, 0);
    expect(maxN).toBeCloseTo(200, 12);
    expect(minN).toBeCloseTo(200, 12);
  });

  it('上限判定：合格与超限', () => {
    expect(assessContactForce({ ...SITE_INPUT, maxLimitN: 300 }).maxVerdict).toBe('pass');
    expect(assessContactForce({ ...SITE_INPUT, maxLimitN: 275 }).maxVerdict).toBe('pass');
    expect(assessContactForce({ ...SITE_INPUT, maxLimitN: 270 }).maxVerdict).toBe('fail');
  });

  it('下限判定：合格与超限', () => {
    expect(assessContactForce({ ...SITE_INPUT, minLimitN: 120 }).minVerdict).toBe('pass');
    expect(assessContactForce({ ...SITE_INPUT, minLimitN: 125 }).minVerdict).toBe('pass');
    expect(assessContactForce({ ...SITE_INPUT, minLimitN: 130 }).minVerdict).toBe('fail');
  });

  it('只填一侧限值时另一侧仍为未判定', () => {
    const r = assessContactForce({ ...SITE_INPUT, maxLimitN: 300 });
    expect(r.maxVerdict).toBe('pass');
    expect(r.minVerdict).toBe('not-assessed');
  });

  it('速度为 null 时不输出参考目标力', () => {
    const r = assessContactForce({ ...SITE_INPUT, speedKmH: null });
    expect(r.referenceTargetN).toBeNull();
    expect(r.meanDeviationN).toBeNull();
  });
});

describe('force - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => statisticalForcesN(0, 25)).toThrow(RangeError);
    expect(() => statisticalForcesN(-10, 25)).toThrow(RangeError);
    expect(() => statisticalForcesN(200, -1)).toThrow(RangeError);
    expect(() => referenceTargetForceN(-1, 'ac')).toThrow(RangeError);
  });
});
