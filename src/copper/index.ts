export { copperMeta } from './meta';

/** 铜的电阻温度系数，1/℃ */
export const COPPER_ALPHA_PER_DEG_C = 0.00393;

/** IACS 退火铜 20℃ 标准电阻率，Ω·mm²/m（= 1/58） */
export const IACS_RESISTIVITY_OHM_MM2_PER_M = 0.017241;

/** 站点计算器内置的 6 个型号 */
export type CopperWireModel =
  | 'CTHM-120'
  | 'CTHM-150'
  | 'CTHA-120'
  | 'CTHA-150'
  | 'CTHS-120'
  | 'CTHS-150';

export interface WireParamEntry {
  /** 单位重量，kg/km（标称值） */
  readonly unitWeightKgPerKm: number;
  /** 20℃ 直流电阻，Ω/km */
  readonly r20OhmPerKm: number;
  /** 150℃ 持续载流量，室内口径，A */
  readonly ampacityIndoor150A: number;
  /** 150℃ 持续载流量，室外口径，A */
  readonly ampacityOutdoor150A: number;
  /** 口径说明：本行实际对应标准中的哪一行 */
  readonly note: string;
}

/**
 * 接触线参数表，来源 TB/T 2809-2017。
 *
 * 载流量为 150℃ 持续值（室内/室外双口径，标准表5）。
 *
 * 已与站点 `/calculator/assets/calc-core.js` 中的 COPPER_TABLE 逐项比对，
 * 6 个型号 × 4 项参数完全一致。
 *
 * 注：站点曾因显示层 `fmt()` 的尾零剥离正则把载流量渲染成 43/56（应为 430/560），
 * 已于 R38 之后修复。若再遇渲染值与本表不符，先确认是否为显示层问题：
 * 本表与服务端数据源始终一致。
 *
 * ⚠️ 注意型号口径：CTHM / CTHA / CTHS 是站点计算器的型号代码，与标准中的
 * CTMH / CTA / CTS 并非同名对应。`note` 字段说明各行实际取自标准的哪一行，
 * 交叉引用 TB/T 2809-2017 时请以 note 为准。
 */
export const TB2809_WIRE_PARAMS: Record<CopperWireModel, WireParamEntry> = {
  'CTHM-120': {
    unitWeightKgPerKm: 1082,
    r20OhmPerKm: 0.2113,
    ampacityIndoor150A: 430,
    ampacityOutdoor150A: 560,
    note: '取标准 CTMH 行（高强度铜镁合金），ρ 按标准上限 0.02535 计算',
  },
  'CTHM-150': {
    unitWeightKgPerKm: 1350,
    r20OhmPerKm: 0.169,
    ampacityIndoor150A: 500,
    ampacityOutdoor150A: 650,
    note: '取标准 CTMH 行（高强度铜镁合金）',
  },
  'CTHA-120': {
    unitWeightKgPerKm: 1070,
    r20OhmPerKm: 0.1481,
    ampacityIndoor150A: 515,
    ampacityOutdoor150A: 680,
    note: '取标准 CTA 行（铜银合金），ρ ≤ 0.01777',
  },
  'CTHA-150': {
    unitWeightKgPerKm: 1330,
    r20OhmPerKm: 0.1185,
    ampacityIndoor150A: 620,
    ampacityOutdoor150A: 785,
    note: '取标准 CTA 行（铜银合金）',
  },
  'CTHS-120': {
    unitWeightKgPerKm: 1080,
    r20OhmPerKm: 0.1916,
    ampacityIndoor150A: 515,
    ampacityOutdoor150A: 680,
    note: '取标准 CTS 行（铜锡合金），载流量按 CTS 行取值',
  },
  'CTHS-150': {
    unitWeightKgPerKm: 1345,
    r20OhmPerKm: 0.1533,
    ampacityIndoor150A: 620,
    ampacityOutdoor150A: 790,
    note: '取标准 CTS 行（铜锡合金），载流量按 CTS 行取值',
  },
};

/**
 * 电阻温度修正：r_T = r₂₀·[1 + α·(T − 20)]。
 *
 * @param r20OhmPerKm 20℃ 直流电阻，Ω/km
 * @param tempDegC 目标温度，℃
 * @param alphaPerDegC 电阻温度系数，1/℃。缺省铜 0.00393
 * @returns 该温度下的直流电阻，Ω/km
 */
export function resistanceAtTempOhmPerKm(
  r20OhmPerKm: number,
  tempDegC: number,
  alphaPerDegC: number = COPPER_ALPHA_PER_DEG_C,
): number {
  if (!(r20OhmPerKm > 0)) {
    throw new RangeError(`20℃ 电阻必须为正数，收到 ${r20OhmPerKm} Ω/km`);
  }
  if (!(alphaPerDegC > 0)) {
    throw new RangeError(`电阻温度系数必须为正数，收到 ${alphaPerDegC} /℃`);
  }
  if (tempDegC < -40 || tempDegC > 90) {
    throw new RangeError(`适用温度为 −40 ~ 90 ℃，收到 ${tempDegC} ℃`);
  }
  return r20OhmPerKm * (1 + alphaPerDegC * (tempDegC - 20));
}

export interface CopperLookupInput {
  readonly model: CopperWireModel;
  /** 长度 l，km */
  readonly lengthKm: number;
  /** 环境温度 T，℃ */
  readonly ambientTempDegC: number;
}

export interface CopperLookupResult extends WireParamEntry {
  readonly model: CopperWireModel;
  /** 总重量 W = w₀ × l，kg */
  readonly totalWeightKg: number;
  /** 温度修正电阻 r_T，Ω/km */
  readonly rTOhmPerKm: number;
  /** 全长温度修正电阻，Ω */
  readonly totalResistanceOhm: number;
}

/**
 * 按型号、长度与环境温度给出接触线参数速查结果。
 */
export function wireLookup(input: CopperLookupInput): CopperLookupResult {
  const { model, lengthKm, ambientTempDegC } = input;

  const params = TB2809_WIRE_PARAMS[model];
  if (params === undefined) {
    throw new RangeError(`未知型号：${model}`);
  }
  if (!(lengthKm > 0)) {
    throw new RangeError(`长度必须为正数，收到 ${lengthKm} km`);
  }

  const rT = resistanceAtTempOhmPerKm(params.r20OhmPerKm, ambientTempDegC);

  return {
    model,
    ...params,
    totalWeightKg: params.unitWeightKgPerKm * lengthKm,
    rTOhmPerKm: rT,
    totalResistanceOhm: rT * lengthKm,
  };
}
