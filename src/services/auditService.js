/**
 * Audit Service for NOM-024-SSA3-2012 Compliance
 * Registers all user actions for traceability
 */

const AUDIT_STORAGE_KEY = 'medflow_audit_log';
const MAX_AUDIT_ENTRIES = 10000;

// Action types for audit trail
export const AUDIT_ACTIONS = {
    // Authentication
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Patient actions
    PATIENT_CREATE: 'PATIENT_CREATE',
    PATIENT_UPDATE: 'PATIENT_UPDATE',
    PATIENT_DELETE: 'PATIENT_DELETE',
    PATIENT_VIEW: 'PATIENT_VIEW',

    // Consultation actions
    CONSULTATION_CREATE: 'CONSULTATION_CREATE',
    CONSULTATION_UPDATE: 'CONSULTATION_UPDATE',
    CONSULTATION_VIEW: 'CONSULTATION_VIEW',

    // Recipe/Prescription actions
    RECIPE_PRINT: 'RECIPE_PRINT',
    RECIPE_UPDATE: 'RECIPE_UPDATE',

    // Lab results
    LAB_RESULT_CREATE: 'LAB_RESULT_CREATE',
    LAB_RESULT_DELETE: 'LAB_RESULT_DELETE',
    STUDY_REQUEST_CREATE: 'STUDY_REQUEST_CREATE',

    // Appointments
    APPOINTMENT_CREATE: 'APPOINTMENT_CREATE',
    APPOINTMENT_DELETE: 'APPOINTMENT_DELETE',

    // Settings
    SETTINGS_UPDATE: 'SETTINGS_UPDATE',

    // Backup
    BACKUP_EXPORT: 'BACKUP_EXPORT',
    BACKUP_IMPORT: 'BACKUP_IMPORT',
};

/**
 * Get current user info from storage
 */
const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('medflow_user');
        return user ? JSON.parse(user) : { id: 'unknown', name: 'Sistema' };
    } catch {
        return { id: 'unknown', name: 'Sistema' };
    }
};

/**
 * Get all audit entries
 */
export const getAuditLog = () => {
    try {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Log an audit entry
 * @param {string} action - Type of action from AUDIT_ACTIONS
 * @param {object} details - Additional details about the action
 * @param {string} entityType - Type of entity (patient, consultation, etc.)
 * @param {string} entityId - ID of the entity affected
 */
export const logAudit = (action, details = {}, entityType = null, entityId = null) => {
    try {
        const user = getCurrentUser();
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            action,
            userId: user.id || user.email || 'unknown',
            userName: user.name || user.email || 'Unknown',
            entityType,
            entityId,
            details,
            userAgent: navigator.userAgent,
            ip: 'local' // In production, get from server
        };

        const log = getAuditLog();
        log.unshift(entry);

        // Limit entries to prevent storage overflow
        const trimmed = log.slice(0, MAX_AUDIT_ENTRIES);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));

        return entry;
    } catch (error) {
        console.error('Audit log error:', error);
        return null;
    }
};

/**
 * Filter audit log by criteria
 */
export const filterAuditLog = (filters = {}) => {
    const log = getAuditLog();

    return log.filter(entry => {
        if (filters.action && entry.action !== filters.action) return false;
        if (filters.userId && entry.userId !== filters.userId) return false;
        if (filters.entityType && entry.entityType !== filters.entityType) return false;
        if (filters.entityId && entry.entityId !== filters.entityId) return false;
        if (filters.startDate && new Date(entry.timestamp) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(entry.timestamp) > new Date(filters.endDate)) return false;
        return true;
    });
};

/**
 * Export audit log to CSV
 */
export const exportAuditToCSV = () => {
    const log = getAuditLog();
    const headers = ['ID', 'Fecha/Hora', 'Acción', 'Usuario', 'Tipo Entidad', 'ID Entidad', 'Detalles'];

    const rows = log.map(entry => [
        entry.id,
        entry.timestamp,
        entry.action,
        entry.userName,
        entry.entityType || '',
        entry.entityId || '',
        JSON.stringify(entry.details)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    logAudit(AUDIT_ACTIONS.BACKUP_EXPORT, { type: 'audit_log' });
};

/**
 * Clear old audit entries (keep last N days)
 */
export const cleanOldAuditEntries = (daysToKeep = 365) => {
    const log = getAuditLog();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const filtered = log.filter(entry => new Date(entry.timestamp) > cutoff);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(filtered));

    return log.length - filtered.length;
};

/**
 * Get audit statistics
 */
export const getAuditStats = () => {
    const log = getAuditLog();
    const today = new Date().toISOString().split('T')[0];

    const todayEntries = log.filter(e => e.timestamp.startsWith(today));

    const actionCounts = {};
    log.forEach(entry => {
        actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    });

    return {
        totalEntries: log.length,
        todayEntries: todayEntries.length,
        actionCounts,
        oldestEntry: log.length > 0 ? log[log.length - 1].timestamp : null,
        newestEntry: log.length > 0 ? log[0].timestamp : null
    };
};

export default {
    AUDIT_ACTIONS,
    logAudit,
    getAuditLog,
    filterAuditLog,
    exportAuditToCSV,
    cleanOldAuditEntries,
    getAuditStats
};
