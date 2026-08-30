import type { CalculatorMeta } from '../types';

export const ampacityMeta: CalculatorMeta = {
  name: '载流量修正与短路热稳定',
  nameEn: 'Ampacity Derating and Short-Circuit Thermal Stability',
  summary:
    '按环境温度修正持续载流量，并按短路热稳定校核最小截面，用于接触线/附加导线截面选型与校核。',
  formula: [
    '载流量环境温度修正：I(Ta) = I₀·√((Tmax − Ta) / (Tmax − T₀))',
    '短路热稳定最小截面：S ≥ I_k·√t_k / C',
  ],
  references: [
    '允许工作温度：铜 95℃、铜合金 150℃（TB/T 2809-2017 表5）',
    '基准载流量 I₀ 可按 TB/T 2809-2017 表5 取值（室内为无风无日照试验条件下须符合值，室外值宜参照）',
    '热稳定系数 C 属设计输入，须按设计手册与产品技术条件取值',
  ],
  scope: [
    '修正式仅覆盖环境温度项',
    '高海拔、隧道、日照叠加场景须另行叠加散热修正',
    '短路电流 I_k 应为供电计算给出的热稳定等效值',
    '切除时间 t_k 为保护动作全切除时间',
    '未考虑邻近金属回流、集肤效应与短时过载工况',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/ampacity/',
};
