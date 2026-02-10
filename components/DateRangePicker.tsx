import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (dates: { start: Date | null; end: Date | null }) => void;
    onClose: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(startDate || new Date());
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // Internal state to hold selection before confirming
    const [tempStart, setTempStart] = useState<Date | null>(startDate);
    const [tempEnd, setTempEnd] = useState<Date | null>(endDate);

    // Sync internal state if props change (optional, but good for re-opening)
    useEffect(() => {
        setTempStart(startDate);
        setTempEnd(endDate);
    }, [startDate, endDate]);

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

        const days = [];
        // Empty slots for previous month days
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const handleDateClick = (date: Date) => {
        if (!tempStart || (tempStart && tempEnd)) {
            // Start new selection (clearing previous range or starting fresh)
            setTempStart(date);
            setTempEnd(null);
        } else if (tempStart && !tempEnd) {
            // Completing the range
            if (date < tempStart) {
                // If clicked date is before start date, make it the new start date
                setTempStart(date);
                setTempEnd(null);
            } else {
                // Set end date
                setTempEnd(date);
            }
        }
    };

    const isSelected = (date: Date) => {
        if (!tempStart) return false;
        if (date.toDateString() === tempStart.toDateString()) return true;
        if (tempEnd && date.toDateString() === tempEnd.toDateString()) return true;
        return false;
    };

    const isInRange = (date: Date) => {
        if (!tempStart || !date) return false;
        const targetEnd = tempEnd || hoverDate;
        if (!targetEnd) return false;

        // Check if date is strictly between start and targetEnd
        return date > tempStart && date < targetEnd;
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '--/--/----';
        return date.toLocaleDateString('pt-BR');
    };

    const handleConfirm = () => {
        if (tempStart && tempEnd) {
            onChange({ start: tempStart, end: tempEnd });
            onClose();
        }
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="absolute top-12 right-0 bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 z-50 w-80 animate-in fade-in zoom-in-95 select-none font-sans">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 px-2">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white capitalize tracking-tight">
                    {monthName}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-3 px-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 mb-6">
                {days.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} />;

                    const isToday = date.toDateString() === new Date().toDateString();
                    const selected = isSelected(date);
                    const inRange = isInRange(date);

                    // Button Classes Logic
                    let btnClass = "h-8 w-8 mx-auto rounded-lg text-xs font-bold transition-all relative flex items-center justify-center ";

                    if (selected) {
                        btnClass += "bg-[#2e8ba6] text-white shadow-lg shadow-[#2e8ba6]/30 z-10 scale-110";
                    } else if (inRange) {
                        btnClass += "bg-[#73c6df]/20 text-[#2e8ba6] w-full rounded-none mx-0 first:rounded-l-lg last:rounded-r-lg";
                    } else {
                        btnClass += "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
                        if (isToday) btnClass += " border border-[#2e8ba6] text-[#2e8ba6]";
                    }

                    return (
                        <div key={index} className="flex justify-center w-full">
                            {/* Wrapper for range styling continuity if needed, simplified here */}
                            <button
                                onClick={() => handleDateClick(date)}
                                onMouseEnter={() => setHoverDate(date)}
                                onMouseLeave={() => setHoverDate(null)}
                                className={btnClass}
                            >
                                {date.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Footer Status */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 border border-slate-100 dark:border-slate-600">
                <div className="flex justify-between items-center text-xs">
                    <div className="text-center w-1/2 border-r border-slate-200 dark:border-slate-600 pr-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Início</span>
                        <span className={`font-bold ${tempStart ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                            {formatDate(tempStart)}
                        </span>
                    </div>
                    <div className="text-center w-1/2 pl-2">
                        <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Fim</span>
                        <span className={`font-bold ${tempEnd ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                            {formatDate(tempEnd)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!tempStart || !tempEnd}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${tempStart && tempEnd
                        ? 'bg-[#2e8ba6] text-white hover:bg-[#257a91] shadow-[#2e8ba6]/20 transform hover:-translate-y-0.5'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                >
                    Confirmar Período
                </button>
            </div>
        </div>
    );
};

export default DateRangePicker;
