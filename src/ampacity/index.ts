export { ampacityMeta } from './meta';

/** 基准环境温度 T₀，℃（TB/T 2809-2017 标准环境） */
export const DEFAULT_BASE_AMBIENT_TEMP_DEG_C = 25;

/** 载流量环境温度修正输入 */
export interface AmpacityDeratingInput {
  /** 基准载流量 I₀，A（标准环境 T₀ 下的持续载流量） */
  readonly baseAmpacityA: number;
  /** 最高允许工作温度 Tmax，℃（铜 95、铜合金 150） */
  readonly maxAllowedTempDegC: number;
  /** 最不利实际环境温度 Ta，℃ */
  readonly ambientTempDegC: number;
  /** 基准环境温度 T₀，℃。缺省 25 ℃ */
  readonly baseAmbientTempDegC?: number;
}

export interface AmpacityDeratingResult {
  /** 修正系数，无量纲 */
  readonly deratingFactor: number;
  /** 修正后载流量 I(Ta)，A */
  readonly deratedAmpacityA: number;
}

/**
 * 环境温度修正系数：√((Tmax − Ta) / (Tmax − T₀))。
 *
 * Ta 越接近允许温度，系数越小；Ta = T₀ 时为 1；Ta > Tmax 无解，直接抛错。
 */
export function ampacityDeratingFactor(input: AmpacityDeratingInput): number {
  const {
    maxAllowedTempDegC: tMax,
    ambientTempDegC: tAmbient,
    baseAmbientTempDegC: tBaseOpt,
  } = input;
  const tBase = tBaseOpt ?? DEFAULT_BASE_AMBIENT_TEMP_DEG_C;

  if (!(input.baseAmpacityA > 0)) {
    throw new RangeError(`基准载流量必须为正数，收到 ${input.baseAmpacityA} A`);
  }
  if (!(tMax > tBase)) {
    throw new RangeError(
      `允许温度 ${tMax} ℃ 必须高于基准环境温度 ${tBase} ℃`,
    );
  }
  if (!(tAmbient < tMax)) {
    throw new RangeError(
      `实际环境温度 ${tAmbient} ℃ 已达到或超过允许温度 ${tMax} ℃，无法持续运行`,
    );
  }
  if (!(tAmbient >= -273.15)) {
    throw new RangeError(`环境温度不能低于绝对零度，收到 ${tAmbient} ℃`);
  }

  return Math.sqrt((tMax - tAmbient) / (tMax - tBase));
}

/**
 * 修正后载流量：I(Ta) = I₀·√((Tmax − Ta)/(Tmax − T₀))，A。
 *
 * ⚠️ 修正式仅覆盖环境温度项；高海拔、隧道、日照叠加场景须另行叠加修正。
 */
export function deratedAmpacityA(input: AmpacityDeratingInput): number {
  return input.baseAmpacityA * ampacityDeratingFactor(input);
}

/** 热稳定校核判定结果 */
export type ThermalStabilityVerdict = 'pass' | 'fail' | 'not-assessed';

export interface ShortCircuitCheckInput {
  /** 短路电流 I_k，kA（热稳定等效值，由供电计算给出） */
  readonly shortCircuitCurrentKA: number;
  /** 全切除时间 t_k，s */
  readonly clearingTimeS: number;
  /** 热稳定系数 C，A·√s/mm²（设计输入） */
  readonly thermalCoefficientC: number;
  /** 拟选截面，mm²。传 null 则仅输出最小截面，不判定 */
  readonly selectedSectionMM2: number | null;
}

export interface ShortCircuitCheckResult {
  /** 最小热稳截面 S_min = I_k·√t_k / C，mm² */
  readonly minSectionMM2: number;
  readonly selectedSectionMM2: number | null;
  /** 拟选截面判定 */
  readonly verdict: ThermalStabilityVerdict;
}

/**
 * 短路热稳定最小截面：S_min = I_k·√t_k / C，mm²。
 *
 * @param shortCircuitCurrentKA 短路电流，kA
 * @param clearingTimeS 切除时间，s
 * @param thermalCoefficientC 热稳定系数，A·√s/mm²
 */
export function shortCircuitMinSectionMM2(
  shortCircuitCurrentKA: number,
  clearingTimeS: number,
  thermalCoefficientC: number,
): number {
  if (!(shortCircuitCurrentKA > 0)) {
    throw new RangeError(
      `短路电流必须为正数，收到 ${shortCircuitCurrentKA} kA`,
    );
  }
  if (!(clearingTimeS > 0)) {
    throw new RangeError(`切除时间必须为正数，收到 ${clearingTimeS} s`);
  }
  if (!(thermalCoefficientC > 0)) {
    throw new RangeError(
      `热稳定系数必须为正数，收到 ${thermalCoefficientC} A·√s/mm²`,
    );
  }
  const iA = shortCircuitCurrentKA * 1000;
  return (iA * Math.sqrt(clearingTimeS)) / thermalCoefficientC;
}

/**
 * 短路热稳定校核：给出最小截面，并在提供拟选截面时判定是否满足 S ≥ S_min。
 */
export function shortCircuitCheck(input: ShortCircuitCheckInput): ShortCircuitCheckResult {
  const minSectionMM2 = shortCircuitMinSectionMM2(
    input.shortCircuitCurrentKA,
    input.clearingTimeS,
    input.thermalCoefficientC,
  );

  const verdict: ThermalStabilityVerdict =
    input.selectedSectionMM2 === null
      ? 'not-assessed'
      : input.selectedSectionMM2 >= minSectionMM2
        ? 'pass'
        : 'fail';

  return { minSectionMM2, selectedSectionMM2: input.selectedSectionMM2, verdict };
}
