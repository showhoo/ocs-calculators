export { cantileverMeta } from './meta';

/** 腕臂预配安装偏差（TB 10758-2018 第 5.10.1 条），mm */
export const ASSEMBLY_TOLERANCE_MM = 5;

/** 斜腕臂勾股下料计算输入。单位：m。 */
export interface CantileverInput {
  /** 上下底座竖直距 h，m */
  readonly verticalOffsetM: number;
  /** 下底座至定位点水平投影 d，m */
  readonly horizontalProjectionM: number;
  /** 端部零件扣减 Δc，m */
  readonly endDeductionM?: number;
  /** 定位点至下底座竖直距 y_d，m */
  readonly regHeightM?: number;
}

export interface CantileverResult {
  /** 理论斜长 √(h²+d²)，m */
  readonly fullLengthM: number;
  /** 下料长度 L = √(h²+d²) − Δc，m */
  readonly cutLengthM: number;
  /** 定位环安装位置 s = (y_d/h)·√(h²+d²)，m */
  readonly regulatorPosM: number | null;
  /** 安装允差，mm */
  readonly toleranceMM: number;
}

/** 斜腕臂勾股下料（几何自证） */
export function cantileverCut(input: CantileverInput): CantileverResult {
  const { verticalOffsetM, horizontalProjectionM, endDeductionM, regHeightM } = input;
  if (!(verticalOffsetM > 0)) throw new RangeError('竖直距必须为正，收到 ' + verticalOffsetM + ' m');
  if (!(horizontalProjectionM > 0)) throw new RangeError('水平投影必须为正，收到 ' + horizontalProjectionM + ' m');
  const fullLengthM = Math.sqrt(verticalOffsetM * verticalOffsetM + horizontalProjectionM * horizontalProjectionM);
  const cutLengthM = fullLengthM - (endDeductionM ?? 0);
  let regulatorPosM: number | null = null;
  if (regHeightM !== undefined) {
    if (regHeightM > verticalOffsetM) throw new RangeError('定位点高度 y_d 应不大于底座竖直距 h');
    regulatorPosM = (regHeightM / verticalOffsetM) * fullLengthM;
  }
  return { fullLengthM, cutLengthM, regulatorPosM, toleranceMM: ASSEMBLY_TOLERANCE_MM };
}
