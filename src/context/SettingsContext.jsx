import { createContext, useContext, useState, useEffect } from 'react';

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
        availability: '' // Webhook to check Google Calendar availability via n8n
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

    useEffect(() => {
        localStorage.setItem('medflow_settings', JSON.stringify(settings));
        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings]);

    const updateSettings = (updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    // Clinic management
    const addClinic = (clinic) => {
        const newClinic = { ...clinic, id: Date.now().toString() };
        setSettings(prev => ({ ...prev, clinics: [...prev.clinics, newClinic] }));
        return newClinic;
    };

    const updateClinic = (id, data) => {
        setSettings(prev => ({
            ...prev,
            clinics: prev.clinics.map(c => c.id === id ? { ...c, ...data } : c)
        }));
    };

    const removeClinic = (id) => {
        if (settings.clinics.length <= 1) return; // Keep at least one
        setSettings(prev => ({
            ...prev,
            clinics: prev.clinics.filter(c => c.id !== id),
            activeClinic: prev.activeClinic === id ? prev.clinics[0]?.id : prev.activeClinic
        }));
    };

    const setActiveClinic = (id) => {
        setSettings(prev => ({ ...prev, activeClinic: id }));
    };

    const getActiveClinic = () => {
        return settings.clinics.find(c => c.id === settings.activeClinic) || settings.clinics[0];
    };

    // Doctor management
    const addDoctor = (doctor) => {
        const newDoctor = { ...doctor, id: Date.now().toString() };
        setSettings(prev => ({ ...prev, doctors: [...prev.doctors, newDoctor] }));
        return newDoctor;
    };

    const updateDoctor = (id, data) => {
        setSettings(prev => ({
            ...prev,
            doctors: prev.doctors.map(d => d.id === id ? { ...d, ...data } : d)
        }));
    };

    const removeDoctor = (id) => {
        if (settings.doctors.length <= 1) return; // Keep at least one
        setSettings(prev => ({
            ...prev,
            doctors: prev.doctors.filter(d => d.id !== id),
            activeDoctor: prev.activeDoctor === id ? prev.doctors[0]?.id : prev.activeDoctor
        }));
    };

    const setActiveDoctor = (id) => {
        setSettings(prev => ({ ...prev, activeDoctor: id }));
    };

    const getActiveDoctor = () => {
        return settings.doctors.find(d => d.id === settings.activeDoctor) || settings.doctors[0];
    };

    const updateWebhooks = (webhooks) => {
        setSettings(prev => ({ ...prev, webhooks: { ...prev.webhooks, ...webhooks } }));
    };

    const updateWhatsApp = (whatsapp) => {
        setSettings(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, ...whatsapp } }));
    };

    const updateRecipeLayout = (recipeLayout) => {
        setSettings(prev => ({ ...prev, recipeLayout: { ...prev.recipeLayout, ...recipeLayout } }));
    };

    // Automation settings
    const updateAutomation = (automation) => {
        setSettings(prev => ({ ...prev, automation: { ...prev.automation, ...automation } }));
    };

    const generateApiToken = () => {
        const token = 'zm_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        updateAutomation({ apiToken: token });
        return token;
    };

    // Clinic schedules
    const updateClinicSchedule = (clinicId, schedule) => {
        setSettings(prev => ({
            ...prev,
            clinicSchedules: {
                ...prev.clinicSchedules,
                [clinicId]: schedule
            }
        }));
    };

    const getClinicSchedule = (clinicId) => {
        return settings.clinicSchedules?.[clinicId] || null;
    };

    return (
        <SettingsContext.Provider value={{
            settings,
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
