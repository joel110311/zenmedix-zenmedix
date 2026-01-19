import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Edit2, Save, FileText, Eye, EyeOff, Settings } from 'lucide-react';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

export default function PrintRecipe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings, getActiveDoctor, getActiveClinic } = useSettings();
    const [loading, setLoading] = useState(true);
    const [consultation, setConsultation] = useState(null);
    const [patient, setPatient] = useState(null);
    const [editing, setEditing] = useState(false);
    const [printSize, setPrintSize] = useState('media-carta');
    const [showHeader, setShowHeader] = useState(true);

    const [editMeds, setEditMeds] = useState([]);
    const [editIndications, setEditIndications] = useState('');

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            const consultData = await api.consultations.get(id);
            setConsultation(consultData);
            setEditMeds(consultData.medications || []);
            setEditIndications(consultData.treatmentPlan || '');
            const patientData = await api.patients.get(consultData.patientId);
            setPatient(patientData);
        } catch (error) {
            toast.error('Error al cargar la receta');
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const saveEdits = async () => {
        try {
            await api.consultations.update(id, { medications: editMeds, treatmentPlan: editIndications });
            setConsultation({ ...consultation, medications: editMeds, treatmentPlan: editIndications });
            setEditing(false);
            toast.success('Receta actualizada');
        } catch (error) {
            toast.error('Error al guardar');
        }
    };

    const updateMed = (index, field, value) => {
        const updated = [...editMeds];
        updated[index] = { ...updated[index], [field]: value };
        setEditMeds(updated);
    };

    const addMed = () => setEditMeds([...editMeds, { name: '', dose: '', frequency: '', duration: '' }]);
    const removeMed = (index) => setEditMeds(editMeds.filter((_, i) => i !== index));

    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    const age = patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '';

    // Use consultation's saved clinic/doctor if available, otherwise fallback to active
    const activeDoctor = consultation?.doctor || getActiveDoctor();
    const activeClinic = consultation?.clinic || getActiveClinic();

    const HEADER_HEIGHT = '4.5rem';

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white">
            {/* Controls */}
            <div className="no-print bg-white border-b border-slate-200 p-3 md:p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(`/pacientes/${patient?.id}/historial`)}>
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
                            title={showHeader ? "Ocultar membrete" : "Mostrar membrete"}
                        >
                            {showHeader ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span className="ml-1 hidden sm:inline">Membrete</span>
                        </Button>

                        {editing ? (
                            <Button onClick={saveEdits} size="sm">
                                <Save className="w-4 h-4 mr-1" /> Guardar
                            </Button>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                                <Edit2 className="w-4 h-4 mr-1" /> Editar
                            </Button>
                        )}

                        <Button onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-1" /> Imprimir
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/configuracion/receta')}
                            title="Configurar posiciones de impresión"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Document Container */}
            <div className="flex justify-center p-4 md:p-8 print:p-0">
                <div
                    id="recipe-document"
                    className={`bg-white shadow-lg print:shadow-none ${printSize === 'media-carta' ? 'recipe-media-carta' : 'recipe-carta'}`}
                    style={{ position: 'relative' }}
                >
                    {/* CUSTOM LAYOUT MODE - Absolute positioning */}
                    {!showHeader && settings.recipeLayout?.enabled ? (
                        <>
                            {/* Patient Name */}
                            {settings.recipeLayout.elements?.patientName?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.patientName.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.patientName.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.patientName.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.patientName.bold ? 'bold' : 'normal'
                                }}>
                                    {patient?.firstName} {patient?.lastName}
                                </div>
                            )}

                            {/* Date */}
                            {settings.recipeLayout.elements?.date?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.date.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.date.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.date.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.date.bold ? 'bold' : 'normal'
                                }}>
                                    {new Date(consultation?.date).toLocaleDateString('es-ES')}
                                </div>
                            )}

                            {/* Age */}
                            {settings.recipeLayout.elements?.patientAge?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.patientAge.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.patientAge.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.patientAge.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.patientAge.bold ? 'bold' : 'normal'
                                }}>
                                    {age} años
                                </div>
                            )}

                            {/* Weight */}
                            {settings.recipeLayout.elements?.weight?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.weight.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.weight.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.weight.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.weight.bold ? 'bold' : 'normal'
                                }}>
                                    {consultation?.vitalSigns?.weight || '___'} kg
                                </div>
                            )}

                            {/* Height (Talla) */}
                            {settings.recipeLayout.elements?.height?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.height.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.height.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.height.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.height.bold ? 'bold' : 'normal'
                                }}>
                                    {consultation?.vitalSigns?.height || '___'} cm
                                </div>
                            )}

                            {/* Vital Signs */}
                            {settings.recipeLayout.elements?.vitals?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.vitals.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.vitals.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.vitals.fontSize || 10}pt`,
                                    fontWeight: settings.recipeLayout.elements.vitals.bold ? 'bold' : 'normal',
                                    lineHeight: '1.4'
                                }}>
                                    <div>T/A: {consultation?.vitalSigns?.systolic || '___'}/{consultation?.vitalSigns?.diastolic || '___'} mmHg</div>
                                    <div>FC: {consultation?.vitalSigns?.heartRate || '___'} lpm</div>
                                    <div>Temp: {consultation?.vitalSigns?.temperature || '___'} °C</div>
                                </div>
                            )}

                            {/* Medications */}
                            {settings.recipeLayout.elements?.medications?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.medications.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.medications.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.medications.fontSize || 11}pt`,
                                    fontWeight: settings.recipeLayout.elements.medications.bold ? 'bold' : 'normal',
                                    width: `${settings.recipeLayout.elements.medications.width * 0.264583}mm`,
                                    lineHeight: '1.3'
                                }}>
                                    {(consultation?.medications || []).filter(m => m.name).map((med, index) => (
                                        <div key={index} style={{ marginBottom: '2mm' }}>
                                            <div>{index + 1}. {med.name} {med.dose}</div>
                                            <div style={{ marginLeft: '3mm', color: '#666' }}>{med.frequency} • {med.duration}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Diagnosis */}
                            {settings.recipeLayout.elements?.diagnosis?.visible && consultation?.diagnosis && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.diagnosis.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.diagnosis.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.diagnosis.fontSize || 10}pt`,
                                    fontWeight: settings.recipeLayout.elements.diagnosis.bold ? 'bold' : 'normal'
                                }}>
                                    <span>Dx: </span>
                                    <span>{consultation.diagnosis}</span>
                                </div>
                            )}

                            {/* Indications */}
                            {settings.recipeLayout.elements?.indications?.visible && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${settings.recipeLayout.elements.indications.x * 0.264583}mm`,
                                    top: `${settings.recipeLayout.elements.indications.y * 0.264583}mm`,
                                    fontSize: `${settings.recipeLayout.elements.indications.fontSize || 10}pt`,
                                    fontWeight: settings.recipeLayout.elements.indications.bold ? 'bold' : 'normal',
                                    width: `${settings.recipeLayout.elements.indications.width * 0.264583}mm`,
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    <div style={{ marginBottom: '1mm' }}>Indicaciones:</div>
                                    <div>{consultation?.treatmentPlan || ''}</div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* STANDARD LAYOUT MODE */
                        <>
                            {/* Header Section - Professional 3-Column Layout */}
                            <div style={{ marginBottom: '0.1rem' }}>
                                {showHeader ? (
                                    <header>
                                        <div className="grid grid-cols-3 items-center gap-2" style={{ paddingBottom: '0.2rem' }}>
                                            {/* LEFT: Logo + Clinic Name */}
                                            <div className="flex items-center gap-2">
                                                {activeClinic?.logo ? (
                                                    <img src={activeClinic.logo} alt="Logo" className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C11.172 2 10.5 2.672 10.5 3.5V6.5H7.5C6.672 6.5 6 7.172 6 8V10.5H3.5C2.672 10.5 2 11.172 2 12C2 12.828 2.672 13.5 3.5 13.5H6V16C6 16.828 6.672 17.5 7.5 17.5H10.5V20.5C10.5 21.328 11.172 22 12 22C12.828 22 13.5 21.328 13.5 20.5V17.5H16.5C17.328 17.5 18 16.828 18 16V13.5H20.5C21.328 13.5 22 12.828 22 12C22 11.172 21.328 10.5 20.5 10.5H18V8C18 7.172 17.328 6.5 16.5 6.5H13.5V3.5C13.5 2.672 12.828 2 12 2Z" />
                                                    </svg>
                                                )}
                                                <div className="text-[9px] text-slate-600">
                                                    <p className="font-semibold">{activeClinic?.name || 'Clínica'}</p>
                                                    {activeClinic?.subtitle && <p>{activeClinic.subtitle}</p>}
                                                </div>
                                            </div>

                                            {/* CENTER: Doctor Name + Specialty */}
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{activeDoctor?.name}</p>
                                                <p className="text-[10px] text-slate-600 whitespace-nowrap">{activeDoctor?.specialty}</p>
                                            </div>

                                            {/* RIGHT: University + Cedula + SSG */}
                                            <div className="text-right text-[9px] text-slate-600 leading-tight">
                                                {activeDoctor?.university && <p>{activeDoctor.university}</p>}
                                                <p>Céd. Prof. {activeDoctor?.cedula}</p>
                                                {activeDoctor?.ssg && <p>S.S.G. {activeDoctor.ssg}</p>}
                                            </div>
                                        </div>
                                        <div style={{ borderBottom: '3px solid #3b82f6', marginBottom: '0.15rem' }}></div>
                                    </header>
                                ) : (
                                    <div style={{ height: '3rem', visibility: 'hidden' }}></div>
                                )}
                            </div>

                            {/* Patient Info + Medications LEFT | Vital Signs RIGHT */}
                            <section className="text-[11px] grid grid-cols-2 gap-4">
                                {/* LEFT COLUMN: Patient + Medications */}
                                <div className="space-y-0">
                                    <div><span className="text-slate-500">Paciente: </span><span className="font-semibold">{patient?.firstName} {patient?.lastName}</span></div>
                                    <div><span className="text-slate-500">Edad: </span><span className="font-semibold">{age} años</span></div>

                                    {/* Medications immediately after Edad */}
                                    {editing ? (
                                        <div className="space-y-1 mt-1">
                                            {editMeds.map((med, index) => (
                                                <div key={index} className="flex gap-1 items-center bg-slate-50 p-1 rounded text-[10px]">
                                                    <input value={med.name} onChange={(e) => updateMed(index, 'name', e.target.value)} placeholder="Medicamento" className="flex-1 border rounded px-1 py-0.5" />
                                                    <input value={med.dose} onChange={(e) => updateMed(index, 'dose', e.target.value)} placeholder="Dosis" className="w-16 border rounded px-1 py-0.5" />
                                                    <input value={med.frequency} onChange={(e) => updateMed(index, 'frequency', e.target.value)} placeholder="Frec." className="w-20 border rounded px-1 py-0.5" />
                                                    <input value={med.duration} onChange={(e) => updateMed(index, 'duration', e.target.value)} placeholder="Dur." className="w-16 border rounded px-1 py-0.5" />
                                                    <button onClick={() => removeMed(index)} className="text-red-500 hover:bg-red-50 p-0.5 rounded text-xs">✕</button>
                                                </div>
                                            ))}
                                            <button onClick={addMed} className="text-blue-600 text-[10px] hover:underline">+ Agregar</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {(consultation?.medications || []).filter(m => m.name).map((med, index) => (
                                                <div key={index}>
                                                    <p className="font-semibold">{index + 1}. {med.name} <span className="font-normal text-slate-600">{med.dose}</span></p>
                                                    <p className="text-slate-600 text-[10px] ml-4">{med.frequency} • {med.duration}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT COLUMN: Vital Signs */}
                                <div className="text-right space-y-0">
                                    <div><span className="text-slate-500">Fecha: </span><span className="font-semibold">{new Date(consultation?.date).toLocaleDateString('es-ES')}</span></div>
                                    <div><span className="text-slate-500">Peso: </span><span className="font-semibold">{consultation?.vitalSigns?.weight || '___'} kg</span></div>
                                    <div><span className="text-slate-500">Talla: </span><span className="font-semibold">{consultation?.vitalSigns?.height || '___'} cm</span></div>
                                    <div><span className="text-slate-500">T/A: </span><span className="font-semibold">{consultation?.vitalSigns?.systolic || '___'}/{consultation?.vitalSigns?.diastolic || '___'} mmHg</span></div>
                                    <div><span className="text-slate-500">FC: </span><span className="font-semibold">{consultation?.vitalSigns?.heartRate || '___'} lpm</span></div>
                                    <div><span className="text-slate-500">Temp: </span><span className="font-semibold">{consultation?.vitalSigns?.temperature || '___'} °C</span></div>
                                </div>
                            </section>

                            {/* Spacer - pushes Indicaciones lower on the page */}
                            <div className="flex-grow min-h-[3rem]"></div>

                            {/* Indications - Lower on the page */}
                            <section className="mb-1">
                                <h3 className="text-[11px] font-semibold text-slate-800 mb-0">Indicaciones:</h3>
                                {editing ? (
                                    <textarea value={editIndications} onChange={(e) => setEditIndications(e.target.value)} rows={2} className="w-full border rounded px-2 py-1 text-[10px]" placeholder="Instrucciones..." />
                                ) : (
                                    <p className="text-[10px] text-slate-600 whitespace-pre-wrap">{consultation?.treatmentPlan || '-'}</p>
                                )}
                            </section>

                            {/* Diagnosis */}
                            {consultation?.diagnosis && (
                                <section className="text-[10px] mb-1">
                                    <span className="font-semibold text-slate-700">Dx: </span>
                                    <span className="text-slate-600">{consultation.diagnosis}</span>
                                </section>
                            )}

                            {/* Footer Section - Address left, Phones right */}
                            {showHeader && (
                                <footer className="mt-2 pt-0">
                                    <div style={{ borderBottom: '3px solid #3b82f6', marginBottom: '0.2rem' }}></div>
                                    <div className="flex justify-between text-[11px]">
                                        <div className="text-slate-700">
                                            <p className="font-medium">{activeClinic?.address || 'Dirección de la clínica'}</p>
                                        </div>
                                        <div className="text-right text-slate-700">
                                            {activeClinic?.phone && <p>Tel: {activeClinic.phone}</p>}
                                        </div>
                                    </div>
                                </footer>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        .recipe-media-carta {
          width: 14cm;
          min-height: 10.8cm;
          padding: 0.6cm;
          font-size: 10pt;
        }
        .recipe-carta {
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
          
          .recipe-media-carta {
            width: 14cm;
            height: 21.59cm;
            max-height: 21.59cm;
            padding: 0.8cm;
            margin: 0;
            box-shadow: none;
            page-break-inside: avoid;
          }
          
          .recipe-carta {
            width: 21.59cm;
            height: 27.94cm;
            padding: 1.5cm;
            margin: 0;
            box-shadow: none;
          }
        }
        
        @media (max-width: 640px) {
          .recipe-media-carta, .recipe-carta {
            width: 100%;
            min-height: auto;
            padding: 1rem;
          }
        }
      `}</style>
        </div>
    );
}
