import type { CalculatorMeta } from '../types';

export const sagMeta: CalculatorMeta = {
  name: '弛度速算（弛度-张力互算）',
  nameEn: 'Sag Quick Calculation',
  summary: '等高悬挂抛物线近似（小弛度假设）下弛度、张力与最大跨距互算。',
  formula: [
    '弛度 f = g·l²/(8T)',
    '反算张力 T = g·l²/(8·f)',
    '反算跨距上限 l_max = √(8·T·f_max/g)',
  ],
  references: [
    '限值（TB 10009-2016 第 5.1.9 条，推荐性「不宜大于」口径）：链形悬挂接触线 150 mm、简单悬挂 250 mm、低速区段 350 mm',
    '等高悬挂抛物线近似，适用于 f/l ≤ 1/10',
  ],
  scope: ['张力 T：1~40 kN', '跨距 l：5~80 m', '单位重 g：5~25 N/m'],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/sag/',
};
