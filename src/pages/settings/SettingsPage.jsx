import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Building2, Link2, Plus, Trash2, Save, Check, ChevronRight, Settings, Hospital, HardDrive, Upload, Download, Database, MessageCircle, FileText, Users, X, AlertCircle, Info } from 'lucide-react';
import { THEMES, MODES, getConfigTheme, saveConfigTheme, getConfigMode, saveConfigMode } from '../../data/themeStore';
import { useSettings } from '../../context/SettingsContext';
import { exportBackup, importBackup, getBackupInfo, getStorageStats } from '../../services/backupService';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import AutomationSection from '../../components/settings/AutomationSection';

const modeIcons = { light: Sun, dark: Moon, system: Monitor };
const modeLabels = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' };

// Role badge colors - match PocketBase schema (lowercase)
const ROLE_COLORS = {
    'superadmin': 'bg-amber-100 text-amber-700 border-amber-300',
    'medico': 'bg-blue-100 text-blue-700 border-blue-300',
    'recepcion': 'bg-green-100 text-green-700 border-green-300'
};

// Users Management Section Component
function UsersSection() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('medico');

    const ROLES = api.users.getRoles();

    // Get allowed roles based on current user role
    const getAllowedRoles = () => {
        if (currentUser?.role === ROLES.SUPER_ADMIN) {
            return [ROLES.SUPER_ADMIN, ROLES.MEDICO, ROLES.RECEPCION];
        } else if (currentUser?.role === ROLES.MEDICO) {
            return [ROLES.MEDICO, ROLES.RECEPCION];
        }
        return [];
    };

    const canAddUsers = currentUser?.role !== ROLES.RECEPCION;

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.users.list();
            setUsers(data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUserName || !newUserEmail || !newUserPassword) {
            toast.error('Completa todos los campos');
            return;
        }

        try {
            await api.users.create({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole
            }, currentUser?.role);

            toast.success('Usuario creado exitosamente');
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('medico');
            setShowAddForm(false);
            loadUsers();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === currentUser?.id) {
            toast.error('No puedes eliminar tu propio usuario');
            return;
        }

        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await api.users.delete(userId);
                toast.success('Usuario eliminado');
                loadUsers();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Gestión de Usuarios</h3>
                        <p className="text-sm text-slate-500">{users.length} usuarios registrados</p>
                    </div>
                    {canAddUsers && (
                        <Button onClick={() => setShowAddForm(!showAddForm)}>
                            {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                            {showAddForm ? 'Cancelar' : 'Agregar'}
                        </Button>
                    )}
                </div>

                {/* Info tip */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-2">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p>Los usuarios nuevos podrán iniciar sesión inmediatamente con su contraseña.</p>
                        <p className="text-blue-500 dark:text-blue-400">Se recomienda que cambien su contraseña en el primer inicio de sesión.</p>
                    </div>
                </div>

                {/* Add User Form */}
                {showAddForm && (
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Nuevo Usuario</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <input
                                type="email"
                                placeholder="Correo o usuario"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {getAllowedRoles().map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button onClick={handleAddUser}>
                                <Check className="w-4 h-4 mr-1" /> Crear
                            </Button>
                            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                                <X className="w-4 h-4 mr-1" /> Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Users List */}
                <div className="space-y-2">
                    {users.map(u => (
                        <div
                            key={u.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                    {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-800 dark:text-white">{u.name}</p>
                                        {u.id === currentUser?.id && (
                                            <span className="text-xs text-primary font-medium">(Tú)</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">✉ {u.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                    {u.role}
                                </span>
                                {u.id !== currentUser?.id && canAddUsers && (
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Eliminar usuario"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    const {
        settings, updateSettings,
        addClinic, updateClinic, removeClinic, setActiveClinic, getActiveClinic,
        addDoctor, removeDoctor, setActiveDoctor,
        updateWebhooks, updateWhatsApp
    } = useSettings();

    const [activeSection, setActiveSection] = useState('design');
    const [currentTheme, setCurrentTheme] = useState(getConfigTheme());
    const [currentMode, setCurrentMode] = useState(getConfigMode());

    // Form state stored at top level to prevent re-renders causing focus loss
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
    const [newDoctorCedula, setNewDoctorCedula] = useState('');
    const [newDoctorUniversity, setNewDoctorUniversity] = useState('');
    const [newDoctorSsg, setNewDoctorSsg] = useState('');

    const [newClinicName, setNewClinicName] = useState('');
    const [newClinicSubtitle, setNewClinicSubtitle] = useState('');
    const [newClinicPhone, setNewClinicPhone] = useState('');
    const [newClinicAddress, setNewClinicAddress] = useState('');
    const [newClinicLogo, setNewClinicLogo] = useState('');

    const [webhookSchedule, setWebhookSchedule] = useState(settings.webhooks?.schedule || '');
    const [webhookDelete, setWebhookDelete] = useState(settings.webhooks?.delete || '');
    const [webhookAiSummary, setWebhookAiSummary] = useState(settings.webhooks?.aiSummary || '');
    const [webhookAvailability, setWebhookAvailability] = useState(settings.webhooks?.availability || '');

    // WhatsApp / YCloud settings
    const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsapp?.ycloudApiKey || '');
    const [whatsappSenderNumber, setWhatsappSenderNumber] = useState(settings.whatsapp?.senderNumber || '');
    const [whatsappTemplateName, setWhatsappTemplateName] = useState(settings.whatsapp?.templateName || 'recordatorio_cita_1_dia');
    const [whatsappReminderHour, setWhatsappReminderHour] = useState(settings.whatsapp?.reminderHour || 'disabled');
    const [whatsappTimezone, setWhatsappTimezone] = useState(settings.whatsapp?.timezone || 'America/Mexico_City');

    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
        saveConfigTheme(themeId);
    };

    const handleModeChange = (mode) => {
        setCurrentMode(mode);
        saveConfigMode(mode);
    };

    const handleAddDoctor = () => {
        if (newDoctorName) {
            addDoctor({
                name: newDoctorName,
                specialty: newDoctorSpecialty,
                cedula: newDoctorCedula,
                university: newDoctorUniversity,
                ssg: newDoctorSsg
            });
            setNewDoctorName('');
            setNewDoctorSpecialty('');
            setNewDoctorCedula('');
            setNewDoctorUniversity('');
            setNewDoctorSsg('');
            toast.success('Doctor agregado');
        }
    };

    const handleAddClinic = async () => {
        if (newClinicName) {
            await addClinic({
                name: newClinicName,
                subtitle: newClinicSubtitle,
                phone: newClinicPhone,
                address: newClinicAddress,
                logo: newClinicLogo
            });
            setNewClinicName('');
            setNewClinicSubtitle('');
            setNewClinicPhone('');
            setNewClinicAddress('');
            setNewClinicLogo('');
            toast.success('Clínica agregada');
        }
    };

    const handleLogoUpload = (e, clinicId = null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500000) { // 500KB limit
            toast.error('La imagen es muy grande (máx 500KB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            if (clinicId) {
                // Update existing clinic
                updateClinic(clinicId, { logo: base64 });
                toast.success('Logo actualizado');
            } else {
                // For new clinic
                setNewClinicLogo(base64);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveWebhooks = () => {
        updateWebhooks({ schedule: webhookSchedule, delete: webhookDelete, aiSummary: webhookAiSummary, availability: webhookAvailability });
        toast.success('Webhooks guardados');
    };

    const handleSaveWhatsApp = () => {
        updateWhatsApp({
            ycloudApiKey: whatsappApiKey,
            senderNumber: whatsappSenderNumber,
            templateName: whatsappTemplateName,
            reminderHour: whatsappReminderHour,
            timezone: whatsappTimezone
        });
        toast.success('Configuración WhatsApp guardada');
    };

    // Get current user to check role
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'superadmin';

    // All sections with role restrictions
    const allSections = [
        { id: 'design', label: 'Diseño', icon: Palette, description: 'Tema y visualización', color: 'from-violet-500 to-purple-500', superAdminOnly: false },
        { id: 'users', label: 'Usuarios y Roles', icon: Users, description: 'Gestionar usuarios', color: 'from-emerald-500 to-teal-500', superAdminOnly: false },
        { id: 'clinic', label: 'Clínica', icon: Building2, description: 'Clinicas y doctores', color: 'from-blue-500 to-indigo-500', superAdminOnly: false },
        { id: 'automation', label: 'Automatización', icon: Settings, description: 'Bot y horarios n8n', color: 'from-cyan-500 to-blue-500', superAdminOnly: true },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Automatización YCloud', color: 'from-green-500 to-emerald-500', superAdminOnly: true },
        { id: 'webhooks', label: 'Webhooks', icon: Link2, description: 'Conexiones API', color: 'from-orange-500 to-red-500', superAdminOnly: true },
        { id: 'backup', label: 'Respaldo', icon: HardDrive, description: 'NOM-024', color: 'from-green-500 to-emerald-500', superAdminOnly: false },
    ];

    // Filter sections based on role
    const sections = allSections.filter(s => !s.superAdminOnly || isSuperAdmin);

    const activeClinic = getActiveClinic();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    Configuración
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Personaliza tu sistema</p>
            </div>

            {/* Section Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveSection(section.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${isActive
                                ? 'border-primary bg-primary-50 dark:bg-primary-900/30'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${isActive ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>
                                        {section.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{section.description}</p>
                                </div>
                                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-300'}`} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 md:p-6">

                {/* DESIGN TAB */}
                {activeSection === 'design' && (
                    <div className="space-y-8">
                        {/* Mode Selection */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Sun className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Modo de Visualización</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {MODES.map((mode) => {
                                    const Icon = modeIcons[mode];
                                    const isActive = currentMode === mode;
                                    return (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => handleModeChange(mode)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${isActive
                                                ? 'border-primary bg-primary-50 dark:bg-primary-900/30'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-16 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${mode === 'dark' ? 'bg-slate-800 text-white' :
                                                mode === 'light' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-gradient-to-r from-slate-100 to-slate-800 text-white'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {modeLabels[mode]}
                                            </p>
                                            {isActive && <Check className="w-4 h-4 text-primary mx-auto mt-2" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Theme Selection */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Palette className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tema de Colores</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(THEMES).map((theme) => {
                                    const isActive = currentTheme === theme.id;
                                    return (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => handleThemeChange(theme.id)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${isActive
                                                ? 'border-primary bg-primary-50 dark:bg-primary-900/30'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="flex gap-1 mb-3">
                                                {[theme.colors[400], theme.colors[500], theme.colors[600]].map((color, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: color }} />
                                                ))}
                                            </div>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className={`font-medium ${isActive ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>
                                                        {theme.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{theme.description}</p>
                                                </div>
                                                {isActive && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {/* USERS TAB */}
                {activeSection === 'users' && (
                    <UsersSection />
                )}

                {/* CLINIC TAB */}
                {activeSection === 'clinic' && (
                    <div className="space-y-6">
                        {/* Clinics Section */}
                        <Card title="Clínicas">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Nombre de la clínica"
                                    value={newClinicName}
                                    onChange={(e) => setNewClinicName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Subtítulo"
                                    value={newClinicSubtitle}
                                    onChange={(e) => setNewClinicSubtitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Teléfono"
                                    value={newClinicPhone}
                                    onChange={(e) => setNewClinicPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Dirección"
                                    value={newClinicAddress}
                                    onChange={(e) => setNewClinicAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 cursor-pointer hover:border-primary transition-colors flex-1">
                                        <Upload className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500">{newClinicLogo ? 'Logo cargado ✓' : 'Subir logo (opcional)'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e)} />
                                    </label>
                                    {newClinicLogo && (
                                        <img src={newClinicLogo} alt="Preview" className="w-10 h-10 object-contain rounded border" />
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleAddClinic}><Plus className="w-4 h-4 mr-1" /> Agregar</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {settings.clinics?.map(clinic => (
                                    <div key={clinic.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="activeClinic"
                                                checked={settings.activeClinic === clinic.id}
                                                onChange={() => setActiveClinic(clinic.id)}
                                                className="w-4 h-4"
                                            />
                                            {/* Logo or Upload Button */}
                                            <label className="cursor-pointer relative group">
                                                {clinic.logo ? (
                                                    <img src={clinic.logo} alt="Logo" className="w-10 h-10 object-contain rounded border group-hover:opacity-75 transition-opacity" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded border border-dashed border-slate-300 flex items-center justify-center group-hover:border-primary transition-colors">
                                                        <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, clinic.id)} />
                                            </label>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">{clinic.name}</p>
                                                <p className="text-sm text-slate-500">{clinic.subtitle} • {clinic.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {clinic.logo && (
                                                <Button variant="ghost" size="sm" onClick={() => updateClinic(clinic.id, { logo: '' })} className="text-slate-400 hover:text-red-500" title="Quitar logo">
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                            {settings.clinics?.length > 1 && (
                                                <Button variant="ghost" size="sm" onClick={() => removeClinic(clinic.id)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Doctors Section */}
                        <Card title="Doctores / Especialistas">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Nombre del doctor"
                                    value={newDoctorName}
                                    onChange={(e) => setNewDoctorName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Especialidad"
                                    value={newDoctorSpecialty}
                                    onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Universidad"
                                    value={newDoctorUniversity}
                                    onChange={(e) => setNewDoctorUniversity(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Cédula Profesional"
                                    value={newDoctorCedula}
                                    onChange={(e) => setNewDoctorCedula(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="SSG (Reg. Estatal)"
                                        value={newDoctorSsg}
                                        onChange={(e) => setNewDoctorSsg(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <Button onClick={handleAddDoctor}><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {settings.doctors?.map(doctor => (
                                    <div key={doctor.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="activeDoctor"
                                                checked={settings.activeDoctor === doctor.id}
                                                onChange={() => setActiveDoctor(doctor.id)}
                                                className="w-4 h-4"
                                            />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">{doctor.name}</p>
                                                <p className="text-sm text-slate-500">{doctor.specialty} • Céd: {doctor.cedula}</p>
                                                {(doctor.university || doctor.ssg) && (
                                                    <p className="text-xs text-slate-400">{doctor.university} {doctor.ssg && `• SSG: ${doctor.ssg}`}</p>
                                                )}
                                            </div>
                                        </div>
                                        {settings.doctors?.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeDoctor(doctor.id)} className="text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* AUTOMATION TAB */}
                {activeSection === 'automation' && (
                    <AutomationSection />
                )}

                {/* WEBHOOKS TAB */}
                {activeSection === 'webhooks' && (
                    <Card title="Conexiones API (Webhooks)">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Configura las URLs de n8n u otros servicios para sincronizar citas y estadísticas.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook - Agendar Cita</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="https://n8n.example.com/webhook/schedule"
                                    value={webhookSchedule}
                                    onChange={(e) => setWebhookSchedule(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook - Eliminar Cita</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="https://n8n.example.com/webhook/delete"
                                    value={webhookDelete}
                                    onChange={(e) => setWebhookDelete(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook - Resumen IA (Dictado)</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="https://n8n.example.com/webhook/ai-summary"
                                    value={webhookAiSummary}
                                    onChange={(e) => setWebhookAiSummary(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Para generar resumen de consulta con IA desde el dictado por voz</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook - Verificar Disponibilidad (Google Calendar)</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="https://n8n.example.com/webhook/check-availability"
                                    value={webhookAvailability}
                                    onChange={(e) => setWebhookAvailability(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Consulta Google Calendar para verificar disponibilidad antes de agendar</p>
                            </div>
                            <Button onClick={handleSaveWebhooks}><Save className="w-4 h-4 mr-2" /> Guardar Webhooks</Button>
                        </div>
                    </Card>
                )}

                {/* RECIPE LAYOUT TAB */}
                {activeSection === 'recipe' && (
                    <Card title="Diseño de Receta Personalizado">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Personaliza la posición de los elementos en tu receta para que coincidan con tu papel pre-impreso.
                        </p>
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                <h3 className="font-medium text-cyan-800 dark:text-cyan-300 mb-2">¿Cómo funciona?</h3>
                                <ol className="text-sm text-cyan-700 dark:text-cyan-400 space-y-1 list-decimal list-inside">
                                    <li>Sube una foto de tu recetario vacío como guía</li>
                                    <li>Arrastra los elementos (nombre, medicamentos, etc.) sobre la imagen</li>
                                    <li>Guarda la configuración</li>
                                    <li>Al imprimir "Sin membrete", el texto caerá en las posiciones que configuraste</li>
                                </ol>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">Estado actual:</p>
                                    <p className="text-sm text-slate-500">
                                        {settings.recipeLayout?.enabled ? '✅ Diseño personalizado activo' : '❌ Usando diseño estándar'}
                                    </p>
                                </div>
                                <Button onClick={() => window.location.href = '/configuracion/receta'}>
                                    <FileText className="w-4 h-4 mr-2" /> Abrir Editor Visual
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* WHATSAPP AUTOMATION TAB */}
                {activeSection === 'whatsapp' && (
                    <Card title="Automatización WhatsApp - YCloud">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Configura el envío automático de recordatorios de citas via WhatsApp usando YCloud API.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    YCloud API Key *
                                </label>
                                <input
                                    type="password"
                                    autoComplete="off"
                                    placeholder="Ingresa tu YCloud API Key"
                                    value={whatsappApiKey}
                                    onChange={(e) => setWhatsappApiKey(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Encuéntrala en tu panel de YCloud → Settings → API Keys</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Número Remitente WhatsApp *
                                </label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="+524771075025"
                                    value={whatsappSenderNumber}
                                    onChange={(e) => setWhatsappSenderNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Número verificado en YCloud desde el cual se envían los mensajes (incluye código de país)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nombre de Plantilla
                                </label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="recordatorio_cita_1_dia"
                                    value={whatsappTemplateName}
                                    onChange={(e) => setWhatsappTemplateName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                                <p className="text-xs text-slate-400 mt-1">Nombre de la plantilla aprobada en WhatsApp Business (debe tener parámetros: nombre y hora)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Hora de Envío de Recordatorios
                                </label>
                                <select
                                    value={whatsappReminderHour}
                                    onChange={(e) => setWhatsappReminderHour(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    <option value="disabled">Desactivado</option>
                                    <option value="7">7:00 AM</option>
                                    <option value="8">8:00 AM</option>
                                    <option value="9">9:00 AM</option>
                                    <option value="10">10:00 AM</option>
                                    <option value="11">11:00 AM</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">El recordatorio se enviará a esta hora para todas las citas del día</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Zona Horaria
                                </label>
                                <select
                                    value={whatsappTimezone}
                                    onChange={(e) => setWhatsappTimezone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    <option value="America/Mexico_City">México (Ciudad de México)</option>
                                    <option value="America/Monterrey">México (Monterrey)</option>
                                    <option value="America/Tijuana">México (Tijuana)</option>
                                    <option value="America/Bogota">Colombia (Bogotá)</option>
                                    <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                                    <option value="America/Lima">Perú (Lima)</option>
                                    <option value="America/Santiago">Chile (Santiago)</option>
                                    <option value="Europe/Madrid">España (Madrid)</option>
                                </select>
                                <p className="text-xs text-slate-400 mt-1">Zona horaria para los recordatorios automáticos</p>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">📡 Webhook para Confirmaciones</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Configura esta URL en tu panel de YCloud para recibir respuestas de los pacientes:
                                </p>
                                <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-blue-800 dark:text-blue-200 break-all">
                                    https://[tu-dominio]/api/webhooks/whatsapp-inbound
                                </code>
                            </div>

                            <Button onClick={handleSaveWhatsApp}>
                                <Save className="w-4 h-4 mr-2" /> Guardar Configuración WhatsApp
                            </Button>
                        </div>
                    </Card>
                )}

                {/* BACKUP TAB - NOM-024 */}
                {activeSection === 'backup' && (
                    <Card title="Respaldo de Datos - NOM-024-SSA3-2012">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Cumplimiento de respaldo de expedientes clínicos electrónicos.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Export */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                                        <Download className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-green-800 dark:text-green-300">Exportar Respaldo</h3>
                                        <p className="text-xs text-green-600 dark:text-green-400">Descargar todos los datos</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Genera un archivo JSON con todos los pacientes, consultas, análisis y configuración.
                                </p>
                                <Button
                                    onClick={() => {
                                        const result = exportBackup();
                                        if (result.success) {
                                            toast.success(`Respaldo exportado (${result.keysExported} registros)`);
                                        } else {
                                            toast.error('Error al exportar');
                                        }
                                    }}
                                    className="w-full"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Descargar Respaldo
                                </Button>
                            </div>

                            {/* Import */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-800 dark:text-blue-300">Restaurar Respaldo</h3>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Importar desde archivo</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Restaura datos desde un archivo de respaldo previo.
                                </p>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const result = await importBackup(file, false);
                                            if (result.success) {
                                                toast.success(`Importados ${result.keysImported} registros`);
                                            } else {
                                                toast.error(result.error || 'Error al importar');
                                            }
                                        }
                                        e.target.value = '';
                                    }}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
                                />
                            </div>
                        </div>

                        {/* Storage Info */}
                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">Uso de Almacenamiento</span>
                            </div>
                            {(() => {
                                const stats = getStorageStats();
                                const backupInfo = getBackupInfo();
                                return (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-primary">{stats.totalKeys}</p>
                                            <p className="text-xs text-slate-500">Registros</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.totalMB} MB</p>
                                            <p className="text-xs text-slate-500">Tamaño</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-amber-600">{stats.usagePercent}%</p>
                                            <p className="text-xs text-slate-500">Capacidad</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {backupInfo?.lastBackup
                                                    ? new Date(backupInfo.lastBackup).toLocaleDateString('es-MX')
                                                    : 'Nunca'}
                                            </p>
                                            <p className="text-xs text-slate-500">Último respaldo</p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
