# 思维接触网百科 · 计算工具集

**铁路接触网（OCS）工程计算工具 —— 公式公开、零依赖、可直接在你的项目里引用。**

🔗 在线使用：<https://www.itswe.com/Category:tools>
📖 配套百科：<https://www.itswe.com>（504 条接触网专业词条）

[English](./README_EN.md) | 简体中文

![npm version](https://img.shields.io/npm/v/ocs-calculators)
[![CI](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml/badge.svg)](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml)
![license](https://img.shields.io/npm/l/ocs-calculators)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

![首屏截图](docs/screenshot.png)

---

## 为什么用它

- **公式公开可查** — 每个模块的 `meta.ts` 里写明公式、参考依据与适用范围，不是黑盒
- **有单元测试** — 计算结果的期望值直接取自站点已发布的输出表，可复现、可校验
- **零运行时依赖** — 全部是纯函数，浏览器和 Node 通用，不会给你的项目塞进一堆传递依赖
- **单位写在变量名里** — `tensionKN`、`spanM`、`crossSectionMM2`，杜绝工程计算里最常见的单位错误

## 安装

```bash
npm install ocs-calculators
```

## 快速开始

```ts
import { tensionCurve } from 'ocs-calculators';

// 张力-温度安装曲线：CTHM-120，当量跨距 55 m，基准 20 kN @ -20 ℃
const curve = tensionCurve(
  {
    baseTensionKN: 20,
    baseTempDegC: -20,
    weightPerLengthNPerM: 10.61442,
    spanM: 55,
    elasticModulusGPa: 120,
    crossSectionMM2: 120,
    expansionPerDegC: 1.7e-5,
  },
  [-20, -10, 0, 10, 20, 30, 40],
);

for (const p of curve) {
  console.log(`${p.targetTempDegC}℃  T=${p.tensionKN.toFixed(2)} kN  f=${p.sagM.toFixed(3)} m`);
}
// -20℃  T=20.00 kN  f=0.201 m
// -10℃  T=17.69 kN  f=0.227 m
//   0℃  T=15.45 kN  f=0.260 m
//  10℃  T=13.30 kN  f=0.302 m
//  20℃  T=11.30 kN  f=0.355 m
//  30℃  T= 9.51 kN  f=0.422 m
//  40℃  T= 8.00 kN  f=0.502 m
```

上面这段输出与 <https://www.itswe.com/calculator/tension/> 在线计算器完全一致，测试用例里做了逐行回归。

也支持按模块子路径导入（利于打包工具做 tree-shaking）：

```ts
import { windClearanceCheck } from 'ocs-calculators/wind';
import { wearRatio } from 'ocs-calculators/wear';
```

## 12 个计算器（全部实现）

对应 <https://www.itswe.com/Category:tools> 的 12 个在线计算器，全部已实现并逐项回归。

| 状态 | 计算器 | 模块 | 在线地址 |
|---|---|---|---|
| ✅ 已实现 | 张力-温度安装曲线 | `tension` | [/calculator/tension/](https://www.itswe.com/calculator/tension/) |
| ✅ 已实现 | 弓网接触力评价 | `force` | [/calculator/force/](https://www.itswe.com/calculator/force/) |
| ✅ 已实现 | 载流量与热稳定 | `ampacity` | [/calculator/ampacity/](https://www.itswe.com/calculator/ampacity/) |
| ✅ 已实现 | 吊弦长度计算 | `dropper` | [/calculator/dropper/](https://www.itswe.com/calculator/dropper/) |
| ✅ 已实现 | 风偏限界校验 | `wind` | [/calculator/wind/](https://www.itswe.com/calculator/wind/) |
| ✅ 已实现 | 接触线磨耗率 | `wear` | [/calculator/wear/](https://www.itswe.com/calculator/wear/) |
| ✅ 已实现 | 接触线参数速查 | `copper` | [/calculator/copper/](https://www.itswe.com/calculator/copper/) |
| ✅ 已实现 | 补偿行程 | `stroke` | [/calculator/stroke/](https://www.itswe.com/calculator/stroke/) |
| ✅ 已实现 | 波速利用率 | `wavespeed` | [/calculator/wavespeed/](https://www.itswe.com/calculator/wavespeed/) |
| ✅ 已实现 | 电压降校核 | `voltage-drop` | [/calculator/voltage-drop/](https://www.itswe.com/calculator/voltage-drop/) |
| ✅ 已实现 | 曲线拉出值校核 | `curve-stagger` | [/calculator/curve-stagger/](https://www.itswe.com/calculator/curve-stagger/) |
| ✅ 已实现 | 覆冰荷载校核 | `icing` | [/calculator/icing/](https://www.itswe.com/calculator/icing/) |

所有公式与默认参数均取自站点 `/calculator/assets/calc-core.js` 源码，
单元测试的期望值由源码公式独立算出，未从渲染结果反推。

## 单位约定

| 量的后缀 | 单位 | 例 |
|---|---|---|
| `...KN` | kN | `baseTensionKN`, `tensionKN` |
| `...N` | N | `residualN`, `tensionN` |
| `...NPerM` | N/m | `weightPerLengthNPerM` |
| `...M` | m | `spanM`, `sagM` |
| `...MM` / `...MM2` | mm / mm² | `wireDiameterMM`, `crossSectionMM2` |
| `...GPa` | GPa | `elasticModulusGPa` |
| `...PerDegC` | 1/℃ | `expansionPerDegC` |
| `...DegC` | ℃ | `baseTempDegC` |
| `...KgPerM` / `...KgPerM3` | kg/m / kg/m³ | `linearMassKgPerM` |

## 每个模块都带 meta

```ts
import { tensionMeta } from 'ocs-calculators';

console.log(tensionMeta.formula);     // 状态方程、弛度、当量跨距、覆冰公式
console.log(tensionMeta.references);  // 依据标准号，以及"该标准是否真的包含此公式"
console.log(tensionMeta.scope);       // 适用范围：跨距 20~90 m、E 50~200 GPa …
console.log(tensionMeta.disclaimer);  // 免责声明
```

## 与站点实现的同步政策

本仓库是 [itswe.com](https://www.itswe.com) 在线计算器的公式算法层，同步基准为站点资产
[`calculator/assets/calc-core.js`](https://www.itswe.com/calculator/assets/calc-core.js)：

- `src/` 中每个模块的公式与默认参数，以 `calc-core.js` 对应实现为准；
- 站点侧公式变更时，本仓库同步更新并补充/修订对应测试；
- 本仓库的公式变更同样会回流站点，两边的计算结果保持一致；
- `meta.ts` 中的参考依据（标准号 + 年份）随两侧更新同步修订。

当前同步状态：`calc-core.js` 与 `src/` 一致（2026-09-05 校验，152 项测试全绿）。

## ⚠️ 免责声明

**本库所有计算结果仅供参考，不构成工程设计、施工或验收依据。**

- 实际工程应用必须以正式设计文件、现行有效版本的标准规范、产品技术条件为准
- `wire-specs.ts` 里的线材参数均为标称参考值
- 公式形式以设计文件及接触网设计教材/手册为准

详见 [DISCLAIMER.md](./DISCLAIMER.md)。

## 自重口径（已确认）

线密度取标准「参考单位质量」表值，而非由截面推算。标准表分两列，
`CT 120｜标称截面 120｜计算截面 121｜参考单位质量 1082 kg/km`，
注「参考单位质量按密度 8.94 g/cm³ 计算」——这个 8.94 g/cm³ 是配**计算截面**
（把尺寸公差计入后的截面）用的，不是配标称截面：
`121 × 8.94 × 1e-3 = 1.08174 ≈ 1.082 kg/m`。

因此 CTHM-120 自重 `g = 1.082 × 9.81 = 10.61442 N/m`，
与站点 `/calculator/tension/` 的预设 `rho=1.082`、表单默认值 `10.61`、
以及本库 `TB2809_WIRE_PARAMS` 的 `1082` 三处同源。

依据：TB/T 2810-2017（纯铜）、TB/T 2821-2017（铜银）规格尺寸表。

早期版本按标称截面 120 推算得 `1.0728 kg/m`（g ≈ 10.524 N/m），比标准值低约 0.86%，
另有一版用回归表反算出魔数 `10.6222`，偏高约 0.07%，两者均已废弃。

顺带说明为什么仅靠回归表约不动 g：g 在状态方程里以 `g²l²EA/24` 项出现，
量级只有 0.006 kN，而 `αEA·Δt` 项有 15 kN。g 偏差 1% 只让张力变化约 0.001%，
弛度则随 g 线性变化。所以张力逐位一致对 g 的约束极弱，必须回到标准表确认口径。

## 新增一个计算器

以 `src/tension/` 为模板：

```
src/<模块名>/
├── index.ts        # 纯函数实现，单位写在变量名里
├── meta.ts         # 公式 / 依据 / 适用范围 / 免责
└── <模块名>.test.ts # 期望值取自站点在线计算器的输出
```

三条约定：

1. 只导出纯函数，不引第三方运行时依赖
2. `meta.ts` 必须写全 `formula` / `references` / `scope` / `disclaimer`
3. 测试的期望值取自站点在线计算器，容差 1%（站点输出经过显示取整）

完整约定与同步政策见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 相关项目

- ocs-wiki-content — 504 条词条快照与结构化数据（规划中，仓库未建，建仓后再挂链接）
- [itswe](https://github.com/showhoo/itswe) — 站点介绍与建站文档

## 赞助

本项目的开发与维护感谢以下赞助者的支持：

**[河南创为铁路器材有限公司](https://www.chuangwit.com)**

## 授权

- **代码**：[MIT](./LICENSE)
- **配套百科内容**：CC BY-SA 4.0（见 [itswe](https://github.com/showhoo/itswe) 仓库 LICENSE 与 [itswe.com](https://www.itswe.com)）

---

由 [思维接触网百科](https://www.itswe.com) 维护。发现公式或参数问题请提 issue —— 这对本库的改进最有价值。
