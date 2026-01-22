import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Trash2, Sparkles, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

// Get the SpeechRecognition constructor
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function DictadoConsulta({ onSummaryReady }) {
    const { settings } = useSettings();
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState('');
    const [copied, setCopied] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef(null);

    // Check browser support
    useEffect(() => {
        if (!SpeechRecognition) {
            setIsSupported(false);
            console.log('❌ Speech recognition not supported');
        } else {
            console.log('✅ Speech recognition supported');
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            toast.error('Tu navegador no soporta reconocimiento de voz');
            return;
        }

        console.log('🎤 Starting speech recognition...');

        // Create new recognition instance
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-MX';

        let finalTranscript = transcript;

        recognition.onstart = () => {
            console.log('✅ Speech recognition started');
            setIsRecording(true);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            if (event.error !== 'aborted') {
                toast.error('Error en reconocimiento de voz: ' + event.error);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            console.log('🛑 Speech recognition ended');
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            toast.error('Error al iniciar: ' + error.message);
            setIsRecording(false);
        }
    }, [transcript]);

    const stopListening = useCallback(() => {
        console.log('🛑 Stopping speech recognition...');

        if (recognitionRef.current) {
            recognitionRef.current.abort(); // Use abort() for immediate stop
            recognitionRef.current = null;
        }

        setIsRecording(false);
    }, []);

    const handleClear = () => {
        setTranscript('');
        setSummary('');
    };

    const handleGenerateSummary = async () => {
        if (!transcript.trim()) {
            toast.error('No hay texto para generar resumen');
            return;
        }

        const webhookUrl = settings.webhooks?.aiSummary;
        if (!webhookUrl) {
            toast.error('Configura el webhook de IA en Configuración > Webhooks');
            return;
        }

        setIsGenerating(true);
        const payload = { transcript, type: 'consultation_summary' };

        try {
            console.log('📡 Calling AI summary webhook:', webhookUrl);

            // Try JSON first
            const response = await fetch(webhookUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();
            console.log('📥 Response:', response.status, text);

            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { message: text, success: true };
            }

            if (!response.ok) throw new Error(data.message || 'Error: ' + response.status);

            // Check if response has structured medical data
            if (data.motivo_principal || data.nota_evolucion || data.signos_vitales) {
                // Pass the structured object directly
                setSummary(JSON.stringify(data, null, 2));
                if (onSummaryReady) {
                    onSummaryReady(data); // Pass object, not string
                }
            } else {
                // Fallback to text extraction
                const generatedSummary = data.summary || data.result || data.text || data.message || JSON.stringify(data);
                setSummary(generatedSummary);
                if (onSummaryReady) {
                    onSummaryReady(generatedSummary);
                }
            }

            toast.success('Resumen generado');
        } catch (error) {
            console.log('❌ JSON request failed:', error.message);

            // Fallback: Try form data (like estetica-dashboard)
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                console.log('🔄 Trying form data fallback...');
                try {
                    const formData = new URLSearchParams();
                    Object.entries(payload).forEach(([key, value]) => {
                        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                    });

                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        body: formData
                    });

                    const text = await response.text();
                    console.log('📥 Form response:', text);

                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = { message: text, success: true };
                    }

                    // Check if response has structured medical data
                    if (data.motivo_principal || data.nota_evolucion || data.signos_vitales) {
                        setSummary(JSON.stringify(data, null, 2));
                        if (onSummaryReady) {
                            onSummaryReady(data); // Pass object, not string
                        }
                    } else {
                        const generatedSummary = data.summary || data.result || data.text || data.message || text;
                        setSummary(generatedSummary);
                        if (onSummaryReady) {
                            onSummaryReady(generatedSummary);
                        }
                    }

                    toast.success('Resumen generado');
                    return;
                } catch (formError) {
                    console.error('❌ Form fallback also failed:', formError);
                    toast.error('Error de conexión con n8n');
                    return;
                }
            }

            toast.error('Error al generar resumen: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopySummary = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copiado al portapapeles');
    };

    const handleUseSummary = () => {
        if (onSummaryReady && summary) {
            onSummaryReady(summary);
            toast.success('Resumen aplicado a notas');
        }
    };

    if (!isSupported) {
        return (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-300">
                    Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Start Recording Button */}
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={startListening}
                    disabled={isRecording}
                    className={isRecording ? 'opacity-50' : ''}
                >
                    <Mic className={`w-4 h-4 mr-1 ${isRecording ? 'text-slate-400' : 'text-green-600'}`} />
                    Iniciar
                </Button>

                {/* Stop Button */}
                <button
                    type="button"
                    onClick={stopListening}
                    disabled={!isRecording}
                    className={`p-2 rounded-lg transition-colors ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    title="Detener grabación"
                >
                    <div className={`w-3 h-3 rounded-sm ${isRecording ? 'bg-white' : 'bg-slate-400'}`} />
                </button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    disabled={!transcript && !summary}
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpiar
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateSummary}
                    disabled={!transcript.trim() || isGenerating}
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4 mr-1 text-primary" />
                    )}
                    {isGenerating ? 'Generando...' : 'Generar Resumen IA'}
                </Button>

                {isRecording && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Grabando...
                    </span>
                )}
            </div>

            {/* Transcript Display */}
            <div className={`bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 min-h-[60px] ${isRecording ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'
                }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    {isRecording ? (
                        <>
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            Transcribiendo en vivo:
                        </>
                    ) : (
                        'Transcripción:'
                    )}
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {transcript || (
                        <span className="text-slate-400 italic">
                            {isRecording ? 'Habla ahora...' : 'Presiona "Iniciar" y comienza a hablar'}
                        </span>
                    )}
                    {isRecording && transcript && <span className="inline-block w-0.5 h-4 bg-red-500 animate-pulse ml-0.5 align-middle" />}
                </p>
            </div>

            {/* AI Summary Result */}
            {summary && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Resumen IA:
                        </p>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={handleCopySummary}
                                className="p-1 hover:bg-primary/10 rounded text-primary"
                                title="Copiar"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={4}
                        className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded resize-none text-slate-700 dark:text-slate-300"
                    />
                    <Button
                        type="button"
                        size="sm"
                        className="mt-2"
                        onClick={handleUseSummary}
                    >
                        Usar este resumen
                    </Button>
                </div>
            )}
        </div>
    );
}
