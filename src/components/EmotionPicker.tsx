'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EMOTIONS, getQuadrantBg, type Emotion } from '@/lib/emotion-data';
import { X } from 'lucide-react';

interface EmotionPickerProps {
    selected: string[];
    onChange: (emotions: string[]) => void;
    onClose: () => void;
}

export default function EmotionPicker({ selected, onChange, onClose }: EmotionPickerProps) {
    const [tempSelected, setTempSelected] = useState<string[]>(selected);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 禁止背景捲動
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleToggle = (chinese: string) => {
        if (tempSelected.includes(chinese)) {
            setTempSelected(tempSelected.filter(e => e !== chinese));
        } else {
            if (tempSelected.length < 3) {
                setTempSelected([...tempSelected, chinese]);
            }
        }
    };

    const handleConfirm = () => {
        onChange(tempSelected);
        onClose();
    };

    if (!mounted) return null;

    const quadrants = {
        red: EMOTIONS.filter(e => e.quadrant === 'red'),
        yellow: EMOTIONS.filter(e => e.quadrant === 'yellow'),
        blue: EMOTIONS.filter(e => e.quadrant === 'blue'),
        green: EMOTIONS.filter(e => e.quadrant === 'green'),
    };

    const QuadrantSection = ({
        title,
        emotions,
        bgColor
    }: {
        title: string;
        emotions: Emotion[];
        bgColor: string;
    }) => (
        <div className="space-y-3">
            <div className="text-sm font-black uppercase tracking-wider text-black px-1 border-l-4 border-slate-900 pl-3">
                {title}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {emotions.map((emotion) => {
                    const isSelected = tempSelected.includes(emotion.chinese);
                    return (
                        <button
                            key={emotion.chinese}
                            onClick={() => handleToggle(emotion.chinese)}
                            disabled={!isSelected && tempSelected.length >= 3}
                            className={`
                                px-4 py-3 rounded-xl text-base font-bold chinese-font
                                transition-all border-2
                                ${isSelected
                                    ? 'border-black bg-black text-white scale-[1.02] shadow-lg'
                                    : 'border-slate-200 hover:border-black bg-white'
                                }
                                ${!isSelected && tempSelected.length >= 3
                                    ? 'opacity-20 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }
                            `}
                            style={{
                                backgroundColor: isSelected ? undefined : bgColor,
                                color: isSelected ? undefined : '#000000'
                            }}
                        >
                            {emotion.chinese}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-4 border-black">
                {/* Header */}
                <div className="p-8 border-b-2 border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-black">
                            情緒量表
                        </h2>
                        <p className="text-base text-slate-600 mt-2 font-bold">
                            請選擇最多 3 個情緒 (已選 {tempSelected.length}/3)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center transition-colors text-black hover:bg-black hover:text-white"
                    >
                        <X size={28} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <QuadrantSection
                            title="🔴 高能量 + 低愉悅 (憤怒、壓力)"
                            emotions={quadrants.red}
                            bgColor={getQuadrantBg('red')}
                        />
                        <QuadrantSection
                            title="🟡 高能量 + 高愉悅 (興奮、快樂)"
                            emotions={quadrants.yellow}
                            bgColor={getQuadrantBg('yellow')}
                        />
                        <QuadrantSection
                            title="🔵 低能量 + 低愉悅 (沮喪、疲累)"
                            emotions={quadrants.blue}
                            bgColor={getQuadrantBg('blue')}
                        />
                        <QuadrantSection
                            title="🟢 低能量 + 高愉悅 (平靜、放鬆)"
                            emotions={quadrants.green}
                            bgColor={getQuadrantBg('green')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t-2 border-slate-100 flex gap-4 bg-slate-50 rounded-b-[36px]">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 px-6 rounded-2xl border-2 border-slate-300 bg-white text-black font-black text-lg hover:bg-slate-100 transition-all"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-5 px-6 rounded-2xl border-2 border-black bg-black text-white font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
                    >
                        確認選擇 ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
