import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import DateRangePicker from '../DateRangePicker';
import { DateRangeType } from '../../hooks/useInvoiceFilters';

interface FilterControlsProps {
    dateRange: DateRangeType;
    customStartDate: Date | null;
    customEndDate: Date | null;
    onDateRangeChange: (range: DateRangeType) => void;
    onCustomDatesChange: (dates: { start: Date | null, end: Date | null }) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    dateRange,
    customStartDate,
    customEndDate,
    onDateRangeChange,
    onCustomDatesChange
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    return (
        <div className="bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl border border-white/60 dark:border-slate-700 flex items-center gap-2 shadow-sm w-full md:w-auto overflow-x-auto">
            {/* Custom Date Picker Trigger */}
            <div className="relative">
                <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 ${dateRange === 'custom' ? 'text-[#2e8ba6] border-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
                >
                    <Calendar size={14} />
                    {dateRange === 'custom' && customStartDate && customEndDate
                        ? `${customStartDate.toLocaleDateString('pt-BR')} - ${customEndDate.toLocaleDateString('pt-BR')}`
                        : 'Personalizar'}
                    {dateRange === 'custom' && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onDateRangeChange('year');
                                onCustomDatesChange({ start: null, end: null });
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full"
                        >
                            <X size={12} />
                        </span>
                    )}
                </button>

                {isDatePickerOpen && (
                    <DateRangePicker
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onChange={(dates) => {
                            onCustomDatesChange(dates);
                        }}
                        onClose={() => {
                            setIsDatePickerOpen(false);
                            if (customStartDate && customEndDate) {
                                onDateRangeChange('custom');
                            }
                        }}
                    />
                )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                <button
                    onClick={() => onDateRangeChange('24h')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${dateRange === '24h' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    <Clock size={12} /> 24h
                </button>
                <button
                    onClick={() => onDateRangeChange('30days')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${dateRange === '30days' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    30d
                </button>
                <button
                    onClick={() => onDateRangeChange('year')}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${dateRange === 'year' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    Ano
                </button>
            </div>
        </div>
    );
};

export default FilterControls;
