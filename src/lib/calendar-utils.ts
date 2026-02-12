/**
 * 農曆與八字計算工具函數 (自動化版本)
 * 使用 lunar-javascript 進行動態計算，不再依賴靜態 JSON
 */

import { Solar } from 'lunar-javascript';
import { FOUR_TRANSFORMATIONS, type DailyCalendarData } from './calendar-data';
import { calculateFlowMonthPalace, calculateFlowDayPalace } from './purple-palace-calculator';

/**
 * 根據西元日期計算農曆與干支資料
 * 使用 lunar-javascript 庫
 */
export function getDailyCalendar(date: string): DailyCalendarData | null {
    try {
        const [y, m, d] = date.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        // 檢查當天是否有節氣
        const jieQi = lunar.getJieQi();
        const solarTermName = jieQi || undefined;

        // 節氣時間暫時不顯示（避免 API 錯誤）
        let solarTermTime = undefined;

        // 重要修正：使用按「立春」切換的年柱，以及按「節氣」切換的月柱
        return {
            gregorianDate: date,
            lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
            yearPillar: `${lunar.getYearInGanZhiByLiChun()}年`,
            monthPillar: `${lunar.getMonthInGanZhiExact()}月`,
            dayPillar: `${lunar.getDayInGanZhi()}日`,
            solarTerm: solarTermName,
            solarTermTime: solarTermTime,
        };
    } catch (e) {
        console.error('getDailyCalendar 錯誤:', e);
        return null;
    }
}

/**
 * 獲取當前節氣
 * 找到當前日期所處的節氣（最近的一個節氣，不晚於當前日期）
 */
export function getCurrentSolarTerm(date: string): string {
    try {
        const [y, m, d] = date.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        // 獲取最近的一個節氣（JieQi）或中氣（ZhongQi）
        const prevJie = lunar.getPrevJie();
        const prevZhong = lunar.getPrevZhong();

        // 比較誰更接近當前日期
        const prevJieSolar = prevJie.getSolar();
        const prevZhongSolar = prevZhong.getSolar();

        if (prevJieSolar.toYmd() >= prevZhongSolar.toYmd()) {
            return prevJie.getName();
        } else {
            return prevZhong.getName();
        }
    } catch (e) {
        return '小寒';
    }
}

/**
 * 獲取節氣轉換描述
 * 如果當天是節氣轉換日，返回「由[前一節氣]轉換至[當前節氣]」
 */
export function getSolarTermTransition(date: string): string {
    try {
        const [y, m, d] = date.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        const currentTerm = lunar.getJieQi() || lunar.getZhongQi();
        if (!currentTerm) return '';

        const prevJie = lunar.getPrevJie();
        const prevZhong = lunar.getPrevZhong();

        // 找到上一個節氣
        let prevTerm = '';
        if (prevJie.getName() === currentTerm) {
            // 如果當前是節氣，前一個可能是上一個中氣
            prevTerm = prevZhong.getName();
        } else {
            prevTerm = prevJie.getName();
        }

        return `由${prevTerm}轉換至${currentTerm}`;
    } catch (e) {
        return '';
    }
}

/**
 * 格式化農曆日期
 * 直接返回農曆月日
 */
export function formatLunarDate(lunarDate: string): string {
    return lunarDate; // 在自動化版本中已經是格式化好的「十二月初二」
}

/**
 * 獲取八字流年
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
    '右弼': '右',
    '文曲': '曲',
    '左輔': '左',
};

/**
 * 獲取紫微流日四化
 */
export function getDailyFourTransformations(date: string): string {
    const dayStem = getDayStem(date);
    const trans = FOUR_TRANSFORMATIONS[dayStem];
    if (!trans) return '';

    const luAbbr = STAR_ABBREVIATIONS[trans.祿] || trans.祿;
    const quanAbbr = STAR_ABBREVIATIONS[trans.權] || trans.權;
    const keAbbr = STAR_ABBREVIATIONS[trans.科] || trans.科;
    const jiAbbr = STAR_ABBREVIATIONS[trans.忌] || trans.忌;

    return `${luAbbr}${quanAbbr}${keAbbr}${jiAbbr}`;
}


/**
 * 獲取紫微流月（農曆月份名稱）
 */
export function getPurpleFlowMonth(date: string): string {
    try {
        const [y, m, d] = date.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        const month = Math.abs(lunar.getMonth());
        const monthMap: Record<number, string> = {
            1: '正月', 2: '二月', 3: '三月', 4: '四月', 5: '五月', 6: '六月',
            7: '七月', 8: '八月', 9: '九月', 10: '十月', 11: '冬月', 12: '臘月'
        };
        return monthMap[month] || '';
    } catch (e) {
        return '';
    }
}

/**
 * 生成完整的「每日基本資料」
 */
export function generateDailyBasicData(date: string, benmingPalace: string = '巳') {
    const calendar = getDailyCalendar(date);
    if (!calendar) return null;

    const dayStem = getDayStem(date);
    const fourTrans = getDailyFourTransformations(date);

    // 計算紫微流日命宮
    let flowDayPalace = '';
    let lunarMonthStr = '';
    let lunarDayStr = '';
    try {
        const [y, m, d] = date.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        const lunarMonth = Math.abs(lunar.getMonth());
        const lunarDay = lunar.getDay();
        const yearBranch = lunar.getYearZhi();

        // 1. 流年命宮以該年地支為準 (user 之前的修正邏輯)
        // 2. 計算流月命宮
        const flowMonthPalace = calculateFlowMonthPalace(yearBranch, lunarMonth);
        // 3. 計算流日命宮
        flowDayPalace = calculateFlowDayPalace(flowMonthPalace, lunarDay);

        lunarMonthStr = lunarMonth.toString();
        lunarDayStr = lunarDay.toString();
    } catch (error) {
        console.error('紫微計算失敗:', error);
    }

    const dayOfWeek = new Date(date).getDay();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[dayOfWeek];

    return {
        日期: date,
        星期: weekday,
        農曆: calendar.lunarDate,
        農曆月: lunarMonthStr,
        農曆日: lunarDayStr,
        天干: dayStem,
        地支: getDayBranch(date),
        月天干地支: calendar.monthPillar.replace('月', ''),
        節氣: getCurrentSolarTerm(date),
        八字流年: calendar.yearPillar.replace('年', ''),
        八字流月: calendar.monthPillar.replace('月', ''),
        紫微流月: getPurpleFlowMonth(date),
        流日命宮地支: flowDayPalace,
        流日四化: fourTrans,
        節氣轉換: getSolarTermTransition(date),
    };
}

/**
 * 批量生成指定年份的每日基本資料
 */
export function generateYearlyBasicData(year: number = 2026, benmingPalace: string = '戌') {
    const results = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const basicData = generateDailyBasicData(dateStr, benmingPalace);
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
    if (earth.includes(char)) return 'text-amber-700';
    if (metal.includes(char)) return 'text-yellow-500';
    if (water.includes(char)) return 'text-blue-500';

    return 'text-slate-400';
}

