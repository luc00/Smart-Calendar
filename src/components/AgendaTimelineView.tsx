import React, { useState } from 'react';
import {
  Clock,
  Video,
  AlertCircle,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Calendar,
} from 'lucide-react';
import {
  AgendaEvent,
  AgendaTask,
  calculateDayStats,
  detectScheduleConflicts,
} from '../utils/agendaLogic';
import { GoogleMeetLogo } from './BrandIcons';
import { PhysicalCalendarView } from './PhysicalCalendarView';

interface AgendaTimelineViewProps {
  events: AgendaEvent[];
  tasks: AgendaTask[];
  selectedDate: string; // "YYYY-MM-DD"
  onChangeDate: (date: string) => void;
  onOpenAddModal: () => void;
  onDeleteEvent: (event: AgendaEvent) => void;
  onSyncGoogleCalendar: () => Promise<void>;
  isSyncingCalendar: boolean;
  isWorkspaceConnected: boolean;
}

export const AgendaTimelineView: React.FC<AgendaTimelineViewProps> = ({
  events,
  tasks,
  selectedDate,
  onChangeDate,
  onOpenAddModal,
  onDeleteEvent,
  onSyncGoogleCalendar,
  isSyncingCalendar,
  isWorkspaceConnected,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Filter events matching selected date
  const dayEvents = events
    .filter((e) => {
      const eDate = e.startTime.split('T')[0];
      return eDate === selectedDate;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Filter tasks for the day and calculate productivity statistics
  const dayTasks = tasks.filter((t) => !t.dueDate || t.dueDate === selectedDate);
  const stats = calculateDayStats(dayEvents, dayTasks);

  // Conflicts check
  const conflicts = detectScheduleConflicts(dayEvents);

  const handleCopyMeet = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onChangeDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onChangeDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onChangeDate(new Date().toISOString().split('T')[0]);
  };

  const formattedDateHeader = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(selectedDate));

  return (
    <div className="space-y-4">
      {/* View Switcher: Timeline vs Calendario Fisico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-neutral-200">
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Timeline oraria
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Mese intero
          </button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'timeline' && isWorkspaceConnected && (
            <button
              type="button"
              onClick={onSyncGoogleCalendar}
              disabled={isSyncingCalendar}
              aria-label="Sincronizza Google Calendar"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
              <span>{isSyncingCalendar ? 'Sincronizzazione...' : 'Sincronizza'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuovo impegno</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <PhysicalCalendarView
          events={events}
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={(newDate) => {
            onChangeDate(newDate);
          }}
          onOpenAddModal={onOpenAddModal}
          onSwitchToTimeline={() => setViewMode('timeline')}
        />
      ) : (
        <>
          {/* Date Navigation Strip */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 border border-neutral-200 rounded-lg bg-white p-0.5">
                <button
                  onClick={handlePrevDay}
                  aria-label="Giorno precedente"
                  className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-2 py-0.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
                >
                  Oggi
                </button>
                <button
                  onClick={handleNextDay}
                  aria-label="Giorno successivo"
                  className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-sm font-semibold text-neutral-900 capitalize ml-1">
                {formattedDateHeader}
              </h2>
            </div>

            <span className="text-xs text-neutral-400">
              {dayEvents.length} {dayEvents.length === 1 ? 'impegno' : 'impegni'}
            </span>
          </div>

          {/* Productivity Stats Widget (Clean Tabular Architecture) */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
              {/* Focus Time */}
              <div className="pt-2 lg:pt-0 lg:px-3 first:pl-0">
                <p className="text-[11px] font-medium text-neutral-400">Tempo in focus</p>
                <p className="text-base font-semibold text-neutral-900 font-mono mt-0.5">
                  {stats.focusMinutes >= 60
                    ? `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60 > 0 ? `${stats.focusMinutes % 60}m` : '00m'}`
                    : `${stats.focusMinutes} min`}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {dayEvents.filter((e) => e.category === 'focus').length} sessioni dedicate
                </p>
              </div>

              {/* Task Completion */}
              <div className="pt-2 lg:pt-0 lg:px-3">
                <p className="text-[11px] font-medium text-neutral-400">Completamento attività</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-semibold text-neutral-900 font-mono">
                    {stats.completedTasks}/{stats.totalTasks}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ({stats.completionRate}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-neutral-800 h-full rounded-full transition-all duration-200"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Meetings */}
              <div className="pt-2 lg:pt-0 lg:px-3">
                <p className="text-[11px] font-medium text-neutral-400">Riunioni</p>
                <p className="text-base font-semibold text-neutral-900 font-mono mt-0.5">
                  {stats.totalMeetings}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5 inline-flex items-center gap-1.5">
                  <GoogleMeetLogo className="w-3.5 h-3.5" />
                  <span>Google Meet</span>
                </p>
              </div>

              {/* Workload Status */}
              <div className="pt-2 lg:pt-0 lg:px-3 last:pr-0">
                <p className="text-[11px] font-medium text-neutral-400">Densità giornata</p>
                <p className="text-base font-semibold text-neutral-900 mt-0.5">
                  {stats.totalEvents > 4 ? 'Intensa' : stats.totalEvents > 0 ? 'Bilanciata' : 'Libera'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {dayTasks.length} task da gestire
                </p>
              </div>
            </div>
          </div>

          {/* Conflict notification if overlapping */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-2.5 text-xs text-neutral-800">
              <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Sovrapposizione oraria: </span>
                <span>
                  &quot;{conflicts[0].eventA.title}&quot; e &quot;{conflicts[0].eventB.title}&quot; condividono{' '}
                  {conflicts[0].overlapMinutes} minuti.
                </span>
              </div>
            </div>
          )}

          {/* Timeline List (Refined Editorial Layout) */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
            {dayEvents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-xs font-medium text-neutral-800">Nessun impegno in questa data</p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  La giornata è libera. Usa il pulsante &quot;Nuovo impegno&quot; per pianificare.
                </p>
              </div>
            ) : (
              dayEvents.map((event) => {
                const startFormatted = event.startTime.includes('T')
                  ? event.startTime.split('T')[1].slice(0, 5)
                  : event.startTime;
                const endFormatted = event.endTime.includes('T')
                  ? event.endTime.split('T')[1].slice(0, 5)
                  : event.endTime;

                return (
                  <div
                    key={event.id}
                    className="p-3.5 sm:px-4 hover:bg-neutral-50/70 transition-colors flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-4 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 flex-1 min-w-0">
                      {/* Time Column */}
                      <span className="text-xs font-mono text-neutral-500 tabular-nums shrink-0 w-24">
                        {startFormatted} – {endFormatted}
                      </span>

                      {/* Title & Unboxed Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 truncate">
                            {event.title}
                          </h4>

                          {/* Unboxed clean metadata text with dots */}
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{event.category || 'impegno'}</span>
                            {event.isGoogleCalendar && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Google Calendar</span>
                              </>
                            )}
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-1 leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        {event.meetLink && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <a
                              href={event.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-neutral-900 font-medium hover:underline"
                            >
                              <GoogleMeetLogo className="w-3.5 h-3.5 shrink-0" />
                              <span>Partecipa a Google Meet</span>
                              <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopyMeet(event.meetLink!)}
                              className="text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
                              title="Copia link riunione"
                            >
                              {copiedLink === event.meetLink ? (
                                <span className="text-neutral-800 font-medium text-[11px]">Copiato</span>
                              ) : (
                                <span className="text-[11px]">Copia link</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(event)}
                        aria-label={`Elimina ${event.title}`}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
