export { windMeta } from './meta';

/** 标准大气空气密度，kg/m³ */
export const AIR_DENSITY_KG_PER_M3 = 1.225;

/** 风荷载计算的输入参数 */
export interface WindLoadInput {
  /** 风速 v，m/s */
  readonly windSpeedMPerS: number;
  /** 风向与线路夹角 θ，度。90° 表示风垂直于线路 */
  readonly windAngleDeg: number;
  /** 线索直径 d，mm */
  readonly wireDiameterMM: number;
  /** 风载体型系数 α（阻力系数），圆柱形线索常取 1.2 */
  readonly dragCoefficient: number;
  /** 空气密度 ρ，kg/m³。缺省为标准大气 1.225 */
  readonly airDensityKgPerM3?: number;
}

/**
 * 单位风荷载（Janssen 公式）：p = ½·ρ·v²·d·α·sin²θ，N/m。
 * 线索直径按 mm → m 换算（×1e-3）。
 */
export function windLoadNPerM(params: WindLoadInput): number {
  const { windSpeedMPerS, windAngleDeg, wireDiameterMM, dragCoefficient, airDensityKgPerM3 } = params;

  if (!(windSpeedMPerS >= 0)) {
    throw new RangeError(`风速不能为负，收到 ${windSpeedMPerS} m/s`);
  }
  if (!(wireDiameterMM > 0)) {
    throw new RangeError(`线索直径必须为正数，收到 ${wireDiameterMM} mm`);
  }
  if (!(dragCoefficient > 0)) {
    throw new RangeError(`风载体型系数必须为正数，收到 ${dragCoefficient}`);
  }
  if (!(windAngleDeg >= 0 && windAngleDeg <= 180)) {
    throw new RangeError(`风向与线路夹角应为 0 ~ 180°，收到 ${windAngleDeg}°`);
  }
  const rho = airDensityKgPerM3 ?? AIR_DENSITY_KG_PER_M3;
  if (!(rho > 0)) {
    throw new RangeError(`空气密度必须为正数，收到 ${rho} kg/m³`);
  }

  const dM = wireDiameterMM * 1e-3;
  const sinTheta = Math.sin((windAngleDeg * Math.PI) / 180);
  return 0.5 * rho * windSpeedMPerS * windSpeedMPerS * dM * dragCoefficient * sinTheta * sinTheta;
}

/**
 * 跨中风偏（简支索抛物线近似）：b = p·L² / (8·T)，m。
 *
 * @param windLoadNPerM 单位风荷载 p，N/m
 * @param spanM 跨距 L，m
 * @param tensionKN 线索张力 T，kN（内部 ×1e3 化 N）
 */
export function windDeflectionM(windLoadNPerM: number, spanM: number, tensionKN: number): number {
  if (!(windLoadNPerM >= 0)) {
    throw new RangeError(`单位风荷载不能为负，收到 ${windLoadNPerM} N/m`);
  }
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }
  if (!(tensionKN > 0)) {
    throw new RangeError(`线索张力必须为正数，收到 ${tensionKN} kN`);
  }
  return (windLoadNPerM * spanM * spanM) / (8 * tensionKN * 1e3);
}

/** 风偏限界校验输入：风荷载参数 + 张力/跨距/拉出值/限界允许值 */
export interface WindClearanceInput extends WindLoadInput {
  /** 线索张力 T，kN */
  readonly tensionKN: number;
  /** 跨距 L，m */
  readonly spanM: number;
  /** 拉出值 a，m */
  readonly staggerM: number;
  /** 限界允许值，m */
  readonly clearanceLimitM: number;
}

/** 风偏限界校验结果 */
export interface WindClearanceResult {
  /** 单位风荷载 p，N/m */
  readonly windLoadNPerM: number;
  /** 跨中风偏 b，m */
  readonly deflectionM: number;
  /** 风偏 + 拉出值 b + a，m */
  readonly totalOffsetM: number;
  /** 限界允许值，m */
  readonly clearanceLimitM: number;
  /** 富余量 = 限界允许值 − (b + a)，m。负值表示超限 */
  readonly marginM: number;
  /** 是否合格 */
  readonly passes: boolean;
}

/**
 * 风偏限界校验：计算跨中风偏 b，叠加拉出值 a，与限界允许值比较。
 *
 * 判据：b + a ≤ 限界允许值 → 合格。
 */
export function windClearanceCheck(input: WindClearanceInput): WindClearanceResult {
  const { staggerM, clearanceLimitM } = input;

  if (!(staggerM >= 0)) {
    throw new RangeError(`拉出值不能为负，收到 ${staggerM} m`);
  }
  if (!(clearanceLimitM > 0)) {
    throw new RangeError(`限界允许值必须为正数，收到 ${clearanceLimitM} m`);
  }

  const p = windLoadNPerM(input);
  const b = windDeflectionM(p, input.spanM, input.tensionKN);
  const totalOffsetM = b + staggerM;

  return {
    windLoadNPerM: p,
    deflectionM: b,
    totalOffsetM,
    clearanceLimitM,
    marginM: clearanceLimitM - totalOffsetM,
    passes: totalOffsetM <= clearanceLimitM,
  };
}
