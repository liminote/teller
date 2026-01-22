/**
 * 八字五行顏色對應工具
 * 根據天干地支的五行屬性返回對應的顏色
 */

/**
 * 獲取單個天干或地支字符的顏色類名
 * @param char - 天干或地支字符（甲乙丙丁...子丑寅卯...）
 * @returns Tailwind CSS 顏色類名
 */
export const getGanzhiColor = (char: string): string => {
    if ('甲乙寅卯'.includes(char)) return 'text-[#567D5B]'; // 雅致綠 (木)
    if ('丙丁巳午'.includes(char)) return 'text-[#B25050]'; // 磚紅 (火)
    if ('戊己辰戌丑未'.includes(char)) return 'text-[#8D6E63]'; // 咖啡木 (土)
    if ('庚辛申酉'.includes(char)) return 'text-[#B89130]'; // 古銅金 (金)
    if ('壬癸亥子'.includes(char)) return 'text-[#457B9D]'; // 鋼青藍 (水)
    return 'text-[#6B7280]'; // 默認灰色
};

/**
 * 獲取干支組合的顏色類名（返回陣列，天干一個顏色，地支一個顏色）
 * @param ganzhi - 干支組合字串（例如："甲子"）
 * @returns [天干顏色, 地支顏色]
 */
export const getGanzhiColors = (ganzhi: string): [string, string] => {
    if (ganzhi.length < 2) return ['text-[#6B7280]', 'text-[#6B7280]'];
    return [getGanzhiColor(ganzhi[0]), getGanzhiColor(ganzhi[1])];
};

/**
 * 五行顏色常量
 */
export const WUXING_COLORS = {
    木: '#567D5B', // 雅致綠
    火: '#B25050', // 磚紅
    土: '#8D6E63', // 咖啡木
    金: '#B89130', // 古銅金
    水: '#457B9D', // 鋼青藍
} as const;

/**
 * 天干地支對應五行
 */
export const GANZHI_WUXING = {
    甲: '木', 乙: '木',
    丙: '火', 丁: '火',
    戊: '土', 己: '土',
    庚: '金', 辛: '金',
    壬: '水', 癸: '水',
    子: '水', 亥: '水',
    寅: '木', 卯: '木',
    巳: '火', 午: '火',
    申: '金', 酉: '金',
    辰: '土', 戌: '土', 丑: '土', 未: '土',
} as const;

/**
 * 獲取字符對應的五行
 * @param char - 天干或地支字符
 * @returns 五行名稱（木火土金水）或 null
 */
export const getWuxing = (char: string): string | null => {
    return GANZHI_WUXING[char as keyof typeof GANZHI_WUXING] || null;
};
