/**
 * 电阻温度修正 —— copper 与 voltage-drop 共用。
 *
 * ⚠️ 注意别与线膨胀系数混淆：
 *   - 本文件的 α = 0.00393 /℃ 是**电阻**温度系数
 *   - wire-specs 的 COPPER_ALLOY_ALPHA_PER_DEG_C = 1.7e-5 /℃ 是**热膨胀**系数
 * 两者相差两个数量级，混用会导致结果严重偏离。
 */

/** 铜的电阻温度系数，1/℃ */
export const COPPER_ALPHA_PER_DEG_C = 0.00393;

/** IACS 退火铜 20℃ 标准电阻率，Ω·mm²/m（= 1/58） */
export const IACS_RESISTIVITY_OHM_MM2_PER_M = 0.017241;

/**
 * 单位电阻温度修正：r_T = r₂₀·[1 + α·(T − 20)]。
 *
 * @param r20OhmPerKm 20℃ 单位电阻，Ω/km
 * @param tempDegC 环境温度，℃
 * @param alphaPerDegC 电阻温度系数，1/℃。缺省铜 0.00393
 * @returns 该温度下的单位电阻，Ω/km
 */
export function resistanceAtTempOhmPerKm(
  r20OhmPerKm: number,
  tempDegC: number,
  alphaPerDegC: number = COPPER_ALPHA_PER_DEG_C,
): number {
  if (!(r20OhmPerKm > 0)) {
    throw new RangeError(`20℃ 单位电阻必须为正数，收到 ${r20OhmPerKm} Ω/km`);
  }
  if (!(alphaPerDegC > 0)) {
    throw new RangeError(`电阻温度系数必须为正数，收到 ${alphaPerDegC} /℃`);
  }
  return r20OhmPerKm * (1 + alphaPerDegC * (tempDegC - 20));
}
