import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, ClipboardList, Plus, Edit, Printer, Trash2, Search, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { usePatient } from '../../context/PatientContext';
import { useSettings } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

// Storage key for evolution notes per consultation
const getNotesKey = (consultId) => `medflow_evolution_notes_${consultId}`;

export default function ConsultationList() {
    const { activePatient } = usePatient();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Evolution notes view state
    const [viewingNotes, setViewingNotes] = useState(null); // consultation id
    const [notes, setNotes] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [noteModal, setNoteModal] = useState(null); // { mode: 'add'|'edit', note?: object }
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        if (activePatient) loadConsultations();
    }, [activePatient]);

    const loadConsultations = async () => {
        try {
            const data = await api.consultations.listByPatient(activePatient.id);
            setConsultations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadNotes = (consultId) => {
        const stored = localStorage.getItem(getNotesKey(consultId));
        if (stored) {
            setNotes(JSON.parse(stored));
        } else {
            setNotes([]);
        }
        setSelectedNotes([]);
        setSearchTerm('');
    };

    const saveNotesToStorage = (consultId, notesData) => {
        localStorage.setItem(getNotesKey(consultId), JSON.stringify(notesData));
        setNotes(notesData);
    };

    const openNotesView = (consultId) => {
        setViewingNotes(consultId);
        loadNotes(consultId);
    };

    const handleAddNote = () => {
        setNoteText('');
        setNoteModal({ mode: 'add' });
    };

    const handleEditNote = () => {
        if (selectedNotes.length !== 1) {
            toast.error('Selecciona una nota para editar');
            return;
        }
        const note = notes.find(n => n.id === selectedNotes[0]);
        setNoteText(note.content);
        setNoteModal({ mode: 'edit', note });
    };

    const handleSaveNote = () => {
        if (!noteText.trim()) {
            toast.error('La nota no puede estar vacía');
            return;
        }
        const doctor = settings.doctors?.find(d => d.id === settings.activeDoctor);

        if (noteModal.mode === 'add') {
            const newNote = {
                id: `note_${Date.now()}`,
                date: new Date().toISOString(),
                content: noteText,
                doctorName: doctor?.name || 'Sin asignar'
            };
            saveNotesToStorage(viewingNotes, [newNote, ...notes]);
            toast.success('Nota agregada');
        } else {
            const updated = notes.map(n =>
                n.id === noteModal.note.id
                    ? { ...n, content: noteText, doctorName: doctor?.name || n.doctorName }
                    : n
            );
            saveNotesToStorage(viewingNotes, updated);
            toast.success('Nota actualizada');
        }
        setNoteModal(null);
        setSelectedNotes([]);
    };

    const handleDeleteNotes = () => {
        if (selectedNotes.length === 0) {
            toast.error('Selecciona notas para eliminar');
            return;
        }
        if (confirm(`¿Eliminar ${selectedNotes.length} nota(s)?`)) {
            const remaining = notes.filter(n => !selectedNotes.includes(n.id));
            saveNotesToStorage(viewingNotes, remaining);
            setSelectedNotes([]);
            toast.success('Nota(s) eliminada(s)');
        }
    };

    const handlePrintNotes = () => {
        const toPrint = selectedNotes.length > 0
            ? notes.filter(n => selectedNotes.includes(n.id))
            : notes;

        if (toPrint.length === 0) {
            toast.error('No hay notas para imprimir');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Notas de Evolución</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
            </style></head>
            <body>
                <h2>Notas de Evolución</h2>
                <p><strong>Paciente:</strong> ${activePatient.firstName} ${activePatient.lastName}</p>
                <table>
                    <tr><th>Fecha</th><th>Médico</th><th>Nota</th></tr>
                    ${toPrint.map(n => `
                        <tr>
                            <td>${new Date(n.date).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td>${n.doctorName}</td>
                            <td>${n.content}</td>
                        </tr>
                    `).join('')}
                </table>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const toggleNoteSelection = (noteId) => {
        setSelectedNotes(prev =>
            prev.includes(noteId)
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId]
        );
    };

    const filteredNotes = notes.filter(n =>
        n.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-MX', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) return <Spinner />;

    // Evolution Notes View
    if (viewingNotes) {
        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewingNotes(null)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notas de Evolución</h1>
                    </div>
                    <Button onClick={handleAddNote}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar
                    </Button>
                </div>

                {/* Search and Action Buttons */}
                <Card>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleEditNote}>
                                <Edit className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handlePrintNotes}>
                                <Printer className="w-4 h-4 mr-1" /> Imprimir
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handleDeleteNotes} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                        </div>
                    </div>

                    {/* Notes Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="w-10 py-3 px-2"></th>
                                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-2">Fecha</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-2">Médico</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-2">Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-400">
                                            No hay notas de evolución
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNotes.map((note) => (
                                        <tr
                                            key={note.id}
                                            className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer ${selectedNotes.includes(note.id) ? 'bg-primary/5' : ''
                                                }`}
                                            onClick={() => toggleNoteSelection(note.id)}
                                        >
                                            <td className="py-3 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNotes.includes(note.id)}
                                                    onChange={() => { }}
                                                    className="w-4 h-4 rounded border-slate-300"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(note.date)}
                                            </td>
                                            <td className="py-3 px-2 text-sm text-slate-800 dark:text-white">
                                                {note.doctorName}
                                            </td>
                                            <td className="py-3 px-2 text-sm text-slate-700 dark:text-slate-300">
                                                <span className="line-clamp-1">{note.content}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Note Modal */}
                {noteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-xl">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                                {noteModal.mode === 'add' ? 'Nueva Nota de Evolución' : 'Editar Nota'}
                            </h3>
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                rows={6}
                                placeholder="Escribe la nota de evolución..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none mb-4"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setNoteModal(null)}>Cancelar</Button>
                                <Button onClick={handleSaveNote}>Guardar</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Main Consultation List View
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Historial de Consultas</h1>

            {consultations.length === 0 ? (
                <Card>
                    <div className="text-center py-12 text-slate-500">
                        <p>No hay consultas registradas para este paciente.</p>
                        <Button className="mt-4" onClick={() => navigate(`../consulta/nueva`)}>
                            Nueva Consulta
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {consultations.map((consult) => {
                        const storedNotes = localStorage.getItem(getNotesKey(consult.id));
                        const hasNotes = storedNotes && JSON.parse(storedNotes).length > 0;

                        return (
                            <Card key={consult.id} className="hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(consult.created || consult.date).toLocaleDateString('es-ES', {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{consult.diagnosis || 'Sin diagnóstico registrado'}</h3>
                                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">{consult.chiefComplaint}</p>
                                        {/* Doctor and Clinic info */}
                                        {(consult.doctor?.name || consult.clinic?.name) && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-1">
                                                {consult.doctor?.name && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">Médico: {consult.doctor.name}</span>}
                                                {consult.clinic?.name && <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Clínica: {consult.clinic.name}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => navigate(`/imprimir/receta/${consult.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver Receta
                                        </Button>
                                        <Button
                                            variant={hasNotes ? "primary" : "ghost"}
                                            size="sm"
                                            onClick={() => openNotesView(consult.id)}
                                            className={hasNotes ? '' : 'text-slate-500 hover:text-primary border border-slate-300 dark:border-slate-600'}
                                        >
                                            <ClipboardList className="w-4 h-4 mr-1" />
                                            Notas
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )
            }
        </div >
    );
}
