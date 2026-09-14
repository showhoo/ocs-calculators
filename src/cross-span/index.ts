export { crossSpanMeta } from './meta';

/** 软横跨负载计算（负载计算法）的输入参数 */
export interface CrossSpanNodeInput {
  /** 股道悬挂节点数 N */
  readonly nodeCount: number;
  /** 股道间距 a，m（节点近似均匀分布，起点距支柱 a） */
  readonly spacingM: number;
  /** 横承索跨距 L，m */
  readonly spanTotalM: number;
  /** 最低点距左支柱距离 l₁，m */
  readonly lowPointFromLeftM: number;
  /** 最大弛度 f_max，m（最低点弛度） */
  readonly maxSagM: number;
  /** 节点负载 J，kg（大站 65 / 小站 45） */
  readonly nodeLoadKg: number;
  /** 接触悬挂单位重 q₀，kg/m */
  readonly suspensionWeightKgPerM: number;
  /** 每节点悬挂组数 n */
  readonly suspensionGroups: number;
  /** 横承索 + 定位索单位重 g_c，kg/m */
  readonly cableWeightKgPerM: number;
  /** 绝缘子串分摊负载 P，kg */
  readonly insulatorDistributedKg: number;
}

/** 软横跨负载计算结果 */
export interface CrossSpanResult {
  /** 各节点距左支柱距离 x_i，m */
  readonly nodeX: readonly number[];
  /** 各节点垂直负载 Q_i，kg */
  readonly nodeQ: readonly number[];
  /** 各节点弛度 f_i，m */
  readonly nodeSag: readonly number[];
  /** 相邻节点间分段索长 b_i，m（共 N−1 段） */
  readonly segmentLength: readonly number[];
  /** 左端支柱锚固段索长，m */
  readonly endLeftM: number;
  /** 右端支柱锚固段索长，m */
  readonly endRightM: number;
  /** 总索长 Σb，m */
  readonly totalLengthM: number;
  /** 水平张力（力矩平衡精确式）H = M(l₁)/f_max，kg */
  readonly horizontalForceKg: number;
  /** 水平张力（简化式对照）H' = ΣQ_i·l₁/(2·f_max)，kg */
  readonly horizontalForceSimpleKg: number;
  /** 总垂直负载 ΣQ，kg */
  readonly totalLoadKg: number;
}

/**
 * 软横跨负载计算（负载计算法，教材口径）。
 *
 * 节点垂直负载（均匀间距简化）：
 *   Q_i = J + n·q₀·a + P + g_c·a
 *
 * 节点弛度（抛物线分布，最低点在 l₁）：
 *   f_i = f_max·(1 − ((x_i−l₁)/c_i)²)，c_i = l₁（x_i≤l₁）或 L−l₁（x_i>l₁）
 *
 * 水平张力：精确式 H = M(l₁)/f_max，其中 M(l₁) 为悬挂负载对最低点截面的
 * 简支梁弯矩；简化式对照 H' = ΣQ_i·l₁/(2·f_max)。
 *
 * 分段索长：b_i ≈ a + (f_{i+1}−f_i)²/(2a)；两端支柱锚固段
 * b_end = x₁ + f₁²/(2·x₁)（支柱端弛度为 0）。
 */
