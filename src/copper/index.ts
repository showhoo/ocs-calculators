export { copperMeta } from './meta';

// 电阻温度修正与铜常数统一放在 src/common/resistance.ts（copper 与 voltage-drop 共用），
// 由根 index 统一导出，此处仅内部引用，避免重复导出同名符号。
import { resistanceAtTempOhmPerKm } from '../common/resistance';

/** 站点计算器内置的 6 个型号 */
export type CopperWireModel =
  | 'CTMH-120'
  | 'CTMH-150'
  | 'CTAH-120'
  | 'CTAH-150'
  | 'CTS-120'
  | 'CTS-150';

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
 * r₂₀ 口径 = 各材质 20℃ 电阻率上限 ÷ 标称截面。2026-09-19 全表复核：
 * 更正 CTMH-120/150（旧值误用 0.02535 档，应 0.02653）与
 * CTS-120/150（旧值误用 0.02299 档，应 0.01854）四行错档值，
 * 已随站点 `/calculator/assets/calc-core.js` 同批修正。
 *
 * 注：站点曾因显示层 `fmt()` 的尾零剥离正则把载流量渲染成 43/56（应为 430/560），
 * 已于 R38 之后修复。若再遇渲染值与本表不符，先确认是否为显示层问题：
 * 本表与服务端数据源始终一致。
 *
 * 单位重量口径（2026-09-19 更正）：六行 unitWeightKgPerKm 已按 TB/T 2809-2017
 * 表3 参考单位质量逐项更正——CTMH-120 1082→1076、CTMH-150 1350→1342、
 * CTAH-120 1070→1076、CTAH-150 1330→1342、CTS-120 1080→1079、CTS-150 1345→1347
 * （旧值混入了 TB/T 2810 纯铜表 1082 及近似凑整值）。站点 `calc-core.js` 的
 * COPPER_TABLE 当前仍为旧值，站点侧同步待另批；r₂₀/载流量两列不受本更正影响。
 *
 * ⚠️ 注意型号口径：CTMH / CTAH / CTS 是站点计算器的型号代码，与标准中的
 * CTMH / CTA / CTS 并非同名对应。`note` 字段说明各行实际取自标准的哪一行，
 * 交叉引用 TB/T 2809-2017 时请以 note 为准。
 *
 * ⚠️ 载流量字段仍为 2017 版表5 口径；站点已于 2026-09-19 切换 2026 版表5
 * （室内值 442/524/509/593/511/590 等，含 2017 对照列），npm 侧同步待另批。
 */
export const TB2809_WIRE_PARAMS: Record<CopperWireModel, WireParamEntry> = {
  'CTMH-120': {
    unitWeightKgPerKm: 1076,
    r20OhmPerKm: 0.2211,
    ampacityIndoor150A: 430,
    ampacityOutdoor150A: 560,
    note: '取标准 CTMH 行（高强度铜镁合金），r20 = ρ 上限 0.02653 ÷ 120（2026-09-19 更正：旧值 0.2113 误用 0.02535 档）',
  },
  'CTMH-150': {
    unitWeightKgPerKm: 1342,
    r20OhmPerKm: 0.1769,
    ampacityIndoor150A: 500,
    ampacityOutdoor150A: 650,
    note: '取标准 CTMH 行（高强度铜镁合金），r20 = 0.02653 ÷ 150（2026-09-19 更正：旧值 0.169 误用 0.02535 档）',
  },
  'CTAH-120': {
    unitWeightKgPerKm: 1076,
    r20OhmPerKm: 0.1481,
    ampacityIndoor150A: 515,
    ampacityOutdoor150A: 680,
    note: '取标准 CTA 行（铜银合金），ρ ≤ 0.01777',
  },
  'CTAH-150': {
    unitWeightKgPerKm: 1342,
    r20OhmPerKm: 0.1185,
    ampacityIndoor150A: 620,
    ampacityOutdoor150A: 785,
    note: '取标准 CTA 行（铜银合金）',
  },
  'CTS-120': {
    unitWeightKgPerKm: 1079,
    r20OhmPerKm: 0.1545,
    ampacityIndoor150A: 515,
    ampacityOutdoor150A: 680,
    note: '取标准 CTS 行（铜锡合金），r20 = ρ 上限 0.01854 ÷ 120（2026-09-19 更正：旧值 0.1916 误用 0.02299 档），载流量按 CTS 行取值',
  },
  'CTS-150': {
    unitWeightKgPerKm: 1347,
    r20OhmPerKm: 0.1236,
    ampacityIndoor150A: 620,
    ampacityOutdoor150A: 790,
    note: '取标准 CTS 行（铜锡合金），r20 = 0.01854 ÷ 150（2026-09-19 更正：旧值 0.1533 误用 0.02299 档），载流量按 CTS 行取值',
  },
};

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
  if (ambientTempDegC < -40 || ambientTempDegC > 90) {
    throw new RangeError(`适用温度为 −40 ~ 90 ℃，收到 ${ambientTempDegC} ℃`);
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
