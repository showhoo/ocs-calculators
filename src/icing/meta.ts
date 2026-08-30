import type { CalculatorMeta } from '../types';

export const icingMeta: CalculatorMeta = {
  name: '覆冰荷载校核',
  nameEn: 'Ice Load Check',
  summary:
    '按冰筒模型计算覆冰荷载，给出覆冰后的总垂直荷载、弛度及相对无冰工况的增幅。',
  formula: [
    '冰筒模型冰重：g_ice = ρ_ice · g₀ · π · b · (d + b)',
    '覆冰后总垂直荷载：g_total = g_self + g_ice',
    '无冰弛度：f₀ = g_self·l² / (8T)',
    '覆冰弛度：f_ice = g_total·l² / (8T)',
    '弛度增幅：(f_ice / f₀ − 1) × 100%',
  ],
  references: [
    '依据本站 覆冰荷载 / 荷载计算 条目',
    '冰密度默认 900 kg/m³，轻覆冰地区可取更小值，以当地气象资料为准',
    '均匀冰筒假设，未考虑不规则覆冰形态',
  ],
  scope: [
    '线索直径 d：1 ~ 40 mm',
    '覆冰厚度 b：0 ~ 50 mm（0 表示无冰）',
    '张力 T：1 ~ 40 kN',
    '跨距 l：10 ~ 90 m',
    '线索自重 g_self：1 ~ 60 N/m',
    '冰密度 ρ_ice：500 ~ 950 kg/m³',
    '均匀冰筒模型，未考虑不均匀覆冰、脱冰跳跃与风冰组合',
    '弛度按抛物线近似，未考虑覆冰后张力变化（未与状态方程耦合）',
  ],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/icing/',
};
