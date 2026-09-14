export { anchorLengthMeta } from './meta';

/** 张力增量判据（TB 10009-2016 第 5.4.7 条） */
export const TENSION_DIFF_RATIO = 0.10;

/** 锚段张力增量计算参数（教材口径，直线吊弦项量纲已复核）。单位：m、kN、1/℃、℃。 */
export interface AnchorLengthInput {
  /** 区段类型：'line' 直线 | 'curve' 曲线 */
  readonly section: 'line' | 'curve';
  /** 接触线额定张力 T_N，kN（判据基准） */
  readonly ratedTensionKN: number;
  /** 半锚段长度 L（中心锚结至补偿器），m */
  readonly halfSpanM?: number;
  /** 曲线半径 R，m（曲线区段） */
  readonly curveRadiusM?: number;
  /** 定位器长度 d，m（曲线区段） */
  readonly regulatorLengthM?: number;
  /** 定位器数量 n（曲线区段） */
  readonly regulatorCount?: number;
  /** 跨距 l，m（直线吊弦项） */
  readonly spanM?: number;
  /** 吊弦平均长度 c，m（直线吊弦项） */
  readonly dropperLengthM?: number;
  /** 接触线单位重 g_j，kN/m（直线吊弦项） */
  readonly wireWeightKNPerM?: number;
  /** 线胀系数 α，1/℃（直线吊弦项） */
  readonly expansionCoeff?: number;
  /** 计算温差 Δt，℃（直线吊弦项） */
  readonly tempDeltaC?: number;
}

export interface AnchorLengthResult {
  /** 张力增量，N */
  readonly deltaN: number;
  /** 判据限值 10%·T_N，N */
  readonly limitN: number;
  /** 张力差占额定张力比例 */
  readonly ratio: number;
  /** 是否合格（ΔT ≤ 10%·T_N） */
  readonly passes: boolean;
}

/** 锚段张力增量（教材口径）与 10% 判据校核 */
export function anchorLengthCheck(input: AnchorLengthInput): AnchorLengthResult {
  const { section, ratedTensionKN } = input;
  if (!(ratedTensionKN > 0)) throw new RangeError('额定张力必须为正，收到 ' + ratedTensionKN + ' kN');
  let deltaN: number;
  if (section === 'curve') {
    const { curveRadiusM, regulatorLengthM, regulatorCount } = input;
    if (!(curveRadiusM && curveRadiusM > 0)) throw new RangeError('曲线半径必须为正');
    if (!(regulatorLengthM && regulatorLengthM > 0)) throw new RangeError('定位器长度必须为正');
    const n = regulatorCount ?? 1;
    const one = (regulatorLengthM * ratedTensionKN * 1e3) / curveRadiusM; // T_jw = d·T_jm/R
    deltaN = one * n;
  } else {
    const { halfSpanM, spanM, dropperLengthM, wireWeightKNPerM, expansionCoeff, tempDeltaC } = input;
    if (!(halfSpanM && halfSpanM > 0)) throw new RangeError('半锚段长度必须为正');
    if (!(spanM && spanM > 0)) throw new RangeError('跨距必须为正');
    if (!(dropperLengthM && dropperLengthM > 0)) throw new RangeError('吊弦长度必须为正');
    if (wireWeightKNPerM === undefined || expansionCoeff === undefined || tempDeltaC === undefined) {
      throw new RangeError('直线区段需提供 g_j、α、Δt');
    }
    // T_jd = L(L−l)·g_j·α·Δt/(2c)，kN → N
    deltaN = (halfSpanM * (halfSpanM - spanM) * wireWeightKNPerM * expansionCoeff * tempDeltaC) / (2 * dropperLengthM) * 1e3;
  }
  const limitN = TENSION_DIFF_RATIO * ratedTensionKN * 1e3;
  return { deltaN, limitN, ratio: deltaN / limitN, passes: deltaN <= limitN };
}
