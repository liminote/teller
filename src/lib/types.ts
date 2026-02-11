
/**
 * Teller 項目全域類型定義
 */

/**
 * 每日回饋記錄 (與 Google Sheets '每日記錄' 對應)
 */
export interface FeedbackData {
    日期: string;
    今日分數: '好' | '普通' | '不好';
    紫微_工作: number;
    紫微_健康: number;
    紫微_財運: number;
    紫微_能量: number;
    八字_體感: string;
    八字_體驗?: string;
    紫微_四化簡述: string;
    情緒: string[];
    hasRecord?: boolean;
    [key: string]: any;
}

/**
 * 每日基本資料 (與 Google Sheets '每日基本資料' 對應)
 */
export interface DailyBasicData {
    日期: string;
    星期: string;
    農曆: string;
    農曆月: string;
    農曆日: string;
    天干: string;
    地支: string;
    月天干地支: string;
    節氣: string;
    八字流年: string;
    八字流月: string;
    紫微流月: string;
    流日命宮地支: string;
    流日四化: string;
    節氣轉換: string;
    isPast?: boolean;
    isToday?: boolean;
}

/**
 * 運勢對照表條目 (與 Google Sheets '運勢對照' 對應)
 */
export interface StatusMappingRecord {
    干支: string;
    組合?: string;
    狀態標籤: string;
    詳細說明: string;
    PM指令: string;
    顏色類別: 'happy' | 'moody' | 'high-pressure' | 'turbulence' | string;
    '宜 (Dos)'?: string;
    "忌 (Don'ts)"?: string;
    [key: string]: any;
}

/**
 * 合併後的歷史資料 (用於預算法)
 */
export type HistoryData = DailyBasicData & Partial<FeedbackData>;
