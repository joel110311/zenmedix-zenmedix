import { useState, useRef } from 'react';
import { Upload, X, RotateCw, RotateCcw, ZoomIn, File, Image, Trash2, Save, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export default function AnalysisUploader({ patientId }) {
    const [files, setFiles] = useState([]);
    const [analysisType, setAnalysisType] = useState('');
    const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [previewFile, setPreviewFile] = useState(null);
    const [previewRotation, setPreviewRotation] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);

        selectedFiles.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} es mayor a 10MB`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setFiles(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    data: event.target.result,
                    size: file.size,
                    rotation: 0
                }]);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const rotateFile = (id, direction) => {
        setFiles(files.map(f => {
            if (f.id === id) {
                return {
                    ...f,
                    rotation: (f.rotation + (direction === 'cw' ? 90 : -90)) % 360
                };
            }
            return f;
        }));
    };

    const openPreview = (file) => {
        setPreviewFile(file);
        setPreviewRotation(file.rotation);
    };

    const closePreview = () => {
        // Save rotation before closing
        if (previewFile) {
            setFiles(files.map(f => {
                if (f.id === previewFile.id) {
                    return { ...f, rotation: previewRotation };
                }
                return f;
            }));
        }
        setPreviewFile(null);
        setPreviewRotation(0);
    };

    const rotatePreview = (direction) => {
        setPreviewRotation((previewRotation + (direction === 'cw' ? 90 : -90)) % 360);
    };

    const handleSave = () => {
        if (!analysisType.trim()) {
            toast.error('Ingresa el tipo de análisis');
            return;
        }

        if (files.length === 0) {
            toast.error('Agrega al menos un archivo');
            return;
        }

        const newAnalysis = {
            id: Date.now().toString(),
            type: analysisType,
            date: analysisDate,
            notes: notes,
            files: files.map(f => ({
                name: f.name,
                type: f.type,
                data: f.data,
                rotation: f.rotation
            })),
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        const storageKey = `medflow_labresults_${patientId}`;
        const existing = localStorage.getItem(storageKey);
        const results = existing ? JSON.parse(existing) : [];
        results.unshift(newAnalysis);
        localStorage.setItem(storageKey, JSON.stringify(results));

        toast.success('Análisis guardado correctamente');

        // Reset form
        setFiles([]);
        setAnalysisType('');
        setAnalysisDate(new Date().toISOString().split('T')[0]);
        setNotes('');
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = (type) => type?.startsWith('image/');
    const isPDF = (type) => type === 'application/pdf';

    return (
        <div className="space-y-4">
            {/* Analysis Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Análisis *
                    </label>
                    <input
                        type="text"
                        autoComplete="off"
                        placeholder="Ej: Biometría Hemática, Química Sanguínea..."
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Fecha del Análisis
                    </label>
                    <input
                        type="date"
                        value={analysisDate}
                        onChange={(e) => setAnalysisDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Observaciones
                </label>
                <textarea
                    autoComplete="off"
                    rows={2}
                    placeholder="Notas o interpretación de resultados..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary resize-none"
                />
            </div>

            {/* File Upload Zone */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Archivos (Imágenes / PDF) *
                </label>
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
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
                >
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                        Haz clic para seleccionar archivos
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Imágenes (JPG, PNG) y PDF • Máximo 10MB por archivo
                    </p>
                </div>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map(file => (
                        <div
                            key={file.id}
                            className="relative group bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden aspect-square"
                        >
                            {isImage(file.type) ? (
                                <img
                                    src={file.data}
                                    alt={file.name}
                                    className="w-full h-full object-cover cursor-pointer"
                                    style={{ transform: `rotate(${file.rotation}deg)` }}
                                    onClick={() => openPreview(file)}
                                />
                            ) : isPDF(file.type) ? (
                                <div
                                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => openPreview(file)}
                                >
                                    <File className="w-12 h-12 text-red-500 mb-2" />
                                    <p className="text-xs text-slate-600 dark:text-slate-300 text-center px-2 truncate w-full">
                                        {file.name}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <File className="w-12 h-12 text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-500 text-center px-2 truncate w-full">
                                        {file.name}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openPreview(file)}
                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
                                    title="Ver"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                {isImage(file.type) && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); rotateFile(file.id, 'ccw'); }}
                                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
                                            title="Rotar izquierda"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); rotateFile(file.id, 'cw'); }}
                                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
                                            title="Rotar derecha"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                    className="p-2 bg-red-500/80 rounded-full hover:bg-red-600 text-white"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* File Size Badge */}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                                {formatFileSize(file.size)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={files.length === 0}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Análisis
                </Button>
            </div>

            {/* Full Preview Modal */}
            {previewFile && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={closePreview}
                >
                    <div
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-t-xl">
                            <span className="text-white font-medium truncate max-w-[60%]">
                                {previewFile.name}
                            </span>
                            <div className="flex items-center gap-2">
                                {isImage(previewFile.type) && (
                                    <>
                                        <button
                                            onClick={() => rotatePreview('ccw')}
                                            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                                            title="Rotar izquierda"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => rotatePreview('cw')}
                                            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                                            title="Rotar derecha"
                                        >
                                            <RotateCw className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={closePreview}
                                    className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 bg-slate-800 rounded-b-xl overflow-hidden flex items-center justify-center p-4">
                            {isImage(previewFile.type) ? (
                                <img
                                    src={previewFile.data}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-[70vh] object-contain transition-transform duration-300"
                                    style={{ transform: `rotate(${previewRotation}deg)` }}
                                />
                            ) : isPDF(previewFile.type) ? (
                                <iframe
                                    src={previewFile.data}
                                    className="w-full h-[70vh] bg-white rounded-lg"
                                    title={previewFile.name}
                                />
                            ) : (
                                <div className="text-center text-white">
                                    <File className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                    <p>Vista previa no disponible</p>
                                    <a
                                        href={previewFile.data}
                                        download={previewFile.name}
                                        className="text-primary hover:underline mt-2 inline-block"
                                    >
                                        Descargar archivo
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
