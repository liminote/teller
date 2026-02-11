
/**
 * Teller 項目共用常量與樣式定義
 */

/**
 * 運勢類別對應的 CSS 類名
 */
export const STATUS_COLORS = {
    'happy': 'bg-[#F0F7F0] text-[#4A6B4E] border-[#DCE8DC]',
    'moody': 'bg-[#F9F1F1] text-[#A64B4E] border-[#E8DCDC]',
    'high-pressure': 'bg-[#F1F4F9] text-[#457B9D] border-[#DCE4E8]',
    'turbulence': 'bg-[#F2EDF7] text-[#7A6A96] border-[#E0DCE8]',
    'default': 'bg-stone-50 text-stone-500 border-stone-100',
} as const;

/**
 * 今日分數對應的顏色
 */
export const SCORE_COLORS = {
    '好': 'bg-[#F0F7F0] border-[#8EA68F] text-[#2D4A31]',
    '普通': 'bg-[#F0F2F5] border-[#8294A5] text-[#2A3B4D]',
    '不好': 'bg-[#F9F1F1] border-[#B88A8A] text-[#5C2B2E]',
} as const;

/**
 * 五行顏色 (用於天干地支)
 */
export const GANZHI_ELEMENT_COLORS = {
    '木': 'text-[#567D5B]', // 雅致綠
    '火': 'text-[#B25050]', // 磚紅
    '土': 'text-[#8D6E63]', // 咖啡木
    '金': 'text-[#B89130]', // 古銅金
    '水': 'text-[#457B9D]', // 鋼青藍
    'default': 'text-[#6B7280]',
} as const;

/**
 * 地支與宮位名稱
 */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '朋友', '官祿', '田宅', '福德', '父母'];

/**
 * 十天干四化對照表
 */
export const SI_HUA_MAP: Record<string, string> = {
    '甲': '廉破武陽', '乙': '機梁紫陰', '丙': '同機昌廉', '丁': '陰同機巨',
    '戊': '貪陰右機', '己': '武貪梁曲', '庚': '陽武陰同', '辛': '巨陽曲昌',
    '壬': '梁紫左武', '癸': '破巨陰貪'
};

/**
 * 星曜縮寫與全名對照表
 */
export const STAR_NAME_MAP: Record<string, string> = {
    '廉': '廉貞', '破': '破軍', '武': '武曲', '陽': '太陽', '機': '天機',
    '梁': '天梁', '紫': '紫微', '陰': '太陰', '同': '天同', '昌': '文昌',
    '巨': '巨門', '貪': '貪狼', '右': '右弼', '左': '左輔', '府': '天府',
    '曲': '文曲'
};
