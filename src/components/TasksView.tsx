import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RefreshCw,
  Tag,
  Calendar,
  Zap,
} from 'lucide-react';
import { AgendaTask } from '../utils/agendaLogic';

interface TasksViewProps {
  tasks: AgendaTask[];
  onToggleTask: (task: AgendaTask) => void;
  onDeleteTask: (task: AgendaTask) => void;
  onAddTask: (taskData: {
    title: string;
    notes?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: string;
    category: string;
    syncToGoogleTasks: boolean;
  }) => Promise<void>;
  onSyncGoogleTasks: () => Promise<void>;
  isSyncingTasks: boolean;
  isWorkspaceConnected: boolean;
  zapierConfigured: boolean;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onSyncGoogleTasks,
  isSyncingTasks,
  isWorkspaceConnected,
  zapierConfigured,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent' | 'completed'>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [isAdding, setIsAdding] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'urgent') return t.priority === 'urgent' && !t.completed;
    return true;
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setIsAdding(true);
    try {
      await onAddTask({
        title: quickTitle.trim(),
        priority: quickPriority,
        category: 'Attività',
        dueDate: new Date().toISOString().split('T')[0],
        syncToGoogleTasks: isWorkspaceConnected,
      });
      setQuickTitle('');
    } finally {
      setIsAdding(false);
    }
  };

  const renderPriority = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="text-[11px] font-medium text-red-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            P0 · Urgente
          </span>
        );
      case 'high':
        return (
          <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            P1 · Alta
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
            P2 · Media
          </span>
        );
      case 'low':
        return (
          <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
            P3 · Bassa
          </span>
        );
      default:
        return null;
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header card with progress bar */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">Attività & Priorità</h2>
              <span className="text-xs text-neutral-500 font-mono">
                {completedCount}/{tasks.length} completate · {progressPercent}%
              </span>
            </div>
            {zapierConfigured && (
              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-1 font-mono">
                <Zap className="w-3 h-3 text-neutral-600" />
                Webhook Zapier connesso: completamento inviato in tempo reale
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isWorkspaceConnected && (
              <button
                type="button"
                onClick={onSyncGoogleTasks}
                disabled={isSyncingTasks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTasks ? 'animate-spin text-neutral-900' : 'text-neutral-500'}`} />
                <span>{isSyncingTasks ? 'Sincronizzazione...' : 'Sincronizza Google Tasks'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Hairline Progress Meter */}
        <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
          <div
            className="bg-neutral-900 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick add inline */}
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="Aggiungi una nuova attività..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 text-xs font-normal p-2.5 rounded-lg border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
          />
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as any)}
            className="text-xs p-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:border-neutral-900"
          >
            <option value="urgent">P0 — Urgente</option>
            <option value="high">P1 — Alta</option>
            <option value="medium">P2 — Media</option>
            <option value="low">P3 — Bassa</option>
          </select>
          <button
            type="submit"
            disabled={isAdding || !quickTitle.trim()}
            className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi</span>
          </button>
        </form>

        {/* Clean segment filter */}
        <div className="flex items-center gap-1 pt-1 border-t border-neutral-100">
          <div className="inline-flex items-center p-0.5 bg-neutral-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-neutral-900 font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Tutti <span className="font-mono text-[10px] text-neutral-400">({tasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'active'
                  ? 'bg-white text-neutral-900 font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Da fare <span className="font-mono text-[10px] text-neutral-400">({tasks.filter((t) => !t.completed).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('urgent')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'urgent'
                  ? 'bg-white text-neutral-900 font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Urgenti <span className="font-mono text-[10px] text-neutral-400">({tasks.filter((t) => t.priority === 'urgent' && !t.completed).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'completed'
                  ? 'bg-white text-neutral-900 font-medium shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Completati <span className="font-mono text-[10px] text-neutral-400">({completedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-xs font-medium text-neutral-700">Nessuna attività in questa vista</p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Tutte le attività corrispondenti sono state completate o non ne sono ancora state create.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`py-3 px-4 flex items-start justify-between gap-3 group transition-colors ${
                task.completed ? 'opacity-50 bg-neutral-50/50' : 'hover:bg-neutral-50/60'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTask(task)}
                  aria-label={task.completed ? `Segna da fare ${task.title}` : `Completa ${task.title}`}
                  className="mt-0.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer shrink-0"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-neutral-900" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`text-xs font-medium text-neutral-900 ${
                        task.completed ? 'line-through text-neutral-400' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                    {renderPriority(task.priority)}
                  </div>

                  {task.notes && (
                    <p className="mt-1 text-[11px] text-neutral-500 line-clamp-1 leading-relaxed">
                      {task.notes}
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 font-mono">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {task.dueDate}
                      </span>
                    )}
                    {task.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-neutral-400" />
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteTask(task)}
                aria-label={`Elimina ${task.title}`}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-600 rounded transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

