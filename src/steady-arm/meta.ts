import type { CalculatorMeta } from '../types';

export const steadyArmMeta: CalculatorMeta = {
  name: '定位器坡度校核',
  nameEn: 'Steady Arm Slope Check',
  summary:
    '计算定位器所受水平力（直线之字力 / 曲线力）与垂直力，求坡度角与坡度比，并按直线/曲线限值判定是否满足坡度要求。',
  formula: [
    '直线之字力：Fz = 4·T·a/l（a 为拉出值，mm 换算 m）',
    '曲线力：Fq = T·l/R',
    '曲线合成：Fs = |Fq − Fz|；直线区段 Fs = Fz',
    '垂直力：Fc = g_j·l₁ + G_d',
    '坡度角：θ = atan(Fc/Fs)，弧度转度',
    '坡度比（垂直∶水平）= 1∶n，n = Fs/Fc',
    '限值（直线 θ ≥ 8°；曲线 6° ≤ θ ≤ 16°）',
  ],
  references: [
    '教材通行近似：之字力 Fz = 4·T·a/l、曲线力 Fq = T·l/R',
    '罗健等《高速铁路接触网定位器坡度问题的深化研究》，铁道工程学报 2013, 30(1): 76-80（300 km/h 及以上坡度限值口径）',
    '在线参考：https://www.itswe.com/calculator/steady-arm/',
  ],
  scope: [
    '接触线张力 T：1 ~ 40 kN',
    '拉出值 a：50 ~ 500 mm',
    '跨距 l：5 ~ 80 m',
    '曲线半径 R：500 ~ 12000 m（undefined 表示直线）',
    '接触线单位重 g_j：0.001 ~ 0.1 kN/m',
    '定位器自重 G_d：0 ~ 0.5 kN',
    '限值适用于 300 km/h 及以上高铁；中低速线路坡度限值可不同',
    '未计入风荷载、定位器长度方向倾斜与零部件公差',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/steady-arm/',
};
