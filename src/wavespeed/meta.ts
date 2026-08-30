import type { CalculatorMeta } from '../types';

export const wavespeedMeta: CalculatorMeta = {
  name: '波速利用率',
  nameEn: 'Wave Propagation Speed Utilisation',
  summary:
    '由接触线张力与线密度求波传播速度 c 与波速利用率 β = v/c，给出跨距前三阶固有频率与一阶共振车速。',
  formula: [
    '波传播速度：c = √(T/ρ)（T 取 N，ρ 取 kg/m）',
    '波速利用率：β = v / c（v 换算为 m/s）',
    '两端固定弦固有频率：f_n = n/(2L)·√(T/ρ)',
    '一阶共振车速：v_res = f₁·L = c/2（跨距通过频率 v/L 与 f₁ 相遇）',
  ],
  references: [
    '依据本站 弓网关系 / 波传播 条目',
    'β 达 0.7 时提示接近共振区，该阈值属工程经验值，请以设计文件为准',
  ],
  scope: [
    '张力 T：5 ~ 40 kN',
    '线密度 ρ：0.5 ~ 3 kg/m',
    '速度 v：20 ~ 500 km/h',
    '跨距 l：30 ~ 90 m',
    '两端固定弦模型，未考虑弹性支承与阻尼',
    '未考虑承力索与吊弦对波传播的影响',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/wavespeed/',
};
