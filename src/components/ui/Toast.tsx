import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastType } from '../../contexts/ToastContext';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500" />,
  info: <Info className="w-5 h-5 text-sky-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const bgColors = {
  success: 'bg-white dark:bg-slate-800 border-emerald-500/20',
  error: 'bg-white dark:bg-slate-800 border-rose-500/20',
  info: 'bg-white dark:bg-slate-800 border-sky-500/20',
  warning: 'bg-white dark:bg-slate-800 border-amber-500/20',
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-3 w-full max-w-sm p-4 rounded-xl shadow-lg border ${bgColors[type]} backdrop-blur-sm`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
