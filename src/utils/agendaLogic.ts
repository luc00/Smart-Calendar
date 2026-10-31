export interface AgendaEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string e.g. "2026-10-31T09:00:00"
  endTime: string;   // ISO string e.g. "2026-10-31T10:00:00"
  category?: 'work' | 'focus' | 'meeting' | 'personal' | 'routine';
  meetLink?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  isGoogleCalendar?: boolean;
  zapierTriggered?: boolean;
}

export interface AgendaTask {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  completed: boolean;
  category?: string;
  notionSynced?: boolean;
  zapierTriggered?: boolean;
}

export interface QuickMemo {
  id: string;
  userId: string;
  title?: string;
  content: string;
  pinned?: boolean;
  color?: string;
  createdAt?: string;
}

export interface DayStats {
  totalEvents: number;
  totalMeetings: number;
  focusMinutes: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface Conflict {
  eventA: AgendaEvent;
  eventB: AgendaEvent;
  overlapMinutes: number;
}

/**
 * Formats agenda into an Obsidian daily note with YAML frontmatter,
 * wikilinks, tasks, and time-block sections.
 */
export function formatObsidianDailyNote(
  dateStr: string,
  events: AgendaEvent[],
  tasks: AgendaTask[],
  memos: QuickMemo[]
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`date: ${dateStr}`);
  lines.push('tags: [daily-notes, aura-agenda, smart-planner]');
  lines.push(`generated_at: ${new Date().toISOString()}`);
  lines.push('---');
  lines.push('');
  lines.push(`# 📅 Daily Note - [[${dateStr}]]`);
  lines.push('');

  // Daily Schedule
  lines.push('## 🕒 Programma Giornaliero (Timeline)');
  if (events.length === 0) {
    lines.push('_Nessun evento programmato._');
  } else {
    const sorted = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (const ev of sorted) {
      const start = ev.startTime.includes('T') ? ev.startTime.split('T')[1].slice(0, 5) : ev.startTime;
      const end = ev.endTime.includes('T') ? ev.endTime.split('T')[1].slice(0, 5) : ev.endTime;
      const meet = ev.meetLink ? ` [Google Meet](${ev.meetLink})` : '';
      const cat = ev.category ? ` #${ev.category}` : '';
      lines.push(`- **${start} - ${end}** : ${ev.title}${cat}${meet}`);
      if (ev.description) {
        lines.push(`  > ${ev.description.replace(/\n/g, ' ')}`);
      }
    }
  }
  lines.push('');

  // Tasks
  lines.push('## ✅ Attività & Priorità');
  if (tasks.length === 0) {
    lines.push('_Nessun task per oggi._');
  } else {
    for (const t of tasks) {
      const check = t.completed ? 'x' : ' ';
      const p = t.priority ? ` [priority:: ${t.priority}]` : '';
      lines.push(`- [${check}] ${t.title}${p}`);
      if (t.notes) {
        lines.push(`  - 📝 ${t.notes}`);
      }
    }
  }
  lines.push('');

  // Memos / Scratchpad
  if (memos.length > 0) {
    lines.push('## 💡 Appunti & Note Rapide');
    for (const m of memos) {
      if (m.title) lines.push(`### ${m.title}`);
      lines.push(m.content);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Builds an Obsidian URI to open or create a note directly in the local Obsidian vault.
 */
export function buildObsidianUri(vaultName: string, filename: string, content: string): string {
  const encVault = encodeURIComponent(vaultName || 'Personal');
  const encFile = encodeURIComponent(filename.replace(/\.md$/, ''));
  const encContent = encodeURIComponent(content);
  return `obsidian://new?vault=${encVault}&name=${encFile}&content=${encContent}&overwrite=true`;
}

/**
 * Prepares payload structure for Notion Database integration.
 */
export function formatNotionTaskPayload(task: AgendaTask, databaseId: string) {
  return {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: task.title } }],
      },
      Status: {
        checkbox: task.completed,
      },
      Priority: {
        select: { name: task.priority || 'medium' },
      },
      Category: {
        select: { name: task.category || 'General' },
      },
      DueDate: task.dueDate ? { date: { start: task.dueDate } } : undefined,
    },
  };
}

/**
 * Creates standardized payload for Zapier Webhook dispatch.
 */
export function buildZapierPayload(
  triggerType: 'task.completed' | 'event.created' | 'daily.summary',
  data: Record<string, unknown>
) {
  return {
    event: triggerType,
    timestamp: new Date().toISOString(),
    source: 'Aura Agenda Smart',
    data,
  };
}

