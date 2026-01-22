import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import pb from '../services/pocketbase';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
    theme: 'light', // light, dark, green-premium
    clinics: [
        {
            id: '1',
            name: 'Clínica ZenMedix',
            subtitle: 'Centro Médico Integral',
            phone: '(555) 123-4567',
            address: 'Av. Principal #123, Ciudad',
            logo: '' // URL or base64 of logo image
        }
    ],
    activeClinic: '1',
    doctors: [
        { id: '1', name: 'Dr. Joel W.', specialty: 'Medicina General', cedula: '12345678', university: 'Universidad Autónoma', ssg: '' }
    ],
    activeDoctor: '1',
    webhooks: {
        schedule: '',
        delete: '',
        dashboard: '',
        availability: '', // Webhook to check Google Calendar availability via n8n
        aiSummary: '' // Webhook for AI voice dictation summary
    },
    whatsapp: {
        ycloudApiKey: '',
        senderNumber: '',
        templateName: 'recordatorio_cita_1_dia',
        reminderHour: 'disabled', // 8, 9, 10, or 'disabled'
        timezone: 'America/Mexico_City' // Timezone for cron jobs
    },
    // Automation settings for n8n integration
    automation: {
        enabled: false,
        botName: 'Medi',
        botBehavior: ['profesional'], // profesional, divertido, casual, empático
        apiToken: '', // Auto-generated token for n8n authentication
        appointmentDuration: 30 // Default duration in minutes
    },
    // Clinic schedules for availability checking
    clinicSchedules: {
        // clinicId: { 0: null, 1: { start: '09:00', end: '18:00' }, ... }
        // null = closed, object with start/end = open
    },
    currency: 'MXN',
    recipeLayout: {
        enabled: false, // If true, use custom positions
        pageSize: 'media-carta', // 'media-carta' | 'carta'
        backgroundImage: null, // base64 or URL of guide image
        elements: {
            patientName: { x: 80, y: 145, width: 200, height: 22, fontSize: 11, visible: true },
            date: { x: 60, y: 175, width: 100, height: 22, fontSize: 11, visible: true },
            patientAge: { x: 210, y: 175, width: 60, height: 22, fontSize: 11, visible: true },
            weight: { x: 290, y: 175, width: 80, height: 22, fontSize: 11, visible: true },
            height: { x: 380, y: 175, width: 80, height: 22, fontSize: 11, visible: true },
            medications: { x: 30, y: 220, width: 350, height: 250, fontSize: 11, visible: true },
            vitals: { x: 390, y: 220, width: 130, height: 150, fontSize: 10, visible: true },
            diagnosis: { x: 30, y: 490, width: 480, height: 30, fontSize: 10, visible: true },
            indications: { x: 30, y: 530, width: 480, height: 80, fontSize: 10, visible: true }
        }
    }
};

