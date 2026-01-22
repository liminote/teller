'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import EmotionPicker from './EmotionPicker';

interface DailyFeedbackFormProps {
    date: string;
    heavenlyStem: string;
    dailyPalace: string;
    onSave: (data: FeedbackData) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<FeedbackData>;
}

export interface FeedbackData {
    日期: string;
    今日分數: '好' | '普通' | '不好';
    紫微_工作: number;
    紫微_健康: number;
    紫微_財運: number;
    紫微_能量: number;
    八字_體感: string;
    紫微_四化簡述: string;
    情緒: string[];
}

const SI_HUA_MAP: Record<string, string> = {
    '甲': '廉破武陽', '乙': '機梁紫陰', '丙': '同機昌廉', '丁': '陰同機巨',
    '戊': '貪陰右機', '己': '武貪梁曲', '庚': '陽武陰同', '辛': '巨陽曲昌',
    '壬': '梁紫左武', '癸': '破巨陰貪'
};

const SI_HUA_STAR_MAP: Record<string, string> = {
    '廉': '廉貞', '破': '破軍', '武': '武曲', '陽': '太陽', '機': '天機',
    '梁': '天梁', '紫': '紫微', '陰': '太陰', '同': '天同', '昌': '文昌',
    '巨': '巨門', '貪': '貪狼', '右': '右弼', '左': '左輔', '府': '天府',
    '曲': '文曲'
};

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const PALACES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '朋友', '官祿', '田宅', '福德', '父母'];

// 用戶固定星曜地支座標 (紫貪在酉盤局 - 精確校正版)
const USER_STAR_POSITIONS: Record<string, string> = {
    '紫微': '酉', '天機': '申', '太陽': '午', '武曲': '巳', '天同': '辰', '廉貞': '丑',
    '天府': '未', '太陰': '申', '貪狼': '酉', '巨門': '戌', '天相': '亥', '天梁': '子',
    '七殺': '丑', '破軍': '卯', '文昌': '寅', '文曲': '子', '左輔': '申', '右弼': '午'
};

