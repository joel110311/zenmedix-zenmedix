import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Trash2, Sparkles, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

export default function DictadoConsulta({ onSummaryReady }) {
    const { settings } = useSettings();
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState('');
    const [copied, setCopied] = useState(false);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    // Debug: Log speech recognition status on mount
    useEffect(() => {
        console.log('🔍 DictadoConsulta mounted:', {
            browserSupportsSpeechRecognition,
            isMicrophoneAvailable,
            hasSpeechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
        });
    }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

    // Stop listening when component unmounts
    useEffect(() => {
        return () => {
            SpeechRecognition.stopListening();
        };
    }, []);

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-300">
                    Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
                </span>
            </div>
        );
    }

    const startListening = async () => {
        console.log('🎤 Starting speech recognition...', {
            browserSupportsSpeechRecognition,
            isMicrophoneAvailable,
            listening
        });

        try {
            await SpeechRecognition.startListening({ continuous: true, language: 'es-MX' });
            console.log('✅ Speech recognition started successfully');
        } catch (error) {
            console.error('❌ Error starting speech recognition:', error);
            toast.error('Error al iniciar reconocimiento de voz: ' + error.message);
        }
    };

    const stopListening = () => {
        console.log('🛑 Stopping speech recognition...');
        // Use abortListening for immediate stop (stopListening waits for final result)
        SpeechRecognition.abortListening();
    };

    const handleClear = () => {
        resetTranscript();
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
        try {
            console.log('📡 Calling AI summary webhook:', webhookUrl);
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, type: 'consultation_summary' })
            });

            if (!response.ok) throw new Error('Error en respuesta: ' + response.status);

            const data = await response.json();
            console.log('📥 AI summary response:', data);
            const generatedSummary = data.summary || data.result || data.text || JSON.stringify(data);
            setSummary(generatedSummary);

            if (onSummaryReady) {
                onSummaryReady(generatedSummary);
            }

            toast.success('Resumen generado');
        } catch (error) {
            console.error('Error generating summary:', error);
            // Check if it's a CORS error
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                toast.error('Error de CORS: Configura los headers en n8n para permitir tu dominio');
            } else {
                toast.error('Error al generar resumen: ' + error.message);
            }
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

    return (
        <div className="space-y-3">
            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Start Recording Button */}
                <Button
                    type="button"
                    variant={listening ? "secondary" : "secondary"}
                    size="sm"
                    onClick={startListening}
                    disabled={!isMicrophoneAvailable || listening}
                    className={listening ? 'opacity-50' : ''}
                >
                    <Mic className={`w-4 h-4 mr-1 ${listening ? 'text-slate-400' : 'text-green-600'}`} />
                    Iniciar
                </Button>

                {/* Stop Button - Small red square button */}
                <button
                    type="button"
                    onClick={stopListening}
                    disabled={!listening}
                    className={`p-2 rounded-lg transition-colors ${listening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    title="Detener grabación"
                >
                    {/* Stop icon - square */}
                    <div className={`w-3 h-3 rounded-sm ${listening ? 'bg-white' : 'bg-slate-400'}`} />
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

                {listening && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Grabando...
                    </span>
                )}
            </div>

            {/* Transcript Display - Shows in real-time */}
            <div className={`bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 min-h-[60px] ${listening ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'
                }`}>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    {listening ? (
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
                            {listening ? 'Habla ahora...' : 'Presiona "Iniciar" y comienza a hablar'}
                        </span>
                    )}
                    {listening && transcript && <span className="inline-block w-0.5 h-4 bg-red-500 animate-pulse ml-0.5 align-middle" />}
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
