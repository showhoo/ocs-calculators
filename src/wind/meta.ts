import type { CalculatorMeta } from '../types';

export const windMeta: CalculatorMeta = {
  name: '风偏限界校验',
  nameEn: 'Wind Deflection Clearance Check',
  summary:
    '计算线索在风荷载作用下的跨中偏移 b，叠加拉出值后与限界允许值比较，给出合格/超限结论。',
  formula: [
    '单位风荷载：p = ½·ρ·v²·d·α·sin²θ（ρ = 1.225 kg/m³）',
    '跨中风偏（简支索抛物线近似）：b = p·L² / (8·T)',
    '限界校验：b + a ≤ 限界允许值，满足判为合格',
  ],
  references: [
    '简支索抛物线近似，适用于 f/L ≤ 1/10 工况',
    '风载体型系数 α：圆柱形线索常取 1.2',
    '限界允许值按受电弓动态包络线取值',
  ],
  scope: [
    '风速 v：0 ~ 60 m/s',
    '风向与线路夹角 θ：0 ~ 180°，90° 为垂直于线路',
    '线索直径 d：1 ~ 30 mm',
    '线索张力 T：1 ~ 40 kN',
    '跨距 L：5 ~ 80 m',
    '风载体型系数 α：0.5 ~ 2.0',
    '拉出值 a：0 ~ 0.6 m',
    '限界允许值：0.1 ~ 2 m',
    '未计入线索风致振动、驰振与覆冰附加风载',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/wind/',
};
