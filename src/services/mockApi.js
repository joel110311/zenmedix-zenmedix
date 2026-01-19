// mockApi.js - Simulated Backend Service
import { v4 as uuidv4 } from 'uuid';

const LATENCY = 800; // ms

// Helper to simulate delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Data Initialization
const INITIAL_PATIENTS = [
    {
        id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678',
        dob: '1980-05-15', // 45 years
        gender: 'M',
        phone: '555-0101',
        email: 'juan.perez@email.com',
        address: 'Av. Siempre Viva 123',
        lastVisit: '2025-12-10',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        firstName: 'Maria',
        lastName: 'Gómez',
        dni: '87654321',
        dob: '1992-10-20', // 33 years
        gender: 'F',
        phone: '555-0202',
        email: 'maria.gomez@email.com',
        address: 'Calle Falsa 456',
        lastVisit: '2026-01-02',
        createdAt: new Date().toISOString()
    }
];

// LocalStorage Helpers
const getStorage = (key, defaultVal) => {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultVal;
    return JSON.parse(stored);
};

const setStorage = (key, val) => {
    localStorage.setItem(key, JSON.stringify(val));
};

// User Roles
const USER_ROLES = {
    SUPER_ADMIN: 'Super Admin',
    MEDICO: 'Medico',
    RECEPCION: 'Recepcion'
};

// Initial admin user
const INITIAL_USERS = [
    {
        id: 'u1',
        name: 'Administrador',
        email: 'admin',
        password: '1234',
        role: USER_ROLES.SUPER_ADMIN,
        createdAt: new Date().toISOString()
    }
];

export const api = {
    auth: {
        login: async (username, password) => {
            await delay(LATENCY);
            const users = getStorage('medflow_users', INITIAL_USERS);
            const user = users.find(u => u.email === username && u.password === password);

            if (user) {
                const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
                setStorage('medflow_user', sessionUser);
                return sessionUser;
            }
            throw new Error('Credenciales inválidas');
        },
        logout: async () => {
            await delay(200);
            localStorage.removeItem('medflow_user');
        },
        getCurrentUser: () => {
            return getStorage('medflow_user', null);
        }
    },

    users: {
        list: async () => {
            await delay(LATENCY / 2);
            const users = getStorage('medflow_users', INITIAL_USERS);
            // Return without passwords
            return users.map(({ password, ...rest }) => rest);
        },
        create: async (data, currentUserRole) => {
            await delay(LATENCY);
            const users = getStorage('medflow_users', INITIAL_USERS);

            // Check if email already exists
            if (users.some(u => u.email === data.email)) {
                throw new Error('El correo ya está registrado');
            }

            // Validate role permissions
            if (currentUserRole === USER_ROLES.RECEPCION) {
                throw new Error('No tienes permisos para crear usuarios');
            }
            if (currentUserRole === USER_ROLES.MEDICO && data.role === USER_ROLES.SUPER_ADMIN) {
                throw new Error('No puedes crear usuarios Super Admin');
            }

            const newUser = {
                ...data,
                id: uuidv4(),
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            setStorage('medflow_users', users);

            const { password, ...safeUser } = newUser;
            return safeUser;
        },
        update: async (id, data) => {
            await delay(LATENCY);
            const users = getStorage('medflow_users', INITIAL_USERS);
            const index = users.findIndex(u => u.id === id);
            if (index === -1) throw new Error('Usuario no encontrado');

            users[index] = { ...users[index], ...data };
            setStorage('medflow_users', users);

            const { password, ...safeUser } = users[index];
            return safeUser;
        },
        delete: async (id) => {
            await delay(LATENCY);
            const users = getStorage('medflow_users', INITIAL_USERS);
            const filtered = users.filter(u => u.id !== id);
            setStorage('medflow_users', filtered);
            return true;
        },
        getRoles: () => USER_ROLES
    },

    patients: {
        list: async () => {
            await delay(LATENCY);
            const patients = getStorage('medflow_patients', INITIAL_PATIENTS);
            return patients;
        },
        get: async (id) => {
            await delay(LATENCY);
            const patients = getStorage('medflow_patients', INITIAL_PATIENTS);
            const patient = patients.find(p => p.id === id);
            if (!patient) throw new Error('Paciente no encontrado');
            return patient;
        },
        create: async (data) => {
            await delay(LATENCY);
            const patients = getStorage('medflow_patients', INITIAL_PATIENTS);
            const newPatient = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
            patients.push(newPatient);
            setStorage('medflow_patients', patients);
            return newPatient;
        },
        update: async (id, data) => {
            await delay(LATENCY);
            const patients = getStorage('medflow_patients', INITIAL_PATIENTS);
            const index = patients.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Paciente no encontrado');

            patients[index] = { ...patients[index], ...data };
            setStorage('medflow_patients', patients);
            return patients[index];
        }
    },

    consultations: {
        listByPatient: async (patientId) => {
            await delay(LATENCY);
            const consultations = getStorage('medflow_consultations', []);
            return consultations.filter(c => c.patientId === patientId).sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        create: async (data) => {
            await delay(LATENCY);
            const consultations = getStorage('medflow_consultations', []);
            const newConsultation = { ...data, id: uuidv4(), date: new Date().toISOString() };
            consultations.push(newConsultation);
            setStorage('medflow_consultations', consultations);

            // Update patient last visit
            const patients = getStorage('medflow_patients', INITIAL_PATIENTS);
            const pIndex = patients.findIndex(p => p.id === data.patientId);
            if (pIndex !== -1) {
                patients[pIndex].lastVisit = newConsultation.date;
                setStorage('medflow_patients', patients);
            }

            return newConsultation;
        },
        get: async (id) => {
            await delay(LATENCY);
            const consultations = getStorage('medflow_consultations', []);
            const consultation = consultations.find(c => c.id === id);
            if (!consultation) throw new Error('Consulta no encontrada');
            return consultation;
        },
        update: async (id, data) => {
            await delay(LATENCY);
            const consultations = getStorage('medflow_consultations', []);
            const index = consultations.findIndex(c => c.id === id);
            if (index === -1) throw new Error('Consulta no encontrada');
            consultations[index] = { ...consultations[index], ...data };
            setStorage('medflow_consultations', consultations);
            return consultations[index];
        }
    },

    appointments: {
        list: async () => {
            await delay(LATENCY / 2);
            const appointments = getStorage('medflow_appointments', []);
            return appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },
        create: async (data) => {
            await delay(LATENCY);
            const appointments = getStorage('medflow_appointments', []);
            const newAppointment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
            appointments.push(newAppointment);
            setStorage('medflow_appointments', appointments);
            return newAppointment;
        },
        delete: async (id) => {
            await delay(LATENCY / 2);
            const appointments = getStorage('medflow_appointments', []);
            const filtered = appointments.filter(a => a.id !== id);
            setStorage('medflow_appointments', filtered);
            return true;
        }
    }
};
