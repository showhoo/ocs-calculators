import type { CalculatorMeta } from '../types';

export const cantileverMeta: CalculatorMeta = {
  name: '腕臂预配（斜腕臂勾股下料）',
  nameEn: 'Cantilever Pre-assembly (Pythagorean)',
  summary: '按勾股几何计算斜腕臂下料长度与定位环安装位置，附 TB 10758 预配允差。',
  formula: [
    '斜腕臂管长 L = √(h²+d²) − Δc',
    '定位环位置 s = (y_d/h)·√(h²+d²)',
    '预配允差 ±5 mm（TB 10758-2018 第 5.10.1 条）；安装允差 ±20 mm（第 5.10.2 条）',
  ],
  references: [
    '勾股几何为平面几何恒等式（几何自证）',
    'TB 10758-2018 第 5.10.1/5.10.2 条（预配/安装允差分离）',
    '端部扣减 Δc 按 TB/T 2075 系列零件尺寸',
  ],
  scope: ['竖直距 h：0.8~4 m', '水平投影 d：0.3~4 m', '端部扣减：0~0.6 m'],
  disclaimer: '本工具结果仅供参考，实际预配以线路装配图与零件实物尺寸为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/cantilever/',
};