/**
 * Generates an authentic Google Meet URL with standard 3-4-3 character pattern.
 */
export function generateRandomMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

export function generateMeetUrl(customCode?: string): string {
  const code = customCode || generateRandomMeetCode();
  return `https://meet.google.com/${code}`;
}

/**
 * Computes day productivity statistics.
 */
export function calculateDayStats(events: AgendaEvent[], tasks: AgendaTask[]): DayStats {
  const totalEvents = events.length;
  let totalMeetings = 0;
  let focusMinutes = 0;

  for (const e of events) {
    if (e.meetLink || e.category === 'meeting') {
      totalMeetings++;
    } else if (e.category === 'focus' || e.category === 'work') {
      const start = new Date(e.startTime).getTime();
      const end = new Date(e.endTime).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        focusMinutes += Math.round((end - start) / (1000 * 60));
      } else {
        focusMinutes += 60; // default 1 hour if parsing fails
      }
    }
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalEvents,
    totalMeetings,
    focusMinutes,
    totalTasks,
    completedTasks,
    completionRate,
  };
}

/**
 * Detects time overlaps between scheduled events.
 */
export function detectScheduleConflicts(events: AgendaEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const valid = events
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      event: e,
      start: new Date(e.startTime).getTime(),
      end: new Date(e.endTime).getTime(),
    }))
    .filter((e) => !isNaN(e.start) && !isNaN(e.end) && e.end > e.start)
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i];
      const b = valid[j];
      if (b.start < a.end) {
        const overlapEnd = Math.min(a.end, b.end);
        const overlapMin = Math.round((overlapEnd - b.start) / (1000 * 60));
        conflicts.push({
          eventA: a.event,
          eventB: b.event,
          overlapMinutes: overlapMin,
        });
      } else {
        break; // sorted by start, so no later event can overlap with a
      }
    }
  }

  return conflicts;
}

export interface CalendarDayCell {
  dateStr: string; // "YYYY-MM-DD"
  dayNumber: number;
  monthNumber: number; // 0-11
  yearNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  events: AgendaEvent[];
  tasks: AgendaTask[];
}

/**
 * Generates an exact, Monday-aligned 7-column calendar grid for any given month,
 * matching events and tasks to their respective day cells.
 */
export function generateMonthGrid(
  year: number,
  month: number, // 0-11
  selectedDateStr: string,
  events: AgendaEvent[] = [],
  tasks: AgendaTask[] = []
): CalendarDayCell[] {
  const cells: CalendarDayCell[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // First day of current month
  const firstDay = new Date(year, month, 1);
  // (0 = Sun, 1 = Mon, ..., 6 = Sat) -> Mon=0 ... Sun=6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Number of days in current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  // Number of days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // 1. Previous month padding days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const y = prevMonthDate.getFullYear();
    const m = prevMonthDate.getMonth();
    const dateStr = `${y}-${padZero(m + 1)}-${padZero(day)}`;
    const dayOfWeek = (prevMonthDate.getDay() + 6) % 7;

    cells.push({
      dateStr,
      dayNumber: day,
      monthNumber: m,
      yearNumber: y,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      events: events.filter((e) => e.startTime.startsWith(dateStr)),
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${year}-${padZero(month + 1)}-${padZero(day)}`;
    const curDate = new Date(year, month, day);
    const dayOfWeek = (curDate.getDay() + 6) % 7;

    cells.push({
      dateStr,
      dayNumber: day,
      monthNumber: month,
      yearNumber: year,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      events: events.filter((e) => e.startTime.startsWith(dateStr)),
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  // 3. Next month padding days to complete full weeks grid
  const totalCellsNeeded = cells.length > 35 ? 42 : 35;
  const remainingCells = totalCellsNeeded - cells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const y = nextMonthDate.getFullYear();
    const m = nextMonthDate.getMonth();
    const dateStr = `${y}-${padZero(m + 1)}-${padZero(day)}`;
    const dayOfWeek = (nextMonthDate.getDay() + 6) % 7;

    cells.push({
      dateStr,
      dayNumber: day,
      monthNumber: m,
      yearNumber: y,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      events: events.filter((e) => e.startTime.startsWith(dateStr)),
      tasks: tasks.filter((t) => t.dueDate === dateStr),
    });
  }

  return cells;
}
