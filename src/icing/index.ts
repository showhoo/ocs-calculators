export { icingMeta } from './meta';

// 冰筒模型与 tension 模块共用 src/common/ice.ts，由根 index 统一导出
import { iceLoadNPerM, type IceLoadParams } from '../common/ice';

export interface IcingCheckInput {
  /** 线索直径 d，m */
  readonly wireDiameterM: number;
  /** 覆冰厚度 b，m。传 0 表示无冰 */
  readonly iceThicknessM: number;
  /** 线索张力 T，N */
  readonly tensionN: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 线索自重 g_self，N/m */
  readonly selfWeightNPerM: number;
  /** 冰密度 ρ_ice，kg/m³。缺省 900 */
  readonly iceDensityKgPerM3?: number;
}

export interface IcingCheckResult {
  /** 单位长度冰重 g_ice，N/m */
  readonly iceLoadNPerM: number;
  /** 覆冰后总垂直荷载 g_total，N/m */
  readonly totalLoadNPerM: number;
  /** 无冰弛度 f₀，m */
  readonly sagNoIceM: number;
  /** 覆冰弛度 f_ice，m */
  readonly sagWithIceM: number;
  /** 弛度增幅，% */
  readonly growthPercent: number;
  /** 冰重是否超过线索自重（重覆冰判据） */
  readonly heavy: boolean;
}

/**
 * 覆冰综合校核。
 *
 * 给出覆冰后的总垂直荷载、弛度及增幅；冰重超过线索自重时 `heavy` 为真。
 *
 * ⚠️ 弛度按抛物线近似，且**未与张力-温度状态方程耦合** —— 覆冰引起的
 * 张力变化未计入，大覆冰工况偏于乐观。
 */
export function icingCheck(input: IcingCheckInput): IcingCheckResult {
  const { wireDiameterM, iceThicknessM, tensionN, spanM, selfWeightNPerM } = input;

  if (!(tensionN > 0)) {
    throw new RangeError(`张力必须为正数，收到 ${tensionN} N`);
  }
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }
  if (!(selfWeightNPerM > 0)) {
    throw new RangeError(`线索自重必须为正数，收到 ${selfWeightNPerM} N/m`);
  }

  const iceParams: IceLoadParams = {
    wireDiameterM,
    iceThicknessM,
    ...(input.iceDensityKgPerM3 === undefined
      ? {}
      : { iceDensityKgPerM3: input.iceDensityKgPerM3 }),
  };
  const gIce = iceLoadNPerM(iceParams);
  const gTotal = selfWeightNPerM + gIce;

  const fNoIce = (selfWeightNPerM * spanM * spanM) / (8 * tensionN);
  const fIce = (gTotal * spanM * spanM) / (8 * tensionN);

  return {
    iceLoadNPerM: gIce,
    totalLoadNPerM: gTotal,
    sagNoIceM: fNoIce,
    sagWithIceM: fIce,
    growthPercent: (fIce / fNoIce - 1) * 100,
    heavy: gIce > selfWeightNPerM,
  };
}
