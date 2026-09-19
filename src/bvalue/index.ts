export { bvalueMeta } from './meta';

/** b 值（坠砣底面距地面高度）计算参数。单位：长度 mm、温度 ℃、张力 kN。 */
export interface BValueInput {
  /** 设计最小 b 值 b_min，mm（最高温度时坠砣最低位） */
  readonly minBMM: number;
  /** 传动比倍数 n（1:3 取 3） */
  readonly ratio: number;
  /** 线膨胀系数 α，1/℃（铜合金约 1.7e-5） */
  readonly expansionCoeff: number;
  /** 半锚段长度 L，mm */
  readonly halfSpanMM: number;
  /** 最高工作温度 t_max，℃ */
  readonly maxTempC: number;
  /** 安装/检调温度 t_x，℃ */
  readonly targetTempC: number;
  /** 额定张力 T，kN（用于坠砣重量换算） */
  readonly tensionKN?: number;
}

export interface BValueResult {
  /** 当前温度 b 值 b_x，mm */
  readonly bMM: number;
  /** 温度伸缩量 ΔL = α·L·(t_max − t_x)，mm */
  readonly stretchMM: number;
  /** 坠砣侧行程变化 n·ΔL，mm */
  readonly strokeMM: number;
  /** 坠砣总质量 W = T·1000/(n·9.81)，kg（对齐站点 /calculator/bvalue/ 换算口径） */
  readonly weightKg: number | null;
}

/** b 值计算：b_x = b_min + n·α·L·(t_max − t_x) */
export function bValue(params: BValueInput): BValueResult {
  const { minBMM, ratio, expansionCoeff, halfSpanMM, maxTempC, targetTempC, tensionKN } = params;
  if (!(minBMM >= 0)) throw new RangeError('b_min 不能为负，收到 ' + minBMM);
  if (!(ratio > 0)) throw new RangeError('传动比倍数必须为正，收到 ' + ratio);
  if (!(halfSpanMM > 0)) throw new RangeError('半锚段长度必须为正，收到 ' + halfSpanMM);
  const dt = maxTempC - targetTempC;
  const stretchMM = expansionCoeff * halfSpanMM * dt;
  const strokeMM = ratio * stretchMM;
  const bMM = minBMM + strokeMM;
  let weightKg: number | null = null;
  if (tensionKN !== undefined) {
    if (!(tensionKN > 0)) throw new RangeError('额定张力必须为正，收到 ' + tensionKN);
    // W = T·1000/(n·9.81)：kN→N 后按 g=9.81 m/s² 折算质量（站点页面同式）
    weightKg = (tensionKN * 1000) / (ratio * 9.81);
  }
  return { bMM, stretchMM, strokeMM, weightKg };
}
