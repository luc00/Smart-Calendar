import React, { useState } from 'react';
import { X, Calendar, CheckSquare, Video, Loader2 } from 'lucide-react';
import { smartParsePrompt, SmartParseResult } from '../services/aiAssistant';
import { generateMeetUrl } from '../utils/agendaLogic';
import { GoogleMeetLogo } from './BrandIcons';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    category: 'work' | 'meeting' | 'focus' | 'personal' | 'routine';
    meetLink?: string;
    syncToGoogleCalendar: boolean;
  }) => Promise<void>;
  onAddTask: (taskData: {
    title: string;
    notes?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: string;
    category: string;
    syncToGoogleTasks: boolean;
  }) => Promise<void>;
  isWorkspaceConnected: boolean;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
  onAddTask,
  isWorkspaceConnected,
}) => {
  const [activeMode, setActiveMode] = useState<'quick' | 'event' | 'task'>('quick');
  const [quickInput, setQuickInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<SmartParseResult | null>(null);

  // Manual Event Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('10:00');
  const [eventEndTime, setEventEndTime] = useState('11:00');
  const [eventCategory, setEventCategory] = useState<'work' | 'meeting' | 'focus' | 'personal' | 'routine'>('work');
  const [attachMeet, setAttachMeet] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(true);

  // Manual Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskPriority, setTaskPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskCategory, setTaskCategory] = useState('Lavoro');
  const [syncToTasks, setSyncToTasks] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      const parsed = await smartParsePrompt(quickInput);
      setParsedPreview(parsed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante l’analisi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmParsed = async () => {
    if (!parsedPreview) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (parsedPreview.type === 'event') {
        const start = parsedPreview.startTime || `${new Date().toISOString().split('T')[0]}T10:00:00`;
        const end = parsedPreview.endTime || `${new Date().toISOString().split('T')[0]}T11:00:00`;
        const meet = parsedPreview.needsMeet ? generateMeetUrl() : undefined;
        await onAddEvent({
          title: parsedPreview.title,
          description: parsedPreview.notes || '',
          startTime: start,
          endTime: end,
          category: parsedPreview.category || 'work',
          meetLink: meet,
          syncToGoogleCalendar: isWorkspaceConnected,
        });
      } else {
        await onAddTask({
          title: parsedPreview.title,
          notes: parsedPreview.notes || '',
          priority: parsedPreview.priority || 'medium',
          dueDate: parsedPreview.dueDate || new Date().toISOString().split('T')[0],
          category: parsedPreview.category || 'Generale',
          syncToGoogleTasks: isWorkspaceConnected,
        });
      }
      resetAndClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setErrorMsg('Inserisci un titolo per l’evento.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const startIso = `${eventDate}T${eventStartTime}:00`;
      const endIso = `${eventDate}T${eventEndTime}:00`;
      const meet = attachMeet ? generateMeetUrl() : undefined;

      await onAddEvent({
        title: eventTitle,
        description: eventDescription,
        startTime: startIso,
        endTime: endIso,
        category: eventCategory,
        meetLink: meet,
        syncToGoogleCalendar: isWorkspaceConnected && syncToCalendar,
      });
      resetAndClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setErrorMsg('Inserisci un titolo per l’attività.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onAddTask({
        title: taskTitle,
        notes: taskNotes,
        priority: taskPriority,
        dueDate: taskDueDate,
        category: taskCategory,
        syncToGoogleTasks: isWorkspaceConnected && syncToTasks,
      });
      resetAndClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nel salvataggio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setQuickInput('');
    setParsedPreview(null);
    setEventTitle('');
    setEventDescription('');
    setTaskTitle('');
    setTaskNotes('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-add-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-xs animate-in fade-in duration-100"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-neutral-200 shadow-xl p-5 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 id="smart-add-modal-title" className="text-sm font-semibold text-neutral-900">
            Nuovo inserimento
          </h2>
          <button
            onClick={resetAndClose}
            aria-label="Chiudi finestra"
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg my-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('quick')}
            className={`flex-1 py-1 rounded font-medium transition cursor-pointer ${
              activeMode === 'quick' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Testo rapido
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('event')}
            className={`flex-1 py-1 rounded font-medium transition cursor-pointer ${
              activeMode === 'event' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Evento
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('task')}
            className={`flex-1 py-1 rounded font-medium transition cursor-pointer ${
              activeMode === 'task' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Attività
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-neutral-50 text-neutral-800 text-xs rounded-lg border border-neutral-200">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 pr-0.5">
          {activeMode === 'quick' && (
            <div className="space-y-3">
              <form onSubmit={handleQuickAnalyze} className="space-y-2.5">
                <textarea
                  id="smart-input-area"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Es: Riunione con Marco domani alle 15:30 su Google Meet per definire budget"
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 leading-relaxed resize-none"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isAnalyzing || !quickInput.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analisi...</span>
                      </>
                    ) : (
                      <span>Continua</span>
                    )}
                  </button>
                </div>
              </form>

              {parsedPreview && (
                <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2 text-xs">
                  <div className="flex items-baseline justify-between text-neutral-500">
                    <span className="font-medium text-neutral-900">
                      {parsedPreview.type === 'event' ? 'Evento' : 'Attività'}
                    </span>
                    {parsedPreview.needsMeet && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
                        <GoogleMeetLogo className="w-3.5 h-3.5" />
                        <span>Include Google Meet</span>
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-neutral-900">{parsedPreview.title}</p>

                  <p className="text-[11px] text-neutral-500">
                    {parsedPreview.type === 'event'
                      ? `Orario: ${parsedPreview.startTime ? new Date(parsedPreview.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '10:00'} - ${parsedPreview.endTime ? new Date(parsedPreview.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '11:00'}`
                      : `Scadenza: ${parsedPreview.dueDate || 'Oggi'} · Priorità: ${parsedPreview.priority || 'media'}`}
                  </p>

                  <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setParsedPreview(null)}
                      className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmParsed}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                    >
                      {isSubmitting ? 'Salvataggio...' : 'Conferma e Salva'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === 'event' && (
            <form onSubmit={handleCreateManualEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Titolo</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Titolo riunione o impegno"
                  className="w-full p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Inizio</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Fine</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Categoria</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="work">Lavoro</option>
                    <option value="meeting">Riunione</option>
                    <option value="focus">Deep focus</option>
                    <option value="personal">Personale</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition">
                    <input
                      type="checkbox"
                      checked={attachMeet}
                      onChange={(e) => setAttachMeet(e.target.checked)}
                      className="rounded text-neutral-900"
                    />
                    <GoogleMeetLogo className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-neutral-800">Crea stanza Google Meet</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Descrizione</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Note aggiuntive..."
                  rows={2}
                  className="w-full p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-3 py-1.5 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition cursor-pointer"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Crea'}
                </button>
              </div>
            </form>
          )}

          {activeMode === 'task' && (
            <form onSubmit={handleCreateManualTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Titolo attività</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Cosa devi completare?"
                  className="w-full p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Priorità</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Bassa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Scadenza</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-neutral-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    placeholder="Lavoro, Studio"
                    className="w-full p-2 rounded-lg border border-neutral-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-3 py-1.5 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition cursor-pointer"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Crea'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
