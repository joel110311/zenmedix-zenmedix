/**
 * Backup Service for NOM-024-SSA3-2012 Compliance - ZenMedix
 * Handles export and import of all patient data
 */

import { logAudit, AUDIT_ACTIONS } from './auditService';

const BACKUP_INFO_KEY = 'medflow_backup_info';

/**
 * Get all localStorage keys that belong to ZenMedix
 */
const getZenMedixKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('medflow_')) {
            keys.push(key);
        }
    }
    return keys;
};

/**
 * Export all ZenMedix data to JSON
 */
export const exportBackup = () => {
    try {
        const keys = getZenMedixKeys();
        const data = {};

        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                data[key] = value ? JSON.parse(value) : null;
            } catch {
                data[key] = localStorage.getItem(key);
            }
        });

        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            application: 'ZenMedix',
            dataKeys: keys.length,
            data
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zenmedix_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        // Update backup info
        const backupInfo = {
            lastBackup: new Date().toISOString(),
            keysBackedUp: keys.length
        };
        localStorage.setItem(BACKUP_INFO_KEY, JSON.stringify(backupInfo));

        // Log the action
        logAudit(AUDIT_ACTIONS.BACKUP_EXPORT, {
            keysExported: keys.length,
            date: backup.exportDate
        });

        return { success: true, keysExported: keys.length };
    } catch (error) {
        console.error('Backup export error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Import backup from JSON file
 * @param {File} file - The backup JSON file
 * @param {boolean} overwrite - Whether to overwrite existing data
 */
export const importBackup = async (file, overwrite = false) => {
    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        // Validate backup structure
        if (!backup.version || !backup.data || !backup.application) {
            throw new Error('Invalid backup file format');
        }

        if (backup.application !== 'ZenMedix' && backup.application !== 'MedFlow EMR') {
            throw new Error('Backup is not from ZenMedix');
        }

        const keysImported = [];
        const keysSkipped = [];

        Object.entries(backup.data).forEach(([key, value]) => {
            if (!overwrite && localStorage.getItem(key)) {
                keysSkipped.push(key);
                return;
            }

            try {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                keysImported.push(key);
            } catch (e) {
                console.error(`Error importing key ${key}:`, e);
            }
        });

        // Log the action
        logAudit(AUDIT_ACTIONS.BACKUP_IMPORT, {
            keysImported: keysImported.length,
            keysSkipped: keysSkipped.length,
            backupDate: backup.exportDate,
            overwrite
        });

        return {
            success: true,
            keysImported: keysImported.length,
            keysSkipped: keysSkipped.length,
            backupDate: backup.exportDate
        };
    } catch (error) {
        console.error('Backup import error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get backup info
 */
export const getBackupInfo = () => {
    try {
        const stored = localStorage.getItem(BACKUP_INFO_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = () => {
    const keys = getZenMedixKeys();
    let totalSize = 0;
    const breakdown = {};

    keys.forEach(key => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;

        // Group by category
        const category = key.split('_')[1] || 'other';
        breakdown[category] = (breakdown[category] || 0) + size;
    });

    return {
        totalKeys: keys.length,
        totalBytes: totalSize,
        totalMB: (totalSize / (1024 * 1024)).toFixed(2),
        breakdown,
        usagePercent: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1) // Assuming 5MB limit
    };
};

export default {
    exportBackup,
    importBackup,
    getBackupInfo,
    getStorageStats
};
