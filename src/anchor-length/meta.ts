import type { CalculatorMeta } from '../types';

export const anchorLengthMeta: CalculatorMeta = {
  name: '锚段长度张力差校核',
  nameEn: 'Anchor Span Tension Difference Check',
  summary: '计算接触线张力增量（曲线定位器项、直线吊弦项，教材口径）并按张力差判据校核。',
  formula: [
    '曲线定位器项：T_jw = d·T_jm/R',
    '直线吊弦项：T_jd = L(L−l)·g_j·α·Δt/(2c)',
    '判据：ΔT ≤ 10%·T_N（TB 10009-2016 第 5.4.7 条）',
  ],
  references: [
    '判据：接触线、承力索张力差均不得大于额定张力 10%（TB 10009-2016 5.4.7）',
    '教材口径（于万聚《电气化铁道接触网设计》体系）',
    '直线吊弦项量纲：m²·kN/m·(1/℃)·℃/m = kN，2026-09-13 复核自洽',
  ],
  scope: ['曲线半径 R：100~4000 m', '定位器长 d：0.5~2.5 m', '半锚段 L：100~2000 m', '跨距 l：30~90 m'],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/anchor-length/',
};
