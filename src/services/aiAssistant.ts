export interface SmartParseResult {
  type: 'event' | 'task';
  title: string;
  startTime?: string;
  endTime?: string;
  category?: 'work' | 'meeting' | 'focus' | 'personal' | 'routine';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  needsMeet?: boolean;
  notes?: string;
}

export interface DayOptimizationResult {
  briefing: string;
  focusSlot: string;
  recommendations: string[];
  productivityScore: number;
}

export interface RoutineBreakdownResult {
  summary: string;
  suggestedTasks: {
    title: string;
    durationMinutes: number;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    category: string;
  }[];
}

export async function smartParsePrompt(input: string): Promise<SmartParseResult> {
  const res = await fetch('/api/gemini/smart-parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Errore durante il parsing con IA');
  return await res.json();
}

export async function getDayOptimization(events: any[], tasks: any[]): Promise<DayOptimizationResult> {
  const res = await fetch('/api/gemini/optimize-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, tasks }),
  });
  if (!res.ok) throw new Error('Errore durante ottimizzazione');
  return await res.json();
}

export async function generateRoutineBreakdown(goal: string): Promise<RoutineBreakdownResult> {
  const res = await fetch('/api/gemini/routine-breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal }),
  });
  if (!res.ok) throw new Error('Errore nella scomposizione routine');
  return await res.json();
}
