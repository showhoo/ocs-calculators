export { forceMeta } from './meta';

/** 供电制式，决定参考目标力 Fref 的常数项 */
export type PowerSystem = 'ac' | 'dc3kv' | 'dc15kv';

/** 限值判定结果 */
export type LimitVerdict = 'pass' | 'fail' | 'not-assessed';

/** Fref = 0.00097·v² + offset，offset 按供电制式取值 */
export const REF_TARGET_COEFF = 0.00097;

/** 参考目标力常数项，N。AC 引自 EN 50367 表6，DC 引自 TSI ENE 2011/274/EU */
export const REF_TARGET_OFFSET_N: Record<PowerSystem, number> = {
  ac: 70,
  dc3kv: 110,
  dc15kv: 140,
};

export interface ContactForceInput {
  /** 平均接触力 Fm，N（同一 C1 检测区段统计均值） */
  readonly meanForceN: number;
  /** 标准差 σ，N（同一区段统计标准差） */
  readonly stdDevN: number;
  /** 速度 v，km/h。传 null 则不输出参考目标力 */
  readonly speedKmH: number | null;
  /** 验收上限 Fmax,lim，N。传 null 则不判定 */
  readonly maxLimitN: number | null;
  /** 验收下限 Fmin,lim，N。传 null 则不判定 */
  readonly minLimitN: number | null;
  /** 供电制式。缺省为交流 */
  readonly system?: PowerSystem;
}

export interface ContactForceResult {
  readonly meanForceN: number;
  readonly stdDevN: number;
  /** 统计最大力 Fmax = Fm + 3σ，N */
  readonly maxForceN: number;
  /** 统计最小力 Fmin = Fm − 3σ，N */
  readonly minForceN: number;
  /** 参考目标力 Fref，N。未提供速度时为 null */
  readonly referenceTargetN: number | null;
  /** 均值对参考目标的偏差 Fm − Fref，N。未提供速度时为 null */
  readonly meanDeviationN: number | null;
  /** 上限判定 */
  readonly maxVerdict: LimitVerdict;
  /** 下限判定 */
  readonly minVerdict: LimitVerdict;
}

/**
 * 参考目标力 Fref，N。
 *
 * Fref = 0.00097·v² + offset
 *
 * @param speedKmH 速度 v，km/h
 * @param system 供电制式，缺省 'ac'
 * @returns 参考目标力，N
 */
export function referenceTargetForceN(
  speedKmH: number,
  system: PowerSystem = 'ac',
): number {
  if (!(speedKmH >= 0)) {
    throw new RangeError(`速度不能为负，收到 ${speedKmH} km/h`);
  }
  return REF_TARGET_COEFF * speedKmH * speedKmH + REF_TARGET_OFFSET_N[system];
}

/**
 * 统计极值：Fmax = Fm + 3σ，Fmin = Fm − 3σ。
 *
 * @returns 统计最大力与最小力，N
 */
export function statisticalForcesN(
  meanForceN: number,
  stdDevN: number,
): { readonly maxN: number; readonly minN: number } {
  if (!(meanForceN > 0)) {
    throw new RangeError(`平均接触力必须为正数，收到 ${meanForceN} N`);
  }
  if (!(stdDevN >= 0)) {
    throw new RangeError(`标准差不能为负，收到 ${stdDevN} N`);
  }
  const threeSigma = 3 * stdDevN;
  return { maxN: meanForceN + threeSigma, minN: meanForceN - threeSigma };
}

/**
 * 弓网接触力统计评价（EN 50367 框架）。
 *
 * 上下限传 null 表示该侧不参与判定，对应判定结果为 'not-assessed'。
 */
export function assessContactForce(input: ContactForceInput): ContactForceResult {
  const { meanForceN, stdDevN, speedKmH, maxLimitN, minLimitN } = input;

  const { maxN, minN } = statisticalForcesN(meanForceN, stdDevN);

  const referenceTargetN = speedKmH === null ? null : referenceTargetForceN(speedKmH, input.system ?? 'ac');
  const meanDeviationN =
    referenceTargetN === null ? null : meanForceN - referenceTargetN;

  const maxVerdict: LimitVerdict =
    maxLimitN === null ? 'not-assessed' : maxN <= maxLimitN ? 'pass' : 'fail';
  const minVerdict: LimitVerdict =
    minLimitN === null ? 'not-assessed' : minN >= minLimitN ? 'pass' : 'fail';

  return {
    meanForceN,
    stdDevN,
    maxForceN: maxN,
    minForceN: minN,
    referenceTargetN,
    meanDeviationN,
    maxVerdict,
    minVerdict,
  };
}
