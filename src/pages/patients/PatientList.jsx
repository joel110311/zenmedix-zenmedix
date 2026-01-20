import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Phone, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { usePatient } from '../../context/PatientContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

// Calculate age from DOB
const calculateAge = (dob) => {
    if (!dob) return '-';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PatientList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { setActivePatient } = usePatient();

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await api.patients.list();
            setPatients(data);
        } catch (error) {
            toast.error('Error al cargar pacientes');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || (p.phone && p.phone.includes(search));
    });

    const handleViewHistory = (patient) => {
        setActivePatient(patient);
        navigate(`/pacientes/${patient.id}`);
    };

    const handleEdit = (patient) => {
        navigate(`/pacientes/editar/${patient.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Directorio de Pacientes</h1>
                <Button onClick={() => navigate('/pacientes/nuevo')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Paciente
                </Button>
            </div>

            <Card>
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <Spinner />
                ) : filteredPatients.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>No se encontraron pacientes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Desktop/Tablet Table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-3 text-sm font-semibold text-slate-600">Nombre Completo</th>
                                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600 w-16">Edad</th>
                                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Teléfono
                                    </th>
                                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Última Visita
                                    </th>
                                    <th className="text-right py-3 px-3 text-sm font-semibold text-slate-600 w-28">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => handleViewHistory(patient)}
                                    >
                                        <td className="py-3 px-3">
                                            <div>
                                                <p className="font-medium text-primary hover:underline">{patient.firstName} {patient.lastName}</p>
                                                {patient.idNumber && <p className="text-xs text-slate-500">{patient.idType}: {patient.idNumber}</p>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 text-sm text-slate-600">{calculateAge(patient.dob)}</td>
                                        <td className="py-3 px-2 text-sm text-slate-600">{patient.phone || '-'}</td>
                                        <td className="py-3 px-2 text-sm text-slate-600">{formatDate(patient.lastVisit)}</td>
                                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(patient)}
                                                title="Editar paciente"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile List */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    className="py-3 px-2 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                                    onClick={() => handleViewHistory(patient)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-primary truncate">
                                                {patient.firstName} {patient.lastName}
                                            </p>
                                            {patient.idNumber && <p className="text-xs text-slate-500">{patient.idType}: {patient.idNumber}</p>}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-medium text-slate-700">{calculateAge(patient.dob)} años</p>
                                            <p className="text-xs text-slate-400">{formatDate(patient.lastVisit)}</p>
                                        </div>
                                    </div>
                                    {patient.phone && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            {patient.phone}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
