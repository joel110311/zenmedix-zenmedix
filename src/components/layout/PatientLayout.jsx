import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { User, FileText, Activity, Clock, ArrowLeft, Printer, FlaskConical, ClipboardList } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Spinner } from '../ui/Spinner';
import { Button } from '../ui/Button';

export const PatientLayout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activePatient, setActivePatient } = usePatient();
    const [loading, setLoading] = useState(!activePatient);

    useEffect(() => {
        if (!activePatient || activePatient.id !== id) {
            loadPatient();
        } else {
            setLoading(false);
        }
    }, [id]);

    const loadPatient = async () => {
        try {
            const patient = await api.patients.get(id);
            setActivePatient(patient);
        } catch (error) {
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

    const menuItems = [
        { label: 'Datos Personales', path: `/pacientes/${id}/resumen`, icon: User },
        { label: 'Antecedentes', path: `/pacientes/${id}/antecedentes`, icon: Activity },
        { label: 'Historial Consultas', path: `/pacientes/${id}/historial`, icon: Clock },
        { label: 'Nueva Consulta', path: `/pacientes/${id}/consulta/nueva`, icon: FileText },
        { label: 'Análisis Clínicos', path: `/pacientes/${id}/analisis`, icon: FlaskConical },
        { label: 'Historia Completa', path: `/imprimir/historia/${id}`, icon: Printer },
    ];

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] -m-4 lg:-m-8">
            {/* Patient Sidebar - Vertical on desktop, horizontal on mobile */}
            <div className="w-full lg:w-64 bg-white dark:bg-[#0E1014] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-[#1e2328] lg:h-full flex flex-col shrink-0">
                {/* Patient Header */}
                <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-[#1e2328] bg-slate-50 dark:bg-[#0B0D10]">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 mb-3 text-slate-500 dark:text-[#6B6F76] hover:text-slate-700 dark:hover:text-white"
                        onClick={() => navigate('/pacientes')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a Lista
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center font-bold text-lg lg:text-xl text-primary shrink-0">
                            {activePatient.firstName[0]}{activePatient.lastName[0]}
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-slate-800 dark:text-white leading-tight truncate">
                                {activePatient.firstName} {activePatient.lastName}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-[#6B6F76]">
                                {new Date().getFullYear() - new Date(activePatient.dob).getFullYear()} años • ID: {activePatient.dni || activePatient.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation - Horizontal scroll on mobile, vertical on desktop */}
                <nav className="overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto p-2 lg:p-4 lg:flex-1">
                    <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium rounded-lg lg:rounded-xl transition-all duration-200 whitespace-nowrap
                                        ${isActive
                                            ? 'nav-active bg-primary/10 dark:bg-primary/15'
                                            : 'text-slate-600 dark:text-[#6B6F76] hover:bg-slate-50 dark:hover:bg-[#1a1d22] hover:text-slate-900 dark:hover:text-white'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline lg:inline">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-[#0B0D10]">
                <Outlet />
            </div>
        </div>
    );
};
