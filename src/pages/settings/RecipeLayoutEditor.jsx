import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import { ArrowLeft, Upload, Save, RotateCcw, Eye, EyeOff, Move, Maximize2, Type, Info, CheckCircle, Trash2, ZoomIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

// Canvas dimensions in pixels at 96 DPI
// Media carta: 14cm × 21.59cm = 5.5" × 8.5" = 528 × 816 px
// Carta (Letter): 21.59cm × 27.94cm = 8.5" × 11" = 816 × 1056 px
const CANVAS_WIDTH = 528;
const CANVAS_HEIGHT_MEDIA = 816;
const CANVAS_HEIGHT_CARTA = 1056;

const ZOOM_LEVELS = [1, 1.5, 2];

const DEFAULT_ELEMENTS = {
    patientName: { x: 85, y: 115, width: 400, height: 25, fontSize: 11, bold: false, visible: true, label: 'Nombre del Paciente' },
    date: { x: 50, y: 145, width: 100, height: 22, fontSize: 11, bold: false, visible: true, label: 'Fecha' },
    patientAge: { x: 200, y: 145, width: 80, height: 22, fontSize: 11, bold: false, visible: true, label: 'Edad' },
    weight: { x: 320, y: 145, width: 80, height: 22, fontSize: 11, bold: false, visible: true, label: 'Peso' },
    height: { x: 430, y: 145, width: 80, height: 22, fontSize: 11, bold: false, visible: true, label: 'Talla' },
    medications: { x: 25, y: 180, width: 340, height: 220, fontSize: 11, bold: false, visible: true, label: 'Medicamentos' },
    vitals: { x: 380, y: 180, width: 140, height: 120, fontSize: 10, bold: false, visible: true, label: 'Signos Vitales' },
    diagnosis: { x: 25, y: 415, width: 490, height: 60, fontSize: 10, bold: false, visible: true, label: 'Diagnostico' },
    indications: { x: 25, y: 490, width: 490, height: 80, fontSize: 10, bold: false, visible: true, label: 'Indicaciones' }
};

const ELEMENT_COLORS = {
    patientName: '#3b82f6',
    date: '#f59e0b',
    patientAge: '#8b5cf6',
    weight: '#22c55e',
    height: '#14b8a6',
    medications: '#ef4444',
    vitals: '#10b981',
    diagnosis: '#06b6d4',
    indications: '#ec4899'
};

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16];

// Sample preview data to show in rectangles
const SAMPLE_DATA = {
    patientName: 'Juan Pérez García',
    date: '18/01/2026',
    patientAge: '45 años',
    weight: '78 kg',
    height: '1.75 m',
    medications: 'Paracetamol 500mg c/8hrs\nIbuprofeno 400mg c/12hrs\nOmeprazol 20mg c/24hrs',
    vitals: 'T.A: 120/80\nF.C: 72 bpm\nTemp: 36.5°C',
    diagnosis: 'Faringitis aguda',
    indications: 'Reposo relativo, abundantes líquidos'
};

