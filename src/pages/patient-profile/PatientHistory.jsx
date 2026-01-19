import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';

export default function PatientHistory() {
    const { activePatient, setActivePatient } = usePatient();
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            allergies: activePatient?.allergies || '',
            pathologicalHistory: activePatient?.pathologicalHistory || '',
            nonPathologicalHistory: activePatient?.nonPathologicalHistory || ''
        }
    });

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            await api.patients.update(activePatient.id, data);
            setActivePatient({ ...activePatient, ...data });
            toast.success('Antecedentes actualizados');
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (!activePatient) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Antecedentes Médicos</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-2 border-red-200 bg-red-50">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-red-700 mb-2">⚠️ ALERGIAS CONOCIDAS</label>
                            <input
                                {...register('allergies')}
                                placeholder="Sin alergias conocidas..."
                                className="w-full px-3 py-2 border-2 border-red-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-red-800 font-medium placeholder:text-red-300"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="grid grid-cols-1 gap-6">
                        <Textarea
                            label="Antecedentes Patológicos"
                            {...register('pathologicalHistory')}
                            rows={6}
                            placeholder="Enfermedades crónicas, cirugías, hospitalizaciones previas..."
                        />
                        <Textarea
                            label="Antecedentes No Patológicos"
                            {...register('nonPathologicalHistory')}
                            rows={6}
                            placeholder="Hábitos, tabaquismo, alcohol, actividad física, alimentación..."
                        />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" loading={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
