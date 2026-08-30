/**
 * 全库公共类型定义。
 *
 * 命名约定（重要）：
 * 所有数值字段的单位都写在变量名末尾，例如 tensionKN / spanM / crossSectionMM2。
 * 工程计算里单位混淆是头号 bug 来源，宁可名字长，也不要靠注释记单位。
 */

/**
 * 每个计算器模块必须导出的元信息。
 * 这是本库区别于"玩具代码"的核心 —— 公式、依据、适用范围、免责声明全部可机读。
 */
export interface CalculatorMeta {
  /** 计算器中文名 */
  readonly name: string;
  /** 计算器英文名，用于国际检索 */
  readonly nameEn: string;
  /** 一句话用途说明 */
  readonly summary: string;
  /** 核心公式，LaTeX 或纯文本，可多条 */
  readonly formula: readonly string[];
  /** 参考依据：标准号、设计手册、教材。注意标注该标准是否真正包含此公式 */
  readonly references: readonly string[];
  /** 适用范围与已知限制 */
  readonly scope: readonly string[];
  /** 免责声明 */
  readonly disclaimer: string;
  /** 在线版本地址 */
  readonly online: string;
}

/** 重力加速度，N/kg（m/s²） */
export const G0 = 9.81;
