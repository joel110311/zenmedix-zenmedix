import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

// Mexican ID types based on official documents
const ID_TYPES = [
    { value: '', label: 'Seleccionar...' },
    { value: 'INE', label: 'INE/IFE (Credencial para Votar)' },
    { value: 'CURP', label: 'CURP' },
    { value: 'PASAPORTE', label: 'Pasaporte Mexicano' },
    { value: 'CEDULA_PROFESIONAL', label: 'Cédula Profesional' },
    { value: 'CARTILLA_MILITAR', label: 'Cartilla del Servicio Militar Nacional' },
    { value: 'LICENCIA_CONDUCIR', label: 'Licencia de Conducir' },
    { value: 'INAPAM', label: 'Credencial INAPAM' },
    { value: 'FM2_FM3', label: 'Forma Migratoria (FM2/FM3)' },
    { value: 'OTRO', label: 'Otro documento' }
];

// Calculate age from DOB
const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default function PatientForm() {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);
    const [calculatedAge, setCalculatedAge] = useState(null);

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            dob: '',
            sex: '',
            email: '',
            address: '',
            idType: '',
            idNumber: ''
        }
    });

    const watchDob = watch('dob');

    useEffect(() => {
        if (watchDob) {
            setCalculatedAge(calculateAge(watchDob));
        }
    }, [watchDob]);

    useEffect(() => {
        if (isEditing) {
            loadPatient();
        }
    }, [id]);

    const loadPatient = async () => {
        try {
            const patient = await api.patients.get(id);

            // Format date for input (needs YYYY-MM-DD format)
            let formattedDob = '';
            if (patient.dob) {
                const dobDate = new Date(patient.dob);
                formattedDob = dobDate.toISOString().split('T')[0];
            }

            // Reset form with patient data
            reset({
                firstName: patient.firstName || '',
                lastName: patient.lastName || '',
                phone: patient.phone || '',
                dob: formattedDob,
                sex: patient.sex || '',
                email: patient.email || '',
                address: patient.address || '',
                idType: patient.idType || '',
                idNumber: patient.idNumber || ''
            });

            if (patient.dob) setCalculatedAge(calculateAge(patient.dob));
        } catch (error) {
            toast.error('Error al cargar el paciente');
            navigate('/pacientes');
        } finally {
            setPageLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (isEditing) {
                await api.patients.update(id, data);
                toast.success('Paciente actualizado correctamente');
            } else {
                await api.patients.create(data);
                toast.success('Paciente registrado correctamente');
            }
            navigate('/pacientes');
        } catch (error) {
            toast.error('Error al guardar el paciente');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <Spinner size="lg" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/pacientes')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h1>
            </div>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Nombre y Apellido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Nombre *"
                            {...register('firstName', { required: 'El nombre es requerido' })}
                            error={errors.firstName}
                        />
                        <Input
                            label="Apellido *"
                            {...register('lastName', { required: 'El apellido es requerido' })}
                            error={errors.lastName}
                        />
                        <Input
                            label="Teléfono *"
                            type="tel"
                            {...register('phone', { required: 'El teléfono es requerido' })}
                            error={errors.phone}
                        />
                    </div>

                    {/* Fecha, Sexo, Email */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Input
                                label="Fecha de Nacimiento *"
                                type="date"
                                {...register('dob', { required: 'La fecha de nacimiento es requerida' })}
                                error={errors.dob}
                            />
                            {calculatedAge !== null && (
                                <p className="mt-1 text-sm text-primary font-medium">
                                    Edad: {calculatedAge} años
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sexo</label>
                            <select
                                {...register('sex')}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="masculino">Masculino</option>
                                <option value="femenino">Femenino</option>
                            </select>
                        </div>
                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <Input
                            label="Dirección"
                            {...register('address')}
                        />
                    </div>

                    {/* Identificación - Nueva Sección */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Identificación</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Documentos oficiales aceptados en México
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tipo de Identificación
                                </label>
                                <select
                                    {...register('idType')}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                >
                                    {ID_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Número de Identificación"
                                placeholder="Ej: CURP, Número de INE, etc."
                                {...register('idNumber')}
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" type="button" onClick={() => navigate('/pacientes')}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
