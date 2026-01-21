import { useState, useEffect } from 'react';
import { Bot, Clock, Copy, Check, RefreshCw, Shield, Save, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

const BEHAVIORS = [
    { id: 'profesional', label: 'Profesional', emoji: '👔' },
    { id: 'amigable', label: 'Amigable', emoji: '😊' },
    { id: 'empatico', label: 'Empático', emoji: '💚' },
    { id: 'conciso', label: 'Conciso', emoji: '📝' },
    { id: 'detallado', label: 'Detallado', emoji: '📖' }
];

const DAYS = [
    { id: 0, name: 'Domingo', short: 'Dom' },
    { id: 1, name: 'Lunes', short: 'Lun' },
    { id: 2, name: 'Martes', short: 'Mar' },
    { id: 3, name: 'Miércoles', short: 'Mié' },
    { id: 4, name: 'Jueves', short: 'Jue' },
    { id: 5, name: 'Viernes', short: 'Vie' },
    { id: 6, name: 'Sábado', short: 'Sáb' }
];

const DURATIONS = [
    { value: 15, label: '15 minutos' },
    { value: 20, label: '20 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' }
];

export default function AutomationSection() {
    const {
        settings,
        updateAutomation,
        generateApiToken,
        updateClinicSchedule,
        getClinicSchedule
    } = useSettings();

    const automation = settings.automation || {};
    const clinics = settings.clinics || [];

    const [botName, setBotName] = useState(automation.botName || 'Medi');
    const [botBehavior, setBotBehavior] = useState(automation.botBehavior || ['profesional']);
    const [appointmentDuration, setAppointmentDuration] = useState(automation.appointmentDuration || 30);
    const [enabled, setEnabled] = useState(automation.enabled || false);
    const [copied, setCopied] = useState(false);

    // Schedule state
    const [selectedClinic, setSelectedClinic] = useState(clinics[0]?.id || '');
    const [schedule, setSchedule] = useState({});

    // Load schedule when clinic changes
    useEffect(() => {
        if (selectedClinic) {
            const clinicSchedule = getClinicSchedule(selectedClinic);
            if (clinicSchedule) {
                setSchedule(clinicSchedule);
            } else {
                // Default schedule: Mon-Fri 9-18, closed weekends
                setSchedule({
                    0: null,
                    1: { start: '09:00', end: '18:00' },
                    2: { start: '09:00', end: '18:00' },
                    3: { start: '09:00', end: '18:00' },
                    4: { start: '09:00', end: '18:00' },
                    5: { start: '09:00', end: '18:00' },
                    6: null
                });
            }
        }
    }, [selectedClinic]);

    const handleBehaviorToggle = (behaviorId) => {
        if (botBehavior.includes(behaviorId)) {
            setBotBehavior(botBehavior.filter(b => b !== behaviorId));
        } else {
            setBotBehavior([...botBehavior, behaviorId]);
        }
    };

    const handleSaveBotConfig = () => {
        updateAutomation({
            enabled,
            botName,
            botBehavior,
            appointmentDuration
        });
        toast.success('Configuración del bot guardada');
    };

    const handleGenerateToken = () => {
        generateApiToken();
        toast.success('Token generado');
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(automation.apiToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Token copiado');
    };

    const handleDayToggle = (dayId) => {
        if (schedule[dayId]) {
            setSchedule({ ...schedule, [dayId]: null });
        } else {
            setSchedule({ ...schedule, [dayId]: { start: '09:00', end: '18:00' } });
        }
    };

    const handleTimeChange = (dayId, field, value) => {
        setSchedule({
            ...schedule,
            [dayId]: { ...schedule[dayId], [field]: value }
        });
    };

    const handleSaveSchedule = () => {
        updateClinicSchedule(selectedClinic, schedule);
        toast.success('Horarios guardados');
    };

    return (
        <div className="space-y-6">
            {/* Bot Configuration */}
            <Card title="Configuración del Chatbot">
                <div className="space-y-4">
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Bot className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium text-slate-700 dark:text-slate-300">Automatización activa</p>
                                <p className="text-sm text-slate-500">Permite agendar citas vía chatbot</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Bot Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nombre del Bot
                        </label>
                        <input
                            type="text"
                            value={botName}
                            onChange={(e) => setBotName(e.target.value)}
                            placeholder="Ej: Medi, Asistente, etc."
                            className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Bot Behavior */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Comportamiento del Bot
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {BEHAVIORS.map(behavior => (
                                <button
                                    key={behavior.id}
                                    type="button"
                                    onClick={() => handleBehaviorToggle(behavior.id)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${botBehavior.includes(behavior.id)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                        }`}
                                >
                                    {behavior.emoji} {behavior.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appointment Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Duración de cita por defecto
                        </label>
                        <select
                            value={appointmentDuration}
                            onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                            className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            {DURATIONS.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    <Button onClick={handleSaveBotConfig}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Configuración
                    </Button>
                </div>
            </Card>

            {/* API Token */}
            <Card title="Token de API para n8n">
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Este token se usa para autenticar las peticiones desde n8n.
                        <strong className="text-amber-600"> Manténlo seguro.</strong>
                    </p>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                readOnly
                                value={automation.apiToken || 'No generado'}
                                className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-mono text-sm"
                            />
                            {automation.apiToken && (
                                <button
                                    onClick={handleCopyToken}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>
                            )}
                        </div>
                        <Button onClick={handleGenerateToken} variant="secondary">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {automation.apiToken ? 'Regenerar' : 'Generar'}
                        </Button>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex gap-2">
                            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Uso en n8n:</strong> Agrega este token en el header de tus peticiones HTTP:
                                <code className="block mt-1 p-2 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">
                                    Authorization: Bearer {automation.apiToken || 'TU_TOKEN'}
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Clinic Schedules */}
            <Card title="Horarios de Atención por Clínica">
                <div className="space-y-4">
                    {/* Clinic Selector */}
                    {clinics.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Seleccionar Clínica
                            </label>
                            <select
                                value={selectedClinic}
                                onChange={(e) => setSelectedClinic(e.target.value)}
                                className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {clinics.map(clinic => (
                                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Schedule Grid */}
                    <div className="space-y-2">
                        {DAYS.map(day => (
                            <div key={day.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="w-24">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={!!schedule[day.id]}
                                            onChange={() => handleDayToggle(day.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {day.name}
                                        </span>
                                    </label>
                                </div>

                                {schedule[day.id] ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={schedule[day.id]?.start || '09:00'}
                                            onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                                            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                        <span className="text-slate-500">a</span>
                                        <input
                                            type="time"
                                            value={schedule[day.id]?.end || '18:00'}
                                            onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                                            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Cerrado</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button onClick={handleSaveSchedule}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Guardar Horarios
                    </Button>
                </div>
            </Card>
        </div>
    );
}
