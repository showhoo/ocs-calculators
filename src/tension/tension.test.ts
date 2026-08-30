import { describe, expect, it } from 'vitest';
import {
  equivalentSpanM,
  sagM,
  solveTensionN,
  stateCoefficientK,
  tensionAt,
  tensionCurve,
  type TensionCurveInput,
} from './index';
import {
  deriveLinearMassKgPerM,
  findWirePreset,
  weightPerLengthNPerM,
  weightOfPresetNPerM,
} from '../data/wire-specs';
// 冰筒模型已抽到公共模块（tension 与 icing 共用），单位为 SI（米）
import { iceLoadNPerM } from '../common/ice';

/**
 * 相对误差断言。
 * 站点输出表的数值经过显示取整（张力 2 位小数 kN、弛度 3 位小数 m），
 * 因此用 1% 相对容差做回归，不做精确相等。
 */
function expectClose(actual: number, expected: number, relTol = 0.01): void {
  const rel = Math.abs(actual - expected) / Math.abs(expected);
  expect(
    rel,
    `期望 ${expected}（±${relTol * 100}%），实际 ${actual}，相对误差 ${(rel * 100).toFixed(3)}%`,
  ).toBeLessThanOrEqual(relTol);
}

/**
 * 站点 https://www.itswe.com/calculator/tension/ 已发布的输出表。
 *
 * 参数：CTHM-120（A=120 mm²），E=120 GPa，α=1.7e-5/℃，
 *       当量跨距 l_D=55 m，基准 T₁=20 kN @ t₁=-20 ℃。
 *
 * 自重口径（2026-08-31 已确定）：
 * g = 线密度 × 9.81 = 1.082 × 9.81 = 10.61442 N/m。
 * 线密度取标准「参考单位质量」1082 kg/km（TB/T 2810-2017），
 * 该值按标准的「计算截面」121 mm² × 8.94 g/cm³ 计，而非「标称截面」120 mm²。
 * 与站点页面预设 rho=1.082、表单默认值 10.61 一致。
 * 早期版本曾用输出表反算出的魔数 10.6222，偏高约 0.07%，已废弃。
 */
const PUBLISHED_TABLE = [
  { tempDegC: -20, tensionKN: 20.0, sagM: 0.201 },
  { tempDegC: -10, tensionKN: 17.69, sagM: 0.227 },
  { tempDegC: 0, tensionKN: 15.45, sagM: 0.260 },
  { tempDegC: 10, tensionKN: 13.3, sagM: 0.302 },
  { tempDegC: 20, tensionKN: 11.3, sagM: 0.355 },
  { tempDegC: 30, tensionKN: 9.51, sagM: 0.422 },
  { tempDegC: 40, tensionKN: 8.0, sagM: 0.502 },
] as const;

const BASE: TensionCurveInput = {
  baseTensionKN: 20,
  baseTempDegC: -20,
  weightPerLengthNPerM: 10.61442,
  spanM: 55,
  elasticModulusGPa: 120,
  crossSectionMM2: 120,
  expansionPerDegC: 1.7e-5,
};

describe('tension - 与站点已发布输出表回归', () => {
  it('复现 7 个温度档的张力与弛度', () => {
    const temps = PUBLISHED_TABLE.map((r) => r.tempDegC);
    const results = tensionCurve(BASE, temps);

    expect(results).toHaveLength(PUBLISHED_TABLE.length);

    results.forEach((r, i) => {
      const row = PUBLISHED_TABLE[i];
      if (!row) throw new Error(`缺少第 ${i} 行期望值`);
      expect(r.targetTempDegC).toBe(row.tempDegC);
      expectClose(r.tensionKN, row.tensionKN);
      expectClose(r.sagM, row.sagM);
    });
  });

  it('状态方程残差收敛到接近 0', () => {
    for (const row of PUBLISHED_TABLE) {
      const r = tensionAt({ ...BASE, targetTempDegC: row.tempDegC });
      expect(Math.abs(r.residualN)).toBeLessThan(1e-6);
    }
  });

  it('张力随温度升高单调下降', () => {
    const results = tensionCurve(BASE, PUBLISHED_TABLE.map((r) => r.tempDegC));
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const cur = results[i];
      if (!prev || !cur) throw new Error('结果缺失');
      expect(cur.tensionKN).toBeLessThan(prev.tensionKN);
    }
  });

  it('弛度随温度升高单调增大', () => {
    const results = tensionCurve(BASE, PUBLISHED_TABLE.map((r) => r.tempDegC));
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const cur = results[i];
      if (!prev || !cur) throw new Error('结果缺失');
      expect(cur.sagM).toBeGreaterThan(prev.sagM);
    }
  });
});

