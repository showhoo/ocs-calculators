import type { CalculatorMeta } from '../types';

export const tensionMeta: CalculatorMeta = {
  name: '张力-温度安装曲线',
  nameEn: 'Tension-Temperature Installation Curve',
  summary:
    '按张力-温度状态方程求解各温度档的施工张力与弛度，生成安装曲线表；支持当量跨距（多跨锚段）与覆冰工况校核。',
  formula: [
    '状态方程：T₂ − g₂²l²EA/(24T₂²) = T₁ − g₁²l²EA/(24T₁²) − αEA(t₂ − t₁)',
    '跨中弛度（抛物线近似）：f = gl²/(8T)',
    '当量跨距：l_D = √(Σlᵢ³ / Σlᵢ)',
    '覆冰荷载（冰筒模型）：g_ice = ρ_ice · g₀ · π · b · (d + b)',
  ],
  references: [
    'TB 10009-2016《铁路电力牵引供电设计规范》—— 仅规定接触线最小张力、张力确定原则与张力差限值，不含张力-温度状态方程本身',
    '张力-温度状态方程为通用柔索状态方程，具体形式以设计文件及接触网设计教材/手册为准',
    '线材 E / α / 线密度为标称参考值，实际以产品技术条件为准',
  ],
  scope: [
    '弹性模量 E：50 ~ 200 GPa',
    '截面积 A：50 ~ 250 mm²',
    '跨距 l：20 ~ 90 m',
    '弛度采用抛物线近似，不适用于大弛度（f/l > 1/10）工况',
    '覆冰模型为均匀冰筒假设，不考虑不均匀覆冰与脱冰跳跃',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/tension/',
};