export default function DailyFeedbackForm({
    date,
    heavenlyStem,
    dailyPalace,
    onSave,
    onCancel,
    initialData
}: DailyFeedbackFormProps) {
    const getInitialZiwei = () => {
        if (initialData?.紫微_四化簡述) return initialData.紫微_四化簡述;
        const sihua = SI_HUA_MAP[heavenlyStem];
        if (!sihua) return '';

        const labels = ['祿', '權', '科', '忌'];
        const dailyPalaceIdx = BRANCHES.indexOf(dailyPalace);

        return sihua.split('').map((s, i) => {
            const starName = SI_HUA_STAR_MAP[s] || s;
            const starBranch = USER_STAR_POSITIONS[starName];

            let palaceTag = '';
            if (starBranch) {
                const starBranchIdx = BRANCHES.indexOf(starBranch);
                // 計算星曜相對於流日命宮的宮位距離 (逆時針方向排布)
                let diff = dailyPalaceIdx - starBranchIdx;
                if (diff < 0) diff += 12;
                palaceTag = ` @${PALACES[diff]}`;
            }

            return `${starName}${labels[i]}${palaceTag}：`;
        }).join('\n');
    };

    const [formData, setFormData] = useState<FeedbackData>({
        日期: date,
        今日分數: initialData?.今日分數 || '普通',
        紫微_工作: initialData?.紫微_工作 || 2,
        紫微_健康: initialData?.紫微_健康 || 2,
        紫微_財運: initialData?.紫微_財運 || 2,
        紫微_能量: initialData?.紫微_能量 || 2,
        八字_體感: initialData?.八字_體感 || '',
        紫微_四化簡述: getInitialZiwei(),
        情緒: initialData?.情緒 || [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmotionPicker, setShowEmotionPicker] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const ScoreSelector = ({
        value,
        onChange
    }: {
        value: '好' | '普通' | '不好';
        onChange: (v: '好' | '普通' | '不好') => void;
    }) => {
        const options: Array<'不好' | '普通' | '好'> = ['不好', '普通', '好'];
        const colors = {
            '好': 'bg-[#F0F7F0] border-[#8EA68F] text-[#2D4A31] ring-2 ring-[#8EA68F]/20',
            '普通': 'bg-[#F0F2F5] border-[#8294A5] text-[#2A3B4D] ring-2 ring-[#8294A5]/20',
            '不好': 'bg-[#F9F1F1] border-[#B88A8A] text-[#5C2B2E] ring-2 ring-[#B88A8A]/20',
        };

        return (
            <div className="flex gap-3">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={`flex-1 py-4 px-4 rounded-xl border-2 font-black text-base transition-all chinese-font
              ${value === option
                                ? colors[option] + ' scale-[1.02] border-opacity-100 shadow-md'
                                : 'bg-white border-stone-100 text-[#8E8E8E] hover:border-stone-300'
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        );
    };

    const MetricSelector = ({
        label,
        value,
        onChange
    }: {
        label: string;
        value: number;
        onChange: (v: number) => void;
    }) => {
        const scores = [1, 2, 3];

        return (
            <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#5C5C5C] chinese-font">
                    {label}
                </div>
                <div className="flex gap-2">
                    {scores.map((score) => (
                        <button
                            key={score}
                            type="button"
                            onClick={() => onChange(score)}
                            className={`flex-1 aspect-square rounded-lg border-2 font-black text-base transition-all
                ${value === score
                                    ? 'bg-[#E0E7ED] border-[#5A6A7A] text-[#1A2B3D] scale-[1.05]'
                                    : 'bg-white border-stone-100 text-[#B0B0B0] hover:border-stone-300'
                                }`}
                        >
                            {score}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100/50 space-y-6">
            {/* 今日分數 */}
            <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5C5C5C]">
                    今日分數 /// OVERALL SCORE
                </div>
                <ScoreSelector
                    value={formData.今日分數}
                    onChange={(v) => setFormData({ ...formData, 今日分數: v })}
                />
            </div>

            {/* 各項指標 */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <MetricSelector
                    label="工作 Work"
                    value={formData.紫微_工作}
                    onChange={(v) => setFormData({ ...formData, 紫微_工作: v })}
                />
                <MetricSelector
                    label="健康 Health"
                    value={formData.紫微_健康}
                    onChange={(v) => setFormData({ ...formData, 紫微_健康: v })}
                />
                <MetricSelector
                    label="財運 Wealth"
                    value={formData.紫微_財運}
                    onChange={(v) => setFormData({ ...formData, 紫微_財運: v })}
                />
                <MetricSelector
                    label="能量 Energy"
                    value={formData.紫微_能量}
                    onChange={(v) => setFormData({ ...formData, 紫微_能量: v })}
                />
            </div>

            {/* 情緒選擇 */}
            <div className="space-y-3 pt-2">
                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#5C5C5C] mb-2">
                    今日情緒 // Emotion Meter
                </div>
                <button
                    type="button"
                    onClick={() => setShowEmotionPicker(true)}
                    className="w-full py-4 px-4 rounded-xl border-2 border-stone-200 bg-white text-base text-[#4A4A4A] hover:border-[#8294A5] hover:text-[#2A3B4D] transition-all flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                    <Sparkles size={16} strokeWidth={2.5} className="text-[#8294A5]" />
                    {formData.情緒.length > 0
                        ? `已選擇 ${formData.情緒.length} 個情緒`
                        : '選擇情緒（最多3個）'
                    }
                </button>
                {formData.情緒.length > 0 && (
                    <div className="text-base text-[#2A3B4D] chinese-font text-center py-2 font-black px-4 bg-white rounded-lg border border-divider">
                        {formData.情緒.join(' · ')}
                    </div>
                )}
            </div>

            {/* 文字回饋 */}
            <div className="space-y-4 pt-2">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2D4A31] mb-2 bg-[#E8F0E8] w-fit px-2 py-1 rounded">
                        八字實證 // Bazi Experience
                    </div>
                    <textarea
                        value={formData.八字_體感}
                        onChange={(e) => setFormData({ ...formData, 八字_體感: e.target.value })}
                        placeholder="記錄今日八字能量的體驗與感受..."
                        className="w-full h-28 px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-base text-[#1A1A1A] chinese-font leading-relaxed resize-none focus:outline-none focus:border-[#8EA68F] transition-colors placeholder:text-[#B0B0B0] font-medium"
                    />
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2A3B4D] mb-2 bg-[#E0E7ED] w-fit px-2 py-1 rounded">
                        紫微回饋 // Zi Wei Reflection
                    </div>
                    <textarea
                        value={formData.紫微_四化簡述}
                        onChange={(e) => setFormData({ ...formData, 紫微_四化簡述: e.target.value })}
                        placeholder="記錄今日紫微四化的感觸與心得..."
                        className="w-full h-28 px-4 py-3 rounded-xl border-2 border-stone-200 bg-white text-base text-[#1A1A1A] chinese-font leading-relaxed resize-none focus:outline-none focus:border-[#8294A5] transition-colors placeholder:text-[#B0B0B0] font-medium"
                    />
                </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-400 font-black text-sm hover:border-stone-300 hover:text-stone-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    取消
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-[#8294A5] bg-[#8294A5] text-white font-black text-sm hover:bg-[#6B7F91] hover:border-[#6B7F91] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            儲存中...
                        </>
                    ) : (
                        '儲存記錄'
                    )}
                </button>
            </div>

            {/* 情緒選擇器 Modal */}
            {showEmotionPicker && (
                <EmotionPicker
                    selected={formData.情緒}
                    onChange={(emotions) => setFormData({ ...formData, 情緒: emotions })}
                    onClose={() => setShowEmotionPicker(false)}
                />
            )}
        </div>
    );
}
