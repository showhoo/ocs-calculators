export { wavespeedMeta } from './meta';

/** 波速利用率告警阈值（工程经验值） */
export const DEFAULT_WARN_THRESHOLD = 0.7;

export interface WaveSpeedInput {
  /** 接触线张力 T，kN */
  readonly tensionKN: number;
  /** 线密度 ρ，kg/m */
  readonly linearMassKgPerM: number;
  /** 列车速度 v，km/h */
  readonly speedKmH: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 告警阈值 β。缺省 0.7 */
  readonly warnThreshold?: number;
}

export interface WaveSpeedResult {
  /** 波传播速度 c = √(T/ρ)，m/s */
  readonly waveSpeedMPerS: number;
  /** 波速利用率 β = v/c，无量纲 */
  readonly beta: number;
  /** 波速利用率，% */
  readonly betaPercent: number;
  /** 前三阶固有频率 f₁ ~ f₃，Hz */
  readonly naturalFrequenciesHz: readonly number[];
  /** 一阶共振车速 v_res = f₁·l，km/h */
  readonly resonanceSpeedKmH: number;
  /** β 是否达到告警阈值 */
  readonly warn: boolean;
}

/**
 * 波传播速度：c = √(T/ρ)，m/s。
 *
 * @param tensionKN 接触线张力 T，kN
 * @param linearMassKgPerM 线密度 ρ，kg/m
 */
export function wavePropagationSpeedMPerS(
  tensionKN: number,
  linearMassKgPerM: number,
): number {
  if (!(tensionKN > 0)) {
    throw new RangeError(`张力必须为正数，收到 ${tensionKN} kN`);
  }
  if (!(linearMassKgPerM > 0)) {
    throw new RangeError(`线密度必须为正数，收到 ${linearMassKgPerM} kg/m`);
  }
  return Math.sqrt((tensionKN * 1e3) / linearMassKgPerM);
}

/**
 * 两端固定弦第 n 阶固有频率：f_n = n/(2L)·√(T/ρ) = n·c/(2L)，Hz。
 *
 * @param n 阶次，正整数
 * @param spanM 跨距 L，m
 * @param waveSpeedMPerS 波速 c，m/s
 */
export function naturalFrequencyHz(
  n: number,
  spanM: number,
  waveSpeedMPerS: number,
): number {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`阶次必须为正整数，收到 ${n}`);
  }
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }
  if (!(waveSpeedMPerS > 0)) {
    throw new RangeError(`波速必须为正数，收到 ${waveSpeedMPerS} m/s`);
  }
  return (n / (2 * spanM)) * waveSpeedMPerS;
}

/** km/h → m/s */
export function kmHToMPerS(speedKmH: number): number {
  return speedKmH / 3.6;
}

/**
 * 波速利用率校核。
 *
 * β = v/c；β 越接近 1 越接近共振区，达到阈值（默认 0.7）时告警。
 * 一阶共振车速 v_res 为跨距通过频率与一阶固有频率相遇时的车速。
 */
export function waveSpeedCheck(input: WaveSpeedInput): WaveSpeedResult {
  const { tensionKN, linearMassKgPerM, speedKmH, spanM } = input;

  if (!(speedKmH >= 0)) {
    throw new RangeError(`速度不能为负，收到 ${speedKmH} km/h`);
  }
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }

  const c = wavePropagationSpeedMPerS(tensionKN, linearMassKgPerM);
  const beta = kmHToMPerS(speedKmH) / c;
  const fns = [1, 2, 3].map((n) => naturalFrequencyHz(n, spanM, c));
  const f1 = fns[0];
  if (f1 === undefined) {
    throw new Error('固有频率计算失败');
  }

  const threshold = input.warnThreshold ?? DEFAULT_WARN_THRESHOLD;

  return {
    waveSpeedMPerS: c,
    beta,
    betaPercent: beta * 100,
    naturalFrequenciesHz: fns,
    resonanceSpeedKmH: f1 * spanM * 3.6,
    warn: beta >= threshold,
  };
}
