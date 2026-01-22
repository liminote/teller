/**
 * 農曆與八字計算工具函數
 */

import calendarData2025 from '../data/calendar-2025.json';
import calendarData2026 from '../data/calendar-2026.json';
import { SOLAR_TERMS_2026, FOUR_TRANSFORMATIONS, type DailyCalendarData } from './calendar-data';

/**
 * 根據西元日期查詢農曆與干支資料
 */
export function getDailyCalendar(date: string): DailyCalendarData | null {
    const year = parseInt(date.substring(0, 4));
    const calendarData = year === 2025 ? calendarData2025 : calendarData2026;

    const data = calendarData.find((d: any) => d.gregorianDate === date);
    if (!data) return null;

    // 查詢當天是否有節氣
    const mmdd = date.substring(5); // 取得 MM-DD
    const solarTerm = SOLAR_TERMS_2026.find(term => term.date === mmdd);

    return {
        ...data,
        solarTerm: solarTerm?.name,
        solarTermTime: solarTerm?.time,
    };
}

/**
 * 獲取當前節氣
 * 找到最接近但不晚於當前日期的節氣
 */
export function getCurrentSolarTerm(date: string): string {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();

    let currentTerm = '';

    for (const term of SOLAR_TERMS_2026) {
        const termDate = new Date(`${year}-${term.date}`);
        if (termDate <= targetDate) {
            currentTerm = term.name;
        } else {
            break;
        }
    }

    return currentTerm || '小寒'; // 預設返回小寒
}

/**
 * 格式化農曆日期
 * 例如：乙巳十二月初二 -> 十二月初二
 */
export function formatLunarDate(lunarDate: string): string {
    // 移除年份部分，只保留月和日
    return lunarDate.substring(2); // 直接從第3個字開始
}

/**
 * 獲取八字流年
 * 注意：立春前仍算前一年
 */
export function getYearPillar(date: string): string {
    const data = getDailyCalendar(date);
    return data?.yearPillar || '';
}

/**
 * 獲取八字流月
 */
export function getMonthPillar(date: string): string {
    const data = getDailyCalendar(date);
    return data?.monthPillar || '';
}

/**
 * 獲取日干支
 */
export function getDayPillar(date: string): string {
    const data = getDailyCalendar(date);
    return data?.dayPillar || '';
}

/**
 * 提取天干（日柱的第一個字）
 */
export function getDayStem(date: string): string {
    const dayPillar = getDayPillar(date);
    return dayPillar.charAt(0);
}

/**
 * 提取地支（日柱的第二個字）
 */
export function getDayBranch(date: string): string {
    const dayPillar = getDayPillar(date);
    return dayPillar.charAt(1);
}

/**
 * 星曜縮寫對照表
 */
const STAR_ABBREVIATIONS: Record<string, string> = {
    '廉貞': '廉',
    '破軍': '破',
    '武曲': '武',
    '太陽': '陽',
    '天機': '機',
    '天梁': '梁',
    '紫微': '紫',
    '太陰': '陰',
    '天同': '同',
    '文昌': '昌',
    '巨門': '巨',
    '貪狼': '貪',
    '右弼': '右',  // 修正：右弼縮寫為「右」
    '文曲': '曲',
    '左輔': '左',
};

/**
 * 獲取紫微流日四化
 * 根據日天干查詢
 */
export function getDailyFourTransformations(date: string): string {
    const dayStem = getDayStem(date);
    const trans = FOUR_TRANSFORMATIONS[dayStem];
    if (!trans) return '';

    // 使用星曜縮寫對照表
    const luAbbr = STAR_ABBREVIATIONS[trans.祿] || trans.祿;
    const quanAbbr = STAR_ABBREVIATIONS[trans.權] || trans.權;
    const keAbbr = STAR_ABBREVIATIONS[trans.科] || trans.科;
    const jiAbbr = STAR_ABBREVIATIONS[trans.忌] || trans.忌;

    // 返回縮寫形式，例如：廉破武陽
    return `${luAbbr}${quanAbbr}${keAbbr}${jiAbbr}`;
}

/**
 * 獲取紫微流月（農曆月份）
 */
