import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Plus, Trash2, FileText, Stethoscope, Pill, FlaskConical, AlertTriangle, User, Phone, Calendar, Heart, Search } from 'lucide-react';
import { api } from '../../services/api';
import { usePatient } from '../../context/PatientContext';
import { useSettings } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import DictadoConsulta from '../../components/consultation/DictadoConsulta';
import AnalysisUploader from '../../components/consultation/AnalysisUploader';
import { toast } from 'sonner';

// Lab Studies Catalog
const LAB_STUDIES_CATALOG = [
    // Hematología
    { id: 'bh', name: 'Biometría Hemática / Plaquetas', category: 'Hematología' },
    { id: 'hba1c', name: 'Hemoglobina Glicosilada (HbA1C)', category: 'Hematología' },
    { id: 'tsc', name: 'Tiempo / Sangrado y Coagulación', category: 'Hematología' },
    { id: 'tp', name: 'Tiempo de Protrombina / INR', category: 'Hematología' },
    { id: 'tpt', name: 'Tiempo Parcial / Tromboplastina', category: 'Hematología' },
    { id: 'tt', name: 'Tiempo de Trombina', category: 'Hematología' },
    { id: 'dd', name: 'Dímeros D', category: 'Hematología' },
    { id: 'plaq', name: 'Plaquetas', category: 'Hematología' },
    { id: 'retic', name: 'Reticulocitos', category: 'Hematología' },
    { id: 'grh', name: 'Grupo Sanguíneo y Factor RH', category: 'Hematología' },
    { id: 'gasa', name: 'Gasometría Arterial', category: 'Hematología' },
    { id: 'gasv', name: 'Gasometría Venosa', category: 'Hematología' },
    { id: 'hierro', name: 'Hierro Sérico', category: 'Hematología' },
    { id: 'ferr', name: 'Ferritina', category: 'Hematología' },
    { id: 'transf', name: 'Transferrina', category: 'Hematología' },
    // Química
    { id: 'qs6', name: 'Química Sanguínea 6 elementos', category: 'Química' },
    { id: 'qs12', name: 'Química Sanguínea 12 elementos', category: 'Química' },
    { id: 'qs24', name: 'Química Sanguínea 24 elementos', category: 'Química' },
    { id: 'glu', name: 'Glucosa en Ayuno', category: 'Química' },
    { id: 'ctog', name: 'Curva Tolerancia a la Glucosa', category: 'Química' },
    { id: 'crea', name: 'Creatinina', category: 'Química' },
    { id: 'bun', name: 'BUN / Urea', category: 'Química' },
    { id: 'auric', name: 'Ácido Úrico', category: 'Química' },
    // Lípidos
    { id: 'perfil', name: 'Perfil de Lípidos', category: 'Lípidos' },
    { id: 'colest', name: 'Colesterol Total', category: 'Lípidos' },
    { id: 'hdl', name: 'Colesterol HDL', category: 'Lípidos' },
    { id: 'ldl', name: 'Colesterol LDL', category: 'Lípidos' },
    { id: 'trig', name: 'Triglicéridos', category: 'Lípidos' },
    // Hepáticos
    { id: 'pfh', name: 'Pruebas de Función Hepática', category: 'Hepáticos' },
    { id: 'tgo', name: 'TGO / AST', category: 'Hepáticos' },
    { id: 'tgp', name: 'TGP / ALT', category: 'Hepáticos' },
    { id: 'biltot', name: 'Bilirrubinas (Total, Directa, Indirecta)', category: 'Hepáticos' },
    { id: 'alb', name: 'Albúmina', category: 'Hepáticos' },
    { id: 'prot', name: 'Proteínas Totales', category: 'Hepáticos' },
    // Tiroides
    { id: 'pft', name: 'Perfil Tiroideo (T3, T4, TSH)', category: 'Tiroides' },
    { id: 'tsh', name: 'TSH', category: 'Tiroides' },
    { id: 't3', name: 'T3 Libre', category: 'Tiroides' },
    { id: 't4', name: 'T4 Libre', category: 'Tiroides' },
    // Orina
    { id: 'ego', name: 'Examen General de Orina (EGO)', category: 'Orina' },
    { id: 'urocult', name: 'Urocultivo', category: 'Orina' },
    { id: 'depcreat', name: 'Depuración de Creatinina', category: 'Orina' },
    // Otros
    { id: 'pcr', name: 'Proteína C Reactiva (PCR)', category: 'Otros' },
    { id: 'vsg', name: 'Velocidad de Sedimentación (VSG)', category: 'Otros' },
    { id: 'elec', name: 'Electrolitos Séricos', category: 'Otros' },
    { id: 'vitd', name: 'Vitamina D', category: 'Otros' },
    { id: 'vitb12', name: 'Vitamina B12', category: 'Otros' },
    // Imagen
    { id: 'rxtorax', name: 'Radiografía de Tórax PA', category: 'Imagen' },
    { id: 'rxabd', name: 'Radiografía de Abdomen', category: 'Imagen' },
    { id: 'eco', name: 'Ultrasonido Abdominal', category: 'Imagen' },
    { id: 'ecoren', name: 'Ultrasonido Renal', category: 'Imagen' },
    { id: 'ecotir', name: 'Ultrasonido Tiroideo', category: 'Imagen' },
    { id: 'eco mamario', name: 'Ultrasonido Mamario', category: 'Imagen' },
    { id: 'ekg', name: 'Electrocardiograma (EKG)', category: 'Imagen' },
];

