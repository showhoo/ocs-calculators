import type { CalculatorMeta } from '../types';

export const curveStaggerMeta: CalculatorMeta = {
  name: '曲线拉出值校核',
  nameEn: 'Curve Stagger Clearance Check',
  summary:
    '计算曲线区段跨中综合偏移（拉出值均值、曲线矢度、超高横移、风偏的组合），与受电弓容许偏移比较给出判定。',
  formula: [
    '平均拉出值：ā = (a₁ + a₂) / 2',
    '曲线矢度：c = l² / (8R)（直线段 R = ∞ 时 c = 0）',
    '超高横移：δ = H·h / l₀',
    '跨中风偏：p_w = (½·ρ·v²·d·α) · l² / (8T)（取风向垂直线路的最不利工况）',
    '综合偏移（两风向取大）：e = max(|ā + c − δ|, |ā − c + δ|) + p_w ≤ [e]',
  ],
  references: [
    '依据本站 拉出值设计 条目',
    '风偏取风向垂直线路的最不利工况（sin²θ = 1）',
    '超高横移 δ 于 2026-09-19 纳入综合偏移合成（与站点 calc-core.js 同批更正；旧版仅计算返回、未参与 e）',
    '容许偏移 [e] 按受电弓动态包络线取值，以设计文件为准',
  ],
  scope: [
    '曲线半径 R：0 ~ 20000 m（直线传 0 或 Infinity）',
    '跨距 l：20 ~ 80 m',
    '拉出值 a₁/a₂：−0.6 ~ 0.6 m（曲线内侧为正）',
    '风速 v：0 ~ 60 m/s',
    '线索直径 d：1 ~ 30 mm',
    '风载体型系数 α：0.5 ~ 2',
    '张力 T：5 ~ 40 kN',
    '滑板面距轨面 H：4 ~ 8 m；外轨超高 h：0 ~ 0.25 m；轨距 l₀ 默认 1.435 m',
    'δ 纳入合成后，外轨超高 h 直接影响判定结果（h 增大 → e₋ 增大）',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/curve-stagger/',
};
