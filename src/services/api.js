import pb from './pocketbase';

// API wrapper for PocketBase operations
export const api = {
    // ==================== AUTHENTICATION ====================
    auth: {
        login: async (email, password) => {
            try {
                const authData = await pb.collection('users').authWithPassword(email, password);
                return {
                    user: {
                        id: authData.record.id,
                        email: authData.record.email,
                        name: authData.record.name,
                        role: authData.record.role,
                        specialty: authData.record.specialty,
                        license: authData.record.license
                    },
                    token: authData.token
                };
            } catch (error) {
                console.error('Login error:', error);
                throw new Error('Credenciales inválidas');
            }
        },

        logout: () => {
            pb.authStore.clear();
        },

        getCurrentUser: () => {
            if (!pb.authStore.isValid) return null;
            const record = pb.authStore.record;
            return {
                id: record.id,
                email: record.email,
                name: record.name,
                role: record.role,
                specialty: record.specialty,
                license: record.license
            };
        },

        isAuthenticated: () => {
            return pb.authStore.isValid;
        }
    },

    // ==================== USERS ====================
    users: {
        // Role constants
        getRoles: () => ({
            SUPER_ADMIN: 'superadmin',
            MEDICO: 'medico',
            RECEPCION: 'recepcion'
        }),

        list: async () => {
            const records = await pb.collection('users').getFullList({
                sort: 'name'
            });
            return records.map(r => ({
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                specialty: r.specialty,
                license: r.license,
                created: r.created
            }));
        },

        create: async (data) => {
            const record = await pb.collection('users').create({
                ...data,
                passwordConfirm: data.password,
                emailVisibility: true
            });
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('users').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('users').delete(id);
            return true;
        }
    },

    // ==================== PATIENTS ====================
    patients: {
        list: async () => {
            const records = await pb.collection('patients').getFullList({
                sort: '-created'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('patients').getOne(id);
            return record;
        },

        create: async (data) => {
            const record = await pb.collection('patients').create(data);
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('patients').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('patients').delete(id);
            return true;
        },

        search: async (query) => {
            const records = await pb.collection('patients').getList(1, 50, {
                filter: `firstName ~ "${query}" || lastName ~ "${query}" || dni ~ "${query}" || phone ~ "${query}"`,
                sort: '-created'
            });
            return records.items;
        }
    },

    // ==================== APPOINTMENTS ====================
    appointments: {
        list: async () => {
            const records = await pb.collection('appointments').getFullList({
                sort: '-created',
                expand: 'patient,doctor,clinic'
            });
            return records.map(r => ({
                ...r,
                patient: r.expand?.patient,
                doctor: r.expand?.doctor,
                clinic: r.expand?.clinic
            }));
        },

        listByDate: async (date) => {
            const records = await pb.collection('appointments').getFullList({
                filter: `date >= "${date}T00:00:00" && date <= "${date}T23:59:59"`,
                sort: 'time',
                expand: 'patient,doctor,clinic'
            });
            return records;
        },

        create: async (data) => {
            // Handle both relation IDs and legacy format
            const appointmentData = {
                patientName: data.patientName,
                phone: data.phone,
                date: data.date,
                time: data.time,
                reason: data.reason || 'Consulta General',
                notes: data.notes,
                status: data.status || 'scheduled',
                source: data.source || 'manual'
            };

            // Add relations if provided as IDs
            if (data.patientId) appointmentData.patient = data.patientId;
            if (data.doctorId) appointmentData.doctor = data.doctorId;
            if (data.clinicId) appointmentData.clinic = data.clinicId;

            const record = await pb.collection('appointments').create(appointmentData);
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('appointments').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('appointments').delete(id);
            return true;
        },

        // Check availability for n8n integration
        checkAvailability: async (clinicId, doctorId, date, time) => {
            try {
                // Build filter
                let filter = `date = "${date}" && time = "${time}" && status != "cancelled"`;
                if (doctorId) filter += ` && doctor = "${doctorId}"`;
                if (clinicId) filter += ` && clinic = "${clinicId}"`;

                const existing = await pb.collection('appointments').getList(1, 1, { filter });

                if (existing.totalItems > 0) {
                    return { available: false, reason: 'Horario ocupado' };
                }

                // Check clinic schedule if clinicId provided
                if (clinicId) {
                    try {
                        const clinic = await pb.collection('clinics').getOne(clinicId);
                        if (clinic.schedule) {
                            const dayOfWeek = new Date(date).getDay();
                            const daySchedule = clinic.schedule[dayOfWeek];

                            if (!daySchedule || !daySchedule.open) {
                                return { available: false, reason: 'Clínica cerrada este día' };
                            }

                            if (time < daySchedule.start || time > daySchedule.end) {
                                return { available: false, reason: 'Fuera de horario de atención' };
                            }
                        }
                    } catch (e) {
                        console.warn('Could not check clinic schedule:', e);
                    }
                }

                return { available: true };
            } catch (error) {
                console.error('Availability check error:', error);
                return { available: false, reason: 'Error al verificar disponibilidad' };
            }
        }
    },

    // ==================== CONSULTATIONS ====================
    consultations: {
        listByPatient: async (patientId) => {
            const records = await pb.collection('consultations').getFullList({
                filter: `patient = "${patientId}"`,
                sort: '-created',
                expand: 'doctor,appointment'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('consultations').getOne(id, {
                expand: 'patient,doctor,appointment'
            });
            return record;
        },

        create: async (data) => {
            const consultationData = {
                ...data,
                type: data.type || 'consultation'
            };

            // Convert patientId to patient relation
            if (data.patientId && !data.patient) {
                consultationData.patient = data.patientId;
                delete consultationData.patientId;
            }

            if (data.appointmentId && !data.appointment) {
                consultationData.appointment = data.appointmentId;
                delete consultationData.appointmentId;
            }

            const record = await pb.collection('consultations').create(consultationData);

            // Update patient's lastVisit
            if (consultationData.patient) {
                try {
                    await pb.collection('patients').update(consultationData.patient, {
                        lastVisit: new Date().toISOString()
                    });
                } catch (e) {
                    console.warn('Could not update patient lastVisit:', e);
                }
            }

            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('consultations').update(id, data);
            return record;
        }
    },

    // ==================== CLINICS ====================
    clinics: {
        list: async () => {
            const records = await pb.collection('clinics').getFullList({
                sort: 'name'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('clinics').getOne(id);
            return record;
        },

        create: async (data) => {
            const record = await pb.collection('clinics').create(data);
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('clinics').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('clinics').delete(id);
            return true;
        }
    },

    // ==================== CONFIG (Settings) ====================
    config: {
        get: async (key) => {
            try {
                const records = await pb.collection('config').getFullList({
                    filter: `key = "${key}"`
                });
                return records.length > 0 ? records[0].value : null;
            } catch (error) {
                console.error('Config get error:', error);
                return null;
            }
        },

        set: async (key, value) => {
            try {
                // Try to find existing
                const existing = await pb.collection('config').getFullList({
                    filter: `key = "${key}"`
                });

                if (existing.length > 0) {
                    await pb.collection('config').update(existing[0].id, { value });
                } else {
                    await pb.collection('config').create({ key, value });
                }
                return true;
            } catch (error) {
                console.error('Config set error:', error);
                return false;
            }
        },

        getAll: async () => {
            try {
                const records = await pb.collection('config').getFullList();
                const config = {};
                records.forEach(r => {
                    config[r.key] = r.value;
                });
                return config;
            } catch (error) {
                console.error('Config getAll error:', error);
                return {};
            }
        }
    },

    // ==================== AUDIT LOGS ====================
    auditLogs: {
        list: async (page = 1, perPage = 50, filters = {}) => {
            let filter = '';

            if (filters.action) {
                filter += `action ~ "${filters.action}"`;
            }
            if (filters.entity) {
                if (filter) filter += ' && ';
                filter += `entity = "${filters.entity}"`;
            }
            if (filters.userId) {
                if (filter) filter += ' && ';
                filter += `user = "${filters.userId}"`;
            }

            const records = await pb.collection('audit_logs').getList(page, perPage, {
                filter: filter || undefined,
                sort: '-created',
                expand: 'user'
            });

            return {
                items: records.items,
                totalPages: records.totalPages,
                totalItems: records.totalItems
            };
        },

        create: async (data) => {
            const user = pb.authStore.record;
            const record = await pb.collection('audit_logs').create({
                user: user?.id,
                userName: user?.name || 'Sistema',
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                details: data.details,
                ipAddress: data.ipAddress
            });
            return record;
        }
    }
};

// Export default
export default api;
