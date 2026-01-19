import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Filter, Calendar, User, Activity, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuditLog, filterAuditLog, exportAuditToCSV, getAuditStats, cleanOldAuditEntries, AUDIT_ACTIONS } from '../../services/auditService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

// Human-readable action labels
const ACTION_LABELS = {
    [AUDIT_ACTIONS.LOGIN]: 'Inicio de sesión',
    [AUDIT_ACTIONS.LOGOUT]: 'Cierre de sesión',
    [AUDIT_ACTIONS.LOGIN_FAILED]: 'Intento fallido de login',
    [AUDIT_ACTIONS.SESSION_EXPIRED]: 'Sesión expirada',
    [AUDIT_ACTIONS.PATIENT_CREATE]: 'Paciente creado',
    [AUDIT_ACTIONS.PATIENT_UPDATE]: 'Paciente actualizado',
    [AUDIT_ACTIONS.PATIENT_DELETE]: 'Paciente eliminado',
    [AUDIT_ACTIONS.PATIENT_VIEW]: 'Paciente consultado',
    [AUDIT_ACTIONS.CONSULTATION_CREATE]: 'Consulta creada',
    [AUDIT_ACTIONS.CONSULTATION_UPDATE]: 'Consulta actualizada',
    [AUDIT_ACTIONS.CONSULTATION_VIEW]: 'Consulta vista',
    [AUDIT_ACTIONS.RECIPE_PRINT]: 'Receta impresa',
    [AUDIT_ACTIONS.RECIPE_UPDATE]: 'Receta actualizada',
    [AUDIT_ACTIONS.LAB_RESULT_CREATE]: 'Análisis creado',
    [AUDIT_ACTIONS.LAB_RESULT_DELETE]: 'Análisis eliminado',
    [AUDIT_ACTIONS.STUDY_REQUEST_CREATE]: 'Solicitud de estudios',
    [AUDIT_ACTIONS.APPOINTMENT_CREATE]: 'Cita creada',
    [AUDIT_ACTIONS.APPOINTMENT_DELETE]: 'Cita eliminada',
    [AUDIT_ACTIONS.SETTINGS_UPDATE]: 'Configuración actualizada',
    [AUDIT_ACTIONS.BACKUP_EXPORT]: 'Respaldo exportado',
    [AUDIT_ACTIONS.BACKUP_IMPORT]: 'Respaldo importado',
};

// Action color classes
const ACTION_COLORS = {
    [AUDIT_ACTIONS.LOGIN]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    [AUDIT_ACTIONS.LOGOUT]: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    [AUDIT_ACTIONS.LOGIN_FAILED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    [AUDIT_ACTIONS.SESSION_EXPIRED]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
};

export default function AuditLogPage() {
    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState(null);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const filters = {};
        if (filterAction) filters.action = filterAction;
        if (filterStartDate) filters.startDate = filterStartDate;
        if (filterEndDate) filters.endDate = filterEndDate;

        const filtered = Object.keys(filters).length > 0
            ? filterAuditLog(filters)
            : getAuditLog();

        setEntries(filtered.slice(0, 500)); // Limit for display
        setStats(getAuditStats());
    };

    const handleExport = () => {
        exportAuditToCSV();
        toast.success('Registro exportado a CSV');
    };

    const handleCleanOld = () => {
        const removed = cleanOldAuditEntries(365);
        toast.success(`Se eliminaron ${removed} registros antiguos`);
        loadData();
    };

    const applyFilters = () => {
        loadData();
    };

    const clearFilters = () => {
        setFilterAction('');
        setFilterStartDate('');
        setFilterEndDate('');
        setTimeout(loadData, 0);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Registro de Auditoría
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Cumplimiento NOM-024-SSA3-2012 - Trazabilidad de acciones
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                    <Button variant="ghost" onClick={loadData}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{stats.totalEntries}</p>
                            <p className="text-sm text-slate-500">Total registros</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.todayEntries}</p>
                            <p className="text-sm text-slate-500">Hoy</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.actionCounts?.[AUDIT_ACTIONS.LOGIN] || 0}</p>
                            <p className="text-sm text-slate-500">Sesiones</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.actionCounts?.[AUDIT_ACTIONS.LOGIN_FAILED] || 0}</p>
                            <p className="text-sm text-slate-500">Intentos fallidos</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                        <Filter className="w-4 h-4" /> Filtros
                    </span>
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo de Acción</label>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Todas</option>
                                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Desde</label>
                            <input
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
                            <input
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={applyFilters}>Aplicar</Button>
                            <Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Log Entries */}
            <Card title={`Registros (${entries.length})`} action={
                <Button variant="ghost" size="sm" onClick={handleCleanOld} title="Limpiar registros >1 año">
                    <Trash2 className="w-4 h-4" />
                </Button>
            }>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {entries.length === 0 ? (
                        <p className="text-center text-slate-400 py-8">No hay registros</p>
                    ) : (
                        entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[entry.action] || ACTION_COLORS.default}`}>
                                            {ACTION_LABELS[entry.action] || entry.action}
                                        </span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {entry.userName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {formatDate(entry.timestamp)}
                                    </span>
                                </div>

                                {expandedEntry === entry.id && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                                        <p><strong>ID:</strong> {entry.id}</p>
                                        <p><strong>Usuario ID:</strong> {entry.userId}</p>
                                        {entry.entityType && <p><strong>Entidad:</strong> {entry.entityType} ({entry.entityId})</p>}
                                        {Object.keys(entry.details || {}).length > 0 && (
                                            <div>
                                                <strong>Detalles:</strong>
                                                <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(entry.details, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
