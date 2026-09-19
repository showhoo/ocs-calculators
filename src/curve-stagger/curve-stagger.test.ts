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
 * 按页面默认输入算出（脚本 /tmp/dcalc/cs.mjs 生成，非手算）。
 * 页面传参时会做单位换算：
 *   d: in-d / 1000（mm→m）、T: in-T * 1000（kN→N）、l0: 1.435
 *
 * 2026-09-19 修复批 D 更正：超高横移 δ 纳入综合偏移合成（旧版 δ 仅计算返回、
 * 未参与 e，原注释「δ 不参与合成」删除）。新口径：
 *   e₊ = |ā + c − δ| + p_w；e₋ = |ā − c + δ| + p_w；e_max = max(e₊, e₋)。
 *
 * 默认输入：R=800 m、l=50 m、a1=0.25 m、a2=0.35 m、v=30 m/s、
 *           d=13.4 mm、α=1.2、T=25 kN、h=0.125 m、H=6.0 m、[e]=0.45 m
 *
 *   ā    = (0.25+0.35)/2        = 0.3
 *   c    = 50²/(8·800)          = 0.390625
 *   δ    = 6.0·0.125/1.435      = 0.5226480836236934
 *   p_w  = (½·1.225·30²·0.0134·1.2)·50²/(8·25000) = 0.11080125
 *   e₊   = |0.3+0.390625−δ| + p_w = 0.1679769163763066 + 0.11080125 = 0.2787781663763066
 *   e₋   = |0.3−0.390625+δ| + p_w = 0.4320230836236934 + 0.11080125 = 0.5428243336236934
 *   e_max= 0.5428243336236934 > [e]=0.45 → 仍判超限（判定结果未翻转，但主导风向由 e₊ 变为 e₋）
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

describe('curve-stagger - 与站点源码公式回归（δ 纳入合成，2026-09-19 更正）', () => {
  it('ā、矢度 c、超高横移 δ 与风偏 p_w', () => {
    const r = curveStaggerCheck(SITE_INPUT);
    expect(r.meanStaggerM).toBeCloseTo(0.3, 12);
    expect(r.versineM).toBeCloseTo(0.390625, 12);
    expect(r.cantShiftM).toBeCloseTo(0.5226480836236934, 12);
    expect(r.windOffsetM).toBeCloseTo(0.11080125, 12);
  });

  it('两个风向的综合偏移与最大值（含 δ）', () => {
    const r = curveStaggerCheck(SITE_INPUT);
    expect(r.offsetPlusM).toBeCloseTo(0.2787781663763066, 12);
    expect(r.offsetMinusM).toBeCloseTo(0.5428243336236934, 12);
    expect(r.maxOffsetM).toBeCloseTo(0.5428243336236934, 12);
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

  it('风速为 0 时偏移 = max(|ā+c−δ|, |ā−c+δ|)', () => {
    const r = curveStaggerCheck({ ...SITE_INPUT, windSpeedMPerS: 0 });
    expect(r.windOffsetM).toBe(0);
    // 脚本值：|0.3−0.390625+0.5226480836236934| = 0.4320230836236934
    expect(r.maxOffsetM).toBeCloseTo(0.4320230836236934, 12);
  });

  it('直线、无风且无超高时偏移等于平均拉出值', () => {
    const r = curveStaggerCheck({
      ...SITE_INPUT,
      curveRadiusM: 0,
      windSpeedMPerS: 0,
      cantM: 0,
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

  it('✅ δ 纳入合成（2026-09-19 更正）：改变 h 影响 maxOffsetM', () => {
    // 旧实现 δ 不参与合成，改 h 不影响结果；更正后 h 增大 → e₋ 增大 → e_max 增大。
    const noCant = curveStaggerCheck({ ...SITE_INPUT, cantM: 0 });
    const withCant = curveStaggerCheck({ ...SITE_INPUT, cantM: 0.25 });
    expect(withCant.cantShiftM).toBeGreaterThan(0);
    // δ 纳入后：h=0 时 e_max=|ā+c|+p_w=0.80142625
    expect(noCant.maxOffsetM).toBeCloseTo(0.80142625, 12);
    // h=0.25 → δ=1.0452961672473868；e₋=|0.3−0.390625+δ|+p_w=0.9546711672473868+0.11080125
    expect(withCant.maxOffsetM).toBeCloseTo(1.0654724172473868, 12);
    // 直线无风极端情形：e_max=|0.3−0.390625+δ|=1.3452961672473869
    const straight = curveStaggerCheck({
      ...SITE_INPUT,
      curveRadiusM: 0,
      windSpeedMPerS: 0,
      cantM: 0.25,
    });
    expect(straight.maxOffsetM).toBeCloseTo(1.3452961672473869, 12);
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