// Expanded ICD-10 Diagnosis Catalog
const DIAGNOSIS_CATALOG = [
    // Respiratory
    "J00 - Rinofaringitis aguda (resfriado común)",
    "J01 - Sinusitis aguda",
    "J02 - Faringitis aguda",
    "J03 - Amigdalitis aguda",
    "J04 - Laringitis y traqueítis aguda",
    "J06 - Infección respiratoria superior aguda",
    "J11 - Influenza",
    "J18 - Neumonía",
    "J20 - Bronquitis aguda",
    "J21 - Bronquiolitis aguda",
    "J30 - Rinitis alérgica",
    "J45 - Asma",
    // Cardiovascular
    "I10 - Hipertensión esencial primaria",
    "I20 - Angina de pecho",
    "I21 - Infarto agudo de miocardio",
    "I25 - Cardiopatía isquémica crónica",
    "I50 - Insuficiencia cardíaca",
    // Metabolic / Endocrine
    "E10 - Diabetes mellitus tipo 1",
    "E11 - Diabetes mellitus tipo 2",
    "E66 - Obesidad",
    "E78 - Dislipidemia",
    "E03 - Hipotiroidismo",
    "E05 - Hipertiroidismo",
    // Gastrointestinal
    "K21 - Enfermedad por reflujo gastroesofágico",
    "K25 - Úlcera gástrica",
    "K29 - Gastritis",
    "K30 - Dispepsia",
    "K35 - Apendicitis aguda",
    "K52 - Gastroenteritis y colitis",
    "K58 - Síndrome del intestino irritable",
    "K59 - Estreñimiento",
    // Musculoskeletal
    "M54 - Dorsalgia / Lumbalgia",
    "M79 - Dolor en articulación",
    "M25 - Artralgia",
    // Neurological
    "G43 - Migraña",
    "G44 - Cefalea tensional",
    "R51 - Cefalea no especificada",
    // Genitourinary
    "N30 - Cistitis",
    "N39 - Infección de vías urinarias",
    // Skin
    "L20 - Dermatitis atópica",
    "L50 - Urticaria",
    // Mental / Behavioral
    "F32 - Episodio depresivo",
    "F41 - Trastorno de ansiedad",
    // General
    "R50 - Fiebre de origen desconocido",
    "R11 - Náusea y vómito",
    "R10 - Dolor abdominal",
    "Z00 - Examen general (check-up)"
];

// Get saved medication history from localStorage
const getMedicationHistory = () => {
    const stored = localStorage.getItem('medflow_medication_history');
    return stored ? JSON.parse(stored) : [];
};

// Save medication to history
const saveMedicationToHistory = (medication) => {
    if (!medication.name) return;
    const history = getMedicationHistory();
    const exists = history.find(m => m.name.toLowerCase() === medication.name.toLowerCase());
    if (!exists) {
        const updated = [{ name: medication.name, dose: medication.dose, frequency: medication.frequency, duration: medication.duration }, ...history].slice(0, 50);
        localStorage.setItem('medflow_medication_history', JSON.stringify(updated));
    }
};

