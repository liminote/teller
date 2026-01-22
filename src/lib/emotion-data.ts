/**
 * 情緒量表資料結構
 * 基於二維分類：能量水平 (Energy) × 愉悅度 (Pleasantness)
 */

export type EmotionQuadrant = 'red' | 'yellow' | 'blue' | 'green';

export interface Emotion {
    chinese: string;
    english: string;
    quadrant: EmotionQuadrant;
    energy: 'high' | 'low';
    pleasantness: 'high' | 'low';
}

// 情緒量表完整資料
export const EMOTIONS: Emotion[] = [
    // 🔴 紅色區（高能量 + 低愉悅）
    { chinese: '憤怒的', english: 'Enraged', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '恐慌的', english: 'Panicked', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '壓力大的', english: 'Stressed', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '暴怒的', english: 'Livid', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '震驚的', english: 'Shocked', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '憤恨的', english: 'Furious', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '混亂的', english: 'Frustrated', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '緊張的', english: 'Tense', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '驚嚇的', english: 'Stunned', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '火冒三丈的', english: 'Fuming', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '受到驚嚇的', english: 'Frightened', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '生氣的', english: 'Angry', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '緊繃的', english: 'Nervous', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '焦立不安的', english: 'Restless', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '焦慮的', english: 'Anxious', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '憂慮不安的', english: 'Apprehensive', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '擔心的', english: 'Worried', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '被激怒的', english: 'Irritated', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '被惱怒的', english: 'Annoyed', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '反感的', english: 'Repulsed', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '困擾的', english: 'Troubled', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '在意的', english: 'Concerned', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '忐忑不安的', english: 'Uneasy', quadrant: 'red', energy: 'high', pleasantness: 'low' },
    { chinese: '不爽快的', english: 'Peeved', quadrant: 'red', energy: 'high', pleasantness: 'low' },

    // 🟡 黃色區（高能量 + 高愉悅）
    { chinese: '驚喜的', english: 'Surprised', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '振奮的', english: 'Upbeat', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '敬畏的', english: 'Festive', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '心花怒放的', english: 'Exhilarated', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '欣喜若狂的', english: 'Ecstatic', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '亢奮的', english: 'Hyper', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '愉快的', english: 'Cheerful', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '有動力的', english: 'Motivated', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '受到鼓勵的', english: 'Inspired', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '興高采烈的', english: 'Elated', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '精力充沛的', english: 'Energized', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '生氣勃勃的', english: 'Lively', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '興奮的', english: 'Excited', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '樂觀的', english: 'Optimistic', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '熱情洋溢的', english: 'Enthusiastic', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '開心的', english: 'Pleased', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '集中的', english: 'Focused', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '快樂的', english: 'Happy', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '驕傲的', english: 'Proud', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '興奮激動的', english: 'Thrilled', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '令人愉快的', english: 'Pleasant', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '欣喜的', english: 'Joyful', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '有希望的', english: 'Hopeful', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '好玩的', english: 'Playful', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },
    { chinese: '喜悅的', english: 'Blissful', quadrant: 'yellow', energy: 'high', pleasantness: 'high' },

    // 🔵 藍色區（低能量 + 低愉悅）
    { chinese: '厭惡的', english: 'Disgusted', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '沮喪沉悶的', english: 'Glum', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '失望的', english: 'Disappointed', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '低落的', english: 'Down', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '提不起勁的', english: 'Apathetic', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '悲觀的', english: 'Pessimistic', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '鬱鬱寡歡的', english: 'Morose', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '沮喪的', english: 'Discouraged', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '難過的', english: 'Sad', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '無聊的', english: 'Bored', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '疏離的', english: 'Alienated', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '慘慘的', english: 'Miserable', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '孤單的', english: 'Lonely', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '心灰意冷的', english: 'Disheartened', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '疲累的', english: 'Tired', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '消沉的', english: 'Despondent', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '抑鬱的', english: 'Depressed', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '陰鬱天黑的', english: 'Sullen', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '精疲力盡的', english: 'Exhausted', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '疲倦的', english: 'Fatigued', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '絕望的', english: 'Despairing', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '無望的', english: 'Hopeless', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '孤寂的', english: 'Desolate', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '過度不堪的', english: 'Spent', quadrant: 'blue', energy: 'low', pleasantness: 'low' },
    { chinese: '被榨乾的', english: 'Drained', quadrant: 'blue', energy: 'low', pleasantness: 'low' },

    // 🟢 綠色區（低能量 + 高愉悅）
    { chinese: '自在的', english: 'At Ease', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '隨和的', english: 'Easygoing', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '知足的', english: 'Content', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '無憂無慮的', english: 'Loving', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '心滿意足的', english: 'Fulfilled', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '平靜的', english: 'Calm', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '安全的', english: 'Secure', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '滿意的', english: 'Satisfied', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '感恩感激的', english: 'Grateful', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '感動的', english: 'Touched', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '放鬆的', english: 'Relaxed', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '冷靜的', english: 'Chill', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '寧靜的', english: 'Restful', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '有福氣的', english: 'Blessed', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '平衡的', english: 'Balanced', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '悠閒的', english: 'Mellow', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '體貼的', english: 'Thoughtful', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '平和的', english: 'Peaceful', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '舒適的', english: 'Comfortable', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '無憂無慮的', english: 'Carefree', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '睡意濃濃的', english: 'Sleepy', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '自鳴得意的', english: 'Complacent', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '平靜的', english: 'Tranquil', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '舒適的', english: 'Cozy', quadrant: 'green', energy: 'low', pleasantness: 'high' },
    { chinese: '安詳的', english: 'Serene', quadrant: 'green', energy: 'low', pleasantness: 'high' },
];

// 根據象限獲取顏色
export function getQuadrantColor(quadrant: EmotionQuadrant): string {
    const colors = {
        red: 'bg-red-50 text-red-600 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
    };
    return colors[quadrant];
}

// 根據象限獲取背景色（用於選擇器）
export function getQuadrantBg(quadrant: EmotionQuadrant): string {
    const colors = {
        red: '#FFE5E5',
        yellow: '#FFF9E5',
        blue: '#E5F3FF',
        green: '#E5F9E5',
    };
    return colors[quadrant];
}
