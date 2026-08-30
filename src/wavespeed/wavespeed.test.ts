import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WARN_THRESHOLD,
  kmHToMPerS,
  naturalFrequencyHz,
  wavePropagationSpeedMPerS,
  waveSpeedCheck,
  type WaveSpeedInput,
} from './index';

/**
 * 期望值由站点 `/calculator/assets/calc-core.js` 的 waveSpeed() 源码公式
 * 按页面默认输入（ρ=1.082 kg/m、T=27 kN、v=350 km/h、l=50 m）独立算出，
 * 非从渲染结果读取。
 *
 *   c     = √(27000/1.082)        = 157.96768428736542 m/s
 *   β     = (350/3.6)/c           = 0.6154563995846222
 *   f₁~f₃ = n/(2·50)·c            = 1.5796768428736543, 3.1593536857473086, 4.739030528620963
 *   v_res = f₁·50·3.6             = 284.3418317172578 km/h
 */
const SITE_INPUT: WaveSpeedInput = {
  tensionKN: 27,
  linearMassKgPerM: 1.082,
  speedKmH: 350,
  spanM: 50,
};

describe('wavespeed - 与站点源码公式回归', () => {
  it('波速 c、利用率 β 与一阶共振车速', () => {
    const r = waveSpeedCheck(SITE_INPUT);
    expect(r.waveSpeedMPerS).toBeCloseTo(157.96768428736542, 9);
    expect(r.beta).toBeCloseTo(0.6154563995846222, 12);
    expect(r.betaPercent).toBeCloseTo(61.54563995846222, 9);
    expect(r.resonanceSpeedKmH).toBeCloseTo(284.3418317172578, 9);
  });

  it('前三阶固有频率', () => {
    const r = waveSpeedCheck(SITE_INPUT);
    const [f1, f2, f3] = r.naturalFrequenciesHz;
    expect(f1).toBeCloseTo(1.5796768428736543, 12);
    expect(f2).toBeCloseTo(3.1593536857473086, 12);
    expect(f3).toBeCloseTo(4.739030528620963, 12);
  });

  it('默认阈值下不告警', () => {
    const r = waveSpeedCheck(SITE_INPUT);
    expect(DEFAULT_WARN_THRESHOLD).toBeCloseTo(0.7, 12);
    expect(r.warn).toBe(false);
  });
});

describe('wavespeed - 公式性质', () => {
  it('c = √(T/ρ)', () => {
    // 手算：√(27000/1.082)
    expect(wavePropagationSpeedMPerS(27, 1.082)).toBeCloseTo(
      Math.sqrt(27000 / 1.082),
      12,
    );
  });

  it('张力增大波速提高，线密度增大波速降低', () => {
    const base = wavePropagationSpeedMPerS(27, 1.082);
    expect(wavePropagationSpeedMPerS(54, 1.082)).toBeCloseTo(base * Math.SQRT2, 9);
    expect(wavePropagationSpeedMPerS(27, 2.164)).toBeCloseTo(base / Math.SQRT2, 9);
  });

  it('f_n 与 n 成正比', () => {
    const c = wavePropagationSpeedMPerS(27, 1.082);
    expect(naturalFrequencyHz(2, 50, c)).toBeCloseTo(naturalFrequencyHz(1, 50, c) * 2, 12);
    expect(naturalFrequencyHz(3, 50, c)).toBeCloseTo(naturalFrequencyHz(1, 50, c) * 3, 12);
  });

  it('v_res = c/2 · 3.6（与 f₁·l·3.6 等价）', () => {
    const r = waveSpeedCheck(SITE_INPUT);
    expect(r.resonanceSpeedKmH).toBeCloseTo((r.waveSpeedMPerS / 2) * 3.6, 9);
  });

  it('km/h → m/s 换算', () => {
    expect(kmHToMPerS(36)).toBeCloseTo(10, 12);
    expect(kmHToMPerS(350)).toBeCloseTo(97.22222222222222, 12);
  });

  it('速度达到共振车速时 β = 0.5', () => {
    const r1 = waveSpeedCheck(SITE_INPUT);
    const atRes = waveSpeedCheck({ ...SITE_INPUT, speedKmH: r1.resonanceSpeedKmH });
    expect(atRes.beta).toBeCloseTo(0.5, 12);
  });

  it('β 达阈值时告警，且支持自定义阈值', () => {
    const r1 = waveSpeedCheck(SITE_INPUT);
    // 把速度提高到 β ≈ 0.72
    const fast = waveSpeedCheck({ ...SITE_INPUT, speedKmH: r1.waveSpeedMPerS * 0.72 * 3.6 });
    expect(fast.beta).toBeCloseTo(0.72, 9);
    expect(fast.warn).toBe(true);

    expect(waveSpeedCheck({ ...SITE_INPUT, warnThreshold: 0.5 }).warn).toBe(true);
    expect(waveSpeedCheck({ ...SITE_INPUT, warnThreshold: 0.9 }).warn).toBe(false);
  });
});

describe('wavespeed - 输入校验', () => {
  it('非法参数抛 RangeError', () => {
    expect(() => waveSpeedCheck({ ...SITE_INPUT, tensionKN: 0 })).toThrow(RangeError);
    expect(() => waveSpeedCheck({ ...SITE_INPUT, linearMassKgPerM: -1 })).toThrow(RangeError);
    expect(() => waveSpeedCheck({ ...SITE_INPUT, speedKmH: -1 })).toThrow(RangeError);
    expect(() => waveSpeedCheck({ ...SITE_INPUT, spanM: 0 })).toThrow(RangeError);
    expect(() => naturalFrequencyHz(0, 50, 158)).toThrow(RangeError);
    expect(() => naturalFrequencyHz(1.5, 50, 158)).toThrow(RangeError);
  });
});
