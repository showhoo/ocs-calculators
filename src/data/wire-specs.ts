import { G0 } from '../types';

/**
 * 接触线线材参数预设。
 *
 * ⚠️ 全部为标称参考值，实际取值以产品技术条件与设计文件为准。
 * ⚠️ 本站计算器的参数界面支持手工覆盖这些值 —— 那才是工程上正确的用法。
 *
 * 自重口径（2026-08-31 已确定）：
 * 线密度取标准「参考单位质量」表值，而非由标称截面推算。标准表分两列：
 *   型号｜标称截面｜计算截面｜参考单位质量
 *   CT 120｜120｜121｜1082 kg/km
 *   注：参考单位质量按密度 8.94 g/cm³ 计算
 * 即标准的 8.94 g/cm³ 是配「计算截面」（把尺寸公差计入后的截面）用的，
 * 不是配「标称截面」用的：121 × 8.94 × 1e-3 = 1.0817 ≈ 1.082 kg/m。
 * 因此 CTHM-120 自重 g = 1.082 × 9.81 = 10.61442 N/m，
 * 与站点 /calculator/tension/ 预设 rho=1.082、COPPER_TABLE.unitWeight=1082 一致。
 * 早期版本用标称截面 120 直接推算得 1.0728 kg/m，偏低约 0.85%，已废弃。
 *
 * 依据：TB/T 2810-2017（纯铜）、TB/T 2821-2017（铜银）规格尺寸表；
 * CTHM/CTHA 型号口径与 TB/T 2809-2017 的对应关系见 copper 模块 note 字段。
 */

export interface WireSpec {
  /** 唯一标识 */
  readonly id: WirePresetId;
  /** 中文名 */
  readonly name: string;
  /** 英文名 */
  readonly nameEn: string;
  /** 标称截面积 A，mm² */
  readonly crossSectionMM2: number;
  /** 计算截面积，mm²（标准表列，自重按此值 × 8.94 g/cm³ 计） */
  readonly calculatedSectionMM2: number;
  /** 弹性模量 E，GPa（标称参考值） */
  readonly elasticModulusGPa: number;
  /** 线膨胀系数 α，1/℃（标称参考值） */
  readonly expansionPerDegC: number;
  /** 线密度，kg/m（标准参考单位质量） */
  readonly linearMassKgPerM: number;
}

/** 参考密度，g/cm³（标准注：参考单位质量按此密度计） */
export const REFERENCE_DENSITY_G_PER_CM3 = 8.94;

/** 线材预设 id */
export type WirePresetId = 'cthm120' | 'cthm150' | 'ctha120';

/**
 * 标准「参考单位质量」表，kg/km。
 * 与 `src/copper/index.ts` 的 TB2809_WIRE_PARAMS.unitWeightKgPerKm 同源
 * （站点 /calculator/assets/calc-core.js 的 COPPER_TABLE）。
 */
export const STANDARD_UNIT_WEIGHT_KG_PER_KM: Readonly<Record<WirePresetId, number>> = {
  cthm120: 1082,
  cthm150: 1350,
  ctha120: 1070,
};

/** 由标准参考单位质量换算线密度，kg/m */
export function unitWeightToKgPerM(kgPerKm: number): number {
  return kgPerKm / 1000;
}

/**
 * 由截面积与密度反算线密度。
 *
 * ⚠️ 传入的必须是「计算截面」而非「标称截面」，否则结果偏低约 0.85%。
 * 120 mm² 标称对应计算截面 121 mm²；150 mm² 标称对应 151 mm²。
 *
 * @param crossSectionMM2 计算截面积，mm²
 * @param densityGPerCm3 密度，g/cm³
 * @returns 线密度，kg/m
 */
export function deriveLinearMassKgPerM(
  crossSectionMM2: number,
  densityGPerCm3: number = REFERENCE_DENSITY_G_PER_CM3,
): number {
  // A[mm²] × 1e-6 [m²/mm²] × ρ[g/cm³] × 1000 [kg/m³ per g/cm³]
  return crossSectionMM2 * 1e-6 * densityGPerCm3 * 1000;
}

/** 铜及铜合金接触线的常用线膨胀系数，1/℃ */
export const COPPER_ALLOY_ALPHA_PER_DEG_C = 1.7e-5;

export const WIRE_PRESETS: readonly WireSpec[] = [
  {
    id: 'cthm120',
    name: 'CTHM-120（铜镁 120）',
    nameEn: 'CTHM-120 (CuMg 120 mm²)',
    crossSectionMM2: 120,
    calculatedSectionMM2: 121,
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: unitWeightToKgPerM(STANDARD_UNIT_WEIGHT_KG_PER_KM.cthm120),
  },
  {
    id: 'cthm150',
    name: 'CTHM-150（铜镁 150）',
    nameEn: 'CTHM-150 (CuMg 150 mm²)',
    crossSectionMM2: 150,
    calculatedSectionMM2: 151,
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: unitWeightToKgPerM(STANDARD_UNIT_WEIGHT_KG_PER_KM.cthm150),
  },
  {
    id: 'ctha120',
    name: 'CTHA-120（铜银 120）',
    nameEn: 'CTHA-120 (CuAg 120 mm²)',
    crossSectionMM2: 120,
    calculatedSectionMM2: 121,
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: unitWeightToKgPerM(STANDARD_UNIT_WEIGHT_KG_PER_KM.ctha120),
  },
];

/** 按 id 取线材预设，找不到返回 undefined */
export function findWirePreset(id: string): WireSpec | undefined {
  return WIRE_PRESETS.find((w) => w.id === id);
}

/**
 * 由线密度求单位自重荷载 g，N/m。
 * @param linearMassKgPerM 线密度，kg/m
 */
export function weightPerLengthNPerM(linearMassKgPerM: number): number {
  return linearMassKgPerM * G0;
}

/**
 * 由线材预设直接取单位自重荷载 g，N/m。
 */
export function weightOfPresetNPerM(spec: WireSpec): number {
  return weightPerLengthNPerM(spec.linearMassKgPerM);
}
