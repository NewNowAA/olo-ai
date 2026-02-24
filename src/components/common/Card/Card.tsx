import React from 'react';

// ===========================================
// Card Component - Base card for all card variants
// ===========================================

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingStyles: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
    onClick,
}) => {
    return (
        <div
            className={`
        bg-white/40 dark:bg-slate-800/40 
        backdrop-blur-md 
        border border-white/50 dark:border-slate-700 
        rounded-[2rem] shadow-sm
        ${hover ? 'hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
