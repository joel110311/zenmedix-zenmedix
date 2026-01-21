import { useState, useEffect } from 'react';
import { Bot, Clock, Copy, Check, RefreshCw, Shield, Save, Calendar, Zap, Server, Code, ExternalLink, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

const BEHAVIORS = [
    { id: 'profesional', label: 'Profesional', emoji: '👔', desc: 'Formal y directo' },
    { id: 'amigable', label: 'Amigable', emoji: '😊', desc: 'Cálido y cercano' },
    { id: 'empatico', label: 'Empático', emoji: '💚', desc: 'Comprensivo' },
    { id: 'conciso', label: 'Conciso', emoji: '📝', desc: 'Breve y claro' },
    { id: 'detallado', label: 'Detallado', emoji: '📖', desc: 'Explicativo' }
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
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hora' }
];

// Get PocketBase URL from environment or default
const getPocketBaseUrl = () => {
    // Try to get from environment, fallback to production URL
    return import.meta.env.VITE_POCKETBASE_URL || 'https://api-consultorio.logicapp.net';
};

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
    const [copiedEndpoint, setCopiedEndpoint] = useState(null);
    const [showToken, setShowToken] = useState(false);

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
            if (botBehavior.length > 1) {
                setBotBehavior(botBehavior.filter(b => b !== behaviorId));
            }
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
        toast.success('Configuración guardada');
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

    const handleCopyEndpoint = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedEndpoint(id);
        setTimeout(() => setCopiedEndpoint(null), 2000);
        toast.success('Copiado');
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

    const pbUrl = getPocketBaseUrl();

    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Automatización n8n</h2>
                            <p className="text-cyan-100">Integra tu chatbot de WhatsApp con ZenMedix</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${enabled ? 'bg-green-500/30 text-green-100' : 'bg-white/20 text-white/70'}`}>
                            {enabled ? '● Activo' : '○ Inactivo'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-white/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Bot Configuration */}
                <div className="space-y-6">
                    {/* Bot Identity */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Identidad del Bot</h3>
                                <p className="text-xs text-slate-500">Personaliza cómo se presenta</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nombre del Asistente
                                </label>
                                <div className="relative">
                                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={botName}
                                        onChange={(e) => setBotName(e.target.value)}
                                        placeholder="Ej: Medi, Asistente, Luna..."
                                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Personalidad
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {BEHAVIORS.map(behavior => (
                                        <button
                                            key={behavior.id}
                                            type="button"
                                            onClick={() => handleBehaviorToggle(behavior.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${botBehavior.includes(behavior.id)
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <span className="text-lg">{behavior.emoji}</span>
                                            <p className={`text-sm font-medium mt-1 ${botBehavior.includes(behavior.id) ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {behavior.label}
                                            </p>
                                            <p className="text-xs text-slate-500">{behavior.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Duración de cita predeterminada
                                </label>
                                <div className="flex gap-2">
                                    {DURATIONS.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setAppointmentDuration(d.value)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${appointmentDuration === d.value
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleSaveBotConfig} className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                Guardar Configuración
                            </Button>
                        </div>
                    </Card>

                    {/* Clinic Schedules */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Horarios de Atención</h3>
                                <p className="text-xs text-slate-500">Para validar disponibilidad</p>
                            </div>
                        </div>

                        {/* Clinic Selector */}
                        {clinics.length > 1 && (
                            <div className="mb-4">
                                <select
                                    value={selectedClinic}
                                    onChange={(e) => setSelectedClinic(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    {clinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Compact Schedule Grid */}
                        <div className="space-y-2">
                            {DAYS.map(day => (
                                <div key={day.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${schedule[day.id] ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                    <input
                                        type="checkbox"
                                        checked={!!schedule[day.id]}
                                        onChange={() => handleDayToggle(day.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className={`w-20 text-sm font-medium ${schedule[day.id] ? 'text-green-700 dark:text-green-400' : 'text-slate-500'}`}>
                                        {day.name}
                                    </span>

                                    {schedule[day.id] ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <input
                                                type="time"
                                                value={schedule[day.id]?.start || '09:00'}
                                                onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                            />
                                            <span className="text-slate-400">→</span>
                                            <input
                                                type="time"
                                                value={schedule[day.id]?.end || '18:00'}
                                                onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Cerrado</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleSaveSchedule} variant="secondary" className="w-full mt-4">
                            <Calendar className="w-4 h-4 mr-2" />
                            Guardar Horarios
                        </Button>
                    </Card>
                </div>

                {/* Right Column - API & Documentation */}
                <div className="space-y-6">
                    {/* API Token */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Token de Autenticación</h3>
                                <p className="text-xs text-slate-500">Para peticiones desde n8n</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    readOnly
                                    value={automation.apiToken || 'No generado - Click en Generar'}
                                    className="w-full px-3 py-2.5 pr-20 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-mono text-sm"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        {showToken ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                                    </button>
                                    {automation.apiToken && (
                                        <button
                                            onClick={handleCopyToken}
                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleGenerateToken} variant="secondary" className="w-full">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {automation.apiToken ? 'Regenerar Token' : 'Generar Token'}
                            </Button>

                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                    <strong>⚠️ Importante:</strong> Guarda este token de forma segura. Si lo regeneras, deberás actualizar tus workflows en n8n.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* API Documentation */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Code className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white">Documentación API</h3>
                                <p className="text-xs text-slate-500">Endpoints para n8n</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Base URL */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base URL</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(pbUrl, 'base')}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'base' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        Copiar
                                    </button>
                                </div>
                                <code className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">{pbUrl}</code>
                            </div>

                            {/* Header Auth */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Header de Autenticación</span>
                                </div>
                                <code className="text-sm font-mono text-blue-800 dark:text-blue-200 block">
                                    Authorization: Bearer {automation.apiToken || 'TU_TOKEN'}
                                </code>
                            </div>

                            {/* Endpoint 1: Check Availability */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Verificar Disponibilidad</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(`${pbUrl}/api/collections/appointments/records?filter=(date='YYYY-MM-DD' && time='HH:MM' && status!='cancelled')`, 'avail')}
                                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'avail' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900">
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                                        /api/collections/appointments/records?filter=(date='YYYY-MM-DD' && time='HH:MM' && status!='cancelled')
                                    </code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        ✅ Si <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">totalItems = 0</code>, el horario está disponible.
                                    </p>
                                </div>
                            </div>

                            {/* Endpoint 2: Create Appointment */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">POST</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Crear Cita</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(`${pbUrl}/api/collections/appointments/records`, 'create')}
                                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'create' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900">
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                        /api/collections/appointments/records
                                    </code>
                                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">{`{
  "patientName": "Juan Pérez",
  "phone": "+521234567890",
  "date": "2026-01-20",
  "time": "10:00",
  "reason": "Consulta general",
  "status": "scheduled",
  "source": "whatsapp"
}`}</pre>
                                    </div>
                                </div>
                            </div>

                            {/* Endpoint 3: Cancel Appointment */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">PATCH</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cancelar Cita</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(`${pbUrl}/api/collections/appointments/records/{id}`, 'cancel')}
                                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'cancel' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900">
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                        /api/collections/appointments/records/{'{id}'}
                                    </code>
                                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">{`{
  "status": "cancelled"
}`}</pre>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        ⚠️ Reemplaza <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">{'{id}'}</code> con el ID de la cita a cancelar.
                                    </p>
                                </div>
                            </div>

                            {/* Endpoint 4: Get Clinics */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Listar Clínicas</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(`${pbUrl}/api/collections/clinics/records`, 'clinics')}
                                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'clinics' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900">
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                        /api/collections/clinics/records
                                    </code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Retorna lista de clínicas para selección múltiple.
                                    </p>
                                </div>
                            </div>

                            {/* Endpoint 5: Search Patient */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">GET</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar Paciente por Teléfono</span>
                                    <button
                                        onClick={() => handleCopyEndpoint(`${pbUrl}/api/collections/patients/records?filter=(phone~'1234567890')`, 'patient')}
                                        className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        {copiedEndpoint === 'patient' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900">
                                    <code className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                                        /api/collections/patients/records?filter=(phone~'ULTIMOS_10_DIGITOS')
                                    </code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Busca paciente existente. Si <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">totalItems {'>'} 0</code>, el paciente existe.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
