import type { CalculatorMeta } from '../types';

export const voltageDropMeta: CalculatorMeta = {
  name: '电压降校核',
  nameEn: 'Voltage Drop Check',
  summary:
    '按温度修正后的单位电阻计算供电臂电压损失 ΔU 与末端电压，用于供电臂长度与导线截面校核。',
  formula: [
    '单位电阻温度修正：r_T = r₂₀·[1 + α·(T − 20)]（α = 0.00393 /℃）',
    '并联 n 路时：r_T / n',
    '电压损失：ΔU = I · r_T · L（r_T 单位 Ω/km，L 单位 km）',
    '末端电压：U_end = U₀ − ΔU；压降率 = ΔU / U₀',
  ],
  references: [
    '依据本站 供电计算 / 电气设计 条目',
    '末端电压限值：25kV 体系常按 20kV 掌握；实际限值以设计文件与供电计算书为准',
  ],
  scope: [
    '母线电压 U₀：20000 ~ 30000 V',
    '持续电流 I：10 ~ 3000 A',
    '单位电阻 r₂₀：0.05 ~ 1 Ω/km',
    '供电臂等效长度 L：1 ~ 60 km',
    '环境温度：−40 ~ 80 ℃',
    '单回路集中负荷模型，未考虑负荷沿供电臂分布与再生制动',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/voltage-drop/',
};
