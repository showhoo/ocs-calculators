export { sagMeta } from './meta';

/** 弛度计算参数。单位：张力 kN、跨距 m、单位重 N/m。 */
export interface SagInput {
  /** 接触线/承力索张力 T，kN */
  readonly tensionKN: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 单位长度重量 g，N/m */
  readonly weightNPerM: number;
}

/** 弛度 f = g·l²/(8T)，mm */
export function sagMM(input: SagInput): number {
  const { tensionKN, spanM, weightNPerM } = input;
  if (!(tensionKN > 0)) throw new RangeError('张力必须为正，收到 ' + tensionKN + ' kN');
  if (!(spanM > 0)) throw new RangeError('跨距必须为正，收到 ' + spanM + ' m');
  if (!(weightNPerM >= 0)) throw new RangeError('单位重不能为负，收到 ' + weightNPerM + ' N/m');
  const sagM = (weightNPerM * spanM * spanM) / (8 * tensionKN * 1e3);
  return sagM * 1e3;
}

/** 反算张力：给定弛度求张力 T = g·l²/(8·f)，kN */
export function tensionFromSagKN(weightNPerM: number, spanM: number, sagMM: number): number {
  if (!(sagMM > 0)) throw new RangeError('弛度必须为正，收到 ' + sagMM + ' mm');
  const sagM = sagMM / 1e3;
  return (weightNPerM * spanM * spanM) / (8 * sagM) / 1e3;
}

/** 反算最大跨距：给定张力与限值弛度 l_max = √(8·T·f_max/g)，m */
export function maxSpanFromSagM(weightNPerM: number, tensionKN: number, sagLimitMM: number): number {
  if (!(tensionKN > 0)) throw new RangeError('张力必须为正，收到 ' + tensionKN + ' kN');
  if (!(weightNPerM > 0)) throw new RangeError('单位重必须为正，收到 ' + weightNPerM + ' N/m');
  if (!(sagLimitMM > 0)) throw new RangeError('限值弛度必须为正，收到 ' + sagLimitMM + ' mm');
  const sagM = sagLimitMM / 1e3;
  return Math.sqrt((8 * tensionKN * 1e3 * sagM) / weightNPerM);
}