describe('tension - 纯公式校验', () => {
  it('弛度 f = gl²/(8T)', () => {
    // 手算：10.61442 × 3025 / (8 × 20000) = 0.200679
    expectClose(sagM(10.61442, 55, 20000), 0.200679, 1e-4);
  });

  it('当量跨距 l_D = √(Σlᵢ³/Σlᵢ)', () => {
    // 手算：√((50³+60³+40³)/150) = √2700 = 51.9615
    expectClose(equivalentSpanM([50, 60, 40]), 51.9615, 1e-4);
  });

  it('单跨时当量跨距等于该跨距', () => {
    expectClose(equivalentSpanM([55]), 55, 1e-12);
  });

  it('等跨距时当量跨距等于该跨距', () => {
    expectClose(equivalentSpanM([50, 50, 50]), 50, 1e-12);
  });

  it('覆冰荷载 g_ice = ρ·g₀·π·b·(d+b)', () => {
    // 手算：900 × 9.81 × π × 0.010 × (0.0129 + 0.010) = 6.3522 N/m
    expectClose(
      iceLoadNPerM({
        iceDensityKgPerM3: 900,
        iceThicknessM: 0.01,
        wireDiameterM: 0.0129,
      }),
      6.3522,
      1e-3,
    );
  });

  it('自重口径：标准参考单位质量 → 自重荷载', () => {
    // 120 mm² 标称对应计算截面 121 mm²；121 × 8.94 × 1e-3 = 1.08174 kg/m
    expectClose(deriveLinearMassKgPerM(121), 1.08174, 1e-6);
    // 预设取标准表值 1082 kg/km = 1.082 kg/m
    expectClose(weightPerLengthNPerM(1.082), 10.61442, 1e-9);

    const cthm120 = findWirePreset('cthm120');
    expect(cthm120).toBeDefined();
    if (!cthm120) throw new Error('缺少 cthm120 预设');
    expect(cthm120.crossSectionMM2).toBe(120);
    expect(cthm120.calculatedSectionMM2).toBe(121);
    expectClose(cthm120.linearMassKgPerM, 1.082, 1e-12);
    expectClose(weightOfPresetNPerM(cthm120), 10.61442, 1e-9);

    // 反例：误用标称截面 120 推算会偏低约 0.85%（1.0728 vs 1.082）
    expectClose(deriveLinearMassKgPerM(120), 1.0728, 1e-6);
  });

  it('状态方程系数 K = g²l²EA/24', () => {
    // 手算：10.61442² × 3025 × 1.2e11 × 1.2e-4 / 24 = 2.044886e11
    expectClose(stateCoefficientK(10.61442, 55, 120, 120), 2.044886e11, 1e-6);
  });
});

describe('tension - 求解器', () => {
  it('目标温度等于基准温度时返回基准张力', () => {
    const r = tensionAt({ ...BASE, targetTempDegC: BASE.baseTempDegC });
    expectClose(r.tensionKN, BASE.baseTensionKN, 1e-9);
  });

  it('解满足 T = target + K/T²', () => {
    const K = stateCoefficientK(10.61442, 55, 120, 120);
    const { tensionN } = solveTensionN(K, 19488.025);
    expectClose(tensionN, 19488.025 + K / (tensionN * tensionN), 1e-12);
  });

  it('二分法在合理迭代次数内收敛', () => {
    const r = tensionAt({ ...BASE, targetTempDegC: 40 });
    expect(r.iterations).toBeGreaterThan(0);
    expect(r.iterations).toBeLessThan(100);
  });

  it('输入非法时抛出 RangeError', () => {
    expect(() =>
      tensionAt({ ...BASE, targetTempDegC: 0, baseTensionKN: 0 }),
    ).toThrow(RangeError);
    expect(() => tensionAt({ ...BASE, targetTempDegC: 0, spanM: -1 })).toThrow(RangeError);
    expect(() => sagM(10, 55, 0)).toThrow(RangeError);
    expect(() => equivalentSpanM([])).toThrow(RangeError);
    expect(() => equivalentSpanM([50, -1])).toThrow(RangeError);
    expect(() =>
      iceLoadNPerM({ iceDensityKgPerM3: 900, iceThicknessM: 0.01, wireDiameterM: 0 }),
    ).toThrow(RangeError);
  });
});
