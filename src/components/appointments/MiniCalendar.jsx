import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MiniCalendar = ({ selectedDate, onDateChange }) => {
    const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate));

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(new Date(selectedDate));
        }
    }, [selectedDate]);

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysArray = [];

        for (let i = 0; i < (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1); i++) {
            daysArray.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            daysArray.push(new Date(year, month, d));
        }

        return daysArray;
    }, [currentMonth]);

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.toISOString().split('T')[0] === selectedDate;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {formatMonthYear(currentMonth)}
                </span>
                <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 p-2 gap-1">
                {daysInMonth.map((date, i) => (
                    <div key={i} className="aspect-square">
                        {date && (
                            <button
                                onClick={() => onDateChange(date.toISOString().split('T')[0])}
                                className={`
                                    w-full h-full flex items-center justify-center rounded-lg text-xs transition-all relative
                                    ${isSelected(date)
                                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }
                                    ${isToday(date) && !isSelected(date) ? 'text-primary font-bold bg-primary/5' : ''}
                                `}
                            >
                                {date.getDate()}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MiniCalendar;
