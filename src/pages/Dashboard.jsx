import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Calendar, Clock, Building2, User, Activity, CheckCircle, XCircle, AlertCircle, CalendarCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0,
        byStatus: { scheduled: 0, attended: 0, cancelled: 0, noShow: 0 },
        byHour: {},
        byClinic: {},
        byReason: {},
        byDoctor: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointmentsData();
    }, []);

    const loadAppointmentsData = async () => {
        try {
            // Load appointments from PocketBase
            const allAppointments = await api.appointments.list();

            // Load consultations
            // For now, we'll get stats from appointments only
            // Direct consultations can be added later

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Sunday
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            let todayCount = 0;
            let weekCount = 0;
            let monthCount = 0;
            const byStatus = { scheduled: 0, attended: 0, cancelled: 0, noShow: 0 };
            const byHour = {};
            const byClinic = {};
            const byReason = {};
            const byDoctor = {};
            const todayAppointments = [];

            allAppointments.forEach(apt => {
                // Use string comparison for dates to avoid timezone issues
                const todayStr = now.toISOString().split('T')[0];
                const aptDateStr = apt.date?.split('T')[0] || apt.date;
                const aptDate = new Date(apt.date);
                const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());

                // Count by period
                if (aptDateStr === todayStr) {
                    todayCount++;
                    todayAppointments.push(apt);
                }
                if (aptDay >= weekStart) weekCount++;
                if (aptDay >= monthStart) monthCount++;

                // Count by status based on logic:
                // - Agendadas: date/time is in the future
                // - Asistieron: has consultationCompleted = true
                // - Canceladas: status === 'cancelled'
                // - No llegaron: past date AND no consultationCompleted
                const aptDateTime = new Date(`${apt.date}T${apt.time || '23:59'}`);
                const isPast = aptDateTime < now;
                const isCompleted = apt.consultationCompleted === true || apt.status === 'completed' || apt.status === 'attended';
                const isCancelled = apt.status === 'cancelled';

                if (isCancelled) {
                    byStatus.cancelled++;
                } else if (isCompleted) {
                    byStatus.attended++;
                } else if (isPast) {
                    byStatus.noShow++;
                } else {
                    byStatus.scheduled++;
                }

                // Count by hour (for today)
                if (aptDay.getTime() === today.getTime()) {
                    const hour = apt.time?.split(':')[0] || '09';
                    byHour[hour] = (byHour[hour] || 0) + 1;
                }

                // Count by clinic (handle object case)
                let clinicName = apt.clinicName || 'Sin clínica';
                if (apt.clinic && typeof apt.clinic === 'object') {
                    clinicName = apt.clinic.name || 'Sin clínica';
                } else if (typeof apt.clinic === 'string') {
                    clinicName = apt.clinic;
                }
                byClinic[clinicName] = (byClinic[clinicName] || 0) + 1;

                // Count by reason/service
                const reason = apt.service || apt.reason || 'Consulta General';
                byReason[reason] = (byReason[reason] || 0) + 1;

                // Count by doctor (handle object case)
                let doctorName = apt.doctorName || 'Sin asignar';
                if (apt.doctor && typeof apt.doctor === 'object') {
                    doctorName = apt.doctor.name || 'Sin asignar';
                } else if (typeof apt.doctor === 'string') {
                    doctorName = apt.doctor;
                }
                byDoctor[doctorName] = (byDoctor[doctorName] || 0) + 1;
            });

            // Note: Direct consultations from PocketBase will be handled
            // in a future update when we expand the consultations API

            setAppointments(todayAppointments.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
            setStats({
                today: todayCount,
                week: weekCount,
                month: monthCount,
                byStatus,
                byHour,
                byClinic,
                byReason,
                byDoctor
            });
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get max value for scaling charts
    const maxClinicValue = Math.max(...Object.values(stats.byClinic), 1);
    const maxDoctorValue = Math.max(...Object.values(stats.byDoctor), 1);

    // Colors for donut chart
    const reasonColors = ['#14b8a6', '#0d4f5f', '#06b6d4', '#0891b2', '#0e7490', '#155e75'];

    // Calculate donut segments
    const totalReasons = Object.values(stats.byReason).reduce((a, b) => a + b, 0) || 1;
    let cumulativePercent = 0;
    const donutSegments = Object.entries(stats.byReason).map(([reason, count], idx) => {
        const percent = (count / totalReasons) * 100;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        return { reason, count, percent, startPercent, color: reasonColors[idx % reasonColors.length] };
    });

    // Generate hours for occupation chart (8am - 8pm)
    const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
    const maxHourValue = Math.max(...hours.map(h => stats.byHour[h] || 0), 1);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'attended':
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'noShow':
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            default:
                return <Clock className="w-4 h-4 text-blue-500" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'attended':
            case 'completed':
                return 'Asistió';
            case 'cancelled':
                return 'Canceló';
            case 'noShow':
                return 'No llegó';
            default:
                return 'Agendada';
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">Métricas de Rendimiento</h1>

            {/* Top Stats Row - Citas Hoy, Esta Semana, Este Mes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Citas Hoy */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <Calendar className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Citas Hoy</p>
                            <p className="text-4xl font-bold text-slate-800 dark:text-white">{stats.today}</p>
                            <p className="text-sm text-slate-400">programadas</p>
                        </div>
                    </div>
                </div>

                {/* Esta Semana */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <CalendarCheck className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Esta Semana</p>
                            <p className="text-4xl font-bold text-slate-800 dark:text-white">{stats.week}</p>
                            <p className="text-sm text-slate-400">totales</p>
                        </div>
                    </div>
                </div>

                {/* Este Mes */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <Activity className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Este Mes</p>
                            <p className="text-4xl font-bold text-slate-800 dark:text-white">{stats.month}</p>
                            <p className="text-sm text-slate-400">acumulado</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.byStatus.scheduled}</p>
                        <p className="text-sm text-slate-500">Agendadas</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.byStatus.attended}</p>
                        <p className="text-sm text-slate-500">Asistieron</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.byStatus.cancelled}</p>
                        <p className="text-sm text-slate-500">Canceladas</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.byStatus.noShow}</p>
                        <p className="text-sm text-slate-500">No llegaron</p>
                    </div>
                </div>
            </div>

            {/* Main Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Citas de Hoy */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-[#2a2f38]">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Pacientes con cita del día</span>
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-white">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                        <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                            {stats.today}
                        </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {appointments.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">No hay citas agendadas para hoy</p>
                        ) : (
                            <div className="overflow-x-auto">
                                {/* Table Header */}
                                <div className="grid grid-cols-[40px_50px_minmax(120px,1fr)_100px_95px_75px] gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-[#2a2f38]">
                                    <span>Pac</span>
                                    <span>Hora</span>
                                    <span>Nombre</span>
                                    <span>Teléfono</span>
                                    <span>Estado</span>
                                    <span>Acciones</span>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-100 dark:divide-[#2a2f38]">
                                    {[...appointments].sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((apt, idx) => (
                                        <div key={idx} className="grid grid-cols-[40px_50px_minmax(120px,1fr)_100px_95px_75px] gap-3 py-3 items-center hover:bg-slate-50 dark:hover:bg-[#22262e] transition-colors">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{idx + 1}</span>
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{apt.time || '--:--'}</span>
                                            <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{apt.patientName || 'Sin nombre'}</span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{apt.phone || 'N/A'}</span>
                                            {(() => {
                                                switch (apt.status) {
                                                    case 'completed':
                                                    case 'attended':
                                                        return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">Confirmada</span>;
                                                    case 'cancelled':
                                                        return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">Cancelada</span>;
                                                    case 'noShow':
                                                        return <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">No llegó</span>;
                                                    default:
                                                        return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">Pendiente</span>;
                                                }
                                            })()}
                                            <div className="flex items-center gap-2">
                                                {apt.patientId && (
                                                    <a
                                                        href={`/pacientes/${apt.patientId}/historial`}
                                                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center gap-1"
                                                        title="Ver expediente"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {(() => {
                                                    // Check if WhatsApp window is open (reminder sent today)
                                                    const today = new Date().toISOString().split('T')[0];
                                                    const reminderDate = apt.reminderSentAt ? apt.reminderSentAt.split('T')[0] : null;
                                                    const isWindowOpen = apt.reminderSent && reminderDate === today;

                                                    return (
                                                        <button
                                                            type="button"
                                                            disabled={!isWindowOpen}
                                                            className={`p-1.5 rounded transition-colors ${isWindowOpen
                                                                ? 'bg-green-100 hover:bg-green-200 text-green-600 cursor-pointer'
                                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                }`}
                                                            title={isWindowOpen ? 'Enviar mensaje WhatsApp' : 'WhatsApp no disponible (ventana 24h cerrada)'}
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* Ocupación Semanal - Multi-clinic Line Chart */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Ocupación Semanal</h3>
                        </div>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {stats.week} citas
                        </span>
                    </div>

                    {(() => {
                        // Get appointments from localStorage to calculate weekly by clinic
                        const stored = localStorage.getItem('medflow_appointments');
                        const allAppointments = stored ? JSON.parse(stored) : [];

                        // Get week days (last 7 days)
                        const today = new Date();
                        const weekDays = [];
                        for (let i = 6; i >= 0; i--) {
                            const d = new Date(today);
                            d.setDate(d.getDate() - i);
                            weekDays.push({
                                date: d.toISOString().split('T')[0],
                                label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
                            });
                        }

                        // Get unique clinics (max 5)
                        const clinicNames = [...new Set(allAppointments.map(apt => {
                            if (apt.clinic && typeof apt.clinic === 'object') return apt.clinic.name || 'Sin clínica';
                            if (typeof apt.clinic === 'string') return apt.clinic;
                            return apt.clinicName || 'Sin clínica';
                        }))].slice(0, 5);

                        // Colors for lines
                        const lineColors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

                        // Calculate data per clinic per day
                        const clinicData = clinicNames.map(clinicName => {
                            const dataPoints = weekDays.map(day => {
                                return allAppointments.filter(apt => {
                                    const aptDate = apt.date?.split('T')[0] || apt.date;
                                    let aptClinic = apt.clinicName || 'Sin clínica';
                                    if (apt.clinic && typeof apt.clinic === 'object') aptClinic = apt.clinic.name || 'Sin clínica';
                                    else if (typeof apt.clinic === 'string') aptClinic = apt.clinic;
                                    return aptDate === day.date && aptClinic === clinicName;
                                }).length;
                            });
                            return { name: clinicName, data: dataPoints };
                        });

                        // Calculate max value for Y axis
                        const maxValue = Math.max(...clinicData.flatMap(c => c.data), 1);
                        const chartHeight = 140;
                        const chartWidth = 100; // percentage

                        // Generate Y axis labels
                        const yLabels = [maxValue, Math.round(maxValue / 2), 0];

                        return (
                            <div>
                                {/* Legend */}
                                {clinicNames.length > 1 && (
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {clinicNames.map((clinic, idx) => (
                                            <div key={clinic} className="flex items-center gap-1.5">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: lineColors[idx] }}
                                                />
                                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                                                    {clinic}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Chart */}
                                <div className="relative" style={{ height: chartHeight + 30 }}>
                                    {/* Y Axis Labels */}
                                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 pr-2" style={{ height: chartHeight }}>
                                        {yLabels.map((val, i) => (
                                            <span key={i}>{val}</span>
                                        ))}
                                    </div>

                                    {/* Chart Area */}
                                    <div className="ml-6" style={{ height: chartHeight }}>
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 ml-6 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
                                            {yLabels.map((_, i) => (
                                                <div key={i} className="border-t border-dashed border-slate-200 dark:border-slate-700 w-full" />
                                            ))}
                                        </div>

                                        {/* SVG Lines */}
                                        <svg
                                            viewBox={`0 0 ${weekDays.length - 1} ${maxValue || 1}`}
                                            preserveAspectRatio="none"
                                            className="w-full"
                                            style={{ height: chartHeight }}
                                        >
                                            {clinicData.map((clinic, clinicIdx) => {
                                                const points = clinic.data.map((val, i) =>
                                                    `${i},${maxValue - val}`
                                                ).join(' ');
                                                return (
                                                    <polyline
                                                        key={clinic.name}
                                                        points={points}
                                                        fill="none"
                                                        stroke={lineColors[clinicIdx]}
                                                        strokeWidth="0.15"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                );
                                            })}
                                            {/* Data Points */}
                                            {clinicData.map((clinic, clinicIdx) => (
                                                clinic.data.map((val, i) => (
                                                    <circle
                                                        key={`${clinic.name}-${i}`}
                                                        cx={i}
                                                        cy={maxValue - val}
                                                        r="0.12"
                                                        fill={lineColors[clinicIdx]}
                                                    />
                                                ))
                                            ))}
                                        </svg>
                                    </div>

                                    {/* X Axis Labels */}
                                    <div className="flex justify-between ml-6 mt-2">
                                        {weekDays.map((day, i) => (
                                            <span key={i} className="text-[10px] text-slate-500 dark:text-slate-400 text-center capitalize">
                                                {day.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {clinicNames.length === 0 && (
                                    <p className="text-slate-500 text-sm text-center py-8">Sin datos de citas esta semana</p>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Bottom Row - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Promedio por Clínica */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Citas por Clínica</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Distribución total</p>

                    <div className="space-y-3">
                        {Object.entries(stats.byClinic).length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4">Sin datos de clínicas</p>
                        ) : (
                            Object.entries(stats.byClinic).map(([clinic, count]) => (
                                <div key={clinic} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-300 truncate">{clinic}</span>
                                        <span className="text-slate-800 dark:text-white font-medium">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-[#22262e] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${(count / maxClinicValue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Citas por Médico */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#2a2f38]">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Por Médico</span>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(stats.byDoctor).length === 0 ? (
                                <p className="text-slate-500 text-xs">Sin datos</p>
                            ) : (
                                Object.entries(stats.byDoctor).slice(0, 4).map(([doctor, count]) => (
                                    <div key={doctor} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-300 truncate">{doctor}</span>
                                            <span className="text-slate-800 dark:text-white font-medium">{count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-[#22262e] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/70 rounded-full transition-all"
                                                style={{ width: `${(count / maxDoctorValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Motivo de Consulta - Donut Chart */}
                <div className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#2a2f38] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Motivo de Consulta</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Distribución</p>

                    <div className="flex items-center gap-6">
                        {/* Donut Chart */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                {donutSegments.length === 0 ? (
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2a2f38" strokeWidth="3" />
                                ) : (
                                    donutSegments.map((seg, idx) => (
                                        <circle
                                            key={idx}
                                            cx="18"
                                            cy="18"
                                            r="15.9"
                                            fill="none"
                                            stroke={seg.color}
                                            strokeWidth="3"
                                            strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
                                            strokeDashoffset={-seg.startPercent}
                                            className="transition-all"
                                        />
                                    ))
                                )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalReasons}</span>
                                <span className="text-xs text-slate-500">total</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-2">
                            {donutSegments.length === 0 ? (
                                <p className="text-slate-500 text-sm">Sin datos de consultas</p>
                            ) : (
                                donutSegments.slice(0, 5).map((seg, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{seg.reason}</span>
                                        <span className="text-xs font-medium text-slate-800 dark:text-white">{seg.count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
