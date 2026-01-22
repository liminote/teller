/**
 * 農曆與干支曆對照資料
 * 資料來源: https://calendar.8s8s.net/calendar/2026/2026riqi.php
 */

export interface DailyCalendarData {
  gregorianDate: string; // 西元日期 YYYY-MM-DD
  lunarDate: string; // 農曆日期 例如：十二月初二
  yearPillar: string; // 年柱 例如：乙巳年
  monthPillar: string; // 月柱 例如：己丑月
  dayPillar: string; // 日柱 例如：甲午日
  solarTerm?: string; // 節氣（如果當天有）
  solarTermTime?: string; // 節氣時間（如果當天有）例如：09:46
}

export interface SolarTermData {
  name: string; // 節氣名稱
  date: string; // 日期 MM-DD
  time: string; // 時間 HH:mm
}

/**
 * 2026年二十四節氣
 * 資料來源: https://calendar.8s8s.net/calendar/2026/2026-24jieqi.php
 */
export const SOLAR_TERMS_2026: SolarTermData[] = [
  { name: '小寒', date: '01-05', time: '16:24' },
  { name: '大寒', date: '01-20', time: '09:46' },
  { name: '立春', date: '02-04', time: '04:03' },
  { name: '雨水', date: '02-18', time: '23:51' },
  { name: '驚蟄', date: '03-05', time: '21:58' },
  { name: '春分', date: '03-20', time: '22:41' },
  { name: '清明', date: '04-05', time: '02:35' },
  { name: '谷雨', date: '04-20', time: '09:31' },
  { name: '立夏', date: '05-05', time: '19:41' },
  { name: '小滿', date: '05-21', time: '08:28' },
  { name: '芒種', date: '06-05', time: '23:40' },
  { name: '夏至', date: '06-21', time: '16:16' },
  { name: '小暑', date: '07-07', time: '09:50' },
  { name: '大暑', date: '07-23', time: '03:07' },
  { name: '立秋', date: '08-07', time: '19:38' },
  { name: '處暑', date: '08-23', time: '10:16' },
  { name: '白露', date: '09-07', time: '22:41' },
  { name: '秋分', date: '09-23', time: '08:04' },
  { name: '寒露', date: '10-08', time: '14:31' },
  { name: '霜降', date: '10-23', time: '17:38' },
  { name: '立冬', date: '11-07', time: '17:54' },
  { name: '小雪', date: '11-22', time: '15:24' },
  { name: '大雪', date: '12-07', time: '10:55' },
  { name: '冬至', date: '12-22', time: '04:53' },
];

/**
 * 天干四化對照表（紫微斗數）
 * 庚干使用：太陽化祿、武曲化權、太陰化科、天同化忌
 */
export const FOUR_TRANSFORMATIONS: Record<string, {
  祿: string;
  權: string;
  科: string;
  忌: string;
}> = {
  '甲': { 祿: '廉貞', 權: '破軍', 科: '武曲', 忌: '太陽' },
  '乙': { 祿: '天機', 權: '天梁', 科: '紫微', 忌: '太陰' },
  '丙': { 祿: '天同', 權: '天機', 科: '文昌', 忌: '廉貞' },
  '丁': { 祿: '太陰', 權: '天同', 科: '天機', 忌: '巨門' },
  '戊': { 祿: '貪狼', 權: '太陰', 科: '右弼', 忌: '天機' },
  '己': { 祿: '武曲', 權: '貪狼', 科: '天梁', 忌: '文曲' },
  '庚': { 祿: '太陽', 權: '武曲', 科: '太陰', 忌: '天同' }, // 庚干爭議，使用此版本
  '辛': { 祿: '巨門', 權: '太陽', 科: '文曲', 忌: '文昌' },
  '壬': { 祿: '天梁', 權: '紫微', 科: '左輔', 忌: '武曲' },
  '癸': { 祿: '破軍', 權: '巨門', 科: '太陰', 忌: '貪狼' },
};

/**
 * 根據日期查詢當天的節氣
 */
export function getSolarTerm(date: string): SolarTermData | null {
  const mmdd = date.substring(5); // 取得 MM-DD
  return SOLAR_TERMS_2026.find(term => term.date === mmdd) || null;
}

/**
 * 根據日天干查詢紫微流日四化
 */
export function getDailyFourTransformations(dayStem: string): string {
  const trans = FOUR_TRANSFORMATIONS[dayStem];
  if (!trans) return '';
  return `${trans.祿}${trans.權}${trans.科}${trans.忌}`;
}

/**
 * 將簡化的四化字串轉為完整說明
 * 例如：廉破武陽 -> 廉貞化祿、破軍化權、武曲化科、太陽化忌
 */
export function formatFourTransformations(dayStem: string): string {
  const trans = FOUR_TRANSFORMATIONS[dayStem];
  if (!trans) return '';
  return `${trans.祿}化祿、${trans.權}化權、${trans.科}化科、${trans.忌}化忌`;
}
