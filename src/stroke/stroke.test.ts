import { describe, expect, it } from 'vitest';
import {
  CONVENTIONAL_MARGIN_MM,
  elongationMM,
  MIN_MARGIN_MM,
  requiredStrokeMM,
  strokeCheck,
  type StrokeInput,
} from './index';

/**
 * 站点 https://www.itswe.com/calculator/stroke/ 已发布的输出（2026-09-19 半锚段口径）：
 *   每℃伸缩量 12.75 mm/℃，总伸缩量 ΔL = 1020 mm，所需行程 S = 3260 mm，校核未判定
 *
 * 口径更正（修复批 D）：双边补偿时每侧补偿装置仅服务半锚段（中心锚结至补偿器），
 * 页面长度输入按半锚段取值，默认 750 m（旧默认 1500 m 为全锚段口径，已废弃）。
 *
 * 参数反推（脚本 /tmp/dcalc/alpha.mjs，非手算）：
 *   L = 750 m（半锚段：中心锚结至补偿器）
 *   每℃ α·L = 1.7e-5 × 750 × 1000 = 12.75 mm/℃
 *   Δt = 80 ℃（最高 40℃/最低 −40℃ 的标准温差）→ ΔL = 12.75 × 80 = 1020 mm
 *   S = 3 × 1020 + 200 = 3260 mm（n = 3 棘轮 1:3 主流、S₀ = 200 mm 规程下限）
 */
const SITE_INPUT: StrokeInput = {
  anchorLengthM: 750,
  tempRangeDegC: 80,
  expansionPerDegC: 1.7e-5,
  transmissionRatio: 3,
  marginMM: 200,
  allowableStrokeMM: null,
};

describe('stroke - 与站点已发布输出回归（半锚段口径）', () => {
  it('每℃伸缩量 12.75 mm/℃', () => {
    const r = strokeCheck(SITE_INPUT);
    expect(r.perDegreeMM).toBeCloseTo(12.75, 9);
  });

  it('总伸缩量 ΔL = 1020 mm', () => {
    const r = strokeCheck(SITE_INPUT);
    expect(r.elongationMM).toBeCloseTo(1020, 9);
  });

  it('所需行程 S = 3260 mm，未填许用行程时校核未判定', () => {
    const r = strokeCheck(SITE_INPUT);
    // 3 × 1020 + 200 = 3260
    expect(r.requiredStrokeMM).toBeCloseTo(3260, 9);
    expect(r.verdict).toBe('not-assessed');
  });
});

describe('stroke - 公式性质', () => {
  it('ΔL = α·L·Δt，手算校验', () => {
    // 1.7e-5 × 1500 × 80 × 1000 = 2040
    expect(elongationMM(1.7e-5, 1500, 80)).toBeCloseTo(2040, 9);
  });

  it('伸缩量与长度、温差均成线性关系', () => {
    const base = elongationMM(1.7e-5, 1500, 80);
    expect(elongationMM(1.7e-5, 750, 80)).toBeCloseTo(base / 2, 9);
    expect(elongationMM(1.7e-5, 1500, 40)).toBeCloseTo(base / 2, 9);
  });

  it('传动比放大伸缩量', () => {
    const dL = 2040;
    expect(requiredStrokeMM(dL, 2, 200)).toBeCloseTo(4280, 9);
    expect(requiredStrokeMM(dL, 3, 200)).toBeCloseTo(6320, 9);
    expect(requiredStrokeMM(dL, 4, 200)).toBeCloseTo(8360, 9);
  });

  it('裕度为 0 时所需行程恰为 n·ΔL', () => {
    expect(requiredStrokeMM(2040, 3, 0)).toBeCloseTo(6120, 9);
  });

  it('规程下限与设计惯例值', () => {
    expect(MIN_MARGIN_MM).toBe(200);
    expect(CONVENTIONAL_MARGIN_MM).toBe(300);
  });
});

describe('stroke - 行程校核', () => {
  it('许用行程足够判合格', () => {
    const r = strokeCheck({ ...SITE_INPUT, allowableStrokeMM: 3300 });
    expect(r.verdict).toBe('pass');
    // 3300 − 3260 = 40
    expect(r.marginMM).toBeCloseTo(40, 9);
  });

  it('恰好等于所需行程判合格（判据为 ≤）', () => {
    const required = strokeCheck(SITE_INPUT).requiredStrokeMM;
    const r = strokeCheck({ ...SITE_INPUT, allowableStrokeMM: required });
    expect(r.verdict).toBe('pass');
    expect(r.marginMM).toBeCloseTo(0, 9);
  });

  it('许用行程不足判不合格', () => {
    const r = strokeCheck({ ...SITE_INPUT, allowableStrokeMM: 3200 });
    expect(r.verdict).toBe('fail');
    // 3200 − 3260 = −60
    expect(r.marginMM).toBeCloseTo(-60, 9);
  });

  it('承力索侧按其自身 α/L 单独计算（半补偿仅接触线侧）', () => {
    // 承力索常用 1:2 滑轮组且 L 更短，这里仅验证不同参数可得不同结果
    const messenger = strokeCheck({
      anchorLengthM: 1400,
      tempRangeDegC: 80,
      expansionPerDegC: 1.7e-5,
      transmissionRatio: 2,
      marginMM: 300,
      allowableStrokeMM: null,
    });
    expect(messenger.requiredStrokeMM).toBeCloseTo(2 * 1.7e-5 * 1400 * 80 * 1000 + 300, 9);
  });
});

describe('stroke - 输入校验', () => {
  it('非法传动比抛错', () => {
    expect(() =>
      strokeCheck({ ...SITE_INPUT, transmissionRatio: 5 as never }),
    ).toThrow(RangeError);
  });

  it('非法参数抛 RangeError', () => {
    expect(() => strokeCheck({ ...SITE_INPUT, anchorLengthM: 0 })).toThrow(RangeError);
    expect(() => strokeCheck({ ...SITE_INPUT, tempRangeDegC: 0 })).toThrow(RangeError);
    expect(() => strokeCheck({ ...SITE_INPUT, expansionPerDegC: 0 })).toThrow(RangeError);
    expect(() => strokeCheck({ ...SITE_INPUT, marginMM: -1 })).toThrow(RangeError);
    expect(() => strokeCheck({ ...SITE_INPUT, allowableStrokeMM: 0 })).toThrow(RangeError);
    expect(() => elongationMM(1.7e-5, 1500, 0)).toThrow(RangeError);
  });
});
