/**
 * TB/T 2809-2017 表5 持续载流量参考值（A）。
 *
 * 来源：itswe.com 标准规范库，据 TB/T 2809-2017 无水印全文扫描件逐格复核。
 *
 * 查表语义：
 *   - 返回数值：该项载流量
 *   - 返回 null：该 (材质， 截面) 规格存在，但该工况按标准原文注"不需要考核"
 *     （如纯铜接触线不考核 150℃ 工况）
 *   - 返回 undefined：该材质无此截面规格（如铜铬锆无 120 mm²）
 *
 * ⚠️ 表中为室内（无风无日照试验条件）值与室外值；工程取值请以标准原文与
 * 产品技术条件为准。高海拔、隧道内等场景须另行叠加散热修正。
 */

export type ContactWireTypeCode =
  | 'CT'
  | 'CTA'
  | 'CTS'
  | 'CTSM'
  | 'CTSH'
  | 'CTM'
  | 'CTMM'
  | 'CTMH'
  | 'CTCZ';

/** 载流量考核工况 */
export type AmpacityCondition = 'indoor-95' | 'outdoor-95' | 'indoor-150' | 'outdoor-150';

export type CrossSectionMM2 = 120 | 150;

/** 按截面索引的载流量对，[120 mm², 150 mm²] */
type SectionPair = readonly [number | null, number | null];

export interface AmpacityEntry {
  readonly type: ContactWireTypeCode;
  readonly materialZh: string;
  /** 标称截面，mm² */
  readonly crossSectionMM2: CrossSectionMM2;
  readonly condition: AmpacityCondition;
  /** 持续载流量，A。null 表示该项不需要考核 */
  readonly ampacityA: number | null;
}

const M = (
  type: ContactWireTypeCode,
  materialZh: string,
  sections: readonly CrossSectionMM2[],
  indoor95: SectionPair,
  outdoor95: SectionPair,
  indoor150: SectionPair,
  outdoor150: SectionPair,
): AmpacityEntry[] => {
  const conditions: ReadonlyArray<readonly [AmpacityCondition, SectionPair]> = [
    ['indoor-95', indoor95],
    ['outdoor-95', outdoor95],
    ['indoor-150', indoor150],
    ['outdoor-150', outdoor150],
  ];
  const out: AmpacityEntry[] = [];
  for (const section of sections) {
    for (const [condition, pair] of conditions) {
      const value = section === 120 ? pair[0] : pair[1];
      out.push({
        type,
        materialZh,
        crossSectionMM2: section,
        condition,
        ampacityA: value ?? null,
      });
    }
  }
  return out;
};

export const TB2809_AMPACITY_A: readonly AmpacityEntry[] = [
  ...M('CT', '铜', [120, 150], [360, 425], [495, 570], [null, null], [null, null]),
  ...M('CTA', '铜银', [120, 150], [360, 425], [495, 570], [515, 620], [680, 785]),
  ...M('CTS', '铜锡', [120, 150], [360, 425], [490, 565], [515, 620], [680, 790]),
  ...M('CTSM', '铜锡', [120, 150], [330, 400], [455, 525], [490, 560], [630, 730]),
  ...M('CTSH', '铜锡', [120, 150], [310, 360], [420, 480], [450, 520], [580, 670]),
  ...M('CTM', '铜镁', [120, 150], [330, 400], [455, 525], [490, 560], [630, 730]),
  ...M('CTMM', '铜镁', [120, 150], [310, 360], [420, 480], [450, 520], [580, 670]),
  ...M('CTMH', '铜镁', [120, 150], [300, 340], [410, 460], [430, 500], [560, 650]),
  ...M('CTCZ', '铜铬锆', [150], [null, 395], [null, 505], [null, 580], [null, 710]),
];

/**
 * 查表。
 * @returns 载流量 A；该规格存在但不考核时为 null；该材质无此截面时为 undefined
 */
export function findAmpacityA(params: {
  type: ContactWireTypeCode;
  crossSectionMM2: CrossSectionMM2;
  condition: AmpacityCondition;
}): number | null | undefined {
  const row = TB2809_AMPACITY_A.find(
    (e) =>
      e.type === params.type &&
      e.crossSectionMM2 === params.crossSectionMM2 &&
      e.condition === params.condition,
  );
  return row === undefined ? undefined : row.ampacityA;
}
