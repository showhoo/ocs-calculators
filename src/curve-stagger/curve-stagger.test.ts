import { describe, expect, it } from 'vitest';
import {
  cantShiftM,
  curveStaggerCheck,
  DEFAULT_PANTOGRAPH_HEIGHT_M,
  STANDARD_GAUGE_M,
  versineM,
  type CurveStaggerInput,
} from './index';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 curveStaggerCheck() 源码公式
 * 按页面默认输入算出。页面传参时会做单位换算：
 *   d: in-d / 1000（mm→m）、T: in-T * 1000（kN→N）、l0: 1.435
 *
 * 默认输入：R=800 m、l=50 m、a1=0.25 m、a2=0.35 m、v=30 m/s、
 *           d=13.4 mm、α=1.2、T=25 kN、h=0.125 m、H=6.0 m、[e]=0.45 m
 *
 *   ā    = (0.25+0.35)/2        = 0.3
 *   c    = 50²/(8·800)          = 0.390625
 *   δ    = 6.0·0.125/1.435      = 0.5226480836236934
 *   p_w  = (½·1.225·30²·0.0134·1.2)·50²/(8·25000) = 0.11080125
 *   e₊   = |0.3+0.390625| + p_w = 0.80142625
 *   e₋   = |0.3−0.390625| + p_w = 0.20142625
 */
const SITE_INPUT: CurveStaggerInput = {
  curveRadiusM: 800,
  spanM: 50,
  stagger1M: 0.25,
  stagger2M: 0.35,
  windSpeedMPerS: 30,
  wireDiameterM: 13.4 / 1000,
  dragCoefficient: 1.2,
  tensionN: 25 * 1000,
  allowableOffsetM: 0.45,
  pantographHeightM: 6.0,
  cantM: 0.125,
};

describe('curve-stagger - 与站点源码公式回归', () => {
  it('ā、矢度 c、超高横移 δ 与风偏 p_w', () => {
    const r = curveStaggerCheck(SITE_INPUT);
    expect(r.meanStaggerM).toBeCloseTo(0.3, 12);
    expect(r.versineM).toBeCloseTo(0.390625, 12);
    expect(r.cantShiftM).toBeCloseTo(0.5226480836236934, 12);
    expect(r.windOffsetM).toBeCloseTo(0.11080125, 12);
  });

  it('两个风向的综合偏移与最大值', () => {
    const r = curveStaggerCheck(SITE_INPUT);
    expect(r.offsetPlusM).toBeCloseTo(0.80142625, 12);
    expect(r.offsetMinusM).toBeCloseTo(0.20142625, 12);
    expect(r.maxOffsetM).toBeCloseTo(0.80142625, 12);
  });

  it('默认工况（小半径曲线）判定为超限', () => {
    const r = curveStaggerCheck(SITE_INPUT);
    expect(r.passes).toBe(false);
  });
});

describe('curve-stagger - 公式性质', () => {
  it('直线段（R = 0 或 Infinity）矢度为 0', () => {
    expect(versineM(50, 0)).toBe(0);
    expect(versineM(50, Infinity)).toBe(0);
  });

  it('矢度与 l² 成正比、与 R 成反比', () => {
    expect(versineM(100, 800)).toBeCloseTo(versineM(50, 800) * 4, 12);
    expect(versineM(50, 1600)).toBeCloseTo(versineM(50, 800) / 2, 12);
  });

  it('δ = H·h/l₀', () => {
    // 手算：6.0 × 0.125 / 1.435
    expect(cantShiftM(0.125, 6.0, 1.435)).toBeCloseTo((6.0 * 0.125) / 1.435, 12);
    expect(DEFAULT_PANTOGRAPH_HEIGHT_M).toBeCloseTo(6.0, 12);
    expect(STANDARD_GAUGE_M).toBeCloseTo(1.435, 12);
  });

  it('超高为 0 时横移为 0', () => {
    expect(curveStaggerCheck({ ...SITE_INPUT, cantM: 0 }).cantShiftM).toBe(0);
  });

  it('风偏与风速平方成正比', () => {
    const base = curveStaggerCheck(SITE_INPUT);
    const double = curveStaggerCheck({ ...SITE_INPUT, windSpeedMPerS: 60 });
    expect(double.windOffsetM).toBeCloseTo(base.windOffsetM * 4, 12);
  });

  it('风速为 0 时仅剩拉出值与矢度', () => {
    const r = curveStaggerCheck({ ...SITE_INPUT, windSpeedMPerS: 0 });
    expect(r.windOffsetM).toBe(0);
    expect(r.maxOffsetM).toBeCloseTo(Math.abs(0.3 + 0.390625), 12);
  });

  it('直线段且无风时偏移等于平均拉出值', () => {
    const r = curveStaggerCheck({
      ...SITE_INPUT,
      curveRadiusM: 0,
      windSpeedMPerS: 0,
      stagger1M: 0.2,
      stagger2M: 0.4,
    });
    expect(r.maxOffsetM).toBeCloseTo(0.3, 12);
  });

  it('容错范围内判合格', () => {
    const r = curveStaggerCheck({ ...SITE_INPUT, allowableOffsetM: 0.9 });
    expect(r.passes).toBe(true);
  });

  it('恰好等于容许偏移判合格（判据为 ≤）', () => {
    const max = curveStaggerCheck(SITE_INPUT).maxOffsetM;
    const r = curveStaggerCheck({ ...SITE_INPUT, allowableOffsetM: max });
    expect(r.passes).toBe(true);
  });

  it('⚠️ 与站点实现一致：δ 计算但不参与 e 的合成', () => {
    // 站点 JSDoc 写 `e = |ā ± c ∓ δ| + p_w`，实现却未使用 δ。
    // 本测试锁定当前实现行为：改变 h 不影响 maxOffsetM。
    const noCant = curveStaggerCheck({ ...SITE_INPUT, cantM: 0 });
    const withCant = curveStaggerCheck({ ...SITE_INPUT, cantM: 0.25 });
    expect(withCant.cantShiftM).toBeGreaterThan(0);
    expect(withCant.maxOffsetM).toBeCloseTo(noCant.maxOffsetM, 12);
    // 若站点日后按 JSDoc 修正，这条断言会失败，提示需同步更新
  });
});

describe('curve-stagger - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => curveStaggerCheck({ ...SITE_INPUT, spanM: 0 })).toThrow(RangeError);
    expect(() => curveStaggerCheck({ ...SITE_INPUT, tensionN: 0 })).toThrow(RangeError);
    expect(() => curveStaggerCheck({ ...SITE_INPUT, wireDiameterM: 0 })).toThrow(RangeError);
    expect(() => curveStaggerCheck({ ...SITE_INPUT, dragCoefficient: 0 })).toThrow(RangeError);
    expect(() => curveStaggerCheck({ ...SITE_INPUT, windSpeedMPerS: -1 })).toThrow(RangeError);
    expect(() => curveStaggerCheck({ ...SITE_INPUT, allowableOffsetM: 0 })).toThrow(RangeError);
    expect(() => cantShiftM(-0.1)).toThrow(RangeError);
  });
});
