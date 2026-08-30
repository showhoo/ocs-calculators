# OCS Calculators

**Engineering calculators for railway overhead contact systems (catenary) — open formulas, zero dependencies, embeddable in your own projects.**

🔗 Try online: <https://www.itswe.com/calculator/>
📖 Companion wiki (Chinese, 504 entries): <https://www.itswe.com>

[简体中文](./README.md) | English

![npm version](https://img.shields.io/npm/v/ocs-calculators)
![CI](https://github.com/showhoo/ocs-calculators/actions/workflows/ci.yml/badge.svg)
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

## Usage

```ts
import { tensionCurve } from 'ocs-calculators';

// Tension-temperature installation curve.
// CTHM-120 contact wire, equivalent span 55 m, reference 20 kN @ -20 °C.
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

This matches <https://www.itswe.com/calculator/tension/> exactly.

## Modules

| Status | Calculator | Module |
|---|---|---|
| ✅ Available | Tension-temperature installation curve | `tension` |
| 📋 Planned | Pantograph-catenary contact force | `force` |
| 📋 Planned | Ampacity and thermal stability | `ampacity` |
| ✅ Available | Dropper length | `dropper` |
| 📋 Planned | Wind deflection | `wind` |
| 📋 Planned | Contact wire wear | `wear` |
| 📋 Planned | Copper weight | `copper` |
| 📋 Planned | Compensation stroke | `stroke` |
| 📋 Planned | Wave propagation speed | `wavespeed` |
| 📋 Planned | Voltage drop | `voltage-drop` |
| 📋 Planned | Curve stagger | `curve-stagger` |
| 📋 Planned | Ice load | `icing` |

## Unit conventions

| Suffix | Unit | Example |
|---|---|---|
| `...KN` | kN | `baseTensionKN`, `tensionKN` |
| `...N` | N | `residualN` |
| `...NPerM` | N/m | `weightPerLengthNPerM` |
| `...M` | m | `spanM`, `sagM` |
| `...MM` / `...MM2` | mm / mm² | `wireDiameterMM`, `crossSectionMM2` |
| `...GPa` | GPa | `elasticModulusGPa` |
| `...PerDegC` | 1/°C | `expansionPerDegC` |
| `...DegC` | °C | `baseTempDegC` |

## Per-module metadata

```ts
import { tensionMeta } from 'ocs-calculators';

tensionMeta.formula;     // state equation, sag, equivalent span, ice load
tensionMeta.references;  // related standards, and whether they define the formula
tensionMeta.scope;       // validity range: span 20-90 m, E 50-200 GPa …
tensionMeta.disclaimer;
```

## ⚠️ Disclaimer

**Results are indicative only and are not a substitute for engineering design,
construction or acceptance documentation.**

Always verify against the applicable design documents, the current edition of
the relevant standards, and the manufacturer's product specifications. Wire
parameters in `wire-specs.ts` are nominal reference values.

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

## License

Code: [MIT](./LICENSE). Companion wiki content: CC BY-SA 4.0.

---

Maintained by [思维接触网百科](https://www.itswe.com).
