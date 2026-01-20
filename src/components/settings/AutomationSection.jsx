import { useState, useEffect } from 'react';
import { Bot, Calendar, Clock, RefreshCw, Copy, Check, Shield, Zap } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const DAYS = [
    { id: 0, name: 'Domingo', short: 'Dom' },
    { id: 1, name: 'Lunes', short: 'Lun' },
    { id: 2, name: 'Martes', short: 'Mar' },
    { id: 3, name: 'Miércoles', short: 'Mié' },
    { id: 4, name: 'Jueves', short: 'Jue' },
    { id: 5, name: 'Viernes', short: 'Vie' },
    { id: 6, name: 'Sábado', short: 'Sáb' }
];

const BEHAVIORS = [
    { id: 'profesional', label: 'Profesional', emoji: '👔' },
    { id: 'amigable', label: 'Amigable', emoji: '😊' },
    { id: 'empatico', label: 'Empático', emoji: '💚' },
    { id: 'conciso', label: 'Conciso', emoji: '⚡' },
    { id: 'detallado', label: 'Detallado', emoji: '📋' }
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
    const [selectedClinic, setSelectedClinic] = useState(clinics[0]?.id || '');
    const [clinicSchedule, setClinicSchedule] = useState({});

    // Load schedule for selected clinic
    useEffect(() => {
        if (selectedClinic) {
            const schedule = getClinicSchedule(selectedClinic) || {};
            setClinicSchedule(schedule);
        }
    }, [selectedClinic]);

    const handleBehaviorToggle = (behaviorId) => {
        if (botBehavior.includes(behaviorId)) {
            setBotBehavior(botBehavior.filter(b => b !== behaviorId));
        } else {
            setBotBehavior([...botBehavior, behaviorId]);
        }
    };

    const handleSaveBot = () => {
        updateAutomation({
            botName,
            botBehavior,
            appointmentDuration,
            enabled
        });
        toast.success('Configuración del bot guardada');
    };

    const handleGenerateToken = () => {
        const token = generateApiToken();
        toast.success('Token API generado');
    };

    const handleCopyToken = () => {
        if (automation.apiToken) {
            navigator.clipboard.writeText(automation.apiToken);
            setCopied(true);
            toast.success('Token copiado al portapapeles');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDayToggle = (dayId) => {
        const newSchedule = { ...clinicSchedule };
        if (newSchedule[dayId]) {
            delete newSchedule[dayId];
        } else {
            newSchedule[dayId] = { start: '09:00', end: '18:00' };
        }
        setClinicSchedule(newSchedule);
    };

    const handleTimeChange = (dayId, field, value) => {
        const newSchedule = { ...clinicSchedule };
        if (newSchedule[dayId]) {
            newSchedule[dayId] = { ...newSchedule[dayId], [field]: value };
            setClinicSchedule(newSchedule);
        }
    };

    const handleSaveSchedule = () => {
        if (selectedClinic) {
            updateClinicSchedule(selectedClinic, clinicSchedule);
            toast.success('Horarios guardados');
        }
    };

    const getClinicName = (clinicId) => {
        return clinics.find(c => c.id === clinicId)?.name || 'Clínica';
    };

    return (
        <div className="space-y-6">
            {/* Bot Configuration */}
            <Card title="Configuración del Chatbot">
                <div className="space-y-6">
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-white">Automatización n8n</h4>
                                <p className="text-sm text-slate-500">Permite agendar citas desde WhatsApp</p>
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
                        <p className="text-xs text-slate-500 mt-1">
                            Este nombre se usará en las respuestas del chatbot
                        </p>
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
                            Duración de cita (minutos)
                        </label>
                        <select
                            value={appointmentDuration}
                            onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                            className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            <option value={15}>15 minutos</option>
                            <option value={20}>20 minutos</option>
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={60}>60 minutos</option>
                        </select>
                    </div>

                    <Button onClick={handleSaveBot}>
                        <Zap className="w-4 h-4 mr-2" />
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Define los horarios de atención para que el bot pueda verificar disponibilidad.
                    </p>

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

                    {clinics.length === 1 && (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            📍 {clinics[0].name}
                        </p>
                    )}

                    {/* Schedule Editor */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Día</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Abierto</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Apertura</th>
                                    <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300">Cierre</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {DAYS.map(day => {
                                    const isOpen = !!clinicSchedule[day.id];
                                    return (
                                        <tr key={day.id} className={isOpen ? '' : 'bg-slate-50/50 dark:bg-slate-900/30'}>
                                            <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {day.name}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isOpen}
                                                    onChange={() => handleDayToggle(day.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="time"
                                                    value={clinicSchedule[day.id]?.start || '09:00'}
                                                    onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                                                    disabled={!isOpen}
                                                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm disabled:opacity-50"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="time"
                                                    value={clinicSchedule[day.id]?.end || '18:00'}
                                                    onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                                                    disabled={!isOpen}
                                                    className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm disabled:opacity-50"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <Button onClick={handleSaveSchedule}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Guardar Horarios
                    </Button>
                </div>
            </Card>

            {/* API Documentation */}
            <Card title="Documentación API para n8n">
                <div className="space-y-4 text-sm">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                            Endpoint: Verificar Disponibilidad
                        </h4>
                        <code className="block p-2 bg-slate-200 dark:bg-slate-800 rounded text-xs font-mono mb-2">
                            GET /api/collections/appointments/records?filter=(date='2026-01-20' && time='10:00')
                        </code>
                        <p className="text-slate-600 dark:text-slate-400">
                            Si la respuesta tiene 0 items, el horario está disponible.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                            Endpoint: Crear Cita
                        </h4>
                        <code className="block p-2 bg-slate-200 dark:bg-slate-800 rounded text-xs font-mono mb-2">
                            POST /api/collections/appointments/records
                        </code>
                        <pre className="p-2 bg-slate-200 dark:bg-slate-800 rounded text-xs font-mono overflow-x-auto">
                            {`{
  "patientName": "Juan Pérez",
  "phone": "+521234567890",
  "date": "2026-01-20",
  "time": "10:00",
  "reason": "Consulta general",
  "status": "scheduled",
  "source": "whatsapp"
}`}
                        </pre>
                    </div>
                </div>
            </Card>
        </div>
    );
}
