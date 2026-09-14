export { creepageMeta } from './meta';

/** 接触网绝缘爬电距离底线（TB 10009-2016 第 5.3.2 条第 1 款），mm */
export const CREEPAGE_FLOOR_GENERAL = 1400;
/** V 形天窗区段上、下行正线间分段绝缘子串底线，mm */
export const CREEPAGE_FLOOR_VCUT = 1600;

/** GB/T 32586 统一爬电比距三档（第 4.4 条，按系统最高持续电压折算） */
export const USCD_BANDS = [
  { label: '正常', min: 24, max: 33 },
  { label: '非正常', min: 36, max: 40 },
  { label: '苛刻', min: 48, max: Infinity },
] as const;

/** 爬电距离校核 */
export function creepageCheck(input: {
  /** 绝缘子实际爬电距离，mm */
  readonly creepageMM: number;
  /** 使用场景：'general' 一般 | 'vcut' V 形天窗分段串 */
  readonly scenario?: 'general' | 'vcut';
  /** 系统最高电压，kV（GB/T 32586 折算用，默认 29） */
  readonly maxVoltageKV?: number;
}): {
  floorMM: number; passes: boolean; uscdBands: { label: string; mm: number }[];
} {
  const floorMM = (input.scenario === 'vcut' ? CREEPAGE_FLOOR_VCUT : CREEPAGE_FLOOR_GENERAL);
  const kv = input.maxVoltageKV ?? 29;
  const uscdBands = USCD_BANDS.map((b) => ({
    label: b.label,
    mm: b.max === Infinity ? Math.round(b.min * kv) : Math.round(b.min * kv),
  }));
  return { floorMM, passes: input.creepageMM >= floorMM, uscdBands };
}
