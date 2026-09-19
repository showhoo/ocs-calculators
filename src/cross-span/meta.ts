import type { CalculatorMeta } from '../types';

export const crossSpanMeta: CalculatorMeta = {
  name: '软横跨负载计算',
  nameEn: 'Soft Cross-Span Load Calculation',
  summary:
    '按负载计算法（教材口径）计算软横跨各节点垂直负载、抛物线节点弛度、水平张力与总索长，用于接触网软横跨设计校核。',
  formula: [
    '节点垂直负载（均匀间距简化）：Q_i = J + n·q₀·a + P + g_c·a',
    '节点弛度（抛物线分布，最低点在 l₁）：f_i = f_max·(1 − ((x_i−l₁)/c_i)²)，c_i = l₁（x_i≤l₁）或 L−l₁（x_i>l₁）',
    '水平张力（精确式）：H = M(l₁)/f_max，M(l₁) 为悬挂负载对最低点截面（简支梁）弯矩',
    '水平张力（简化式对照）：H′ = ΣQ_i·l₁/(2·f_max)',
    '分段索长：b_i ≈ a + (f_{i+1}−f_i)²/(2a)',
    '支柱锚固段：b_end = x₁ + f₁²/(2·x₁)，支柱端弛度为 0',
    '总索长：Σb = b_endL + Σb_i + b_endR',
  ],
  references: [
    '教材负载计算法（软横跨），节点负载按大站 65 kg / 小站 45 kg 取值',
    '抛物线近似，适用于弛跨比 f/L ≤ 1/10 工况',
    '2026-09-14 站长提供文本核对（负载计算法）',
    '2026-09-19 与站点页面实现对齐：节点对称布设 x₁=(L−(N−1)a)/2、x_i=x₁+(i−1)a，约束 L>(N−1)a',
  ],
  scope: [
    '节点数 N：2 ~ 20',
    '股道间距 a：4 ~ 8 m',
    '跨距 L：15 ~ 80 m',
    '节点负载 J：45 / 65 kg',
    '接触悬挂单位重 q₀：1.0 ~ 3.0 kg/m',
    '悬挂组数 n：1 ~ 3',
    '横承索 + 定位索单位重 g_c：0.2 ~ 1.5 kg/m',
    '最大弛度 f_max：1 ~ 6 m，须小于最低点两侧悬挂高度',
    '未计入温度对索长与张力的影响、横承索弧垂非线性修正',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/cross-span/',
};
