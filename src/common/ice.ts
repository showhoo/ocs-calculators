/**
 * 覆冰冰筒模型 —— tension 与 icing 共用。
 *
 * 统一使用 SI 单位（米），与站点 calc-core.js 的 icingCheck 内部口径一致。
 * 页面侧若以 mm 采集，调用前需自行 /1000。
 */

import { G0 } from '../types';

/** 冰密度常用值，kg/m³ */
export const DEFAULT_ICE_DENSITY_KG_PER_M3 = 900;

export interface IceLoadParams {
  /** 线索直径 d，m */
  readonly wireDiameterM: number;
  /** 覆冰厚度 b，m。传 0 表示无冰 */
  readonly iceThicknessM: number;
  /** 冰密度 ρ_ice，kg/m³。缺省 900 */
  readonly iceDensityKgPerM3?: number;
}

/**
 * 冰筒模型单位长度冰重：g_ice = ρ_ice·g₀·π·b·(d + b)，N/m。
 *
 * 传 iceThicknessM = 0 时返回 0。
 */
export function iceLoadNPerM(params: IceLoadParams): number {
  const { wireDiameterM, iceThicknessM } = params;
  const rho = params.iceDensityKgPerM3 ?? DEFAULT_ICE_DENSITY_KG_PER_M3;

  if (!(wireDiameterM > 0)) {
    throw new RangeError(`线索直径必须为正数，收到 ${wireDiameterM} m`);
  }
  if (!(iceThicknessM >= 0)) {
    throw new RangeError(`覆冰厚度不能为负，收到 ${iceThicknessM} m`);
  }
  if (!(rho > 0)) {
    throw new RangeError(`冰密度必须为正数，收到 ${rho} kg/m³`);
  }
  if (iceThicknessM === 0) return 0;

  return rho * G0 * Math.PI * iceThicknessM * (wireDiameterM + iceThicknessM);
}