// Calculate BMI
const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    return bmi.toFixed(1);
};

// Calculate age from date
const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export default function NewConsultation() {
    const { activePatient } = usePatient();
    const { getActiveClinic, getActiveDoctor } = useSettings();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('consulta');
    const [medicationHistory, setMedicationHistory] = useState([]);
    const [selectedStudies, setSelectedStudies] = useState([]);
    const [studyFilter, setStudyFilter] = useState('');
    const [studyMode, setStudyMode] = useState(null); // 'solicitar' | 'registrar' | null

    useEffect(() => {
        setMedicationHistory(getMedicationHistory());
    }, []);

    const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
        defaultValues: {
            vitalSigns: {
                systolic: '', diastolic: '',
                heartRate: '',
                temperature: '', spO2: '',
                weight: '', height: ''
            },
            chiefComplaint: '',
            notes: '',
            diagnosis: '',
            treatmentPlan: '',
            medications: [{ name: '', dose: '', frequency: '', duration: '' }],
            studies: ''
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

    const watchWeight = watch('vitalSigns.weight');
    const watchHeight = watch('vitalSigns.height');
    const bmi = calculateBMI(watchWeight, watchHeight);

    if (!activePatient) return null;

    const patientAge = calculateAge(activePatient.dob);

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            data.medications.filter(m => m.name).forEach(med => saveMedicationToHistory(med));
            setMedicationHistory(getMedicationHistory());

            const consultation = await api.consultations.create({
                patientId: activePatient.id,
                vitalSigns: data.vitalSigns,
                chiefComplaint: data.chiefComplaint,
                notes: data.notes,
                diagnosis: data.diagnosis,
                treatmentPlan: data.treatmentPlan,
                medications: data.medications.filter(m => m.name),
                studies: data.studies,
                bmi,
                // Save clinic and doctor info with consultation
                clinic: getActiveClinic(),
                doctor: getActiveDoctor()
            });

            // Mark today's appointment for this patient as completed
            try {
                const appointmentsData = localStorage.getItem('medflow_appointments');
                if (appointmentsData) {
                    const appointments = JSON.parse(appointmentsData);
                    const today = new Date().toISOString().split('T')[0];

                    // Find appointment for this patient today and mark as completed
                    const updatedAppointments = appointments.map(apt => {
                        const aptDate = apt.date?.split('T')[0] || apt.date;
                        const isToday = aptDate === today;
                        const isPatient = apt.patientId === activePatient.id ||
                            apt.patientName === `${activePatient.firstName} ${activePatient.lastName}`;

                        if (isToday && isPatient && !apt.consultationCompleted) {
                            return { ...apt, consultationCompleted: true, status: 'completed' };
                        }
                        return apt;
                    });

                    localStorage.setItem('medflow_appointments', JSON.stringify(updatedAppointments));
                }
            } catch (e) {
                console.error('Error updating appointment status:', e);
            }

            toast.success('Consulta guardada correctamente');
            navigate(`/imprimir/receta/${consultation.id}`);
        } catch (error) {
            toast.error('Error al guardar la consulta');
        } finally {
            setSaving(false);
        }
    };

    // Tab definitions
    const tabs = [
        { id: 'consulta', label: 'Consulta', icon: FileText },
        { id: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope },
        { id: 'tratamiento', label: 'Tratamiento', icon: Pill },
        { id: 'estudios', label: 'Estudios', icon: FlaskConical },
    ];

    return (
        <div className="space-y-4 pb-24">
            {/* Patient Info Header */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                {activePatient.firstName} {activePatient.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                {patientAge && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {patientAge} años</span>}
                                {activePatient.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {activePatient.phone}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>

                {/* Medical Alerts */}
                {(activePatient.allergies || activePatient.pathologicalHistory || activePatient.nonPathologicalHistory) && (
                    <div className="mt-4 space-y-2">
                        {/* Alergias */}
                        {activePatient.allergies && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-red-700 dark:text-red-400">Alergias: </span>
                                    <span className="text-red-600 dark:text-red-300">{activePatient.allergies}</span>
                                </div>
                            </div>
                        )}

                        {/* Grid para los dos antecedentes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Antecedentes Patológicos */}
                            {activePatient.pathologicalHistory && (
                                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 flex items-start gap-2">
                                    <Heart className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs">
                                        <span className="font-bold text-amber-700 dark:text-amber-400">Ant. Patológicos: </span>
                                        <span className="text-amber-600 dark:text-amber-300">{activePatient.pathologicalHistory}</span>
                                    </div>
                                </div>
                            )}

                            {/* Antecedentes No Patológicos */}
                            {activePatient.nonPathologicalHistory && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs">
                                        <span className="font-bold text-blue-700 dark:text-blue-400">Ant. No Patológicos: </span>
                                        <span className="text-blue-600 dark:text-blue-300">{activePatient.nonPathologicalHistory}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Custom Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Consulta Tab */}
                {activeTab === 'consulta' && (
                    <div className="space-y-6">
                        <Card title="Motivo de Consulta y Evolución">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo Principal</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        {...register('chiefComplaint', { required: 'El motivo es requerido' })}
                                        placeholder="Ej. Fiebre y dolor de garganta"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                    />
                                    {errors.chiefComplaint && <p className="text-red-500 text-sm mt-1">{errors.chiefComplaint.message}</p>}
                                </div>

                                {/* Voice Dictation */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dictado por Voz (opcional)</label>
                                    <DictadoConsulta
                                        onSummaryReady={(summaryData) => {
                                            // summaryData can be string or object
                                            let data = summaryData;

                                            // Try to parse if it's a string that looks like JSON
                                            if (typeof summaryData === 'string') {
                                                try {
                                                    data = JSON.parse(summaryData);
                                                } catch {
                                                    // If not parseable, use as plain text for notes
                                                    const current = watch('notes') || '';
                                                    setValue('notes', current ? current + '\n\n' + summaryData : summaryData);
                                                    return;
                                                }
                                            }

                                            // If it's an object, distribute to fields
                                            if (typeof data === 'object' && data !== null) {
                                                // Motivo Principal
                                                if (data.motivo_principal) {
                                                    setValue('chiefComplaint', data.motivo_principal);
                                                }

                                                // Nota de Evolución
                                                if (data.nota_evolucion) {
                                                    const current = watch('notes') || '';
                                                    setValue('notes', current ? current + '\n\n' + data.nota_evolucion : data.nota_evolucion);
                                                }

                                                // Signos Vitales (si vienen en la respuesta)
                                                if (data.signos_vitales) {
                                                    const sv = data.signos_vitales;
                                                    if (sv.presion) {
                                                        const [sys, dia] = sv.presion.split('/').map(s => s.replace(/\D/g, ''));
                                                        if (sys) setValue('vitalSigns.systolic', sys);
                                                        if (dia) setValue('vitalSigns.diastolic', dia);
                                                    }
                                                    if (sv.temperatura) setValue('vitalSigns.temperature', sv.temperatura.replace(/[^\d.]/g, ''));
                                                    if (sv.frecuencia_cardiaca) setValue('vitalSigns.heartRate', sv.frecuencia_cardiaca.replace(/\D/g, ''));
                                                    if (sv.spo2) setValue('vitalSigns.spO2', sv.spo2.replace(/\D/g, ''));
                                                    if (sv.peso) setValue('vitalSigns.weight', sv.peso.replace(/[^\d.]/g, ''));
                                                    if (sv.talla) setValue('vitalSigns.height', sv.talla.replace(/\D/g, ''));
                                                }

                                                // Diagnóstico (si viene)
                                                if (data.diagnostico) {
                                                    setValue('diagnosis', data.diagnostico);
                                                }

                                                // Tratamiento/Indicaciones (si viene)
                                                if (data.tratamiento || data.indicaciones) {
                                                    setValue('treatmentPlan', data.tratamiento || data.indicaciones);
                                                }
                                            } else {
                                                // Fallback: just append to notes
                                                const current = watch('notes') || '';
                                                setValue('notes', current ? current + '\n\n' + String(data) : String(data));
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota de Evolución / Inspec. General</label>
                                    <textarea
                                        autoComplete="off"
                                        {...register('notes')}
                                        rows={6}
                                        placeholder="Paciente masculino de..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card title="Signos Vitales">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">T/A Sistólica</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" autoComplete="off" {...register('vitalSigns.systolic')} placeholder="120" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">mmHg</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">T/A Diastólica</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" autoComplete="off" {...register('vitalSigns.diastolic')} placeholder="80" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">mmHg</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Frec. Cardíaca</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" autoComplete="off" {...register('vitalSigns.heartRate')} placeholder="72" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">lpm</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Temperatura</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" step="0.1" autoComplete="off" {...register('vitalSigns.temperature')} placeholder="36.5" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">°C</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">SpO2</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" autoComplete="off" {...register('vitalSigns.spO2')} placeholder="98" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Peso</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" step="0.1" autoComplete="off" {...register('vitalSigns.weight')} placeholder="70" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">kg</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Talla</label>
                                    <div className="flex items-center gap-1">
                                        <input type="number" autoComplete="off" {...register('vitalSigns.height')} placeholder="170" className="flex-1 min-w-0 w-20 px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        <span className="text-xs text-slate-400 w-10 text-right">cm</span>
                                    </div>
                                </div>
                            </div>
                            {bmi && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">IMC Calculado: {bmi}</span>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Diagnóstico Tab */}
                {activeTab === 'diagnostico' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <Card title="Diagnóstico Principal">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Buscar Diagnóstico (CIE-10)</label>
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        {...register('diagnosis')}
                                        list="diagnosis-list"
                                        placeholder="Escriba para buscar código o nombre..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                    />
                                    <datalist id="diagnosis-list">
                                        {DIAGNOSIS_CATALOG.map((d, i) => <option key={i} value={d} />)}
                                    </datalist>
                                </div>
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                        <strong>Nota:</strong> Seleccione el diagnóstico más preciso para la generación de estadísticas.
                                    </p>
                                </div>
                            </Card>
                        </div>
                        <div>
                            <Card title="Frecuentes / Últimos">
                                <div className="flex flex-col gap-2">
                                    {DIAGNOSIS_CATALOG.slice(0, 5).map((d, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setValue('diagnosis', d)}
                                            className="text-left text-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 truncate text-slate-700 dark:text-slate-300"
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Tratamiento Tab */}
                {activeTab === 'tratamiento' && (
                    <div className="space-y-6">
                        <Card title="Receta Médica">
                            <datalist id="medication-history">
                                {medicationHistory.map((med, i) => <option key={i} value={med.name} />)}
                            </datalist>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-start p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                {...register(`medications.${index}.name`)}
                                                list="medication-history"
                                                placeholder="Medicamento"
                                                autoComplete="off"
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                onBlur={(e) => {
                                                    const med = medicationHistory.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
                                                    if (med) {
                                                        if (med.dose) setValue(`medications.${index}.dose`, med.dose);
                                                        if (med.frequency) setValue(`medications.${index}.frequency`, med.frequency);
                                                        if (med.duration) setValue(`medications.${index}.duration`, med.duration);
                                                    }
                                                }}
                                            />
                                            <input {...register(`medications.${index}.dose`)} placeholder="Dosis" autoComplete="off" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                            <input {...register(`medications.${index}.frequency`)} placeholder="Frecuencia" autoComplete="off" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                            <input {...register(`medications.${index}.duration`)} placeholder="Duración" autoComplete="off" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" />
                                        </div>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" onClick={() => remove(index)} className="text-red-500 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" onClick={() => append({ name: '', dose: '', frequency: '', duration: '' })}>
                                    <Plus className="w-4 h-4 mr-1" /> Agregar Medicamento
                                </Button>
                            </div>

                            {medicationHistory.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">Medicamentos recientes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {medicationHistory.slice(0, 8).map((med, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => append({ name: med.name, dose: med.dose, frequency: med.frequency, duration: med.duration })}
                                                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                                            >
                                                + {med.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card title="Indicaciones Generales">
                            <textarea
                                autoComplete="off"
                                {...register('treatmentPlan')}
                                rows={5}
                                placeholder="Instrucciones para el paciente, cuidados generales, dieta..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary resize-none"
                            />
                        </Card>
                    </div>
                )}

                {/* Estudios Tab */}
                {activeTab === 'estudios' && (
                    <div className="space-y-6">
                        {/* Initial Selection - Show when no mode selected */}
                        {!studyMode && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Solicitar Estudios Option */}
                                <button
                                    type="button"
                                    onClick={() => setStudyMode('solicitar')}
                                    className="p-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-200 text-left group"
                                >
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FlaskConical className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                        Solicitar Estudios
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Selecciona estudios de laboratorio o imagen del catálogo para generar solicitud
                                    </p>
                                </button>

                                {/* Registrar Resultados Option */}
                                <button
                                    type="button"
                                    onClick={() => setStudyMode('registrar')}
                                    className="p-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-200 text-left group"
                                >
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                        Registrar Resultados
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Sube imágenes o PDF de resultados de laboratorio o estudios de imagen
                                    </p>
                                </button>
                            </div>
                        )}

                        {/* Solicitar Estudios View */}
                        {studyMode === 'solicitar' && (
                            <>
                                {/* Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setStudyMode(null)}
                                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors mb-4"
                                >
                                    <span className="text-lg">←</span>
                                    <span className="text-sm font-medium">Volver a opciones</span>
                                </button>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Catalog */}
                                    <div className="lg:col-span-2">
                                        <Card title="Catálogo de Estudios">
                                            <div className="space-y-4">
                                                {/* Search */}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder="Filtrar..."
                                                        value={studyFilter}
                                                        onChange={(e) => setStudyFilter(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                    />
                                                </div>

                                                {/* Studies List */}
                                                <div className="max-h-[300px] overflow-y-auto space-y-1">
                                                    {LAB_STUDIES_CATALOG
                                                        .filter(s => s.name.toLowerCase().includes(studyFilter.toLowerCase()))
                                                        .map((study) => (
                                                            <label
                                                                key={study.id}
                                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedStudies.includes(study.id)
                                                                    ? 'bg-primary/10 border border-primary/30'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedStudies.includes(study.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedStudies([...selectedStudies, study.id]);
                                                                        } else {
                                                                            setSelectedStudies(selectedStudies.filter(id => id !== study.id));
                                                                        }
                                                                    }}
                                                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                                />
                                                                <span className="text-sm text-slate-700 dark:text-slate-300">{study.name}</span>
                                                            </label>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Selected + Custom */}
                                    <div className="space-y-4">
                                        <Card title="Estudios Seleccionados">
                                            {selectedStudies.length === 0 ? (
                                                <p className="text-sm text-slate-400 italic">Selecciona estudios del catálogo</p>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {selectedStudies.map(id => {
                                                        const study = LAB_STUDIES_CATALOG.find(s => s.id === id);
                                                        return (
                                                            <li key={id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                                                                <span className="text-slate-700 dark:text-slate-300">{study?.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedStudies(selectedStudies.filter(s => s !== id))}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </Card>

                                        <Card title="Estudio Personalizado">
                                            <textarea
                                                autoComplete="off"
                                                {...register('studies')}
                                                rows={4}
                                                placeholder="Escribe estudios adicionales..."
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary resize-none text-sm"
                                            />
                                        </Card>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Registrar Resultados View */}
                        {studyMode === 'registrar' && (
                            <>
                                {/* Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setStudyMode(null)}
                                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors mb-4"
                                >
                                    <span className="text-lg">←</span>
                                    <span className="text-sm font-medium">Volver a opciones</span>
                                </button>

                                <Card title="Registrar Resultado de Análisis">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Sube imágenes o PDF de resultados de laboratorio o estudios de imagen.
                                    </p>
                                    <AnalysisUploader patientId={activePatient?.id} />
                                </Card>
                            </>
                        )}
                    </div>
                )}

                {/* Floating Action Bar */}
                <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end gap-3 z-10 shadow-lg">
                    <Button variant="ghost" type="button" onClick={() => navigate(`../resumen`)}>Cancelar</Button>
                    <Button type="submit" loading={saving} size="lg" className="w-48">
                        <Save className="w-4 h-4 mr-2" />
                        Finalizar Consulta
                    </Button>
                </div>
            </form>
        </div>
    );
}
