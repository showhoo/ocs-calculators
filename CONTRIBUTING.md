# 贡献指南（CONTRIBUTING）

感谢关注 ocs-calculators！欢迎以任何形式贡献：公式纠错、参数补充、新计算器模块、文档改进。

## 开发环境

```bash
git clone git@github.com:showhoo/ocs-calculators.git
cd ocs-calculators
npm ci
npm run test:watch   # 开发时持续跑测试
```

要求 Node.js ≥ 18。项目零运行时依赖，devDependencies 仅构建与测试工具。

## 仓库定位与同步政策（重要）

本仓库是[思维接触网百科](https://www.itswe.com)计算器的**公式算法层**：

- 站点线上计算器的公式实现位于站点资产 `calculator/assets/calc-core.js`，
  **它是本仓库 `src/` 的同步基准**；
- 修改 `src/` 中的公式或默认参数前，先确认 `calc-core.js` 是否同步修改；
  反之，站点侧公式变更也应在本仓库对应模块中更新并补测试；
- 每个模块的 `meta.ts` 必须写明公式、参考依据（标准号）、适用范围与已知限制
  ——这是本项目的核心约定，公式必须公开可查。

## 新增一个计算器模块

1. `src/<模块名>/` 下新建 `index.ts`（实现）、`meta.ts`（元信息）、`<模块名>.test.ts`（测试）；
2. 输入参数单位写在字段名末尾（`tensionKN` / `spanM` / `crossSectionMM2`），
   非标准单位换算在模块内部完成；
3. 公式与期望值：以 `calc-core.js` 源码公式为准，测试注释中写明手算过程
   （参考 `src/icing/icing.test.ts` 的写法）；
4. 在 `src/index.ts` 中追加导出，并在 `package.json` 的 `exports` 中登记子路径；
5. `npm run typecheck && npm run test && npm run build` 全绿后提交。

## 提交约定

- 提交信息一句话说明动机，中文即可；
- 公式数值的改动必须在提交说明或 CHANGELOG 中注明依据（标准号 + 年份）；
- 不确定、无法溯源的参数宁可不写，也不要编造。

## 发布流程（维护者）

更新 `CHANGELOG.md` 与 `package.json` 版本号 → 提交 → 打 `vX.Y.Z` tag 推送，
release.yml 会自动执行测试、构建并发布到 npm。

## 行为准则

保持技术讨论客观中立；引用标准规范时注明版本；对计算口径的分歧用数据说话。
