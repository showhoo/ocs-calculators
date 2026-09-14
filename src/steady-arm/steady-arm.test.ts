import { describe, expect, it } from 'vitest';
import {
  steadyArmAngleDeg,
  steadyArmCheck,
  type SteadyArmInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/steady-arm/ 参考默认示范：
 *   T=25 kN、a=200 mm、l=50 m、l₁=5 m、g_j=0.0132 kN/m、G_d=0.04 kN
 *
 *   直线：Fz = 4·25·0.2/50 = 0.4 kN；Fc = 0.0132·5 + 0.04 = 0.106 kN
 *         θ = atan(0.106/0.4) = 14.8422°；n = 0.4/0.106 = 3.7736
 *   曲线 R=1000：Fq = 25·50/1000 = 1.25 kN；Fs = |1.25 − 0.4| = 0.85 kN
 *         θ = atan(0.106/0.85) = 7.1084°
 */
const STRAIGHT_INPUT: SteadyArmInput = {
  contactWireTensionKN: 25,
  staggerMM: 200,
  spanM: 50,
  firstDropperOffsetM: 5,
  wireWeightKNPerM: 0.0132,
  regulatorSelfWeightKN: 0.04,
};

const CURVE_INPUT: SteadyArmInput = {
  ...STRAIGHT_INPUT,
  curveRadiusM: 1000,
};

describe('steady-arm - 默认示例（直线）', () => {
  it('之字力 Fz = 4·T·a/l', () => {
    const r = steadyArmAngleDeg(STRAIGHT_INPUT);
    expect(r.staggerForceKN).toBeCloseTo(0.4, 9);
  });

  it('垂直力 Fc = g_j·l₁ + G_d', () => {
    const r = steadyArmAngleDeg(STRAIGHT_INPUT);
    expect(r.verticalForceKN).toBeCloseTo(0.106, 12);
  });

  it('坡度角 θ = atan(Fc/Fs) = 14.8422°', () => {
    const r = steadyArmAngleDeg(STRAIGHT_INPUT);
    expect(r.angleDeg).toBeCloseTo(14.8422, 3);
  });

  it('坡度比 n = Fs/Fc = 3.7736', () => {
    const r = steadyArmAngleDeg(STRAIGHT_INPUT);
    expect(r.slopeRatio).toBeCloseTo(3.7736, 3);
  });

  it('水平合成力等于之字力（直线）', () => {
    const r = steadyArmAngleDeg(STRAIGHT_INPUT);
    expect(r.horizontalForceKN).toBeCloseTo(r.staggerForceKN, 12);
    expect(r.curveForceKN).toBe(0);
  });
});

describe('steady-arm - 默认示例（曲线）', () => {
  it('曲线力 Fq = T·l/R', () => {
    const r = steadyArmAngleDeg(CURVE_INPUT);
    expect(r.curveForceKN).toBeCloseTo(1.25, 12);
  });

  it('合成力 Fs = |Fq − Fz| = 0.85', () => {
    const r = steadyArmAngleDeg(CURVE_INPUT);
    expect(r.horizontalForceKN).toBeCloseTo(0.85, 12);
  });

  it('坡度角 θ = 7.1084°', () => {
    const r = steadyArmAngleDeg(CURVE_INPUT);
    expect(r.angleDeg).toBeCloseTo(7.1084, 3);
  });

  it('isStraight 区分直线/曲线', () => {
    expect(steadyArmAngleDeg(STRAIGHT_INPUT).isStraight).toBe(true);
    expect(steadyArmAngleDeg(CURVE_INPUT).isStraight).toBe(false);
  });
});

describe('steady-arm - 限值校验', () => {
  it('直线 θ≥8° 判合格', () => {
    const r = steadyArmCheck(STRAIGHT_INPUT);
    expect(r.angleDeg).toBeCloseTo(14.8422, 3);
    expect(r.passes).toBe(true);
    expect(r.reason).toContain('≥ 8°');
  });

  it('直线坡度不足（θ<8°）判不合格', () => {
    // 跨距拉小 → 之字力 Fz 增大 → 坡度角减小
    const flat = steadyArmCheck({ ...STRAIGHT_INPUT, spanM: 25 });
    expect(flat.angleDeg).toBeCloseTo(7.5477, 3);
    expect(flat.angleDeg).toBeLessThan(8);
    expect(flat.passes).toBe(false);
  });

  it('曲线 6°≤θ≤16° 区间内判合格', () => {
    const r = steadyArmCheck(CURVE_INPUT);
    expect(r.angleDeg).toBeCloseTo(7.1084, 3);
    expect(r.passes).toBe(true);
    expect(r.reason).toContain('曲线区段');
  });

  it('曲线 θ>16° 判不合格（上界）', () => {
    // 曲线力接近之字力（R 接近 3125）→ Fs 极小 → 坡度角很大
    const steep = steadyArmCheck({ ...CURVE_INPUT, curveRadiusM: 3200 });
    expect(steep.angleDeg).toBeGreaterThan(16);
    expect(steep.passes).toBe(false);
  });

  it('曲线 θ<6° 判不合格（下界）', () => {
    // 极小之字力 + 极大曲线力 → Fs 大 → 坡度角小
    const shallow = steadyArmCheck({
      ...CURVE_INPUT,
      staggerMM: 60,
      wireWeightKNPerM: 0.005,
      regulatorSelfWeightKN: 0.01,
    });
    expect(shallow.angleDeg).toBeLessThan(6);
    expect(shallow.passes).toBe(false);
  });
});

describe('steady-arm - 数值性质', () => {
  it('拉出值翻倍则之字力翻倍', () => {
    const base = steadyArmAngleDeg(STRAIGHT_INPUT);
    const doubled = steadyArmAngleDeg({ ...STRAIGHT_INPUT, staggerMM: 400 });
    expect(doubled.staggerForceKN).toBeCloseTo(base.staggerForceKN * 2, 12);
  });

  it('半径越大曲线力越小', () => {
    const r = steadyArmAngleDeg({ ...CURVE_INPUT, curveRadiusM: 2000 });
    expect(r.curveForceKN).toBeCloseTo(0.625, 12);
  });

  it('垂直力仅由吊弦距离与自重决定，与跨距无关', () => {
    const a = steadyArmAngleDeg(STRAIGHT_INPUT);
    const b = steadyArmAngleDeg({ ...STRAIGHT_INPUT, spanM: 100 });
    expect(b.verticalForceKN).toBeCloseTo(a.verticalForceKN, 12);
  });
});

describe('steady-arm - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => steadyArmAngleDeg({ ...STRAIGHT_INPUT, contactWireTensionKN: 0 })).toThrow(
      RangeError,
    );
    expect(() => steadyArmAngleDeg({ ...STRAIGHT_INPUT, staggerMM: 0 })).toThrow(RangeError);
    expect(() => steadyArmAngleDeg({ ...STRAIGHT_INPUT, staggerMM: -100 })).toThrow(RangeError);
    expect(() => steadyArmAngleDeg({ ...STRAIGHT_INPUT, spanM: -5 })).toThrow(RangeError);
    expect(() => steadyArmAngleDeg({ ...STRAIGHT_INPUT, firstDropperOffsetM: -1 })).toThrow(
      RangeError,
    );
    expect(
      () => steadyArmAngleDeg({ ...STRAIGHT_INPUT, wireWeightKNPerM: -0.01 }),
    ).toThrow(RangeError);
    expect(
      () => steadyArmAngleDeg({ ...STRAIGHT_INPUT, regulatorSelfWeightKN: -1 }),
    ).toThrow(RangeError);
  });

  it('曲线半径非正抛 RangeError', () => {
    expect(() => steadyArmAngleDeg({ ...CURVE_INPUT, curveRadiusM: 0 })).toThrow(RangeError);
    expect(() => steadyArmAngleDeg({ ...CURVE_INPUT, curveRadiusM: -100 })).toThrow(
      RangeError,
    );
  });

  it('垂直力为零导致坡度无意义时抛错', () => {
    expect(() =>
      steadyArmAngleDeg({
        ...STRAIGHT_INPUT,
        wireWeightKNPerM: 0,
        regulatorSelfWeightKN: 0,
        firstDropperOffsetM: 0,
      }),
    ).toThrow(RangeError);
  });

  it('check 复用 angle 计算并进行限值判定', () => {
    const r = steadyArmCheck(CURVE_INPUT);
    const base = steadyArmAngleDeg(CURVE_INPUT);
    expect(r.angleDeg).toBeCloseTo(base.angleDeg, 12);
    expect(r.horizontalForceKN).toBeCloseTo(base.horizontalForceKN, 12);
  });
});