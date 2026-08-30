/**
 * ocs-calculators —— 铁路接触网（OCS）工程计算工具集
 *
 * 零运行时依赖，全部为纯函数，浏览器与 Node 通用。
 * 所有数值参数的单位都写在变量名末尾（tensionKN / spanM / crossSectionMM2 …）。
 *
 * ⚠️ 计算结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。
 *
 * 在线版本：https://www.itswe.com
 */

export * from './types';
export * from './data/wire-specs';
export * from './tension';
