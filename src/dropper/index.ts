export { dropperMeta } from './meta';

/** 悬挂类型 */
export type SuspensionType = 'simple' | 'elastic';

export interface DropperInput {
  /** 悬挂类型。弹性链形须同时提供 messenger 参数 */
  readonly suspension: SuspensionType;
  /** 跨距 L，m */
  readonly spanM: number;
  /** 接触线张力 T_c，kN */
  readonly contactTensionKN: number;
  /** 结构高度 H，m */
  readonly structureHeightM: number;
  /** 接触线单位荷载 q_c，kN/m */
  readonly contactLoadKNPerM: number;
  /** 吊弦间距 d，m，须能整除跨距 */
  readonly dropperSpacingM: number;
  /**
   * 承力索参数。弹性链形悬挂（'elastic'）必填，
   * 简单链形悬挂传 null 或不传。
   */
  readonly messenger?: {
    /** 承力索张力 T_m，kN */
    readonly tensionKN: number;
    /** 承力索单位荷载 q_m，kN/m */
    readonly loadKNPerM: number;
  } | null;
}

/** 单个吊弦点的计算结果 */
export interface DropperPoint {
  /** 序号 i（0 为起始端） */
  readonly index: number;
  /** 距起始端的距离 x，m */
  readonly positionM: number;
  /** 接触线弛度 f_c(x)，m */
  readonly contactSagM: number;
  /** 承力索弛度 f_m(x)，m（简单链形恒为 0） */
  readonly messengerSagM: number;
  /** 吊弦长度 l，m */
  readonly dropperLengthM: number;
}

export interface DropperResult {
  readonly points: readonly DropperPoint[];
  /** 跨中最大弛度 f_max，m */
  readonly maxSagM: number;
  /** 最短吊弦长度，m（位于跨中） */
  readonly shortestDropperM: number;
  /** 吊弦数量（含两端） */
  readonly count: number;
}

/**
 * 抛物线弛度：f(x) = q·x·(L−x) / (2·T)
 *
 * 对接触线和承力索通用，区别只在传哪一组 q / T。
 *
 * @param xM 距起始端距离，m
 * @param spanM 跨距 L，m
 * @param loadKNPerM 单位荷载 q，kN/m
 * @param tensionKN 张力 T，kN
 * @returns 该点弛度，m
 */
export function parabolaSagM(
  xM: number,
  spanM: number,
  loadKNPerM: number,
  tensionKN: number,
): number {
  if (!(tensionKN > 0)) {
    throw new RangeError(`张力必须为正数，收到 ${tensionKN} kN`);
  }
  if (xM < 0 || xM > spanM) {
    throw new RangeError(`位置 x = ${xM} m 超出跨距 0 ~ ${spanM} m`);
  }
  return (loadKNPerM * xM * (spanM - xM)) / (2 * tensionKN);
}

/**
 * 跨中最大弛度：f_max = q·L² / (8·T)
 */
export function maxParabolaSagM(
  spanM: number,
  loadKNPerM: number,
  tensionKN: number,
): number {
  return (loadKNPerM * spanM * spanM) / (8 * tensionKN);
}

/**
 * 生成吊弦点位（含两端）。
 * @param spanM 跨距 L，m
 * @param spacingM 吊弦间距 d，m，须能整除跨距
 * @returns 各点位距起始端的距离，m
 */
export function dropperPositionsM(spanM: number, spacingM: number): number[] {
  if (!(spanM > 0)) {
    throw new RangeError(`跨距必须为正数，收到 ${spanM} m`);
  }
  if (!(spacingM > 0)) {
    throw new RangeError(`吊弦间距必须为正数，收到 ${spacingM} m`);
  }
  const intervals = spanM / spacingM;
  const rounded = Math.round(intervals);
  if (Math.abs(intervals - rounded) > 1e-9 || rounded < 1) {
    throw new RangeError(
      `吊弦间距 ${spacingM} m 不能整除跨距 ${spanM} m（得到 ${intervals} 段）`,
    );
  }
  return Array.from({ length: rounded + 1 }, (_, i) => i * spacingM);
}

/**
 * 计算整跨各吊弦长度。
 *
 * 简单链形：l_i = H − f_c(x_i)
 * 弹性链形：l_i = H − f_c(x_i) + f_m(x_i)
 */
export function dropperLengths(input: DropperInput): DropperResult {
  const {
    suspension,
    spanM,
    contactTensionKN,
    structureHeightM,
    contactLoadKNPerM,
    dropperSpacingM: spacingM,
  } = input;

  if (!(contactTensionKN > 0)) {
    throw new RangeError(`接触线张力必须为正数，收到 ${contactTensionKN} kN`);
  }
  if (!(contactLoadKNPerM > 0)) {
    throw new RangeError(`接触线单位荷载必须为正数，收到 ${contactLoadKNPerM} kN/m`);
  }
  if (!(structureHeightM > 0)) {
    throw new RangeError(`结构高度必须为正数，收到 ${structureHeightM} m`);
  }

  if (suspension === 'elastic') {
    const m = input.messenger;
    if (!m) {
      throw new RangeError('弹性链形悬挂必须提供承力索参数（messenger）');
    }
    if (!(m.tensionKN > 0) || !(m.loadKNPerM > 0)) {
      throw new RangeError('承力索张力与单位荷载必须为正数');
    }
  }

  const positions = dropperPositionsM(spanM, spacingM);
  const messenger = suspension === 'elastic' ? input.messenger : null;

  const points: DropperPoint[] = positions.map((xM, index) => {
    const contactSag = parabolaSagM(
      xM,
      spanM,
      contactLoadKNPerM,
      contactTensionKN,
    );
    const messengerSag =
      messenger && messenger !== null
        ? parabolaSagM(xM, spanM, messenger.loadKNPerM, messenger.tensionKN)
        : 0;

    const dropperLengthM = structureHeightM - contactSag + messengerSag;
    if (dropperLengthM <= 0) {
      throw new RangeError(
        `x = ${xM} m 处吊弦长度非正（${dropperLengthM.toFixed(4)} m）：` +
          `结构高度 ${structureHeightM} m 不足，请复核输入`,
      );
    }

    return { index, positionM: xM, contactSagM: contactSag, messengerSagM: messengerSag, dropperLengthM };
  });

  let maxSagM = 0;
  let shortestDropperM = Number.POSITIVE_INFINITY;
  for (const p of points) {
    if (p.contactSagM > maxSagM) maxSagM = p.contactSagM;
    if (p.dropperLengthM < shortestDropperM) shortestDropperM = p.dropperLengthM;
  }

  return {
    points,
    maxSagM,
    shortestDropperM,
    count: points.length,
  };
}
