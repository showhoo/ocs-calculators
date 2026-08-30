export { curveStaggerMeta } from './meta';

/** 标准轨距，m */
export const STANDARD_GAUGE_M = 1.435;

/** 滑板面距轨面的常用值，m */
export const DEFAULT_PANTOGRAPH_HEIGHT_M = 6.0;

export interface CurveStaggerInput {
  /** 曲线半径 R，m。直线段传 0 或 Infinity */
  readonly curveRadiusM: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 定位点 1 拉出值 a₁，m（曲线内侧为正） */
  readonly stagger1M: number;
  /** 定位点 2 拉出值 a₂，m（曲线内侧为正） */
  readonly stagger2M: number;
  /** 风速 v，m/s */
  readonly windSpeedMPerS: number;
  /** 线索直径 d，m */
  readonly wireDiameterM: number;
  /** 风载体型系数 α */
  readonly dragCoefficient: number;
  /** 线索张力 T，N */
  readonly tensionN: number;
  /** 容许偏移 [e]，m */
  readonly allowableOffsetM: number;
  /** 滑板面距轨面 H，m。缺省 6.0 */
  readonly pantographHeightM?: number;
  /** 外轨超高 h，m。缺省 0 */
  readonly cantM?: number;
  /** 轨距 l₀，m。缺省 1.435 */
  readonly gaugeM?: number;
}

export interface CurveStaggerResult {
  /** 平均拉出值 ā，m */
  readonly meanStaggerM: number;
  /** 曲线矢度 c = l²/(8R)，m。直线段为 0 */
  readonly versineM: number;
  /** 超高横移 δ = H·h/l₀，m */
  readonly cantShiftM: number;
  /** 跨中风偏 p_w，m */
  readonly windOffsetM: number;
  /** 矢度与拉出值同向时的偏移，m */
  readonly offsetPlusM: number;
  /** 矢度与拉出值反向时的偏移，m */
  readonly offsetMinusM: number;
  /** 取两者较大值，m */
  readonly maxOffsetM: number;
  /** 是否满足容许偏移 */
  readonly passes: boolean;
}

/**
 * 曲线矢度：c = l² / (8R)，m。
 * 直线段（R = 0 或 Infinity）返回 0。
 */
export function versineM(spanM: number, curveRadiusM: number): number {
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }
  if (!(curveRadiusM > 0) || !Number.isFinite(curveRadiusM)) {
    return 0;
  }
  return (spanM * spanM) / (8 * curveRadiusM);
}

/**
 * 超高横移：δ = H·h / l₀，m。
 *
 * @param cantM 外轨超高 h，m
 * @param pantographHeightM 滑板面距轨面 H，m
 * @param gaugeM 轨距 l₀，m
 */
export function cantShiftM(
  cantM: number,
  pantographHeightM: number = DEFAULT_PANTOGRAPH_HEIGHT_M,
  gaugeM: number = STANDARD_GAUGE_M,
): number {
  if (!(cantM >= 0)) {
    throw new RangeError(`外轨超高不能为负，收到 ${cantM} m`);
  }
  if (!(pantographHeightM > 0)) {
    throw new RangeError(`滑板面距轨面必须为正数，收到 ${pantographHeightM} m`);
  }
  if (!(gaugeM > 0)) {
    throw new RangeError(`轨距必须为正数，收到 ${gaugeM} m`);
  }
  return (pantographHeightM * cantM) / gaugeM;
}

/**
 * 曲线区段跨中综合偏移校核。
 *
 * 风偏取风向垂直线路的最不利工况（sin²θ = 1）。
 *
 * ⚠️ 与站点源码一致：超高横移 δ 会计算并返回，但**不参与** e 的合成。
 * 站点 JSDoc 描述的公式为 `e = |ā ± c ∓ δ| + p_w`，与其实现不符；
 * 若站点后续修正，本库的 offsetPlusM / offsetMinusM 需同步调整。
 */
export function curveStaggerCheck(input: CurveStaggerInput): CurveStaggerResult {
  const { spanM, stagger1M, stagger2M, wireDiameterM, dragCoefficient, tensionN } = input;

  if (!(tensionN > 0)) {
    throw new RangeError(`张力必须为正数，收到 ${tensionN} N`);
  }
  if (!(wireDiameterM > 0)) {
    throw new RangeError(`线索直径必须为正数，收到 ${wireDiameterM} m`);
  }
  if (!(dragCoefficient > 0)) {
    throw new RangeError(`风载体型系数必须为正数，收到 ${dragCoefficient}`);
  }
  if (!(input.windSpeedMPerS >= 0)) {
    throw new RangeError(`风速不能为负，收到 ${input.windSpeedMPerS} m/s`);
  }
  if (!(input.allowableOffsetM > 0)) {
    throw new RangeError(`容许偏移必须为正数，收到 ${input.allowableOffsetM} m`);
  }

  const meanStaggerM = (stagger1M + stagger2M) / 2;
  const c = versineM(spanM, input.curveRadiusM);
  const delta = cantShiftM(
    input.cantM ?? 0,
    input.pantographHeightM ?? DEFAULT_PANTOGRAPH_HEIGHT_M,
    input.gaugeM ?? STANDARD_GAUGE_M,
  );

  // 单位风荷载 p = ½·ρ·v²·d·α·sin²θ，取 sin²θ = 1（风向垂直线路最不利）
  const rhoAir = 1.225;
  const windLoadNPerM =
    0.5 * rhoAir * input.windSpeedMPerS * input.windSpeedMPerS * wireDiameterM * dragCoefficient;
  const pw = (windLoadNPerM * spanM * spanM) / (8 * tensionN);

  const offsetPlusM = Math.abs(meanStaggerM + c) + pw;
  const offsetMinusM = Math.abs(meanStaggerM - c) + pw;
  const maxOffsetM = Math.max(offsetPlusM, offsetMinusM);

  return {
    meanStaggerM,
    versineM: c,
    cantShiftM: delta,
    windOffsetM: pw,
    offsetPlusM,
    offsetMinusM,
    maxOffsetM,
    passes: maxOffsetM <= input.allowableOffsetM,
  };
}
