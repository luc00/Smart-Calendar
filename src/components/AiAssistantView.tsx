import React, { useState } from 'react';
import {
  Clock,
  Loader2,
  Plus,
  Check,
} from 'lucide-react';
import {
  getDayOptimization,
  generateRoutineBreakdown,
  DayOptimizationResult,
  RoutineBreakdownResult,
} from '../services/aiAssistant';
import { AgendaEvent, AgendaTask, calculateDayStats } from '../utils/agendaLogic';

interface AiAssistantViewProps {
  events: AgendaEvent[];
  tasks: AgendaTask[];
  onAddSubtaskToAgenda: (task: { title: string; category: string; priority: 'urgent' | 'high' | 'medium' | 'low' }) => Promise<void>;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  events,
  tasks,
  onAddSubtaskToAgenda,
}) => {
  const [optimization, setOptimization] = useState<DayOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [routineGoal, setRoutineGoal] = useState('');
  const [routineResult, setRoutineResult] = useState<RoutineBreakdownResult | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  const stats = calculateDayStats(events, tasks);

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await getDayOptimization(events, tasks);
      setOptimization(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRoutineBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineGoal.trim()) return;
    setIsBreakingDown(true);
    try {
      const res = await generateRoutineBreakdown(routineGoal.trim());
      setRoutineResult(res);
      setAddedTasks({});
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleAddSuggestedTask = async (task: any, index: number) => {
    await onAddSubtaskToAgenda({
      title: task.title,
      category: task.category || 'work',
      priority: task.priority || 'medium',
    });
    setAddedTasks((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Daily Summary & Planning Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
              Pianificazione & Bilanciamento Giornata
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Analisi dei blocchi orari per individuare finestre di concentrazione e priorità.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer self-start sm:self-auto"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analisi in corso...</span>
              </>
            ) : (
              <span>Aggiorna sintesi</span>
            )}
          </button>
        </div>

        {/* Tabular Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-neutral-100">
          <div>
            <p className="text-[11px] font-medium text-neutral-400">Tempo in focus</p>
            <p className="text-sm font-semibold text-neutral-900 font-mono mt-0.5">
              {stats.focusMinutes} min
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400">Riunioni</p>
            <p className="text-sm font-semibold text-neutral-900 font-mono mt-0.5">
              {stats.totalMeetings}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400">Attività completate</p>
            <p className="text-sm font-semibold text-neutral-900 font-mono mt-0.5">
              {stats.completedTasks}/{stats.totalTasks}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400">Tasso di completamento</p>
            <p className="text-sm font-semibold text-neutral-900 font-mono mt-0.5">
              {stats.completionRate}%
            </p>
          </div>
        </div>

        {/* Output section */}
        {optimization ? (
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-xs font-medium text-neutral-800 leading-relaxed">
                {optimization.briefing}
              </p>
            </div>

            <div className="text-xs text-neutral-600 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>
                <strong>Finestra consigliata per focus: </strong> {optimization.focusSlot}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
                Osservazioni operative
              </p>
              <ul className="space-y-1 text-xs text-neutral-600">
                {optimization.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-neutral-300" aria-hidden="true">
                      –
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-400 py-1">
            Clicca su &quot;Aggiorna sintesi&quot; per generare l&apos;analisi del carico di lavoro e dei tempi di focus.
          </p>
        )}
      </div>

      {/* Goal & Task Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
            Scomposizione Attività in Fasi
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Inserisci un progetto o obiettivo per suddividerlo in passaggi operativi con stima di tempo.
          </p>
        </div>

        <form onSubmit={handleRoutineBreakdown} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Es: Riorganizzare documentazione Notion, Preparare presentazione trimestrale..."
            value={routineGoal}
            onChange={(e) => setRoutineGoal(e.target.value)}
            className="flex-1 text-xs p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={isBreakingDown || !routineGoal.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {isBreakingDown ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Elaborazione...</span>
              </>
            ) : (
              <span>Scomponi</span>
            )}
          </button>
        </form>

        {routineResult && (
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              {routineResult.summary}
            </p>

            <div className="divide-y divide-neutral-100">
              {routineResult.suggestedTasks.map((st, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{st.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {st.durationMinutes} min · {st.category}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={addedTasks[idx]}
                    onClick={() => handleAddSuggestedTask(st, idx)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded transition cursor-pointer ${
                      addedTasks[idx]
                        ? 'text-neutral-400 cursor-default'
                        : 'text-neutral-700 hover:text-neutral-950 bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {addedTasks[idx] ? (
                      <>
                        <Check className="w-3 h-3 text-neutral-600" />
                        <span>Aggiunto</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Aggiungi ai task</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
