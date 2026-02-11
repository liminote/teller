
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#E5E2DB] flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-[32px] shadow-xl border-2 border-slate-200 max-w-md">
                        <h2 className="text-2xl font-black text-[#B25050] mb-4 chinese-font">系統發生預期外的錯誤</h2>
                        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                            很抱歉，Teller 暫時遇到了點問題。
                            這可能是由於資料格式異常或網路不穩導致的。
                        </p>
                        <pre className="text-[10px] bg-stone-50 p-4 rounded-xl mb-6 text-left overflow-auto max-h-32 text-slate-400">
                            {this.state.error?.message}
                        </pre>
                        <button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            className="w-full py-4 bg-[#8294A5] text-white rounded-2xl font-black hover:bg-[#6B7F91] transition-all"
                        >
                            嘗試重啟介面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