export function getPurpleFlowMonth(date: string): string {
    const data = getDailyCalendar(date);
    if (!data) return '';

    // 從農曆日期中提取月份
    // 例如：乙巳十二月初二 -> 臘月
    const lunarDate = data.lunarDate;

    // 先檢查長字串（十二月、十一月、十月），再檢查短字串
    const monthMap: Record<string, string> = {
        '十二月': '臘月',
        '十一月': '冬月',
        '十月': '十月',
        '正月': '正月',
        '二月': '二月',
        '三月': '三月',
        '四月': '四月',
        '五月': '五月',
        '六月': '六月',
        '七月': '七月',
        '八月': '八月',
        '九月': '九月',
    };

    for (const [key, value] of Object.entries(monthMap)) {
        if (lunarDate.includes(key)) {
            return value;
        }
    }

    return '';
}

/**
 * 生成完整的「每日基本資料」
 * 這個函數會生成所有需要的資訊，供Google Sheets使用
 * 
 * @param date - 西元日期 YYYY-MM-DD
 * @param benmingPalace - 本命命宮地支（例如：'戌'）
 */
export function generateDailyBasicData(date: string, benmingPalace: string = '戌') {
    const calendar = getDailyCalendar(date);
    if (!calendar) return null;

    const dayStem = getDayStem(date);
    const fourTrans = getDailyFourTransformations(date);

    // 計算紫微流日命宮、農曆月、農曆日
    let flowDayPalace = '';
    let lunarMonth = '';
    let lunarDay = '';
    try {
        const { calculateFlowDayPalaceFromLunarDate, extractLunarMonth, extractLunarDay } = require('./purple-palace-calculator');
        flowDayPalace = calculateFlowDayPalaceFromLunarDate(benmingPalace, calendar.lunarDate);
        lunarMonth = extractLunarMonth(calendar.lunarDate).toString();
        lunarDay = extractLunarDay(calendar.lunarDate).toString();
    } catch (error) {
        console.error('紫微流日命宮計算失敗:', error);
    }

    const dayOfWeek = new Date(date).getDay();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[dayOfWeek];

    return {
        日期: date,
        星期: weekday,
        農曆: formatLunarDate(calendar.lunarDate),
        農曆月: lunarMonth,
        農曆日: lunarDay,
        天干: dayStem,
        地支: getDayBranch(date),
        月天干地支: calendar.monthPillar,
        節氣: getCurrentSolarTerm(date),
        八字流年: calendar.yearPillar,
        八字流月: calendar.monthPillar,
        紫微流月: getPurpleFlowMonth(date),
        流日命宮地支: flowDayPalace,
        流日四化: fourTrans,
    };
}

/**
 * 批量生成一年份的每日基本資料
 * 
 * @param year - 年份
 * @param benmingPalace - 本命命宮地支
 */
export function generateYearlyBasicData(year: number = 2026, benmingPalace: string = '戌') {
    // 動態導入對應年份的資料
    let calendarData: any[];
    if (year === 2025) {
        calendarData = require('../data/calendar-2025.json');
    } else if (year === 2026) {
        calendarData = require('../data/calendar-2026.json');
    } else {
        throw new Error(`不支援的年份：${year}`);
    }

    const results = [];

    for (const data of calendarData) {
        const basicData = generateDailyBasicData(data.gregorianDate, benmingPalace);
        if (basicData) {
            results.push(basicData);
        }
    }

    return results;
}

/**
 * 根據天干或地支返回對應的五行顏色類別
 */
export function getElementColor(char: string): string {
    const wood = ['甲', '乙', '寅', '卯'];
    const fire = ['丙', '丁', '巳', '午'];
    const earth = ['戊', '己', '辰', '戌', '丑', '未'];
    const metal = ['庚', '辛', '申', '酉'];
    const water = ['壬', '癸', '亥', '子'];

    if (wood.includes(char)) return 'text-emerald-500';
    if (fire.includes(char)) return 'text-rose-500';
    if (earth.includes(char)) return 'text-amber-700'; // 褐色/深琥珀色
    if (metal.includes(char)) return 'text-yellow-500'; // 金色/黃色
    if (water.includes(char)) return 'text-blue-500';

    return 'text-slate-400';
}

