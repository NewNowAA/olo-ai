import React, { useState } from 'react';
import { Calendar, Clock, X, Search, Filter } from 'lucide-react';
import DateRangePicker from '../DateRangePicker';
import { DateRangeType } from '../../hooks/useInvoiceFilters';

interface FilterControlsProps {
    dateRange: DateRangeType;
    customStartDate: Date | null;
    customEndDate: Date | null;
    onDateRangeChange: (range: DateRangeType) => void;
    onCustomDatesChange: (dates: { start: Date | null, end: Date | null }) => void;
    // Optional props for detailed filtering (Billing)
    searchText?: string;
    onSearchChange?: (text: string) => void;
    availableCategories?: string[];
    categoryFilter?: string;
    onCategoryChange?: (category: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    dateRange,
    customStartDate,
    customEndDate,
    onDateRangeChange,
    onCustomDatesChange,
    searchText,
    onSearchChange,
    availableCategories,
    categoryFilter,
    onCategoryChange
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row gap-4 w-full md:items-center justify-between">
            {/* Left: Search & Category (if provided) */}
            {(onSearchChange || onCategoryChange) && (
                <div className="flex flex-1 gap-2 items-center">
                    {onSearchChange && (
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar faturas..."
                                value={searchText || ''}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="h-9 w-48 pl-9 pr-3 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    )}
                     {onCategoryChange && availableCategories && (
                         <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={categoryFilter || ''}
                                onChange={(e) => onCategoryChange(e.target.value)}
                                className="h-9 pl-9 pr-8 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#73c6df]/30 appearance-none cursor-pointer text-slate-600 dark:text-slate-300"
                            >
                                <option value="">Todas Categorias</option>
                                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                         </div>
                     )}
                </div>
            )}

            {/* Right: Date Controls */}
            <div className="bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl border border-white/60 dark:border-slate-700 flex items-center gap-2 shadow-sm w-full md:w-auto h-11">
            {/* Custom Date Picker Trigger */}
            <div className="relative">
                <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className={`h-9 px-4 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 ${dateRange === 'custom' ? 'text-[#2e8ba6] border-[#2e8ba6]' : 'text-slate-500 dark:text-slate-400 hover:text-[#73c6df]'}`}
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
            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600 h-9 items-center">
                <button
                    onClick={() => onDateRangeChange('24h')}
                    className={`h-7 px-3 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${dateRange === '24h' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    <Clock size={12} /> 24h
                </button>
                <button
                    onClick={() => onDateRangeChange('30days')}
                    className={`h-7 px-3 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${dateRange === '30days' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    30d
                </button>
                <button
                    onClick={() => onDateRangeChange('year')}
                    className={`h-7 px-3 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${dateRange === 'year' ? 'bg-[#73c6df] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'}`}
                >
                    Ano
                </button>
            </div>
            </div>
        </div>
    );
};

export default FilterControls;
