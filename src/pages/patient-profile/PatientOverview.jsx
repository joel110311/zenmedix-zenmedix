import { useNavigate } from 'react-router-dom';
import { Edit, ArrowRight, Hash } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function PatientOverview() {
    const { activePatient } = usePatient();
    const navigate = useNavigate();

    if (!activePatient) return null;

    const InfoRow = ({ label, value }) => (
        <div className="py-2 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{label}</span>
            <span className="text-slate-900 dark:text-white text-sm break-words">{value || '-'}</span>
        </div>
    );

    // Generate patient number from ID
    const patientNumber = activePatient.id ? `P-${String(activePatient.id).padStart(4, '0')}` : '-';

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">Datos Personales</h1>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/pacientes/editar/${activePatient.id}`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Datos
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <Card title="Identificación">
                    <InfoRow label="No. Paciente" value={patientNumber} />
                    <InfoRow label="Nombre Completo" value={`${activePatient.firstName} ${activePatient.lastName}`} />
                    <InfoRow label="ID Número" value={activePatient.dni} />
                    <InfoRow label="Fecha de Nacimiento" value={activePatient.dob ? new Date(activePatient.dob).toLocaleDateString('es-MX') : '-'} />
                    <InfoRow label="Sexo" value={activePatient.gender === 'M' ? 'Masculino' : activePatient.gender === 'F' ? 'Femenino' : activePatient.gender || '-'} />
                </Card>

                <Card title="Contacto">
                    <InfoRow label="Teléfono" value={activePatient.phone} />
                    <InfoRow label="Email" value={activePatient.email} />
                    <InfoRow label="Dirección" value={activePatient.address} />
                </Card>
            </div>

            <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--primary-700)' }}>Nueva Consulta</h3>
                        <p className="text-sm" style={{ color: 'var(--primary-600)' }}>Iniciar un nuevo registro de visita para este paciente.</p>
                    </div>
                    <Button onClick={() => navigate(`../consulta/nueva`)} className="w-full sm:w-auto">
                        Comenzar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
