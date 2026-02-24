import React from 'react';

// ===========================================
// Input Component - Reusable form input
// ===========================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            w-full px-4 py-3 
            bg-white dark:bg-slate-700 
            border border-slate-200 dark:border-slate-600 
            rounded-xl 
            text-slate-800 dark:text-white
            placeholder-slate-400 
            focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 focus:bg-white dark:focus:bg-slate-600
            transition-all shadow-sm
            font-medium text-sm
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            ${error ? 'border-rose-500 focus:ring-rose-500/30' : ''}
            ${className}
          `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
            )}
        </div>
    );
};

export default Input;
