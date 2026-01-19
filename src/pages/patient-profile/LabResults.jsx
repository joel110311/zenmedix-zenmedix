import { useState, useEffect, useRef } from 'react';
import { FlaskConical, Plus, Trash2, FileText, Calendar, Upload, Download, Image, File, X, Eye, Printer, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

// Lab Studies Catalog
const LAB_STUDIES_CATALOG = [
    { id: 'bh', name: 'Biometría Hemática / Plaquetas', category: 'Hematología' },
    { id: 'hba1c', name: 'Hemoglobina Glicosilada (HbA1C)', category: 'Hematología' },
    { id: 'tsc', name: 'Tiempo / Sangrado y Coagulación', category: 'Hematología' },
    { id: 'tp', name: 'Tiempo de Protrombina / INR', category: 'Hematología' },
    { id: 'tpt', name: 'Tiempo Parcial / Tromboplastina', category: 'Hematología' },
    { id: 'dd', name: 'Dímeros D', category: 'Hematología' },
    { id: 'grh', name: 'Grupo Sanguíneo y Factor RH', category: 'Hematología' },
    { id: 'gasa', name: 'Gasometría Arterial', category: 'Hematología' },
    { id: 'gasv', name: 'Gasometría Venosa', category: 'Hematología' },
    { id: 'hierro', name: 'Hierro Sérico', category: 'Hematología' },
    { id: 'ferr', name: 'Ferritina', category: 'Hematología' },
    { id: 'qs6', name: 'Química Sanguínea 6 elementos', category: 'Química' },
    { id: 'qs12', name: 'Química Sanguínea 12 elementos', category: 'Química' },
    { id: 'qs24', name: 'Química Sanguínea 24 elementos', category: 'Química' },
    { id: 'glu', name: 'Glucosa en Ayuno', category: 'Química' },
    { id: 'ctog', name: 'Curva Tolerancia a la Glucosa', category: 'Química' },
    { id: 'crea', name: 'Creatinina', category: 'Química' },
    { id: 'bun', name: 'BUN / Urea', category: 'Química' },
    { id: 'auric', name: 'Ácido Úrico', category: 'Química' },
    { id: 'perfil', name: 'Perfil de Lípidos', category: 'Lípidos' },
    { id: 'colest', name: 'Colesterol Total', category: 'Lípidos' },
    { id: 'hdl', name: 'Colesterol HDL', category: 'Lípidos' },
    { id: 'ldl', name: 'Colesterol LDL', category: 'Lípidos' },
    { id: 'trig', name: 'Triglicéridos', category: 'Lípidos' },
    { id: 'pfh', name: 'Pruebas de Función Hepática', category: 'Hepáticos' },
    { id: 'tgo', name: 'TGO / AST', category: 'Hepáticos' },
    { id: 'tgp', name: 'TGP / ALT', category: 'Hepáticos' },
    { id: 'biltot', name: 'Bilirrubinas (Total, Directa, Indirecta)', category: 'Hepáticos' },
    { id: 'pft', name: 'Perfil Tiroideo (T3, T4, TSH)', category: 'Tiroides' },
    { id: 'tsh', name: 'TSH', category: 'Tiroides' },
    { id: 't3', name: 'T3 Libre', category: 'Tiroides' },
    { id: 't4', name: 'T4 Libre', category: 'Tiroides' },
    { id: 'ego', name: 'Examen General de Orina (EGO)', category: 'Orina' },
    { id: 'urocult', name: 'Urocultivo', category: 'Orina' },
    { id: 'depcreat', name: 'Depuración de Creatinina', category: 'Orina' },
    { id: 'pcr', name: 'Proteína C Reactiva (PCR)', category: 'Otros' },
    { id: 'vsg', name: 'Velocidad de Sedimentación (VSG)', category: 'Otros' },
    { id: 'elec', name: 'Electrolitos Séricos', category: 'Otros' },
    { id: 'vitd', name: 'Vitamina D', category: 'Otros' },
    { id: 'vitb12', name: 'Vitamina B12', category: 'Otros' },
    { id: 'rxtorax', name: 'Radiografía de Tórax PA', category: 'Imagen' },
    { id: 'rxabd', name: 'Radiografía de Abdomen', category: 'Imagen' },
    { id: 'eco', name: 'Ultrasonido Abdominal', category: 'Imagen' },
    { id: 'ekg', name: 'Electrocardiograma (EKG)', category: 'Imagen' },
];

export default function LabResults() {
    const { activePatient } = usePatient();
    const navigate = useNavigate();
    const [labResults, setLabResults] = useState([]);
    const [studyRequests, setStudyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [studyFilter, setStudyFilter] = useState('');
    const fileInputRef = useRef(null);

    // Form state for new analysis
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formType, setFormType] = useState('');
    const [formResults, setFormResults] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [attachments, setAttachments] = useState([]);

    // Form state for study request
    const [selectedStudies, setSelectedStudies] = useState([]);
    const [customStudies, setCustomStudies] = useState('');

    useEffect(() => {
        loadLabResults();
    }, [activePatient?.id]);

    const loadLabResults = async () => {
        if (!activePatient?.id) return;
        try {
            const stored = localStorage.getItem(`medflow_labresults_${activePatient.id}`);
            setLabResults(stored ? JSON.parse(stored) : []);

            const storedRequests = localStorage.getItem(`medflow_studyrequests_${activePatient.id}`);
            setStudyRequests(storedRequests ? JSON.parse(storedRequests) : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const saveLabResults = (results) => {
        localStorage.setItem(`medflow_labresults_${activePatient.id}`, JSON.stringify(results));
    };

    const saveStudyRequests = (requests) => {
        localStorage.setItem(`medflow_studyrequests_${activePatient.id}`, JSON.stringify(requests));
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAttachments(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    data: event.target.result,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (id) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    const handleSubmit = () => {
        if (!formType) {
            toast.error('Ingresa el tipo de análisis');
            return;
        }

        const newResult = {
            id: Date.now().toString(),
            date: formDate,
            type: formType,
            results: formResults,
            notes: formNotes,
            attachments: attachments
        };

        const updated = [newResult, ...labResults];
        setLabResults(updated);
        saveLabResults(updated);

        setShowForm(false);
        setFormType('');
        setFormResults('');
        setFormNotes('');
        setAttachments([]);
        toast.success('Análisis guardado');
    };

    const handleCreateStudyRequest = () => {
        if (selectedStudies.length === 0 && !customStudies.trim()) {
            toast.error('Selecciona al menos un estudio');
            return;
        }

        const studyNames = selectedStudies.map(id => {
            const study = LAB_STUDIES_CATALOG.find(s => s.id === id);
            return study?.name;
        }).filter(Boolean);

        const newRequest = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            studies: studyNames,
            customStudies: customStudies.trim(),
            patientId: activePatient.id
        };

        const updated = [newRequest, ...studyRequests];
        setStudyRequests(updated);
        saveStudyRequests(updated);

        setShowRequestForm(false);
        setSelectedStudies([]);
        setCustomStudies('');
        toast.success('Solicitud creada');

        // Navigate to print
        navigate(`/imprimir/solicitud/${newRequest.id}`, { state: { request: newRequest, patient: activePatient } });
    };

    const handleDelete = (id) => {
        const updated = labResults.filter(r => r.id !== id);
        setLabResults(updated);
        saveLabResults(updated);
        toast.success('Análisis eliminado');
    };

    const handleDeleteRequest = (id) => {
        const updated = studyRequests.filter(r => r.id !== id);
        setStudyRequests(updated);
        saveStudyRequests(updated);
        toast.success('Solicitud eliminada');
    };

    const getFileIcon = (type) => {
        if (type?.startsWith('image/')) return <Image className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-primary" />
                        Análisis Clínicos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Resultados de laboratorio de {activePatient?.firstName} {activePatient?.lastName}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowRequestForm(!showRequestForm)}>
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Solicitud de Estudios
                    </Button>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Análisis
                    </Button>
                </div>
            </div>

            {/* Study Request Form */}
            {showRequestForm && (
                <Card title="Solicitud de Estudios">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Catalog */}
                        <div>
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Filtrar estudios..."
                                    value={studyFilter}
                                    onChange={(e) => setStudyFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {LAB_STUDIES_CATALOG
                                    .filter(s => s.name.toLowerCase().includes(studyFilter.toLowerCase()))
                                    .map((study) => (
                                        <label
                                            key={study.id}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm transition-colors ${selectedStudies.includes(study.id)
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
                                            <span className="text-slate-700 dark:text-slate-300">{study.name}</span>
                                        </label>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Selected + Custom */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Seleccionados ({selectedStudies.length})
                                </label>
                                {selectedStudies.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">Ninguno seleccionado</p>
                                ) : (
                                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                                        {selectedStudies.map(id => {
                                            const study = LAB_STUDIES_CATALOG.find(s => s.id === id);
                                            return (
                                                <li key={id} className="flex justify-between text-sm bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                                                    <span className="text-slate-700 dark:text-slate-300">{study?.name}</span>
                                                    <button type="button" onClick={() => setSelectedStudies(selectedStudies.filter(s => s !== id))} className="text-red-500 text-xs">✕</button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estudios adicionales</label>
                                <textarea
                                    autoComplete="off"
                                    value={customStudies}
                                    onChange={(e) => setCustomStudies(e.target.value)}
                                    rows={3}
                                    placeholder="Otros estudios no en la lista..."
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => { setShowRequestForm(false); setSelectedStudies([]); }}>Cancelar</Button>
                        <Button onClick={handleCreateStudyRequest}>
                            <Printer className="w-4 h-4 mr-1" /> Crear e Imprimir
                        </Button>
                    </div>
                </Card>
            )}

            {/* New Analysis Form */}
            {showForm && (
                <Card title="Agregar Análisis">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Análisis</label>
                            <input
                                type="text"
                                autoComplete="off"
                                placeholder="Ej: Biometría Hemática, Química Sanguínea..."
                                value={formType}
                                onChange={(e) => setFormType(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resultados</label>
                        <textarea
                            autoComplete="off"
                            placeholder="Ingresar resultados del análisis..."
                            rows={4}
                            value={formResults}
                            onChange={(e) => setFormResults(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas / Observaciones</label>
                        <textarea
                            autoComplete="off"
                            placeholder="Observaciones adicionales..."
                            rows={2}
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                        />
                    </div>

                    {/* File Attachments */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Adjuntar Archivos (Imágenes / PDF)</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">Haz clic para seleccionar archivos</p>
                            <p className="text-xs text-slate-400">Imágenes y PDF</p>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {getFileIcon(file.type)}
                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                                        </div>
                                        <button onClick={() => removeAttachment(file.id)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => { setShowForm(false); setAttachments([]); }}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Guardar Análisis</Button>
                    </div>
                </Card>
            )}

            {/* Study Requests List */}
            {studyRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Solicitudes de Estudios</h2>
                    {studyRequests.map((request) => (
                        <Card key={request.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(request.date).toLocaleDateString('es-ES')}
                                        </div>
                                        <ul className="mt-2 space-y-0.5">
                                            {request.studies.map((study, i) => (
                                                <li key={i} className="text-sm text-slate-700 dark:text-slate-300">• {study}</li>
                                            ))}
                                            {request.customStudies && (
                                                <li className="text-sm text-slate-600 dark:text-slate-400 italic">{request.customStudies}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/imprimir/solicitud/${request.id}`, { state: { request, patient: activePatient } })}
                                    >
                                        <Printer className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(request.id)} className="text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Results List */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Resultados de Análisis</h2>
                {labResults.length === 0 ? (
                    <Card>
                        <div className="text-center py-8">
                            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No hay análisis registrados</p>
                            <p className="text-sm text-slate-400">Haz clic en "Nuevo Análisis" para agregar uno</p>
                        </div>
                    </Card>
                ) : (
                    labResults.map((result) => (
                        <Card key={result.id}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-white">{result.type}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(result.date).toLocaleDateString('es-ES')}
                                        </div>
                                        {result.results && (
                                            <pre className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                                                {result.results}
                                            </pre>
                                        )}
                                        {result.notes && (
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                                Notas: {result.notes}
                                            </p>
                                        )}

                                        {/* Attachments */}
                                        {result.attachments?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {result.attachments.map(file => (
                                                    <div key={file.id} className="relative group">
                                                        {file.type?.startsWith('image/') ? (
                                                            <img
                                                                src={file.data}
                                                                alt={file.name}
                                                                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => setPreviewFile(file)}
                                                            />
                                                        ) : (
                                                            <a
                                                                href={file.data}
                                                                download={file.name}
                                                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                            >
                                                                <File className="w-4 h-4" />
                                                                {file.name}
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(result.id)} className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Image Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewFile(null)}
                            className="absolute -top-10 right-0 text-white hover:text-slate-300"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img src={previewFile.data} alt={previewFile.name} className="max-w-full max-h-[80vh] rounded-lg" />
                        <p className="text-white text-center mt-2">{previewFile.name}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
