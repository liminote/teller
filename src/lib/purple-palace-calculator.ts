/**
 * 紫微斗數流日命宮計算模組（正確版本）
 * 
 * 計算邏輯：
 * 1. 流年命宮 = 根據本命命宮和年齡推算（需用戶提供）
 * 2. 流月命宮 = 流年命宮 + 當月地支索引 + 2
 * 3. 流日命宮 = 流月命宮 + (農曆日 - 1)
 */

import { getBranchIndex, getBranchByIndex } from './purple-palace-data';

/**
 * 農曆月份對應的地支
 */
const LUNAR_MONTH_BRANCHES: Record<number, string> = {
    1: '寅',   // 正月
    2: '卯',   // 二月
    3: '辰',   // 三月
    4: '巳',   // 四月
    5: '午',   // 五月
    6: '未',   // 六月
    7: '申',   // 七月
    8: '酉',   // 八月
    9: '戌',   // 九月
    10: '亥',  // 十月
    11: '子',  // 十一月
    12: '丑',  // 十二月
};

/**
 * 從農曆日期字符串提取農曆日數
 * 注意：需要先移除月份部分，避免"十一月"中的"十一"被誤識別
 */
export function extractLunarDay(lunarDate: string): number {
    // 先移除月份部分（格式：乙巳十一月初五 -> 初五）
    let dayPart = lunarDate;
    const monthPatterns = ['正月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    for (const month of monthPatterns) {
        const index = dayPart.indexOf(month);
        if (index !== -1) {
            dayPart = dayPart.substring(index + month.length);
            break;
        }
    }

    // 先處理20-30日
    if (dayPart.includes('三十')) return 30;
    if (dayPart.includes('廿九')) return 29;
    if (dayPart.includes('廿八')) return 28;
    if (dayPart.includes('廿七')) return 27;
    if (dayPart.includes('廿六')) return 26;
    if (dayPart.includes('廿五')) return 25;
    if (dayPart.includes('廿四')) return 24;
    if (dayPart.includes('廿三')) return 23;
    if (dayPart.includes('廿二')) return 22;
    if (dayPart.includes('廿一')) return 21;
    if (dayPart.includes('二十')) return 20;

    // 處理10-19日
    if (dayPart.includes('十九')) return 19;
    if (dayPart.includes('十八')) return 18;
    if (dayPart.includes('十七')) return 17;
    if (dayPart.includes('十六')) return 16;
    if (dayPart.includes('十五')) return 15;
    if (dayPart.includes('十四')) return 14;
    if (dayPart.includes('十三')) return 13;
    if (dayPart.includes('十二')) return 12;
    if (dayPart.includes('十一')) return 11;
    if (dayPart.includes('初十')) return 10;

    // 處理1-9日
    if (dayPart.includes('初九')) return 9;
    if (dayPart.includes('初八')) return 8;
    if (dayPart.includes('初七')) return 7;
    if (dayPart.includes('初六')) return 6;
    if (dayPart.includes('初五')) return 5;
    if (dayPart.includes('初四')) return 4;
    if (dayPart.includes('初三')) return 3;
    if (dayPart.includes('初二')) return 2;
    if (dayPart.includes('初一')) return 1;

    throw new Error(`無法從「${lunarDate}」提取農曆日數（處理後：${dayPart}）`);
}

/**
 * 從農曆日期字符串提取農曆月份
 * 注意：需要先檢查「十二月」「十一月」「十月」，避免誤匹配到「二月」「一月」
 */
export function extractLunarMonth(lunarDate: string): number {
    // 先檢查雙字月份（避免「十二月」被誤認為「二月」）
    if (lunarDate.includes('十二月')) return 12;
    if (lunarDate.includes('十一月')) return 11;
    if (lunarDate.includes('十月')) return 10;

    // 再檢查單字月份
    if (lunarDate.includes('正月')) return 1;
    if (lunarDate.includes('二月')) return 2;
    if (lunarDate.includes('三月')) return 3;
    if (lunarDate.includes('四月')) return 4;
    if (lunarDate.includes('五月')) return 5;
    if (lunarDate.includes('六月')) return 6;
    if (lunarDate.includes('七月')) return 7;
    if (lunarDate.includes('八月')) return 8;
    if (lunarDate.includes('九月')) return 9;

    throw new Error(`無法從「${lunarDate}」提取農曆月份`);
}

/**
 * 計算流月命宮
 * 
 * @param flowYearPalace - 流年命宮地支
 * @param lunarMonth - 農曆月份（1-12）
 * @returns 流月命宮地支
 */
export function calculateFlowMonthPalace(flowYearPalace: string, lunarMonth: number): string {
    const flowYearIndex = getBranchIndex(flowYearPalace);
    if (flowYearIndex === -1) {
        throw new Error(`無效的流年命宮地支：${flowYearPalace}`);
    }

    // 獲取當月對應的地支
    const monthBranch = LUNAR_MONTH_BRANCHES[lunarMonth];
    if (!monthBranch) {
        throw new Error(`無效的農曆月份：${lunarMonth}`);
    }

    const monthBranchIndex = getBranchIndex(monthBranch);

    // 核心公式：流月命宮 = 流年命宮 + 當月地支索引 + 2
    const flowMonthIndex = (flowYearIndex + monthBranchIndex + 2) % 12;

    return getBranchByIndex(flowMonthIndex);
}

/**
 * 計算流日命宮
 * 
 * @param flowMonthPalace - 流月命宮地支
 * @param lunarDay - 農曆日數（1-30）
 * @returns 流日命宮地支
 */
export function calculateFlowDayPalace(flowMonthPalace: string, lunarDay: number): string {
    const flowMonthIndex = getBranchIndex(flowMonthPalace);
    if (flowMonthIndex === -1) {
        throw new Error(`無效的流月命宮地支：${flowMonthPalace}`);
    }

    if (lunarDay < 1 || lunarDay > 30) {
        throw new Error(`無效的農曆日數：${lunarDay}`);
    }

    // 核心公式：流日命宮 = 流月命宮 + (農曆日 - 1)
    const flowDayIndex = (flowMonthIndex + lunarDay - 1) % 12;

    return getBranchByIndex(flowDayIndex);
}

/**
 * 完整計算流日命宮（從農曆日期字符串）
 * 
 * @param flowYearPalace - 流年命宮地支
 * @param lunarDate - 農曆日期字符串（例如：'乙巳十二月初二'）
 * @returns 流日命宮地支
 */
export function calculateFlowDayPalaceFromLunarDate(
    flowYearPalace: string,
    lunarDate: string
): string {
    const lunarMonth = extractLunarMonth(lunarDate);
    const lunarDay = extractLunarDay(lunarDate);

    // 1. 先算流月命宮
    const flowMonthPalace = calculateFlowMonthPalace(flowYearPalace, lunarMonth);

    // 2. 再算流日命宮
    const flowDayPalace = calculateFlowDayPalace(flowMonthPalace, lunarDay);

    return flowDayPalace;
}
