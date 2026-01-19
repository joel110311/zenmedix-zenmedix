import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Eye, EyeOff, FileText } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/ui/Button';

export default function PrintStudyRequest() {
    const location = useLocation();
    const navigate = useNavigate();
    const { getActiveDoctor, getActiveClinic } = useSettings();

    const { request, patient } = location.state || {};
    const [printSize, setPrintSize] = useState('media-carta');
    const [showHeader, setShowHeader] = useState(true);

    if (!request || !patient) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-slate-500">No se encontró la solicitud</p>
                <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
            </div>
        );
    }

    const handlePrint = () => window.print();
    const activeDoctor = getActiveDoctor();
    const activeClinic = getActiveClinic();
    const age = patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '';
    const HEADER_HEIGHT = '4.5rem';

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white">
            {/* Controls */}
            <div className="no-print bg-white border-b border-slate-200 p-3 md:p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <select
                                value={printSize}
                                onChange={(e) => setPrintSize(e.target.value)}
                                className="text-sm border border-slate-300 rounded px-2 py-1"
                            >
                                <option value="media-carta">Media Carta</option>
                                <option value="carta">Carta</option>
                            </select>
                        </div>

                        <Button
                            variant={showHeader ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setShowHeader(!showHeader)}
                            title={showHeader ? "Ocultar encabezado" : "Mostrar encabezado"}
                        >
                            {showHeader ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span className="ml-1 hidden sm:inline">Encabezado</span>
                        </Button>

                        <Button onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-1" /> Imprimir
                        </Button>
                    </div>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex justify-center p-4 md:p-8 print:p-0">
                <div
                    id="study-request-document"
                    className={`bg-white shadow-lg print:shadow-none ${printSize === 'media-carta' ? 'request-media-carta' : 'request-carta'}`}
                >
                    {/* Header Section */}
                    <div style={{ height: HEADER_HEIGHT, marginBottom: '0.5rem' }}>
                        {showHeader ? (
                            <header className="h-full">
                                <div className="flex justify-between items-start h-full">
                                    <div>
                                        <h1 className="text-lg font-bold" style={{ color: 'var(--primary-600, #2563eb)' }}>
                                            {activeClinic?.name || 'Clínica ZenMedix'}
                                        </h1>
                                        <p className="text-slate-600 text-xs">{activeClinic?.subtitle || 'Centro Médico Integral'}</p>
                                    </div>
                                    <div className="text-right text-[10px] text-slate-600">
                                        <p className="font-semibold text-slate-800">{activeDoctor?.name}</p>
                                        <p>{activeDoctor?.specialty}</p>
                                        <p>Céd. Prof. {activeDoctor?.cedula}</p>
                                        <p className="mt-0.5">Tel: {activeClinic?.phone || '(555) 123-4567'}</p>
                                    </div>
                                </div>
                            </header>
                        ) : (
                            <div className="h-full" style={{ visibility: 'hidden' }}></div>
                        )}
                    </div>

                    {/* Title */}
                    <div className="text-center mb-4">
                        <h2 className="text-base font-bold text-slate-800">SOLICITUD DE ESTUDIOS DE LABORATORIO</h2>
                    </div>

                    {/* Patient Info */}
                    <section className="mb-4 text-[11px] grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <div><span className="text-slate-500">Paciente: </span><span className="font-semibold">{patient?.firstName} {patient?.lastName}</span></div>
                            <div><span className="text-slate-500">Edad: </span><span className="font-semibold">{age} años</span></div>
                        </div>
                        <div className="text-right space-y-0.5">
                            <div><span className="text-slate-500">Fecha: </span><span className="font-semibold">{new Date(request.date).toLocaleDateString('es-ES')}</span></div>
                        </div>
                    </section>

                    {/* Studies List */}
                    <section className="mb-4">
                        <h3 className="text-[11px] font-semibold text-slate-800 mb-2">Estudios Solicitados:</h3>
                        <div className="space-y-1">
                            {request.studies?.map((study, index) => (
                                <div key={index} className="flex items-start gap-2 text-[11px]">
                                    <span className="text-slate-500">•</span>
                                    <span className="text-slate-700">{study}</span>
                                </div>
                            ))}
                            {request.customStudies && (
                                <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                    <span className="font-medium">Adicionales: </span>
                                    {request.customStudies}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="mb-4 text-[10px] text-slate-500">
                        <p>Por favor, realizar los estudios indicados y enviar resultados a esta clínica.</p>
                    </section>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        .request-media-carta {
          width: 14cm;
          min-height: 10.8cm;
          padding: 0.6cm;
          font-size: 10pt;
        }
        .request-carta {
          width: 21.59cm;
          min-height: 27.94cm;
          padding: 1.5cm;
          font-size: 11pt;
        }
        
        @media print {
          @page {
            size: ${printSize === 'media-carta' ? '14cm 21.59cm' : 'letter'};
            margin: 0;
          }
          
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          
          .request-media-carta {
            width: 14cm;
            height: 21.59cm;
            max-height: 21.59cm;
            padding: 0.8cm;
            margin: 0;
            box-shadow: none;
            page-break-inside: avoid;
          }
          
          .request-carta {
            width: 21.59cm;
            height: 27.94cm;
            padding: 1.5cm;
            margin: 0;
            box-shadow: none;
          }
        }
        
        @media (max-width: 640px) {
          .request-media-carta, .request-carta {
            width: 100%;
            min-height: auto;
            padding: 1rem;
          }
        }
      `}</style>
        </div>
    );
}
