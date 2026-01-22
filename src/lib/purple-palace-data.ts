/**
 * 紫微流日命宮測試資料
 * 用於驗證計算邏輯的準確性
 */

export const KNOWN_FLOW_PALACE_DATA = [
    // 2025年12月資料（連續）
    { date: '2025-12-24', palace: '亥' },
    { date: '2025-12-25', palace: '子' },
    { date: '2025-12-26', palace: '丑' },
    { date: '2025-12-27', palace: '寅' },
    { date: '2025-12-28', palace: '卯' },
    { date: '2025-12-29', palace: '辰' },
    { date: '2025-12-30', palace: '巳' },
    { date: '2025-12-31', palace: '午' },

    // 2026年1月資料（連續）
    { date: '2026-01-01', palace: '未' },
    { date: '2026-01-02', palace: '申' },
    { date: '2026-01-03', palace: '酉' },
    { date: '2026-01-04', palace: '戌' },
    { date: '2026-01-05', palace: '亥' },
    { date: '2026-01-06', palace: '子' },
    { date: '2026-01-07', palace: '丑' },
    { date: '2026-01-08', palace: '寅' },
    { date: '2026-01-09', palace: '卯' },
    { date: '2026-01-10', palace: '辰' },
    { date: '2026-01-11', palace: '巳' },
    { date: '2026-01-12', palace: '午' },
    { date: '2026-01-13', palace: '未' },
    { date: '2026-01-14', palace: '申' },
    { date: '2026-01-15', palace: '酉' },
];

/**
 * 十二地支順序
 */
export const EARTHLY_BRANCHES = [
    '子', '丑', '寅', '卯', '辰', '巳',
    '午', '未', '申', '酉', '戌', '亥'
];

/**
 * 獲取地支的索引
 */
export function getBranchIndex(branch: string): number {
    return EARTHLY_BRANCHES.indexOf(branch);
}

/**
 * 根據索引獲取地支
 */
export function getBranchByIndex(index: number): string {
    // 處理負數和大於11的情況
    const normalizedIndex = ((index % 12) + 12) % 12;
    return EARTHLY_BRANCHES[normalizedIndex];
}

/**
 * 計算兩個地支之間的距離
 */
export function getBranchDistance(from: string, to: string): number {
    const fromIndex = getBranchIndex(from);
    const toIndex = getBranchIndex(to);

    if (fromIndex === -1 || toIndex === -1) return 0;

    let distance = toIndex - fromIndex;
    if (distance < 0) distance += 12;

    return distance;
}
