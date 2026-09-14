export { steadyArmMeta } from './meta';

/** 定位器坡度校核的输入参数 */
export interface SteadyArmInput {
  /** 接触线张力 T，kN */
  readonly contactWireTensionKN: number;
  /** 拉出值 a，mm（内部换算 m） */
  readonly staggerMM: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 曲线半径 R，m。undefined 表示直线区段 */
  readonly curveRadiusM?: number;
  /** 第一吊弦距定位点距离 l₁，m */
  readonly firstDropperOffsetM: number;
  /** 接触线单位重 g_j，kN/m */
  readonly wireWeightKNPerM: number;
  /** 定位器自重 G_d，kN */
  readonly regulatorSelfWeightKN: number;
}

/** 定位器受力与坡度角计算结果 */
export interface SteadyArmAngleResult {
  /** 直线之字力 Fz，kN */
  readonly staggerForceKN: number;
  /** 曲线力 Fq，kN（直线区段为 0） */
  readonly curveForceKN: number;
  /** 水平合成力 Fs，kN（直线为 Fz；曲线为 |Fq − Fz|） */
  readonly horizontalForceKN: number;
  /** 垂直力 Fc，kN */
  readonly verticalForceKN: number;
  /** 坡度角 θ = atan(Fc/Fs)，度 */
  readonly angleDeg: number;
  /** 坡度比（垂直∶水平）= 1∶n，n = Fs/Fc */
  readonly slopeRatio: number;
  /** 是否为直线区段 */
  readonly isStraight: boolean;
}

/** 定位器坡度校核结果 */
export interface SteadyArmCheckResult extends SteadyArmAngleResult {
  /** 是否满足限值要求 */
  readonly passes: boolean;
  /** 判定理由 */
  readonly reason: string;
}

/**
 * 定位器坡度计算（纯函数）：
 *   Fz = 4·T·a/l           （直线之字力，a 由 mm 换算 m）
 *   Fq = T·l/R             （曲线力）
 *   Fs = |Fq − Fz|         （曲线合成，直线时 Fs = Fz）
 *   Fc = g_j·l₁ + G_d      （垂直力）
 *   θ  = atan(Fc/Fs)       （坡度角，弧度转度）
 *   n  = Fs/Fc             （坡度比 1∶n）
 */
export function steadyArmAngleDeg(input: SteadyArmInput): SteadyArmAngleResult {
  const {
    contactWireTensionKN: T,
    staggerMM,
    spanM: l,
    curveRadiusM,
    firstDropperOffsetM: l1,
    wireWeightKNPerM: gJ,
    regulatorSelfWeightKN: gD,
  } = input;

  if (!(T > 0)) {
    throw new RangeError(`接触线张力必须为正数，收到 ${T} kN`);
  }
  if (!(staggerMM > 0)) {
    throw new RangeError(`拉出值必须为正数，收到 ${staggerMM} mm`);
  }
  if (!(l > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${l} m`);
  }
  if (curveRadiusM !== undefined && !(curveRadiusM > 0)) {
    throw new RangeError(`曲线半径必须为正数，收到 ${curveRadiusM} m`);
  }
  if (!(l1 >= 0)) {
    throw new RangeError(`第一吊弦距定位点距离不能为负，收到 ${l1} m`);
  }
  if (!(gJ >= 0)) {
    throw new RangeError(`接触线单位重不能为负，收到 ${gJ} kN/m`);
  }
  if (!(gD >= 0)) {
    throw new RangeError(`定位器自重不能为负，收到 ${gD} kN`);
  }

  const isStraight = curveRadiusM === undefined;

  const aM = staggerMM * 1e-3;
  const fz = (4 * T * aM) / l;

  let fq = 0;
  let fs = fz;
  if (!isStraight) {
    const R = curveRadiusM as number;
    fq = (T * l) / R;
    fs = Math.abs(fq - fz);
  }

  const fc = gJ * l1 + gD;

  if (!(fs > 0)) {
    throw new RangeError(
      `水平合成力 Fs = ${fs} kN 须为正数（曲线力与之字力相等时坡度无意义），请复核输入`,
    );
  }
  if (!(fc > 0)) {
    throw new RangeError(
      `垂直力 Fc = ${fc} kN 须为正数，请复核接触线单位重 / 定位器自重`,
    );
  }

  const angleDeg = (Math.atan(fc / fs) * 180) / Math.PI;
  const slopeRatio = fs / fc;

  return {
    staggerForceKN: fz,
    curveForceKN: fq,
    horizontalForceKN: fs,
    verticalForceKN: fc,
    angleDeg,
    slopeRatio,
    isStraight,
  };
}

/**
 * 定位器坡度限值校核。
 *
 * 限值（300 km/h 及以上高铁期刊口径，罗健等《高速铁路接触网定位器坡度问题的深化研究》，
 * 铁道工程学报 2013,30(1):76-80）：
 *   - 直线区段：θ ≥ 8°
 *   - 曲线区段：6° ≤ θ ≤ 16°
 */
export function steadyArmCheck(input: SteadyArmInput): SteadyArmCheckResult {
  const base = steadyArmAngleDeg(input);

  if (base.isStraight) {
    const passes = base.angleDeg >= 8;
    const reason = passes
      ? `直线区段：θ = ${base.angleDeg.toFixed(4)}° ≥ 8°，满足坡度要求`
      : `直线区段：θ = ${base.angleDeg.toFixed(4)}° < 8°，不满足坡度要求（需 ≥ 8°）`;
    return { ...base, passes, reason };
  }

  const passes = base.angleDeg >= 6 && base.angleDeg <= 16;
  const reason = passes
    ? `曲线区段：θ = ${base.angleDeg.toFixed(4)}° 位于 6° ~ 16° 区间，满足坡度要求`
    : `曲线区段：θ = ${base.angleDeg.toFixed(4)}° 超出 6° ~ 16° 区间，不满足坡度要求`;
  return { ...base, passes, reason };
}
