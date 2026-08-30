export { voltageDropMeta } from './meta';

/** 25kV 体系常用的末端电压下限，V */
export const DEFAULT_MIN_END_VOLTAGE_V = 20000;

// 电阻温度修正统一来自 src/common/resistance.ts（copper 与 voltage-drop 共用）
import { resistanceAtTempOhmPerKm } from '../common/resistance';

export interface VoltageDropInput {
  /** 变电所母线电压 U₀，V */
  readonly busVoltageV: number;
  /** 持续电流 I，A */
  readonly currentA: number;
  /** 20℃ 单位电阻 r₂₀，Ω/km */
  readonly r20OhmPerKm: number;
  /** 供电臂等效长度 L，km */
  readonly feederLengthKm: number;
  /** 环境温度 T，℃。缺省 25 */
  readonly tempDegC?: number;
  /** 并联导线数。缺省 1 */
  readonly parallelCount?: number;
  /** 末端最低允许电压，V。缺省 20000 */
  readonly minEndVoltageV?: number;
}

export interface VoltageDropResult {
  /** 温度修正（并含并联折减）后的单位电阻 r_T，Ω/km */
  readonly rTOhmPerKm: number;
  /** 电压损失 ΔU，V */
  readonly voltageDropV: number;
  /** 末端电压 U_end，V */
  readonly endVoltageV: number;
  /** 压降率，% */
  readonly dropPercent: number;
  /** 末端电压是否满足要求 */
  readonly passes: boolean;
}

/**
 * 电压降校核：ΔU = I·r_T·L（并联 n 路时 r_T/n），U_end = U₀ − ΔU。
 */
export function voltageDropCheck(input: VoltageDropInput): VoltageDropResult {
  const { busVoltageV, currentA, r20OhmPerKm, feederLengthKm } = input;

  if (!(busVoltageV > 0)) {
    throw new RangeError(`母线电压必须为正数，收到 ${busVoltageV} V`);
  }
  if (!(currentA > 0)) {
    throw new RangeError(`持续电流必须为正数，收到 ${currentA} A`);
  }
  if (!(feederLengthKm > 0)) {
    throw new RangeError(`供电臂长度必须为正数，收到 ${feederLengthKm} km`);
  }

  const parallelCount = input.parallelCount ?? 1;
  if (!(parallelCount > 0) || !Number.isInteger(parallelCount)) {
    throw new RangeError(`并联导线数必须为正整数，收到 ${parallelCount}`);
  }

  const minEndVoltageV = input.minEndVoltageV ?? DEFAULT_MIN_END_VOLTAGE_V;

  const rT =
    resistanceAtTempOhmPerKm(r20OhmPerKm, input.tempDegC ?? 25) / parallelCount;
  const voltageDropV = currentA * rT * feederLengthKm;
  const endVoltageV = busVoltageV - voltageDropV;

  return {
    rTOhmPerKm: rT,
    voltageDropV,
    endVoltageV,
    dropPercent: (voltageDropV / busVoltageV) * 100,
    passes: endVoltageV >= minEndVoltageV,
  };
}
