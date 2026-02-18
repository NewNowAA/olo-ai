import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// ===========================================
// Modal Component - Reusable modal dialog
// ===========================================

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom' | '2xl' | '3xl' | '4xl' | '5xl';
    showCloseButton?: boolean;
    footer?: React.ReactNode;
    noPadding?: boolean;
    bodyClassName?: string;
}

const sizeStyles: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'max-w-7xl',
    '4xl': 'max-w-[112rem]', // 8xl equivalent or larger
    '5xl': 'max-w-full m-4',  // Almost full screen
    'custom': '', // User provides width via className on a wrapper if needed, or just standard width
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    footer,
    noPadding = false,
    bodyClassName = '',
}) => {
    // Handle escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    // Use createPortal to render at document.body level
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`
                    flex flex-col
                    relative z-10 w-full ${sizeStyles[size] || sizeStyles['md']}
                    bg-white dark:bg-slate-800 
                    rounded-[2rem] shadow-2xl
                    max-h-[90vh] overflow-hidden
                    animate-in fade-in zoom-in-95 duration-200
                `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex-none flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20">
                        {title ? (
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {title}
                            </h2>
                        ) : <div></div>}
                        
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div 
                    className={`
                        flex-1 overflow-y-auto 
                        ${noPadding ? '' : 'p-6'} 
                        ${bodyClassName}
                    `}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex-none p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
