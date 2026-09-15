# OCS Calculators

**Engineering calculators for railway overhead contact systems (catenary) — open formulas, zero dependencies, embeddable in your own projects.**

**20 modules · 218 unit tests · zero dependencies · pure TypeScript** (Node ≥ 18)

🔗 Try online: <https://www.itswe.com/Category:tools>
📖 Companion wiki: <https://www.itswe.com> (670+ pages of catenary engineering content, in Chinese)

[简体中文](./README.md) | English

![npm version](https://img.shields.io/npm/v/ocs-calculators)
![npm downloads](https://img.shields.io/npm/dm/ocs-calculators)
[![CI](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml/badge.svg)](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml)
![license](https://img.shields.io/npm/l/ocs-calculators)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

## Why

Railway electrification engineering has surprisingly little open tooling. Most
`catenary` / `pantograph` projects on GitHub are computer-vision research or game
mods — not the day-to-day numbers that design, construction and maintenance
engineers actually need.

This library is that missing piece:

- **Formulas are public.** Every module ships a `meta.ts` with the equations,
  the standards they relate to, and their validity range. No black boxes.
- **Tested against a live reference.** Expected values come from the published
  output of the online calculators, and are regression-tested row by row.
- **Zero runtime dependencies.** Pure functions, works in the browser and Node.
- **Units live in the variable names.** `tensionKN`, `spanM`, `crossSectionMM2` —
  unit confusion is the number one bug in engineering code.

## Install

```bash
npm install ocs-calculators
```

Requires Node ≥ 18.

> ⚠️ **Use ≥ 0.2.1.** In `0.2.0` the sub-path `exports` keys were missing the
> `./` prefix, so sub-path imports threw `ERR_PACKAGE_PATH_NOT_EXPORTED`.
> Fixed in `0.2.1`. A bare `npm install ocs-calculators` resolves to the
> latest version (0.3.0); only pins on `@0.2.0` need upgrading. Full history
> in [CHANGELOG.md](./CHANGELOG.md).

## Usage

```ts
import { tensionCurve } from 'ocs-calculators';

// Tension-temperature installation curve.
// CTHM-120 contact wire, equivalent span 55 m, reference 20 kN @ -20 °C.
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
  console.log(`${p.targetTempDegC}°C  T=${p.tensionKN.toFixed(2)} kN  f=${p.sagM.toFixed(3)} m`);
}
// -20°C  T=20.00 kN  f=0.201 m
// -10°C  T=17.69 kN  f=0.227 m
//   0°C  T=15.45 kN  f=0.260 m
//  10°C  T=13.30 kN  f=0.302 m
//  20°C  T=11.30 kN  f=0.355 m
//  30°C  T= 9.51 kN  f=0.422 m
//  40°C  T= 8.00 kN  f=0.502 m
```

This matches <https://www.itswe.com/calculator/tension/> exactly, row by row.

Sub-path imports are also supported, which helps bundlers tree-shake:

```ts
import { windClearanceCheck } from 'ocs-calculators/wind';
import { wearRatio } from 'ocs-calculators/wear';
import { steadyArmAngleDeg } from 'ocs-calculators/steady-arm';
import { crossSpanAnalyze } from 'ocs-calculators/cross-span';
import { bValue } from 'ocs-calculators/bvalue';
import { sagMM } from 'ocs-calculators/sag';
import { anchorLengthCheck } from 'ocs-calculators/anchor-length';
import { creepageCheck } from 'ocs-calculators/creepage';
import { poleCapacityCheck } from 'ocs-calculators/pole-capacity';
import { cantileverCut } from 'ocs-calculators/cantilever';
```

## Modules

All 20 calculators of <https://www.itswe.com/Category:tools> are implemented
and regression-tested.

| Calculator | Module | What it computes | Online |
|---|---|---|---|
| Tension–temperature installation curve | `tension` | Tension and sag at any temperature, via the state equation | [/calculator/tension/](https://www.itswe.com/calculator/tension/) |
| Pantograph–catenary contact force | `force` | EN 50367 statistical review F'max/F'min and reference target force | [/calculator/force/](https://www.itswe.com/calculator/force/) |
| Ampacity and thermal stability | `ampacity` | Ambient-temperature ampacity correction and short-circuit minimum cross-section | [/calculator/ampacity/](https://www.itswe.com/calculator/ampacity/) |
| Dropper length | `dropper` | Dropper lengths point by point, simple and stitched catenary | [/calculator/dropper/](https://www.itswe.com/calculator/dropper/) |
| Wind deflection clearance | `wind` | Mid-span wind deflection and clearance check | [/calculator/wind/](https://www.itswe.com/calculator/wind/) |
| Contact wire wear | `wear` | Wear ratio from residual section or diameter, replacement criterion | [/calculator/wear/](https://www.itswe.com/calculator/wear/) |
| Contact wire parameter lookup | `copper` | Unit weight / resistance / ampacity for 6 wire types | [/calculator/copper/](https://www.itswe.com/calculator/copper/) |
| Compensation stroke | `stroke` | Thermal expansion and compensation stroke (1:2–1:4 gearing) | [/calculator/stroke/](https://www.itswe.com/calculator/stroke/) |
| Wave propagation speed | `wavespeed` | Wave speed, utilization ratio β and resonant speed | [/calculator/wavespeed/](https://www.itswe.com/calculator/wavespeed/) |
| Voltage drop | `voltage-drop` | Feeder voltage drop and end-of-line voltage | [/calculator/voltage-drop/](https://www.itswe.com/calculator/voltage-drop/) |
| Curve stagger | `curve-stagger` | Stagger at curves combined with wind deflection | [/calculator/curve-stagger/](https://www.itswe.com/calculator/curve-stagger/) |
| Ice load | `icing` | Ice-load cylinder model and sag increase | [/calculator/icing/](https://www.itswe.com/calculator/icing/) |
| Quick sag estimate | `sag` | Sag from tension / span / weight, or max span from sag | [/calculator/sag/](https://www.itswe.com/calculator/sag/) |
| B-value (counterweight height) curve | `bvalue` | Counterweight height vs. temperature and b_min check | [/calculator/bvalue/](https://www.itswe.com/calculator/bvalue/) |
| Insulator creepage distance | `creepage` | Required creepage distance from pollution-zone specific creepage | [/calculator/creepage/](https://www.itswe.com/calculator/creepage/) |
| Anchor section tension difference | `anchor-length` | Tension difference on curved/straight spans, anchor section length criterion | [/calculator/anchor-length/](https://www.itswe.com/calculator/anchor-length/) |
| Steady-arm slope | `steady-arm` | Steady-arm slope from combined components vs. limits | [/calculator/steady-arm/](https://www.itswe.com/calculator/steady-arm/) |
| Cross-span (headspan) load | `cross-span` | Cross-span load components and counter-catenary tension | [/calculator/cross-span/](https://www.itswe.com/calculator/cross-span/) |
| Pole (mast) capacity | `pole-capacity` | Design bending moment and capacity selection | [/calculator/pole-capacity/](https://www.itswe.com/calculator/pole-capacity/) |
| Cantilever pre-assembly | `cantilever` | Cut lengths of cantilever members and assembly allowance | [/calculator/cantilever/](https://www.itswe.com/calculator/cantilever/) |

Provenance: the formulas and default parameters of the original 12 modules
come from the site asset `calculator/assets/calc-core.js`. The 8 newer modules
(`sag` / `bvalue` / `creepage` / `anchor-length` / `steady-arm` / `cross-span`
/ `pole-capacity` / `cantilever`) are **inline-engine calculators** on the
site (the engine is embedded in each page's HTML, not in calc-core); this
repository distills them from the published page formulas, and the test
expectations are computed independently from the formulas — not reverse-
engineered from server-rendered output.

## Unit conventions

| Suffix | Unit | Example |
|---|---|---|
| `...KN` | kN | `baseTensionKN`, `tensionKN` |
| `...N` | N | `residualN`, `tensionN` |
| `...NPerM` | N/m | `weightPerLengthNPerM` |
| `...M` | m | `spanM`, `sagM` |
| `...MM` / `...MM2` | mm / mm² | `wireDiameterMM`, `crossSectionMM2` |
| `...GPa` | GPa | `elasticModulusGPa` |
| `...PerDegC` | 1/°C | `expansionPerDegC` |
| `...DegC` | °C | `baseTempDegC` |
| `...KgPerM` / `...KgPerM3` | kg/m / kg/m³ | `linearMassKgPerM` |

## Per-module metadata

```ts
import { tensionMeta } from 'ocs-calculators';

tensionMeta.formula;     // state equation, sag, equivalent span, ice load
tensionMeta.references;  // related standards, and whether they define the formula
tensionMeta.scope;       // validity range: span 20-90 m, E 50-200 GPa …
tensionMeta.disclaimer;
```

## Synchronization policy

This repository is the formula/algorithm layer of the online calculators at
[itswe.com](https://www.itswe.com). The sync baseline is the site's assets:

- The original 12 modules follow
  [`calculator/assets/calc-core.js`](https://www.itswe.com/calculator/assets/calc-core.js);
- The 8 newer modules are the site's **inline-engine calculators** and follow
  their published page formulas;
- When the site's formulas change, this repository is updated accordingly and
  the corresponding tests are added or revised;
- Formula changes made here flow back to the site — both sides always produce
  the same numbers;
- `meta.ts` references (standard numbers + years) are revised on both sides
  together;
- Input-domain guards in the library mirror the pages' valid input ranges
  (`data-min` / `data-max`): out-of-range input throws a `RangeError` (the
  online pages are additionally constrained by their form controls).

Current sync status: all 20 modules verified against the site
(2026-09-15, 218 tests green).

## Wire self-weight convention (confirmed)

Linear density is taken from the standards' "reference unit mass" table, not
derived from the nominal cross-section. For CTHM-120 the standard lists
`nominal 120 mm² | calculated 121 mm² | reference unit mass 1082 kg/km`, with
a note that the mass is computed at 8.94 g/cm³ — a density that pairs with the
**calculated** section (which includes dimensional tolerances), not the
nominal one: `121 × 8.94 × 1e-3 ≈ 1.082 kg/m`. Hence the self-weight
`g = 1.082 × 9.81 = 10.61442 N/m`, consistent across the site preset
(`rho = 1.082`), the form default (`10.61`) and this library
(`TB2809_WIRE_PARAMS`, `1082`).

Basis: TB/T 2810-2017 (copper) and TB/T 2821-2017 (copper-silver) dimension
tables. See the [Chinese README](./README.md) for the full investigation
record.

## ⚠️ Disclaimer

**Results are indicative only and are not a substitute for engineering design,
construction or acceptance documentation.**

- Always verify against the applicable design documents, the current edition
  of the relevant standards, and product specifications
- Wire parameters in `wire-specs.ts` are nominal reference values
- Formula forms follow design documents and catenary design textbooks/handbooks

See [DISCLAIMER.md](./DISCLAIMER.md).

## Contributing

Bug reports on formulas and parameters are the most valuable contribution —
please open an issue. To add a module, copy the structure of `src/tension/`:

```
src/<module>/
├── index.ts          # pure functions, units in variable names
├── meta.ts           # formula / references / scope / disclaimer
└── <module>.test.ts  # expected values taken from the online calculator
```

Three conventions:

1. Export pure functions only; no third-party runtime dependencies
2. `meta.ts` must fill in `formula` / `references` / `scope` / `disclaimer`
3. Test expectations come from the online calculator, with 1% tolerance
   (site output is display-rounded)

Full conventions and the sync policy: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Related projects

- ocs-wiki-content — entry snapshots and structured data (planned; link will
  be added once the repository exists)
- [itswe](https://github.com/showhoo/itswe) — site introduction and build notes

## Sponsors

Development and maintenance of this project is supported by:

**[Henan Chuangwit Railway Equipment Co., Ltd.](https://www.chuangwit.com)** (河南创为铁路器材有限公司)

## License

Code: [MIT](./LICENSE). Companion wiki content: CC BY-SA 4.0 (see the
[itswe](https://github.com/showhoo/itswe) repository LICENSE and
[itswe.com](https://www.itswe.com)).

---

Maintained by [思维接触网百科](https://www.itswe.com). Found a formula or
parameter bug? Please open an issue — that's the most valuable contribution
to this library.