// Config keys that should be synced with PocketBase
const SYNC_KEYS = ['webhooks', 'whatsapp', 'automation', 'clinicSchedules', 'recipeLayout', 'doctors', 'currency'];

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const stored = localStorage.getItem('medflow_settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migrate old clinic format to new clinics array
            if (parsed.clinic && !parsed.clinics) {
                parsed.clinics = [{ id: '1', ...parsed.clinic }];
                parsed.activeClinic = '1';
                delete parsed.clinic;
            }
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
        return DEFAULT_SETTINGS;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Helper function to sync a config key to PocketBase
    const syncToConfig = useCallback(async (key, value) => {
        if (!pb.authStore.isValid) return; // Only sync if authenticated
        try {
            await api.config.set(key, value);
            console.log(`✅ Config synced to PocketBase: ${key}`);
        } catch (error) {
            console.warn(`⚠️ Could not sync config to PocketBase: ${key}`, error);
        }
    }, []);

    // Load configuration from PocketBase on mount (if authenticated)
    useEffect(() => {
        const loadConfigFromPocketBase = async () => {
            if (!pb.authStore.isValid) {
                setIsLoading(false);
                return;
            }

            try {
                // api.config.getAll() returns an object: { key: value, ... }
                const pbConfig = await api.config.getAll();

                // Merge PocketBase config with local settings (PB takes priority for synced keys)
                setSettings(prev => {
                    const merged = { ...prev };
                    for (const key of SYNC_KEYS) {
                        if (pbConfig[key] !== undefined) {
                            // For objects, merge; for primitives, replace
                            if (typeof pbConfig[key] === 'object' && !Array.isArray(pbConfig[key])) {
                                merged[key] = { ...prev[key], ...pbConfig[key] };
                            } else {
                                merged[key] = pbConfig[key];
                            }
                        }
                    }
                    return merged;
                });

                setConfigLoaded(true);
                console.log('✅ Config loaded from PocketBase', pbConfig);
            } catch (error) {
                console.warn('⚠️ Could not load config from PocketBase, using localStorage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadConfigFromPocketBase();
    }, []);

    // Save to localStorage on every change
    useEffect(() => {
        localStorage.setItem('medflow_settings', JSON.stringify(settings));
        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings]);

    const updateSettings = (updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    // Clinic management - Synced with PocketBase
    const addClinic = async (clinic) => {
        try {
            // Create in PocketBase first (logo is handled locally as base64, not sent to PB)
            const pbClinic = await api.clinics.create({
                name: clinic.name,
                subtitle: clinic.subtitle || '',
                phone: clinic.phone || '',
                address: clinic.address || '',
                city: clinic.city || ''
                // Note: logo is type 'file' in PocketBase, we keep it local as base64
            });

            // Use PocketBase ID for consistency
            const newClinic = { ...clinic, id: pbClinic.id, pbId: pbClinic.id };
            setSettings(prev => ({ ...prev, clinics: [...prev.clinics, newClinic] }));
            return newClinic;
        } catch (error) {
            console.error('Error creating clinic in PocketBase:', error);
            // Fallback to local-only if PocketBase fails
            const newClinic = { ...clinic, id: Date.now().toString() };
            setSettings(prev => ({ ...prev, clinics: [...prev.clinics, newClinic] }));
            return newClinic;
        }
    };

    const updateClinic = async (id, data) => {
        // Update local state immediately
        setSettings(prev => ({
            ...prev,
            clinics: prev.clinics.map(c => c.id === id ? { ...c, ...data } : c)
        }));

        // Sync to PocketBase (only text fields, logo is handled locally)
        try {
            const updateData = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
            if (data.phone !== undefined) updateData.phone = data.phone;
            if (data.address !== undefined) updateData.address = data.address;
            if (data.city !== undefined) updateData.city = data.city;

            // Only sync if there are fields to update (excluding logo which is local)
            if (Object.keys(updateData).length > 0) {
                await api.clinics.update(id, updateData);
            }
        } catch (error) {
            console.warn('Could not sync clinic update to PocketBase:', error);
        }
    };

    const removeClinic = async (id) => {
        if (settings.clinics.length <= 1) return; // Keep at least one

        // Update local state immediately
        setSettings(prev => ({
            ...prev,
            clinics: prev.clinics.filter(c => c.id !== id),
            activeClinic: prev.activeClinic === id ? prev.clinics[0]?.id : prev.activeClinic
        }));

        // Sync to PocketBase
        try {
            await api.clinics.delete(id);
        } catch (error) {
            console.warn('Could not sync clinic deletion to PocketBase:', error);
        }
    };

    const setActiveClinic = (id) => {
        setSettings(prev => ({ ...prev, activeClinic: id }));
    };

    const getActiveClinic = () => {
        return settings.clinics.find(c => c.id === settings.activeClinic) || settings.clinics[0];
    };

    // Doctor management - Synced with PocketBase
    const addDoctor = async (doctor) => {
        const newDoctor = { ...doctor, id: Date.now().toString() };
        const newDoctors = [...settings.doctors, newDoctor];
        setSettings(prev => ({ ...prev, doctors: newDoctors }));
        await syncToConfig('doctors', newDoctors);
        return newDoctor;
    };

    const updateDoctor = async (id, data) => {
        const newDoctors = settings.doctors.map(d => d.id === id ? { ...d, ...data } : d);
        setSettings(prev => ({ ...prev, doctors: newDoctors }));
        await syncToConfig('doctors', newDoctors);
    };

    const removeDoctor = async (id) => {
        if (settings.doctors.length <= 1) return; // Keep at least one
        const newDoctors = settings.doctors.filter(d => d.id !== id);
        setSettings(prev => ({
            ...prev,
            doctors: newDoctors,
            activeDoctor: prev.activeDoctor === id ? newDoctors[0]?.id : prev.activeDoctor
        }));
        await syncToConfig('doctors', newDoctors);
    };

    const setActiveDoctor = (id) => {
        setSettings(prev => ({ ...prev, activeDoctor: id }));
    };

    const getActiveDoctor = () => {
        return settings.doctors.find(d => d.id === settings.activeDoctor) || settings.doctors[0];
    };

    // Webhooks - Synced with PocketBase
    const updateWebhooks = async (webhooks) => {
        const newWebhooks = { ...settings.webhooks, ...webhooks };
        setSettings(prev => ({ ...prev, webhooks: newWebhooks }));
        await syncToConfig('webhooks', newWebhooks);
    };

    // WhatsApp - Synced with PocketBase
    const updateWhatsApp = async (whatsapp) => {
        const newWhatsapp = { ...settings.whatsapp, ...whatsapp };
        setSettings(prev => ({ ...prev, whatsapp: newWhatsapp }));
        await syncToConfig('whatsapp', newWhatsapp);
    };

    // Recipe Layout - Synced with PocketBase
    const updateRecipeLayout = async (recipeLayout) => {
        const newRecipeLayout = { ...settings.recipeLayout, ...recipeLayout };
        setSettings(prev => ({ ...prev, recipeLayout: newRecipeLayout }));
        await syncToConfig('recipeLayout', newRecipeLayout);
    };

    // Automation - Synced with PocketBase
    const updateAutomation = async (automation) => {
        const newAutomation = { ...settings.automation, ...automation };
        setSettings(prev => ({ ...prev, automation: newAutomation }));
        await syncToConfig('automation', newAutomation);
    };

    const generateApiToken = async () => {
        const token = 'zm_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        await updateAutomation({ apiToken: token });
        return token;
    };

    // Clinic Schedules - Synced with PocketBase
    const updateClinicSchedule = async (clinicId, schedule) => {
        const newSchedules = {
            ...settings.clinicSchedules,
            [clinicId]: schedule
        };
        setSettings(prev => ({
            ...prev,
            clinicSchedules: newSchedules
        }));
        await syncToConfig('clinicSchedules', newSchedules);
    };

    const getClinicSchedule = (clinicId) => {
        return settings.clinicSchedules?.[clinicId] || null;
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            isLoading,
            configLoaded,
            updateSettings,
            // Clinic
            addClinic,
            updateClinic,
            removeClinic,
            setActiveClinic,
            getActiveClinic,
            // Doctor
            addDoctor,
            updateDoctor,
            removeDoctor,
            setActiveDoctor,
            getActiveDoctor,
            // Webhooks
            updateWebhooks,
            // WhatsApp
            updateWhatsApp,
            // Recipe Layout
            updateRecipeLayout,
            // Automation
            updateAutomation,
            generateApiToken,
            // Clinic Schedules
            updateClinicSchedule,
            getClinicSchedule
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within SettingsProvider');
    return context;
};
