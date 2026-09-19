import type { CalculatorMeta } from '../types';

export const dropperMeta: CalculatorMeta = {
  name: '吊弦长度计算',
  nameEn: 'Dropper Length Calculator',
  summary:
    '按抛物线弛度公式计算链形悬挂各吊弦长度，支持简单链形与弹性链形两种悬挂类型。',
  formula: [
    '承力索弛度（抛物线近似，总荷载口径）：f_m(x) = 4·f_m_max·x·(L−x) / L²，f_m_max = w·L² / (8·T_m)，w = q_c + q_m',
    '接触线弛度（弹性链形）：f_c(x) = 4·f_c_max·x·(L−x) / L²，f_c_max = q_c·L² / (8·T_c)',
    '简单链形：l_i = H − f_m(x_i)',
    '弹性链形（计入接触线弛度）：l_i = H − f_m(x_i) + f_c(x_i)',
  ],
  references: [
    '抛物线近似，适用于 f/L ≤ 1/10 的小弛度工况',
    '承力索下垂使吊弦变短、接触线（相对水平）下垂使吊弦变长，故 l = C − f_m + f_c（2026-09-19 口径更正，旧版将两线弛度角色写反）',
    'w = q_c + q_m 为承力索承担的总单位荷载（含经吊弦传递的接触线荷载），q_c 同时进入总荷载与接触线弛度两项',
    '吊弦间距须能整除跨距；实际吊弦布置以设计文件为准',
  ],
  scope: [
    '跨距 L：5 ~ 80 m',
    '接触线张力 T_c：1 ~ 40 kN（弹性链形用）',
    '承力索张力 T_m：1 ~ 40 kN（两种悬挂类型均需要）',
    '结构高度 H：0.3 ~ 3 m',
    '接触线单位荷载 q_c、承力索单位荷载 q_m：0.001 ~ 0.1 kN/m',
    '吊弦间距 d：1 ~ 15 m，须能整除跨距',
    '抛物线近似，大弛度工况误差增大',
    '未计入吊弦自身伸长、温度变化与零部件制造公差',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/dropper/',
};
