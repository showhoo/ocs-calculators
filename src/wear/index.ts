export { wearMeta } from './meta';

/** 默认更换阈值，% */
export const DEFAULT_REPLACEMENT_THRESHOLD_PERCENT = 20;

/** 站点计算器内置的 6 个型号及其标称截面，mm² */
export type ContactWireModel =
  | 'CTHM-120'
  | 'CTHM-150'
  | 'CTHA-120'
  | 'CTHA-150'
  | 'CTHS-120'
  | 'CTHS-150';

export const NOMINAL_SECTION_MM2: Record<ContactWireModel, number> = {
  'CTHM-120': 120,
  'CTHM-150': 150,
  'CTHA-120': 120,
  'CTHA-150': 150,
  'CTHS-120': 120,
  'CTHS-150': 150,
};

/** 更换判定结果 */
export type WearVerdict = 'keep' | 'replace';

interface WearBaseInput {
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

/**
 * 残径换算为截面积（圆截面近似）：A = π·d²/4，mm²。
 *
 * ⚠️ 接触线实际为梯形截面，此换算存在系统性偏差，站点同此口径。
 */
export function sectionFromDiameterMM2(diameterMM: number): number {
  if (!(diameterMM > 0)) {
    throw new RangeError(`残径必须为正数，收到 ${diameterMM} mm`);
  }
  return (Math.PI * diameterMM * diameterMM) / 4;
}

/**
 * 计算磨耗率并给出更换建议。
 *
 * η = (A₀ − A) / A₀ × 100%，η > 阈值时建议更换。
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

/** 按型号取标称截面积 A₀，mm² */
export function nominalSectionMM2(model: ContactWireModel): number {
  return NOMINAL_SECTION_MM2[model];
}
