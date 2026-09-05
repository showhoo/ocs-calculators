# 安全策略（SECURITY）

## 支持版本

| 版本 | 是否支持 |
| --- | --- |
| latest（main 分支对应的最新发布） | ✅ |
| 更早版本 | ❌ 请升级 |

## 如何报告安全问题

本项目是**零运行时依赖的纯计算函数库**，不处理网络请求、用户输入流或持久化数据，
攻击面主要限于：

1. 计算公式或内置参数表的**数值错误**（可能导致工程误判）；
2. 依赖构建工具链（tsup / typescript / vitest）的供应链问题。

**请勿通过公开 Issue 报告安全问题。** 报告方式：

- 使用 GitHub 的 [Private vulnerability reporting](https://github.com/showhoo/ocs-calculators/security/advisories/new)；
- 或邮件联系 <iam@showhoo.com>（注明 `ocs-calculators security`）。

我们会在 7 天内确认，修复后随新版本发布并在 CHANGELOG 中致谢报告者。

## 数值错误的报告模板

工程计算库最欢迎的"安全报告"其实是**公式与参数纠错**。请尽量包含：

1. 涉及模块与函数名（如 `wearRatio`）；
2. 你使用的输入值与得到的结果；
3. 期望值及其依据（标准号 + 年份 + 条款/表号，如 TB/T 2809-2017 表5）；
4. 若涉及单位换算，请注明你采用的单位制。

也可使用 [Calculation Issue 模板](https://github.com/showhoo/ocs-calculators/issues/new?template=calculation-issue.yml)公开提交非敏感的公式问题。

## 依赖说明

- 运行时依赖：**0**（不存在运行时供应链风险）；
- 构建期依赖（tsup / typescript / vitest）通过 package-lock.json 锁定，
  建议贡献者使用 `npm ci` 安装以保持一致性。
