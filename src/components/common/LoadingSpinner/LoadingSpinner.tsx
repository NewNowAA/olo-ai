import React from 'react';
import { Loader2 } from 'lucide-react';

// ===========================================
// LoadingSpinner Component
// ===========================================

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

const sizeStyles: Record<string, { icon: number; text: string }> = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 24, text: 'text-sm' },
    lg: { icon: 32, text: 'text-base' },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    fullScreen = false,
}) => {
    const styles = sizeStyles[size];

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                size={styles.icon}
                className="animate-spin text-[#73c6df]"
            />
            {text && (
                <span className={`${styles.text} text-slate-500 font-medium`}>
                    {text}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
