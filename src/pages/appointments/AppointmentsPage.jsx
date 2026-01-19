import { useState, useEffect, useMemo } from 'react';
import { CalendarPlus, Trash2, Search, Clock, User, Phone, ChevronLeft, ChevronRight, Building2, FileText, MessageCircle, ExternalLink, Plus, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

// Common consultation reasons
const CONSULTATION_REASONS = [
    'Consulta General',
    'Revisión de Estudios de Laboratorio',
    'Certificado Médico',
    'Curaciones',
    'Procedimientos de Consultorio',
    'Papanicolau / Citología',
    'Control Prenatal',
    'Control de Enfermedades Crónicas',
    'Aplicación de Inyecciones o Medicamentos',
];

// Webhook helper
const callWebhook = async (hookKey, payload, settings) => {
    const url = settings.webhooks?.[hookKey];
    if (!url) return null;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.ok;
    } catch (error) {
        console.error('Webhook error:', error);
        return false;
    }
};

// Calendar Component
const AppointmentCalendar = ({ appointments, onDayClick, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysArray = [];

        // Add empty days for padding
        for (let i = 0; i < firstDay.getDay(); i++) {
            daysArray.push(null);
        }

        // Add actual days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            daysArray.push(new Date(year, month, d));
        }

        return daysArray;
    }, [currentMonth]);

    const getAppointmentsForDay = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(a => a.date === dateStr);
    };

    const formatMonthYear = (date) => {
        return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!date || !selectedDate) return false;
        return date.toISOString().split('T')[0] === selectedDate;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white capitalize">
                    {formatMonthYear(currentMonth)}
                </h3>
                <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {daysInMonth.map((date, i) => {
                    const dayAppointments = getAppointmentsForDay(date);
                    const hasAppointments = dayAppointments.length > 0;

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => date && onDayClick(date.toISOString().split('T')[0])}
                            disabled={!date}
                            className={`
                                min-h-[70px] p-1 border-r border-b border-slate-100 dark:border-slate-800 
                                transition-all duration-150 relative
                                ${!date ? 'bg-slate-50 dark:bg-slate-950' : 'hover:bg-primary/5 dark:hover:bg-primary/10'}
                                ${isToday(date) ? 'bg-primary/10 dark:bg-primary/20' : ''}
                                ${isSelected(date) ? 'ring-2 ring-primary ring-inset' : ''}
                            `}
                        >
                            {date && (
                                <>
                                    <span className={`
                                        text-sm font-medium block
                                        ${isToday(date) ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-300'}
                                    `}>
                                        {date.getDate()}
                                    </span>
                                    {hasAppointments && (
                                        <div className="mt-1 flex justify-center">
                                            <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                                {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Day Detail Panel - Table Format with Cod, Name, Phone, Status
const DayDetail = ({ date, appointments }) => {
    if (!date) return null;

    const dayAppointments = appointments
        .filter(a => a.date === date)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
            case 'attended':
                return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded">Confirmada</span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded">Cancelada</span>;
            case 'noShow':
                return <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded">No llegó</span>;
            default:
                return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">No confirmada</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Pacientes con cita del día</span>
                    <CalendarPlus className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-white capitalize">{formattedDate}</span>
                </div>
            </div>

            {dayAppointments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">No hay citas</p>
            ) : (
                <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-[40px_50px_1fr_90px_100px_80px] gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span>Pac</span>
                        <span>Hora</span>
                        <span>Nombre</span>
                        <span>Teléfono</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dayAppointments.map((appt, idx) => (
                            <div key={appt.id} className="grid grid-cols-[40px_50px_1fr_90px_100px_80px] gap-2 py-2 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{idx + 1}</span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{appt.time || '--:--'}</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-white truncate">{appt.patientName || 'Sin nombre'}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{appt.phone || 'N/A'}</span>
                                {getStatusBadge(appt.status)}
                                <div className="flex items-center gap-1">
                                    {appt.patientId && (
                                        <a
                                            href={`/pacientes/${appt.patientId}/historial`}
                                            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-xs flex items-center gap-1"
                                            title="Ver expediente"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            <span className="hidden sm:inline">Exp.</span>
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        disabled={!(() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const reminderDate = appt.reminderSentAt ? appt.reminderSentAt.split('T')[0] : null;
                                            return appt.reminderSent && reminderDate === today;
                                        })()}
                                        className={`p-1 rounded transition-colors ${(() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const reminderDate = appt.reminderSentAt ? appt.reminderSentAt.split('T')[0] : null;
                                            return appt.reminderSent && reminderDate === today;
                                        })()
                                            ? 'bg-green-100 hover:bg-green-200 text-green-600 cursor-pointer'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                        title={(() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const reminderDate = appt.reminderSentAt ? appt.reminderSentAt.split('T')[0] : null;
                                            return appt.reminderSent && reminderDate === today
                                                ? 'Enviar mensaje WhatsApp'
                                                : 'WhatsApp no disponible (ventana 24h cerrada)';
                                        })()}
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
};

export default function AppointmentsPage() {
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState('calendar');
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    // Form state
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [doctorId, setDoctorId] = useState(settings.activeDoctor || '');
    const [clinicId, setClinicId] = useState(settings.activeClinic || '');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [notes, setNotes] = useState('');

    // New patient form state
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [newPatient, setNewPatient] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [appts, pts] = await Promise.all([
                api.appointments.list(),
                api.patients.list()
            ]);
            setAppointments(appts);
            setPatients(pts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterNewPatient = async () => {
        if (!newPatient.firstName || !newPatient.lastName || !newPatient.phone) {
            toast.error('Nombre, apellido y teléfono son requeridos');
            return;
        }

        try {
            const patientData = {
                firstName: newPatient.firstName,
                lastName: newPatient.lastName,
                phone: newPatient.phone,
                dateOfBirth: newPatient.dateOfBirth || null,
                gender: newPatient.gender || null,
                email: newPatient.email || null,
                address: newPatient.address || null
            };

            const created = await api.patients.create(patientData);

            // Add to local patients list
            setPatients(prev => [...prev, created]);

            // Auto-select the new patient
            setSelectedPatientId(created.id);
            setPatientSearchTerm(`${created.firstName} ${created.lastName}`);

            // Reset form and close
            setNewPatient({
                firstName: '',
                lastName: '',
                phone: '',
                dateOfBirth: '',
                gender: '',
                email: '',
                address: ''
            });
            setShowNewPatientForm(false);

            toast.success('Paciente registrado y seleccionado');
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar paciente');
        }
    };
    const handleSchedule = async () => {
        if (!selectedPatientId || !date || !time) {
            toast.error('Selecciona un paciente, fecha y hora');
            return;
        }

        const selectedPatient = patients.find(p => p.id === selectedPatientId);
        if (!selectedPatient) {
            toast.error('Paciente no encontrado');
            return;
        }

        const patientName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
        const phone = selectedPatient.phone || '';
        const finalReason = reason === 'Otro' ? customReason : reason;

        try {
            // Check Google Calendar availability via n8n webhook if configured
            if (settings.webhooks?.availability) {
                toast.loading('Verificando disponibilidad...', { id: 'availability-check' });
                try {
                    const checkRes = await fetch(settings.webhooks.availability, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            date,
                            time,
                            duration: 30, // Default 30 min appointment
                            doctorId,
                            clinicId
                        })
                    });

                    if (checkRes.ok) {
                        const availabilityData = await checkRes.json();
                        // Expect response: { available: true/false, message?: string }
                        if (availabilityData.available === false) {
                            toast.dismiss('availability-check');
                            toast.error(availabilityData.message || 'Horario no disponible en Google Calendar');
                            return;
                        }
                    }
                    toast.dismiss('availability-check');
                } catch (webhookError) {
                    console.error('Error checking availability:', webhookError);
                    toast.dismiss('availability-check');
                    // Continue anyway if webhook fails - don't block appointment
                    toast.warning('No se pudo verificar disponibilidad, continuando...');
                }
            }

            const appointment = await api.appointments.create({
                patientId: selectedPatientId,
                patientName,
                phone,
                date,
                time,
                doctorId,
                clinicId,
                reason: finalReason || 'Consulta General',
                notes,
                status: 'scheduled',
                doctor: settings.doctors?.find(d => d.id === doctorId),
                clinic: settings.clinics?.find(c => c.id === clinicId)
            });

            if (settings.webhooks?.schedule) {
                await callWebhook('schedule', appointment, settings);
            }

            setAppointments([appointment, ...appointments]);
            // Clear form
            setSelectedPatientId('');
            setPatientSearchTerm('');
            setDate('');
            setTime('');
            setReason('');
            setCustomReason('');
            setNotes('');
            toast.success('Cita agendada exitosamente');
        } catch (error) {
            toast.error('Error al agendar cita');
        }
    };

    const handleDelete = async (id) => {
        try {
            const appointment = appointments.find(a => a.id === id);
            await api.appointments.delete(id);

            if (settings.webhooks?.delete) {
                await callWebhook('delete', appointment, settings);
            }

            setAppointments(appointments.filter(a => a.id !== id));
            toast.success('Cita eliminada');
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Filter appointments for delete tab: only show today and future
    const todayStr = new Date().toISOString().split('T')[0];
    const futureAppointments = appointments.filter(a => {
        return a.date >= todayStr;
    });

    const filteredAppointments = futureAppointments.filter(a =>
        a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Citas</h1>
            <p className="text-slate-500 dark:text-slate-400">Administra las citas de tus pacientes</p>

            {/* Tab Buttons */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    type="button"
                    onClick={() => setActiveTab('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'calendar'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <CalendarPlus className="w-4 h-4" /> Calendario
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'schedule'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <CalendarPlus className="w-4 h-4" /> Agendar
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('delete')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'delete'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Trash2 className="w-4 h-4" /> Eliminar
                </button>
            </div>

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <AppointmentCalendar
                            appointments={appointments}
                            onDayClick={setSelectedDate}
                            selectedDate={selectedDate}
                        />
                    </div>
                    <div>
                        <DayDetail date={selectedDate} appointments={appointments} />
                    </div>
                </div>
            )}

            {/* Schedule Tab Content */}
            {activeTab === 'schedule' && (
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-center flex-1">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CalendarPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nueva Cita</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Completa los datos para agendar</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Paciente
                        </button>
                    </div>

                    {/* Inline New Patient Form */}
                    {showNewPatientForm && (
                        <div className="mb-6 p-4 border-2 border-green-200 dark:border-green-800 rounded-xl bg-green-50 dark:bg-green-900/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={newPatient.firstName}
                                        onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                        placeholder="Nombre"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido *</label>
                                    <input
                                        type="text"
                                        value={newPatient.lastName}
                                        onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                        placeholder="Apellido"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono *</label>
                                    <input
                                        type="tel"
                                        value={newPatient.phone}
                                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                        placeholder="Teléfono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        value={newPatient.dateOfBirth}
                                        onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sexo</label>
                                    <select
                                        value={newPatient.gender}
                                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newPatient.email}
                                        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        value={newPatient.address}
                                        onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500"
                                        placeholder="Dirección"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPatientForm(false)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegisterNewPatient}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Registrar Paciente
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <User className="w-4 h-4 inline mr-1" /> Seleccionar Paciente *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Buscar paciente por nombre o teléfono..."
                                    value={patientSearchTerm}
                                    onChange={(e) => {
                                        setPatientSearchTerm(e.target.value);
                                        setSelectedPatientId('');
                                    }}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                {patientSearchTerm && !selectedPatientId && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {patients
                                            .filter(p =>
                                                `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                                                (p.phone && p.phone.includes(patientSearchTerm))
                                            )
                                            .slice(0, 8)
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatientId(p.id);
                                                        setPatientSearchTerm(`${p.firstName} ${p.lastName}`);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                >
                                                    <div className="font-medium text-slate-800 dark:text-white">{p.firstName} {p.lastName}</div>
                                                    <div className="text-xs text-slate-500">{p.phone || 'Sin teléfono'}</div>
                                                </button>
                                            ))
                                        }
                                        {patients.filter(p =>
                                            `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                                            (p.phone && p.phone.includes(patientSearchTerm))
                                        ).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-slate-500">No se encontraron pacientes</div>
                                            )}
                                    </div>
                                )}
                            </div>
                            {selectedPatientId && (() => {
                                const p = patients.find(pt => pt.id === selectedPatientId);
                                return p ? (
                                    <div className="mt-2 flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                                        <span className="text-green-700 dark:text-green-300">✓ Paciente seleccionado:</span>
                                        <span className="font-medium text-slate-800 dark:text-white">{p.firstName} {p.lastName}</span>
                                        <span className="text-slate-500">| Tel: {p.phone || 'N/A'}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora *</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                step="1800"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <Building2 className="w-4 h-4 inline mr-1" /> Clínica
                            </label>
                            <select
                                value={clinicId}
                                onChange={(e) => setClinicId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {settings.clinics?.slice(0, 5).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Médico</label>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {settings.doctors?.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <FileText className="w-4 h-4 inline mr-1" /> Motivo de Consulta
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Seleccionar motivo</option>
                                {CONSULTATION_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                                <option value="Otro">Otro (especificar)</option>
                            </select>
                        </div>

                        {reason === 'Otro' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Especificar motivo</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Describe el motivo de la consulta"
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                            <textarea
                                autoComplete="off"
                                placeholder="Observaciones adicionales..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full mt-6"
                        size="lg"
                        onClick={handleSchedule}
                        disabled={!selectedPatientId || !date || !time}
                    >
                        <CalendarPlus className="w-5 h-5 mr-2" /> Agendar Cita
                    </Button>
                </Card>
            )
            }

            {/* Delete Tab Content */}
            {
                activeTab === 'delete' && (
                    <Card>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Eliminar Cita</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Solo citas de hoy en adelante</p>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                autoComplete="off"
                                placeholder="Buscar por nombre o teléfono"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <Button variant="secondary">
                                <Search className="w-4 h-4 mr-1" /> Buscar
                            </Button>
                        </div>

                        {loading ? <Spinner /> : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {filteredAppointments.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No hay citas para mostrar</p>
                                ) : (
                                    filteredAppointments.map(appt => (
                                        <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{appt.patientName}</p>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {appt.date} {appt.time}
                                                        </span>
                                                        {appt.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                {appt.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {appt.reason && (
                                                        <p className="text-xs text-slate-400 mt-1">{appt.reason}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(appt.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                )
            }
        </div >
    );
}