export default function RecipeLayoutEditor() {
    const navigate = useNavigate();
    const { settings, updateRecipeLayout } = useSettings();
    const fileInputRef = useRef(null);

    const [elements, setElements] = useState(() => {
        const saved = settings.recipeLayout?.elements;
        if (saved) {
            return Object.keys(DEFAULT_ELEMENTS).reduce((acc, key) => {
                acc[key] = {
                    ...DEFAULT_ELEMENTS[key],
                    ...(saved[key] || {}),
                    label: DEFAULT_ELEMENTS[key].label
                };
                return acc;
            }, {});
        }
        return { ...DEFAULT_ELEMENTS };
    });

    const [backgroundImage, setBackgroundImage] = useState(settings.recipeLayout?.backgroundImage || null);
    const [showBackground, setShowBackground] = useState(true);
    const [pageSize, setPageSize] = useState(settings.recipeLayout?.pageSize || 'media-carta');
    const [enabled, setEnabled] = useState(settings.recipeLayout?.enabled || false);
    const [selectedElement, setSelectedElement] = useState(null);
    const [zoom, setZoom] = useState(1);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen es muy grande. Máximo 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setBackgroundImage(event.target.result);
                toast.success('Imagen de guía cargada');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleElementDrag = (key, d) => {
        setElements(prev => ({
            ...prev,
            [key]: { ...prev[key], x: Math.round(d.x), y: Math.round(d.y) }
        }));
    };

    const handleElementResize = (key, ref, position) => {
        setElements(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: Math.round(position.x),
                y: Math.round(position.y)
            }
        }));
    };

    const toggleElementVisibility = (key) => {
        setElements(prev => ({
            ...prev,
            [key]: { ...prev[key], visible: !prev[key].visible }
        }));
    };

    const handleFontSizeChange = (key, newSize) => {
        setElements(prev => ({
            ...prev,
            [key]: { ...prev[key], fontSize: parseInt(newSize) }
        }));
    };

    const toggleBold = (key) => {
        setElements(prev => ({
            ...prev,
            [key]: { ...prev[key], bold: !prev[key].bold }
        }));
    };

    const handleReset = () => {
        setElements({ ...DEFAULT_ELEMENTS });
        setBackgroundImage(null);
        setEnabled(false);
        toast.info('Posiciones restablecidas');
    };

    const handleSave = () => {
        const elementsToSave = Object.keys(elements).reduce((acc, key) => {
            const { label, ...rest } = elements[key];
            acc[key] = rest;
            return acc;
        }, {});

        updateRecipeLayout({
            enabled: enabled,
            pageSize: pageSize,
            backgroundImage: backgroundImage,
            elements: elementsToSave
        });
        toast.success('Configuración de diseño guardada');
    };

    const canvasHeight = pageSize === 'media-carta' ? CANVAS_HEIGHT_MEDIA : CANVAS_HEIGHT_CARTA;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Editor de Diseño de Receta</h1>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleReset}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Restablecer
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-1" /> Guardar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main 3-column layout */}
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">

                {/* LEFT SIDEBAR - Controls */}
                <div className="w-full lg:w-72 xl:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 space-y-4 overflow-y-auto">

                    {/* Activate Toggle */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Activar</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-primary"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Usar posiciones personalizadas
                            </span>
                        </label>
                        <p className="text-xs text-slate-500 mt-2">
                            Al activar y ocultar membrete, se usarán estas posiciones.
                        </p>
                    </div>

                    {/* Page Size */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Tamaño de Página</h3>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        >
                            <option value="media-carta">Media Carta (14 × 21.5 cm)</option>
                            <option value="carta">Carta (21.59 × 27.94 cm)</option>
                        </select>
                    </div>

                    {/* Background Image */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Imagen de Guía</h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Subir foto
                        </Button>
                        {backgroundImage && (
                            <div className="flex gap-2 mt-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setShowBackground(!showBackground)}
                                >
                                    {showBackground ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                    {showBackground ? 'Ocultar' : 'Mostrar'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => setBackgroundImage(null)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Elements List */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Elementos y Tamaño de Letra</h3>
                        <div className="space-y-2">
                            {Object.entries(elements).map(([key, el]) => (
                                <div
                                    key={key}
                                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${selectedElement === key
                                        ? 'border-primary bg-primary/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    onClick={() => setSelectedElement(key)}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={el.visible}
                                            onChange={() => toggleElementVisibility(key)}
                                            className="rounded border-slate-300"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ backgroundColor: ELEMENT_COLORS[key] }}
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{el.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-5">
                                        <select
                                            value={el.fontSize || 11}
                                            onChange={(e) => handleFontSizeChange(key, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-sm px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                        >
                                            {FONT_SIZES.map(size => (
                                                <option key={size} value={size}>{size}pt</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleBold(key); }}
                                            className={`px-3 py-1 text-sm font-bold border rounded transition-colors ${el.bold
                                                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-800'
                                                : 'bg-white text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            title={el.bold ? 'Quitar negrita' : 'Poner negrita'}
                                        >
                                            B
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER - Canvas Preview */}
                <div className="flex-1 p-4 lg:p-6 overflow-auto bg-slate-200 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Vista previa (arrastrar elementos)
                        </span>
                        <div className="flex items-center gap-3">
                            {/* Zoom buttons */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                                <ZoomIn className="w-4 h-4 text-slate-500 ml-1" />
                                {ZOOM_LEVELS.map(z => (
                                    <button
                                        key={z}
                                        onClick={() => setZoom(z)}
                                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${zoom === z
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {z * 100}%
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {pageSize === 'media-carta' ? '14cm × 21.59cm' : '21.59cm × 27.94cm'}
                            </span>
                        </div>
                    </div>

                    {/* Canvas wrapper with fixed minimum width to prevent reflow on resize */}
                    <div
                        className="inline-block"
                        style={{
                            minWidth: CANVAS_WIDTH * zoom,
                            minHeight: canvasHeight * zoom
                        }}
                    >
                        <div
                            style={{
                                transformOrigin: 'top left',
                                transform: `scale(${zoom})`
                            }}
                        >
                            <div
                                className="relative bg-white shadow-2xl"
                                style={{
                                    width: CANVAS_WIDTH,
                                    height: canvasHeight,
                                    backgroundImage: backgroundImage && showBackground ? `url(${backgroundImage})` : 'none',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'top center'
                                }}
                            >
                                {/* Background overlay */}
                                {backgroundImage && showBackground && (
                                    <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                                )}

                                {/* Draggable Elements */}
                                {Object.entries(elements).map(([key, el]) => {
                                    if (!el.visible) return null;
                                    return (
                                        <Rnd
                                            key={key}
                                            scale={zoom}
                                            size={{ width: el.width, height: el.height }}
                                            position={{ x: el.x, y: el.y }}
                                            onDragStop={(e, d) => handleElementDrag(key, d)}
                                            onResizeStop={(e, direction, ref, delta, position) =>
                                                handleElementResize(key, ref, position)
                                            }
                                            onMouseDown={() => setSelectedElement(key)}
                                            bounds="parent"
                                            minWidth={40}
                                            minHeight={15}
                                            className="cursor-move"
                                        >
                                            <div
                                                className={`w-full h-full border rounded ${selectedElement === key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                                    borderColor: ELEMENT_COLORS[key],
                                                    borderWidth: '1px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {/* Label tag */}
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-10px',
                                                        left: '2px',
                                                        color: ELEMENT_COLORS[key],
                                                        fontSize: '7pt',
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap',
                                                        backgroundColor: 'white',
                                                        padding: '0 3px',
                                                        borderRadius: '2px'
                                                    }}
                                                >
                                                    {el.label}
                                                </span>
                                                {/* Sample data preview */}
                                                <span
                                                    style={{
                                                        position: 'absolute',
                                                        top: '0px',
                                                        left: '1px',
                                                        right: '3px',
                                                        color: '#333',
                                                        fontSize: `${el.fontSize || 11}pt`,
                                                        fontWeight: el.bold ? 'bold' : 'normal',
                                                        whiteSpace: 'pre-wrap',
                                                        lineHeight: '1.2',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {SAMPLE_DATA[key] || el.label}
                                                </span>
                                            </div>
                                        </Rnd>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - Instructions */}
                <div className="w-full lg:w-72 xl:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Diseño de Receta Personalizado</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Personaliza la posición de los elementos en tu receta para que coincidan con tu papel pre-impreso.
                            </p>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                ¿Cómo funciona?
                            </h4>
                            <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-2">
                                <li className="flex gap-2">
                                    <span className="font-bold">1.</span>
                                    Sube una foto de tu recetario vacío como guía
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">2.</span>
                                    Arrastra los elementos (nombre, medicamentos, etc.) sobre la imagen
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">3.</span>
                                    Guarda la configuración
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold">4.</span>
                                    Al imprimir "Sin membrete", el texto caerá en las posiciones que configuraste
                                </li>
                            </ol>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Estado actual:</h4>
                            <div className={`flex items-center gap-2 ${enabled ? 'text-green-600' : 'text-slate-500'}`}>
                                <CheckCircle className={`w-5 h-5 ${enabled ? 'text-green-500' : 'text-slate-400'}`} />
                                <span className="text-sm font-medium">
                                    {enabled ? 'Diseño personalizado activo' : 'Diseño estándar activo'}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Controles:</h4>
                            <div className="text-sm text-blue-600 dark:text-blue-400 space-y-2">
                                <p className="flex items-center gap-2">
                                    <Move className="w-4 h-4" />
                                    Arrastra para mover elementos
                                </p>
                                <p className="flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4" />
                                    Arrastra esquinas para redimensionar
                                </p>
                                <p className="flex items-center gap-2">
                                    <Type className="w-4 h-4" />
                                    Cambia tamaño de letra en panel izquierdo
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400 text-center">
                                ⚠️ La imagen de guía NO se imprime, solo sirve para posicionar
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
