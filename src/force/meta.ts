import type { CalculatorMeta } from '../types';

export const forceMeta: CalculatorMeta = {
  name: '弓网接触力统计评价',
  nameEn: 'Pantograph-Catenary Contact Force Statistical Assessment',
  summary:
    '按 EN 50367 统计评价体系，由平均接触力 Fm 与标准差 σ 计算 Fmax=Fm+3σ、Fmin=Fm−3σ，对照验收限值给出判定，适用于 C1 检测数据评价。',
  formula: [
    '统计评价：Fmax = Fm + 3σ，Fmin = Fm − 3σ',
    '参考目标力（AC 体系）：Fref = 0.00097·v² + 70（v 单位 km/h）',
    'DC 3kV 体系：Fref = 0.00097·v² + 110',
    'DC 1.5kV 体系：Fref = 0.00097·v² + 140',
  ],
  references: [
    '统计评价框架依据 EN 50367；测量方法见 EN 50317',
    'AC 体系常数引自 EN 50367 表6；DC 体系常数引自 TSI ENE 2011/274/EU',
    '验收上下限须按现行验收大纲/合同填写，本模块不内置限值',
    'v = 200 km/h 时 AC 体系 Fref = 108.8 N',
  ],
  scope: [
    'Fm 与 σ 应取自同一检测区段的统计值（C1 检测数据）',
    '3σ 准则是统计极值近似，不替代逐点超限统计',
    '未考虑离线率、燃弧率等其他接触质量指标',
    '分档表值与允差带以标准原文为准',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/force/',
};
