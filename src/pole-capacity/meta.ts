import type { CalculatorMeta } from '../types';

export const poleCapacityMeta: CalculatorMeta = {
  name: '支柱容量选型校核',
  nameEn: 'Mast Capacity Selection Check',
  summary: '容量比较法：悬挂水平力与支柱风载合成工作弯矩，对照 GB/T 25020.1 钢支柱检验弯矩系列选型。',
  formula: [
    '直线之字力 F_z = 4(T_j+T_c)·a/l；曲线力 F_q = (T_j+T_c)·l/R',
    '工作弯矩 M = F_h·h_e + P·b·h²/2 + F_wl·h_e',
    '承载力检验弯矩 = 1.5 × 标称容量（25020.1 表 A.2 表值规律）',
  ],
  references: [
    '钢柱直接依据：GB/T 25020.1-2025 第 5.1.1 条 + 附录 A 检验弯矩系列',
    '同口径混凝土柱条款：TB/T 2286-2020 第 5.9.2 条（荷载矢量组合不大于检验弯矩）',
    '分项系数极限状态法（GB/T 32578-2016 6.3.3 表 15）为设计正式口径，不可混用',
  ],
  scope: ['张力：5~45 kN', '跨距：30~90 m', '风压：100~1500 Pa', '支柱高：5~20 m'],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/pole-capacity/',
};
