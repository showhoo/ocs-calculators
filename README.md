# 思维接触网百科 · 计算工具集

**铁路接触网（OCS）工程计算工具 —— 公式公开、零依赖、可直接在你的项目里引用。**

🔗 在线使用：<https://www.itswe.com/calculator/>
📖 配套百科：<https://www.itswe.com>（504 条接触网专业词条）

[English](./README_EN.md) | 简体中文

![npm version](https://img.shields.io/npm/v/ocs-calculators)
![CI](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml/badge.svg)
![license](https://img.shields.io/npm/l/ocs-calculators)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

> 📷 建议在仓库 `docs/screenshot.png` 放一张在线计算器首屏截图。
> 纯文字 README 的转化率明显低于带截图的。

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
    weightPerLengthNPerM: 10.6222,
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

## 12 个计算器

| 状态 | 计算器 | 模块 | 在线地址 |
|---|---|---|---|
| ✅ 已实现 | 张力-温度安装曲线 | `tension` | [/calculator/tension/](https://www.itswe.com/calculator/tension/) |
| 📋 规划中 | 弓网接触力评价 | `force` | [/calculator/force/](https://www.itswe.com/calculator/force/) |
| 📋 规划中 | 载流量与热稳定 | `ampacity` | [/calculator/ampacity/](https://www.itswe.com/calculator/ampacity/) |
| 📋 规划中 | 吊弦长度计算 | `dropper` | [/calculator/dropper/](https://www.itswe.com/calculator/dropper/) |
| 📋 规划中 | 风偏移计算 | `wind` | [/calculator/wind/](https://www.itswe.com/calculator/wind/) |
| 📋 规划中 | 接触线磨耗计算 | `wear` | [/calculator/wear/](https://www.itswe.com/calculator/wear/) |
| 📋 规划中 | 铜材计算 | `copper` | [/calculator/copper/](https://www.itswe.com/calculator/copper/) |
| 📋 规划中 | 补偿行程计算 | `stroke` | [/calculator/stroke/](https://www.itswe.com/calculator/stroke/) |
| 📋 规划中 | 波速利用率计算 | `wavespeed` | [/calculator/wavespeed/](https://www.itswe.com/calculator/wavespeed/) |
| 📋 规划中 | 电压降校核 | `voltage-drop` | [/calculator/voltage-drop/](https://www.itswe.com/calculator/voltage-drop/) |
| 📋 规划中 | 曲线拉出值校核 | `curve-stagger` | [/calculator/curve-stagger/](https://www.itswe.com/calculator/curve-stagger/) |
| 📋 规划中 | 覆冰荷载校核 | `icing` | [/calculator/icing/](https://www.itswe.com/calculator/icing/) |

`src/tension/` 是其余 11 个模块的参考模板，照它的结构填即可。

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

## ⚠️ 免责声明

**本库所有计算结果仅供参考，不构成工程设计、施工或验收依据。**

- 实际工程应用必须以正式设计文件、现行有效版本的标准规范、产品技术条件为准
- `wire-specs.ts` 里的线材参数均为标称参考值
- 公式形式以设计文件及接触网设计教材/手册为准

详见 [DISCLAIMER.md](./DISCLAIMER.md)。

## 开放问题

**线材自重的取值口径待确认。** 站点页面注明"参考单位质量按密度 8.94 g/cm³ 计"，据此 CTHM-120 应为 1.0728 kg/m（g ≈ 10.524 N/m）。但由站点已发布的输出表反算，实际使用的 g ≈ 10.62 N/m（≈ 1.083 kg/m），比标称值高约 0.9%，疑似计入了吊弦、线夹、接头的等效附加荷载。

本库回归测试采用反算值（10.6222 N/m）以复现站点输出。确认口径后我们会统一，欢迎在 issue 里说明。

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

## 相关项目

- [ocs-wiki-content](https://github.com/showhoo/ocs-wiki-content) — 504 条词条快照与结构化数据（规划中）
- [itswe](https://github.com/showhoo/itswe) — 站点介绍与建站文档（规划中）

## 授权

- **代码**：[MIT](./LICENSE)
- **配套百科内容**：CC BY-SA 4.0（见 ocs-wiki-content 仓库）

---

由 [思维接触网百科](https://www.itswe.com) 维护。发现公式或参数问题请提 issue —— 这对本库的改进最有价值。
