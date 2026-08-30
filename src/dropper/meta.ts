import type { CalculatorMeta } from '../types';

export const dropperMeta: CalculatorMeta = {
  name: '吊弦长度计算',
  nameEn: 'Dropper Length Calculator',
  summary:
    '按抛物线弛度公式计算链形悬挂各吊弦长度，支持简单链形与弹性链形两种悬挂类型。',
  formula: [
    '接触线弛度（抛物线近似）：f_c(x) = q_c·x·(L−x) / (2·T_c)',
    '承力索弛度：f_m(x) = q_m·x·(L−x) / (2·T_m)',
    '简单链形：l_i = H − f_c(x_i)',
    '弹性链形（计入承力索弛度）：l_i = H − f_c(x_i) + f_m(x_i)',
    '跨中最大弛度：f_max = q_c·L² / (8·T_c)',
  ],
  references: [
    '抛物线近似，适用于 f/L ≤ 1/10 的小弛度工况',
    '吊弦间距须能整除跨距；实际吊弦布置以设计文件为准',
    '弹性链形悬挂须同时提供承力索张力与单位荷载',
  ],
  scope: [
    '跨距 L：5 ~ 80 m',
    '接触线张力 T_c：1 ~ 40 kN',
    '结构高度 H：0.3 ~ 3 m',
    '接触线单位荷载 q_c：0.001 ~ 0.1 kN/m',
    '吊弦间距 d：1 ~ 15 m，须能整除跨距',
    '抛物线近似，大弛度工况误差增大',
    '未计入吊弦自身伸长、温度变化与零部件制造公差',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/dropper/',
};