export function crossSpanAnalyze(input: CrossSpanNodeInput): CrossSpanResult {
  const {
    nodeCount,
    spacingM: a,
    spanTotalM: L,
    lowPointFromLeftM: l1,
    maxSagM: fMax,
    nodeLoadKg: J,
    suspensionWeightKgPerM: q0,
    suspensionGroups: n,
    cableWeightKgPerM: gc,
    insulatorDistributedKg: P,
  } = input;

  if (!Number.isInteger(nodeCount) || !(nodeCount >= 2)) {
    throw new RangeError(`节点数须为不小于 2 的整数，收到 ${nodeCount}`);
  }
  if (!(a > 0)) {
    throw new RangeError(`股道间距必须为正数，收到 ${a} m`);
  }
  if (!(L > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${L} m`);
  }
  if (!(l1 > 0 && l1 < L)) {
    throw new RangeError(`最低点距左支柱距离须在 (0, L) 内，收到 ${l1} m`);
  }
  if (!(fMax > 0)) {
    throw new RangeError(`最大弛度必须为正数，收到 ${fMax} m`);
  }
  if (!(J >= 0)) {
    throw new RangeError(`节点负载不能为负，收到 ${J} kg`);
  }
  if (!(q0 >= 0)) {
    throw new RangeError(`接触悬挂单位重不能为负，收到 ${q0} kg/m`);
  }
  if (!(n > 0)) {
    throw new RangeError(`每节点悬挂组数须为正数，收到 ${n}`);
  }
  if (!(gc >= 0)) {
    throw new RangeError(`横承索单位重不能为负，收到 ${gc} kg/m`);
  }
  if (!(P >= 0)) {
    throw new RangeError(`绝缘子串分摊负载不能为负，收到 ${P} kg`);
  }

  // 节点均匀分布：第 i 个节点距左支柱 x = a·(i+1)，须全部落在跨内
  const lastX = a * nodeCount;
  if (!(lastX < L)) {
    throw new RangeError(
      `末节点位置 ${lastX} m 超出跨距 ${L} m，请减小节点数或股道间距`,
    );
  }

  const Q = J + n * q0 * a + P + gc * a;

  const nodeX: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodeX.push(a * (i + 1));
  }

  const nodeQ: number[] = nodeX.map(() => Q);
  const nodeSag: number[] = nodeX.map((x) => {
    const c = x <= l1 ? l1 : L - l1;
    return fMax * (1 - ((x - l1) / c) * ((x - l1) / c));
  });

  // 相邻节点间分段索长 b_i = a + (f_{i+1}−f_i)²/(2a)
  const segmentLength: number[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    const fi = nodeSag[i];
    const fj = nodeSag[i + 1];
    if (fi === undefined || fj === undefined) {
      throw new Error(`缺少节点 ${i} 或 ${i + 1} 的弛度`);
    }
    const d = fj - fi;
    segmentLength.push(a + (d * d) / (2 * a));
  }

  // 两端支柱锚固段（支柱端弛度为 0）
  const x0 = nodeX[0];
  const f0 = nodeSag[0];
  if (x0 === undefined || f0 === undefined) {
    throw new Error('缺少首节点位置或弛度');
  }
  const endLeftM = x0 + (f0 * f0) / (2 * x0);

  const xLast = nodeX[nodeX.length - 1];
  const fLast = nodeSag[nodeSag.length - 1];
  if (xLast === undefined || fLast === undefined) {
    throw new Error('缺少末节点位置或弛度');
  }
  const gapRight = L - xLast;
  const endRightM = gapRight + (fLast * fLast) / (2 * gapRight);

  let segmentSum = 0;
  for (const b of segmentLength) segmentSum += b;
  const totalLengthM = endLeftM + segmentSum + endRightM;

  // 水平张力（力矩平衡精确式）：以左右支柱为简支梁，求最低点截面弯矩
  let rLeft = 0;
  for (let i = 0; i < nodeCount; i++) {
    const x = nodeX[i];
    const q = nodeQ[i];
    if (x === undefined || q === undefined) {
      throw new Error(`缺少节点 ${i} 的位置或负载`);
    }
    rLeft += (q * (L - x)) / L;
  }
  let moment = rLeft * l1;
  for (let i = 0; i < nodeCount; i++) {
    const x = nodeX[i];
    const q = nodeQ[i];
    if (x === undefined || q === undefined) {
      throw new Error(`缺少节点 ${i} 的位置或负载`);
    }
    if (x < l1) {
      moment -= q * (l1 - x);
    }
  }
  const horizontalForceKg = moment / fMax;

  let totalLoadKg = 0;
  for (const q of nodeQ) totalLoadKg += q;

  const horizontalForceSimpleKg = (totalLoadKg * l1) / (2 * fMax);

  return {
    nodeX,
    nodeQ,
    nodeSag,
    segmentLength,
    endLeftM,
    endRightM,
    totalLengthM,
    horizontalForceKg,
    horizontalForceSimpleKg,
    totalLoadKg,
  };
}
