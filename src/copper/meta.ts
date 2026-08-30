import type { CalculatorMeta } from '../types';

export const copperMeta: CalculatorMeta = {
  name: '接触线参数速查',
  nameEn: 'Contact Wire Parameter Lookup',
  summary:
    '内置 CTHM / CTHA / CTHS 系列 120/150 mm² 接触线参数表，按长度与环境温度给出总重量与温度修正电阻。',
  formula: [
    '电阻温度修正（α = 0.00393 /℃）：r_T = r₂₀·[1 + α·(T − 20)]',
    '总重量：W = w₀ × l（w₀ 单位重量 kg/km，l 长度 km）',
  ],
  references: [
    '内置参数表来源 TB/T 2809-2017《电气化铁路用铜及铜合金接触线》（2018-05-01 实施）',
    '单位重量为标称值',
    '载流量为 150℃ 持续值，室内/室外双口径按标准表5',
    'r₂₀ 除 CTHM-120 取给定值外，均按导电率反算估算（IACS 标准电阻率 0.017241 Ω·mm²/m ÷ 导电率 ÷ 截面积；0.017241 = 1/58）',
    '正式工程以产品标准与出厂检验单为准',
  ],
  scope: [
    '温度修正仅覆盖电阻，未修正单位重量与载流量',
    '适用温度 −40 ~ 90 ℃',
    '载流量为 150℃ 允许温度下的持续值，未做环境温度修正',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/copper/',
};
