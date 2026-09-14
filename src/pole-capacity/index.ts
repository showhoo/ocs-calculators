export { poleCapacityMeta } from './meta';

/** GB/T 25020.1-2025 格构式钢支柱标称容量系列（表 A.2），kN·m */
export const STEEL_POLE_SERIES_KNM = [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 750, 900, 1050, 1200, 1500] as const;

/** 承载力检验弯矩 = 1.5 × 标称容量（25020.1 表 A.2 表值规律） */
export const TEST_MOMENT_FACTOR = 1.5;

/** 支柱容量校核输入。单位：kN、m、mm、Pa。 */
export interface PoleCapacityInput {
  /** 区段类型 */
  readonly section: 'line' | 'curve';
  /** 接触线张力 T_j，kN */
  readonly contactWireTensionKN: number;
  /** 承力索张力 T_c，kN */
  readonly messengerTensionKN: number;
  /** 拉出值 a，mm */
  readonly staggerMM: number;
  /** 跨距 l，m */
  readonly spanM: number;
  /** 曲线半径 R，m（曲线区段） */
  readonly curveRadiusM?: number;
  /** 水平力合力作用高度 h_e，m */
  readonly resultantHeightM: number;
  /** 设计最大风压 P，Pa */
  readonly windPressurePa: number;
  /** 支柱迎风宽度 b，m */
  readonly poleWidthM: number;
  /** 支柱高度 h，m */
  readonly poleHeightM: number;
  /** 线索风载 F_wl，N */
  readonly wireWindLoadN?: number;
}

export interface PoleCapacityResult {
  /** 悬挂水平力 F_h，N */
  readonly horizontalForceN: number;
  /** 工作弯矩 M，kN·m */
  readonly workMomentKNM: number;
  /** 折合标称容量（÷1.5），kN·m */
  readonly nominalNeedKNM: number;
  /** 选型结果 */
  readonly selection: string | null;
}

/** 支柱容量选型（容量比较法，TB/T 2286 5.9.2 检验弯矩口径；钢柱 25020.1 5.1.1+附录A） */
export function poleCapacityCheck(input: PoleCapacityInput): PoleCapacityResult {
  const { section, contactWireTensionKN, messengerTensionKN, staggerMM, spanM, resultantHeightM, windPressurePa, poleWidthM, poleHeightM, wireWindLoadN } = input;
  if (!(contactWireTensionKN >= 0) || !(messengerTensionKN >= 0)) throw new RangeError('张力不能为负');
  const T = contactWireTensionKN + messengerTensionKN;
  const a = staggerMM / 1e3;
  const Fz = (4 * T * a) / spanM; // kN
  let Fh: number;
  if (section === 'curve') {
    if (!(input.curveRadiusM && input.curveRadiusM > 0)) throw new RangeError('曲线半径必须为正');
    const Fq = (T * spanM) / input.curveRadiusM;
    Fh = Math.abs(Fq - Fz);
  } else {
    Fh = Fz;
  }
  const M1 = Fh * resultantHeightM; // 悬挂水平力矩 kN·m
  const M2 = (windPressurePa * poleWidthM * Math.pow(poleHeightM, 2) / 2) / 1e3; // 支柱风载矩
  const M3 = ((wireWindLoadN ?? 0) * resultantHeightM) / 1e3;
  const M = M1 + M2 + M3;
  const nomNeed = M / TEST_MOMENT_FACTOR;
  const pick = STEEL_POLE_SERIES_KNM.find((n) => n >= nomNeed) ?? null;
  return {
    horizontalForceN: Fh * 1e3,
    workMomentKNM: M,
    nominalNeedKNM: nomNeed,
    selection: pick ? 'G' + pick : null,
  };
}
