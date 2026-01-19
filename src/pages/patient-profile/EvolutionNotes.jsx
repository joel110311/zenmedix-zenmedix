import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Trash2, Edit, Printer, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';
import { useSettings } from '../../context/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

// Local storage key for evolution notes
const getStorageKey = (patientId) => `medflow_evolution_notes_${patientId}`;

export default function EvolutionNotes() {
    const { id } = useParams();
    const { activePatient } = usePatient();
    const { settings } = useSettings();

    const [notes, setNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [expandedNote, setExpandedNote] = useState(null);

    // Form state
    const [noteContent, setNoteContent] = useState('');
    const [doctorId, setDoctorId] = useState(settings.activeDoctor || '');

    useEffect(() => {
        loadNotes();
    }, [id]);

    const loadNotes = () => {
        const stored = localStorage.getItem(getStorageKey(id));
        if (stored) {
            setNotes(JSON.parse(stored));
        }
    };

    const saveNotes = (updatedNotes) => {
        localStorage.setItem(getStorageKey(id), JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
    };

    const handleAddNote = () => {
        if (!noteContent.trim()) {
            toast.error('La nota no puede estar vacía');
            return;
        }

        const doctor = settings.doctors?.find(d => d.id === doctorId);
        const newNote = {
            id: `note_${Date.now()}`,
            date: new Date().toISOString(),
            content: noteContent,
            doctorId,
            doctorName: doctor?.name || 'Sin asignar'
        };

        if (editingNote) {
            const updated = notes.map(n => n.id === editingNote.id ? { ...newNote, id: editingNote.id } : n);
            saveNotes(updated);
            toast.success('Nota actualizada');
        } else {
            saveNotes([newNote, ...notes]);
            toast.success('Nota agregada');
        }

        setNoteContent('');
        setEditingNote(null);
        setShowForm(false);
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setNoteContent(note.content);
        setDoctorId(note.doctorId || '');
        setShowForm(true);
    };

    const handleDelete = (noteId) => {
        if (confirm('¿Eliminar esta nota?')) {
            saveNotes(notes.filter(n => n.id !== noteId));
            toast.success('Nota eliminada');
        }
    };

    const filteredNotes = notes.filter(note =>
        note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.doctorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-MX', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Notas de Evolución
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Registro de evolución del paciente
                    </p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingNote(null); setNoteContent(''); }}>
                    <Plus className="w-4 h-4 mr-2" /> Agregar
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar notas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <Card>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                        {editingNote ? 'Editar Nota' : 'Nueva Nota de Evolución'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Médico</label>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {settings.doctors?.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nota</label>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                rows={4}
                                placeholder="Escribe la nota de evolución..."
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAddNote}>
                                {editingNote ? 'Actualizar' : 'Guardar'}
                            </Button>
                            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingNote(null); }}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Notes List */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 px-2">Fecha</th>
                                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 px-2">Médico</th>
                                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 px-2">Nota</th>
                                <th className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 px-2">Acciones</th>
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
                                    <tr key={note.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
                                        <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(note.date)}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-slate-800 dark:text-white">
                                            {note.doctorName}
                                        </td>
                                        <td className="py-3 px-2">
                                            <button
                                                onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                                                className="text-left text-sm text-slate-700 dark:text-slate-300"
                                            >
                                                {expandedNote === note.id ? (
                                                    <span className="whitespace-pre-wrap">{note.content}</span>
                                                ) : (
                                                    <span className="line-clamp-1">{note.content.substring(0, 80)}{note.content.length > 80 ? '...' : ''}</span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
