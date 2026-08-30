import { G0 } from '../types';

export { tensionMeta } from './meta';

/** 单个温度档的输入参数 */
export interface TensionPointInput {
  /** 基准工况张力 T₁，kN */
  readonly baseTensionKN: number;
  /** 基准温度 t₁，℃ */
  readonly baseTempDegC: number;
  /** 目标温度 t₂，℃ */
  readonly targetTempDegC: number;
  /** 单位自重荷载 g，N/m（覆冰工况传自重与冰重的组合值） */
  readonly weightPerLengthNPerM: number;
  /** 计算跨距 l，m（多跨锚段传当量跨距 l_D） */
  readonly spanM: number;
  /** 弹性模量 E，GPa */
  readonly elasticModulusGPa: number;
  /** 截面积 A，mm² */
  readonly crossSectionMM2: number;
  /** 线膨胀系数 α，1/℃ */
  readonly expansionPerDegC: number;
}

/** 安装曲线公共参数（不含目标温度） */
export type TensionCurveInput = Omit<TensionPointInput, 'targetTempDegC'>;

/** 单个温度档的计算结果 */
export interface TensionResult {
  /** 目标温度 t₂，℃ */
  readonly targetTempDegC: number;
  /** 该温度下的张力 T₂，kN */
  readonly tensionKN: number;
  /** 跨中弛度 f，m（抛物线近似） */
  readonly sagM: number;
  /** 求解迭代次数 */
  readonly iterations: number;
  /** 状态方程残差，N（用于校验收敛，应接近 0） */
  readonly residualN: number;
}

/**
 * 跨中弛度，抛物线近似：f = gl²/(8T)
 * @param weightPerLengthNPerM 单位自重荷载 g，N/m
 * @param spanM 跨距 l，m
 * @param tensionN 张力 T，N
 * @returns 弛度 f，m
 */
export function sagM(
  weightPerLengthNPerM: number,
  spanM: number,
  tensionN: number,
): number {
  if (!(tensionN > 0)) {
    throw new RangeError(`张力必须为正数，收到 ${tensionN} N`);
  }
  return (weightPerLengthNPerM * spanM * spanM) / (8 * tensionN);
}

/**
 * 当量跨距（多跨锚段归算）：l_D = √(Σlᵢ³ / Σlᵢ)
 * @param spansM 各跨跨距，m
 * @returns 当量跨距 l_D，m
 */
export function equivalentSpanM(spansM: readonly number[]): number {
  if (spansM.length === 0) {
    throw new RangeError('跨距数组不能为空');
  }
  let sumCubed = 0;
  let sum = 0;
  for (const s of spansM) {
    if (!(s > 0)) {
      throw new RangeError(`跨距必须为正数，收到 ${s}`);
    }
    sumCubed += s * s * s;
    sum += s;
  }
  return Math.sqrt(sumCubed / sum);
}

/**
 * 覆冰荷载，均匀冰筒模型：g_ice = ρ_ice · g₀ · π · b · (d + b)
 * @returns 单位长度冰重，N/m
 */
export function iceLoadNPerM(params: {
  readonly iceDensityKgPerM3: number;
  readonly iceThicknessMM: number;
  readonly wireDiameterMM: number;
}): number {
  const bM = params.iceThicknessMM * 1e-3;
  const dM = params.wireDiameterMM * 1e-3;
  if (params.iceThicknessMM < 0 || params.wireDiameterMM <= 0) {
    throw new RangeError('覆冰厚度不能为负，线径必须为正');
  }
  return params.iceDensityKgPerM3 * G0 * Math.PI * bM * (dM + bM);
}

/**
 * 状态方程系数 K = g²l²EA/24，单位 N³。
 * 使状态方程可写成 F(T) = T − K/T² 的紧凑形式。
 */
export function stateCoefficientK(
  weightPerLengthNPerM: number,
  spanM: number,
  elasticModulusGPa: number,
  crossSectionMM2: number,
): number {
  const ePa = elasticModulusGPa * 1e9;
  const aM2 = crossSectionMM2 * 1e-6;
  return (weightPerLengthNPerM * weightPerLengthNPerM * spanM * spanM * ePa * aM2) / 24;
}

/**
 * 求解状态方程 T − K/T² = target 的正根。
 *
 * h(T) = T − K/T² − target 在 T > 0 上严格单调递增（h′ = 1 + 2K/T³ > 0），
 * 因此用二分法必定收敛。又由 T = target + K/T² 可知 T > target，
 * 可直接取 target 作为下界，bracket 很紧。
 */
export function solveTensionN(
  K: number,
  targetN: number,
): { tensionN: number; iterations: number; residualN: number } {
  const hOf = (t: number): number => t - K / (t * t) - targetN;

  let lo = Math.max(targetN, 1e-9);
  let hi = lo + 1;
  let guard = 0;
  while (hOf(hi) < 0 && guard++ < 200) {
    hi = lo + (hi - lo) * 2;
    if (!Number.isFinite(hi)) break;
  }

  let iterations = 0;
  for (let i = 0; i < 200; i++) {
    iterations = i + 1;
    const mid = 0.5 * (lo + hi);
    if (hOf(mid) < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo <= 1e-12 * Math.max(1, hi)) break;
  }

  const tensionN = 0.5 * (lo + hi);
  return { tensionN, iterations, residualN: hOf(tensionN) };
}

/**
 * 求某一温度档的张力与弛度。
 *
 * 状态方程：T₂ − g²l²EA/(24T₂²) = T₁ − g²l²EA/(24T₁²) − αEA(t₂ − t₁)
 */
export function tensionAt(input: TensionPointInput): TensionResult {
  const T1N = input.baseTensionKN * 1000;
  if (!(T1N > 0)) {
    throw new RangeError(`基准张力必须为正数，收到 ${input.baseTensionKN} kN`);
  }
  if (!(input.spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${input.spanM} m`);
  }

  const K = stateCoefficientK(
    input.weightPerLengthNPerM,
    input.spanM,
    input.elasticModulusGPa,
    input.crossSectionMM2,
  );
  const ePa = input.elasticModulusGPa * 1e9;
  const aM2 = input.crossSectionMM2 * 1e-6;
  const alphaEA = input.expansionPerDegC * ePa * aM2;

  const fBase = T1N - K / (T1N * T1N);
  const target = fBase - alphaEA * (input.targetTempDegC - input.baseTempDegC);

  const { tensionN, iterations, residualN } = solveTensionN(K, target);

  return {
    targetTempDegC: input.targetTempDegC,
    tensionKN: tensionN / 1000,
    sagM: sagM(input.weightPerLengthNPerM, input.spanM, tensionN),
    iterations,
    residualN,
  };
}

/**
 * 批量求解多个温度档，生成安装曲线表。
 */
export function tensionCurve(
  base: TensionCurveInput,
  tempsDegC: readonly number[],
): TensionResult[] {
  return tempsDegC.map((t) => tensionAt({ ...base, targetTempDegC: t }));
}
