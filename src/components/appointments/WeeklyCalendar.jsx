import React, { useMemo } from 'react'; // Added React import
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeeklyCalendar = ({ appointments, currentDate, onDateChange }) => {
    // Get Monday of the current week
    const weekStart = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }, [currentDate]);

    // Generate week days
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [weekStart]);

    // Hours 8:00 to 20:00
    const hours = Array.from({ length: 13 }, (_, i) => 8 + i);

    const getWeekRange = () => {
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 6);
        const startStr = weekStart.toLocaleDateString('es-MX', { month: 'long', day: 'numeric' });
        const endStr = end.toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const handlePrevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        onDateChange(d.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        onDateChange(d.toISOString().split('T')[0]);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevWeek} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize min-w-[200px] text-center">
                        {getWeekRange()}
                    </h2>
                    <button onClick={handleNextWeek} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[800px]">
                    {/* Days Header */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <div className="p-3 border-r border-slate-100 dark:border-slate-800"></div>
                        {weekDays.map(day => (
                            <div
                                key={day.toISOString()}
                                className={`
                                    p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0
                                    ${isToday(day) ? 'bg-primary/5' : ''}
                                `}
                            >
                                <div className={`text-xs font-semibold uppercase mb-1 ${isToday(day) ? 'text-primary' : 'text-slate-500'}`}>
                                    {day.toLocaleDateString('es-MX', { weekday: 'short' })}
                                </div>
                                <div className={`
                                    text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto
                                    ${isToday(day) ? 'bg-primary text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}
                                `}>
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time Grid */}
                    <div className="relative">
                        {hours.map(hour => (
                            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[80px]">
                                {/* Time Label */}
                                <div className="p-2 text-xs font-medium text-slate-400 text-right border-r border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                    {hour}:00
                                </div>
                                {/* Day Cells */}
                                {weekDays.map(day => {
                                    const dateStr = day.toISOString().split('T')[0];
                                    const cellAppointments = appointments.filter(a => {
                                        if (a.date !== dateStr) return false;
                                        if (!a.time) return false;
                                        const [h] = a.time.split(':').map(Number);
                                        return h === hour;
                                    });

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={`
                                                border-r border-b border-slate-100 dark:border-slate-800 relative
                                                ${isToday(day) ? 'bg-primary/[0.02]' : ''}
                                            `}
                                        >
                                            {/* Appointments in this cell */}
                                            <div className="absolute inset-0 p-1 flex flex-col gap-1 overflow-visible z-0 pointer-events-none">
                                                {cellAppointments.map(appt => (
                                                    <div
                                                        key={appt.id}
                                                        className="pointer-events-auto bg-blue-100 dark:bg-blue-900/60 border-l-2 border-blue-500 dark:border-blue-400 p-1 rounded-sm text-xs shadow-sm cursor-pointer hover:brightness-95 transition-all z-10"
                                                        title={`${appt.time} - ${appt.patientName} (${appt.reason})`}
                                                    >
                                                        <div className="font-semibold text-blue-900 dark:text-blue-100 truncate leading-tight">
                                                            {appt.time} - {appt.patientName}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendar;
