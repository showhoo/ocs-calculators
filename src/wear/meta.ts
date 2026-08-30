import type { CalculatorMeta } from '../types';

export const wearMeta: CalculatorMeta = {
  name: '接触线磨耗率',
  nameEn: 'Contact Wire Wear Ratio',
  summary: '根据原截面积与实测残存截面计算磨耗率 η，η > 20% 时建议更换接触线。',
  formula: [
    '磨耗率：η = (A₀ − A) / A₀ × 100%',
    '判定准则：η > 20% 建议更换接触线',
    '残径换算（近似）：A = π·d² / 4',
  ],
  references: [
    '原截面积来源 TB/T 2809-2017《电气化铁路用铜及铜合金接触线》',
    '标称截面 120/150 mm² 为名义值，标准另列计算截面 121/151 mm²，实际截面由 TB/T 2809-2017 表2 外形尺寸公差带控制',
    '磨耗更换阈值请以最新版运维规程为准',
  ],
  scope: [
    '残径换算按圆截面近似，接触线实际为梯形截面，换算值存在系统性偏差',
    '未考虑磨耗沿跨距方向的不均匀分布',
    '实际产品截面以出厂检验单为准',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/wear/',
};
