import { G0 } from '../types';

/**
 * 接触线线材参数预设。
 *
 * ⚠️ 全部为标称参考值，实际取值以产品技术条件与设计文件为准。
 * ⚠️ 本站计算器的参数界面支持手工覆盖这些值 —— 那才是工程上正确的用法。
 *
 * 待核对项（见 README「开放问题」）：
 * 站点页面注明"参考单位质量按密度 8.94 g/cm³ 计"，据此 CTHM-120 应为 1.0728 kg/m。
 * 但由站点已发布的输出表反算，实际使用的 g ≈ 10.62 N/m，对应线密度 ≈ 1.083 kg/m，
 * 比标称值高约 0.9%，疑似计入了吊弦、线夹、接头的等效附加荷载。
 * 两者差异约 1%，在多数工程场景可接受，但请确认后统一。
 */

export interface WireSpec {
  /** 唯一标识 */
  readonly id: string;
  /** 中文名 */
  readonly name: string;
  /** 英文名 */
  readonly nameEn: string;
  /** 标称截面积 A，mm² */
  readonly crossSectionMM2: number;
  /** 弹性模量 E，GPa（标称参考值） */
  readonly elasticModulusGPa: number;
  /** 线膨胀系数 α，1/℃（标称参考值） */
  readonly expansionPerDegC: number;
  /** 线密度，kg/m（标称参考值） */
  readonly linearMassKgPerM: number;
}

/** 参考密度，g/cm³（站点页面注明值） */
export const REFERENCE_DENSITY_G_PER_CM3 = 8.94;

/**
 * 由截面积与密度反算线密度。
 * @param crossSectionMM2 截面积 A，mm²
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
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: deriveLinearMassKgPerM(120),
  },
  {
    id: 'cthm150',
    name: 'CTHM-150（铜镁 150）',
    nameEn: 'CTHM-150 (CuMg 150 mm²)',
    crossSectionMM2: 150,
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: deriveLinearMassKgPerM(150),
  },
  {
    id: 'ctha120',
    name: 'CTHA-120（铜银 120）',
    nameEn: 'CTHA-120 (CuAg 120 mm²)',
    crossSectionMM2: 120,
    elasticModulusGPa: 120,
    expansionPerDegC: COPPER_ALLOY_ALPHA_PER_DEG_C,
    linearMassKgPerM: deriveLinearMassKgPerM(120),
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
