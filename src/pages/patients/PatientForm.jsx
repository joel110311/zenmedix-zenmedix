import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

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

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

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
            reset(patient);
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
                <h1 className="text-2xl font-bold text-slate-800">
                    {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h1>
            </div>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Teléfono *"
                            type="tel"
                            {...register('phone', { required: 'El teléfono es requerido' })}
                            error={errors.phone}
                        />
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label>
                            <select
                                {...register('gender')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Email"
                            type="email"
                            {...register('email')}
                        />
                        <Input
                            label="Dirección"
                            {...register('address')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
