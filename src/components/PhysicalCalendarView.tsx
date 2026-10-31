import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  AgendaEvent,
  AgendaTask,
  generateMonthGrid,
} from '../utils/agendaLogic';
import { GoogleMeetLogo } from './BrandIcons';

interface PhysicalCalendarViewProps {
  events: AgendaEvent[];
  tasks: AgendaTask[];
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
  onOpenAddModal: () => void;
  onSwitchToTimeline: () => void;
}

export const PhysicalCalendarView: React.FC<PhysicalCalendarViewProps> = ({
  events,
  tasks,
  selectedDate,
  onSelectDate,
  onOpenAddModal,
  onSwitchToTimeline,
}) => {
  const initialDate = new Date(selectedDate);
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ];

  const weekDayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    onSelectDate(today.toISOString().split('T')[0]);
  };

  const gridCells = generateMonthGrid(currentYear, currentMonth, selectedDate, events, tasks);
  const selectedCell = gridCells.find((c) => c.dateStr === selectedDate);
  const selectedCellEvents = selectedCell ? selectedCell.events : [];
  const selectedCellTasks = selectedCell ? selectedCell.tasks : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-neutral-200 rounded-lg bg-white p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Mese precedente"
              className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTodayMonth}
              className="px-2 py-0.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
            >
              Mese corrente
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Mese successivo"
              className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm font-semibold text-neutral-900 ml-1">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        <button
          type="button"
          onClick={onSwitchToTimeline}
          className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition cursor-pointer"
        >
          Vista timeline oraria →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/50 text-center">
          {weekDayNames.map((d, index) => (
            <div
              key={d}
              className={`py-2 text-[11px] font-mono uppercase tracking-wider ${
                index >= 5 ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 7-column calendar cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100">
          {gridCells.map((cell) => {
            const hasEvents = cell.events.length > 0;
            const hasTasks = cell.tasks.length > 0;

            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDate(cell.dateStr)}
                tabIndex={0}
                role="button"
                aria-label={`${cell.dayNumber} ${monthNames[cell.monthNumber]} ${cell.yearNumber}`}
                className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                  !cell.isCurrentMonth
                    ? 'bg-neutral-50/30 text-neutral-300'
                    : 'bg-white text-neutral-800'
                } ${
                  cell.isSelected
                    ? 'bg-neutral-50 ring-1 ring-neutral-900 ring-inset z-10'
                    : 'hover:bg-neutral-50/60'
                }`}
              >
                {/* Header row in cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono tabular-nums leading-none ${
                      cell.isToday
                        ? 'font-bold text-neutral-950 underline decoration-2 decoration-neutral-900 underline-offset-4'
                        : cell.isSelected
                        ? 'font-bold text-neutral-950'
                        : cell.isCurrentMonth
                        ? 'text-neutral-700'
                        : 'text-neutral-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="text-[9px] font-medium text-neutral-400 uppercase">
                      Oggi
                    </span>
                  )}
                </div>

                {/* Events list in cell */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-800 border border-neutral-200/60 truncate flex items-center gap-1"
                      title={`${ev.title} (${ev.startTime.split('T')[1]?.slice(0, 5) || ''})`}
                    >
                      {ev.meetLink && <GoogleMeetLogo className="w-2.5 h-2.5 shrink-0" />}
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}

                  {cell.events.length > 2 && (
                    <p className="text-[9px] text-neutral-400 font-mono px-0.5">
                      +{cell.events.length - 2} altri
                    </p>
                  )}

                  {hasTasks && cell.events.length < 2 && (
                    <p className="text-[9px] text-neutral-400 font-mono px-0.5">
                      {cell.tasks.length} task
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Quiet Inspector */}
      {selectedCell && (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h3 className="text-xs font-semibold text-neutral-900 capitalize">
                {new Intl.DateTimeFormat('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(selectedDate))}
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {selectedCellEvents.length} impegni · {selectedCellTasks.length} attività
              </p>
            </div>

            <button
              type="button"
              onClick={onSwitchToTimeline}
              className="text-xs text-neutral-700 hover:text-neutral-950 font-medium transition cursor-pointer"
            >
              Apri in timeline
            </button>
          </div>

          {selectedCellEvents.length === 0 ? (
            <p className="text-xs text-neutral-400 py-1">
              Nessun impegno programmato per questo giorno.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {selectedCellEvents.map((ev) => (
                <div key={ev.id} className="py-2 flex items-baseline justify-between gap-3 text-xs">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-neutral-400 tabular-nums shrink-0">
                      {ev.startTime.split('T')[1]?.slice(0, 5)} - {ev.endTime.split('T')[1]?.slice(0, 5)}
                    </span>
                    <span className="font-medium text-neutral-900 truncate">{ev.title}</span>
                    <span className="text-[11px] text-neutral-400 capitalize hidden sm:inline">
                      · {ev.category || 'impegno'}
                    </span>
                  </div>

                  {ev.meetLink && (
                    <a
                      href={ev.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 font-medium text-[11px] shrink-0"
                    >
                      <GoogleMeetLogo className="w-3.5 h-3.5 shrink-0" />
                      <span>Google Meet</span>
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
