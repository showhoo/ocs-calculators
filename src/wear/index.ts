export { wearMeta } from './meta';

/** 更换阈值缺省值：η > 20% 建议更换接触线 */
export const DEFAULT_REPLACEMENT_THRESHOLD_PERCENT = 20;

/** 磨耗计算公共输入 */
export interface WearBaseInput {
  /** 原截面积 A₀，mm² */
  readonly originalSectionMM2: number;
  /** 更换阈值 η，%。缺省 20 */
  readonly replacementThresholdPercent?: number;
}

/** 按实测残截面积计算 */
export interface WearByAreaInput extends WearBaseInput {
  readonly mode: 'area';
  /** 实测残截面积 A，mm²，不得大于 A₀ */
  readonly residualSectionMM2: number;
}

/** 按实测残径计算（圆截面近似 A = πd²/4） */
export interface WearByDiameterInput extends WearBaseInput {
  readonly mode: 'residual-diameter';
  /** 实测残径 d，mm */
  readonly residualDiameterMM: number;
}

export type WearInput = WearByAreaInput | WearByDiameterInput;

/** 判定结论：keep = 继续使用，replace = 建议更换 */
export type WearVerdict = 'keep' | 'replace';

/** 磨耗率计算结果 */
export interface WearResult {
  /** 原截面积 A₀，mm² */
  readonly originalSectionMM2: number;
  /** 参与计算的残截面积 A，mm²（残径模式为换算值） */
  readonly residualSectionMM2: number;
  /** 截面损失 A₀ − A，mm² */
  readonly sectionLossMM2: number;
  /** 磨耗率 η，% */
  readonly wearPercent: number;
  /** 使用的更换阈值，% */
  readonly thresholdPercent: number;
  readonly verdict: WearVerdict;
}

/** 圆截面近似：由实测残径 d（mm）换算残截面积 A = π·d²/4（mm²） */
export function sectionFromDiameterMM2(diameterMM: number): number {
  if (!(diameterMM > 0)) {
    throw new RangeError(`残径必须为正数，收到 ${diameterMM} mm`);
  }
  return (Math.PI * diameterMM * diameterMM) / 4;
}

/**
 * 接触线磨耗率：η = (A₀ − A) / A₀ × 100%。
 *
 * 支持两种输入模式：直接给残截面积（`mode: 'area'`），或给实测残径
 * 按 A = π·d²/4 换算（`mode: 'residual-diameter'`）。
 *
 * 判定：η **严格大于**阈值（缺省 20%）判为 `replace`，等于阈值仍为 `keep`。
 */
export function wearRatio(input: WearInput): WearResult {
  const { originalSectionMM2: a0 } = input;
  if (!(a0 > 0)) {
    throw new RangeError(`原截面积必须为正数，收到 ${a0} mm²`);
  }

  const residualSectionMM2 =
    input.mode === 'area'
      ? input.residualSectionMM2
      : sectionFromDiameterMM2(input.residualDiameterMM);
  if (!(residualSectionMM2 > 0)) {
    throw new RangeError(`残截面积必须为正数，收到 ${residualSectionMM2} mm²`);
  }
  if (residualSectionMM2 > a0) {
    throw new RangeError(
      `残截面积 ${residualSectionMM2.toFixed(2)} mm² 不能大于原截面积 ${a0} mm²`,
    );
  }

  const thresholdPercent =
    input.replacementThresholdPercent ?? DEFAULT_REPLACEMENT_THRESHOLD_PERCENT;
  if (!(thresholdPercent > 0)) {
    throw new RangeError(`更换阈值必须为正数，收到 ${thresholdPercent}%`);
  }

  const sectionLossMM2 = a0 - residualSectionMM2;
  const wearPercent = (sectionLossMM2 / a0) * 100;

  return {
    originalSectionMM2: a0,
    residualSectionMM2,
    sectionLossMM2,
    wearPercent,
    thresholdPercent,
    verdict: wearPercent > thresholdPercent ? 'replace' : 'keep',
  };
}
