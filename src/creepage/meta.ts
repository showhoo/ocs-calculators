import type { CalculatorMeta } from '../types';

export const creepageMeta: CalculatorMeta = {
  name: '绝缘子爬电距离选型校核',
  nameEn: 'Insulator Creepage Distance Check',
  summary: '按 TB 10009-2016 第 5.3.2 条底线判定接触网绝缘最小爬电距离，附 GB/T 32586 比距三档对照。',
  formula: [
    '底线：一般区段 ≥1400 mm；V 形天窗上、下行正线间分段串 ≥1600 mm',
    'GB/T 32586 统一爬电比距三档：正常 24~33、非正常 36~40、苛刻 >48 mm/kV',
  ],
  references: [
    'TB 10009-2016 第 5.3.2 条第 1 款（绝对底线）',
    'GB/T 32586-2016 第 4.4 条（统一爬电比距三档，按系统最高持续电压折算）',
    '铁路体系以绝对值门槛判定，比距法仅作对照',
  ],
  scope: ['爬电距离：600~2500 mm', '系统最高电压：27.5~31 kV'],
  disclaimer: '本工具结果仅供参考，工程应用以设计文件为准。详见 DISCLAIMER.md。',
  online: 'https://www.itswe.com/calculator/creepage/',
};
