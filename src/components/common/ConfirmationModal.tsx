import React from 'react';
import { Modal } from './Modal';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'info' | 'success' | 'warning';
    singleButton?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    singleButton = false,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertCircle size={48} className="text-rose-500" />;
            case 'success': return <CheckCircle2 size={48} className="text-[#2dd4bf]" />;
            case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
            default: return <Info size={48} className="text-[#73c6df]" />;
        }
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
            <div className="flex flex-col items-center text-center p-4">
                <div className="mb-4 p-4 rounded-full bg-slate-50 dark:bg-slate-700/50">
                    {getIcon()}
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {title}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    {message}
                </p>

                <div className="flex gap-3 w-full">
                    {!singleButton && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-lg ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' :
                                type === 'success' ? 'bg-[#2dd4bf] hover:bg-[#14b8a6] shadow-[#2dd4bf]/20' :
                                    'bg-[#73c6df] hover:bg-[#0ea5e9] shadow-[#73c6df]/20'
                            }`}
                    >
                        {singleButton ? 'OK' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
