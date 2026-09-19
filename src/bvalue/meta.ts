import type { CalculatorMeta } from '../types';

export const bvalueMeta: CalculatorMeta = {
  name: 'b值（坠砣高度）安装曲线',
  nameEn: 'B-Value (Balance Weight) Installation Curve',
  summary: '按 b_x = b_min + n·α·L·(t_max − t_x) 计算任一温度下坠砣底面距地面高度，用于坠砣安装与检调定位。',
  formula: [
    'b_x = b_min + n·α·L·(t_max − t_x)',
    '坠砣侧行程变化 n·ΔL，ΔL = α·L·(t_max − t_x)',
    '坠砣总质量 W = T·1000/(n·9.81) kg（T 为张力 kN，n 为传动比倍数；与站点换算口径一致）',
  ],
  references: [
    '限值口径：运行 ≥200 mm、偏差 ±100 mm（TB 10421-2018 第 5.22.3 条）',
    '设计 ≥300 mm（期刊引铁运〔2007〕69 号）',
    '传动比倍数 n：1:3 即 n=3',
  ],
  scope: ['b_min：50~1000 mm', '半锚段 L：50000~900000 mm', '温度差：0~100 ℃', '传动比：2~4'],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/bvalue/',
};
