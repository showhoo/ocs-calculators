export { strokeMeta } from './meta';

/** 补偿装置传动比（滑轮组/棘轮），n:1 中的 n */
export type TransmissionRatio = 2 | 3 | 4;

/** 常见传动比档位 */
export const TRANSMISSION_RATIOS: readonly TransmissionRatio[] = [2, 3, 4];

/** 安装裕度规程下限，mm（原铁运〔2007〕69号第87条） */
export const MIN_MARGIN_MM = 200;

/** 安装裕度设计惯例值，mm（教材/设计惯例，非规程条款） */
export const CONVENTIONAL_MARGIN_MM = 300;

export interface StrokeInput {
  /** 锚段长度 L，m（两端锚固点之间） */
  readonly anchorLengthM: number;
  /** 设计温差 Δt，℃（最高与最低设计温度之差） */
  readonly tempRangeDegC: number;
  /** 线膨胀系数 α，1/℃（铜合金约 1.7e-5） */
  readonly expansionPerDegC: number;
  /** 补偿传动比 n（1:2 / 1:3 / 1:4） */
  readonly transmissionRatio: TransmissionRatio;
  /** 安装裕度 S₀，mm */
  readonly marginMM: number;
  /** 装置许用行程，mm。传 null 则不判定 */
  readonly allowableStrokeMM: number | null;
}

export interface StrokeResult {
  /** 每℃伸缩量 α·L，mm/℃ */
  readonly perDegreeMM: number;
  /** 总伸缩量 ΔL = α·L·Δt，mm */
  readonly elongationMM: number;
  /** 所需行程 S = n·ΔL + S₀，mm */
  readonly requiredStrokeMM: number;
  readonly allowableStrokeMM: number | null;
  /** 富余量 = 许用行程 − 所需行程，mm。未提供许用行程时为 null */
  readonly marginMM: number | null;
  readonly verdict: 'pass' | 'fail' | 'not-assessed';
}

/**
 * 温度伸缩量：ΔL = α·L·Δt，mm。
 *
 * @param expansionPerDegC 线膨胀系数 α，1/℃
 * @param anchorLengthM 锚段长度 L，m
 * @param tempRangeDegC 设计温差 Δt，℃
 * @returns 伸缩量，mm
 */
export function elongationMM(
  expansionPerDegC: number,
  anchorLengthM: number,
  tempRangeDegC: number,
): number {
  if (!(expansionPerDegC > 0)) {
    throw new RangeError(`线膨胀系数必须为正数，收到 ${expansionPerDegC} 1/℃`);
  }
  if (!(anchorLengthM > 0)) {
    throw new RangeError(`锚段长度必须为正数，收到 ${anchorLengthM} m`);
  }
  if (!(tempRangeDegC > 0)) {
    throw new RangeError(`设计温差必须为正数，收到 ${tempRangeDegC} ℃`);
  }
  return expansionPerDegC * anchorLengthM * tempRangeDegC * 1000;
}

/**
 * 补偿行程设计值（含裕度）：S = n·ΔL + S₀，mm。
 *
 * @param elongation 总伸缩量 ΔL，mm
 * @param ratio 传动比 n
 * @param marginMM 安装裕度 S₀，mm
 */
export function requiredStrokeMM(
  elongation: number,
  ratio: TransmissionRatio,
  marginMM: number,
): number {
  if (!(elongation >= 0)) {
    throw new RangeError(`伸缩量不能为负，收到 ${elongation} mm`);
  }
  if (!(marginMM >= 0)) {
    throw new RangeError(`安装裕度不能为负，收到 ${marginMM} mm`);
  }
  return ratio * elongation + marginMM;
}

/**
 * 计算锚段伸缩量与补偿装置所需行程，并可选对照许用行程校核。
 *
 * ⚠️ 全补偿锚段接触线与承力索须分别计算；本函数单次只算一根线索。
 */
export function strokeCheck(input: StrokeInput): StrokeResult {
  const { transmissionRatio, allowableStrokeMM } = input;

  if (!(TRANSMISSION_RATIOS as readonly number[]).includes(transmissionRatio)) {
    throw new RangeError(
      `传动比应为 ${TRANSMISSION_RATIOS.map((r) => `1:${r}`).join(' / ')}，收到 1:${transmissionRatio}`,
    );
  }
  if (!(input.marginMM >= 0)) {
    throw new RangeError(`安装裕度不能为负，收到 ${input.marginMM} mm`);
  }

  const elongation = elongationMM(
    input.expansionPerDegC,
    input.anchorLengthM,
    input.tempRangeDegC,
  );
  const perDegreeMM = elongation / input.tempRangeDegC;
  const required = requiredStrokeMM(elongation, transmissionRatio, input.marginMM);

  if (allowableStrokeMM === null) {
    return {
      perDegreeMM,
      elongationMM: elongation,
      requiredStrokeMM: required,
      allowableStrokeMM: null,
      marginMM: null,
      verdict: 'not-assessed',
    };
  }

  if (!(allowableStrokeMM > 0)) {
    throw new RangeError(`装置许用行程必须为正数，收到 ${allowableStrokeMM} mm`);
  }

  return {
    perDegreeMM,
    elongationMM: elongation,
    requiredStrokeMM: required,
    allowableStrokeMM,
    marginMM: allowableStrokeMM - required,
    verdict: required <= allowableStrokeMM ? 'pass' : 'fail',
  };
}
