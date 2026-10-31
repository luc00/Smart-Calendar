import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatObsidianDailyNote,
  buildObsidianUri,
  formatNotionTaskPayload,
  buildZapierPayload,
  generateMeetUrl,
  calculateDayStats,
  detectScheduleConflicts,
  generateMonthGrid,
  AgendaEvent,
  AgendaTask,
  QuickMemo,
} from './agendaLogic';

test('formatObsidianDailyNote generates valid markdown with frontmatter and tasks', () => {
  const events: AgendaEvent[] = [
    {
      id: 'e1',
      userId: 'u1',
      title: 'Sprint Planning',
      startTime: '2026-10-31T10:00:00',
      endTime: '2026-10-31T11:00:00',
      category: 'meeting',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
  ];
  const tasks: AgendaTask[] = [
    {
      id: 't1',
      userId: 'u1',
      title: 'Review Q4 Roadmap',
      completed: false,
      priority: 'high',
    },
    {
      id: 't2',
      userId: 'u1',
      title: 'Inviare report settimanale',
      completed: true,
      priority: 'urgent',
    },
  ];
  const memos: QuickMemo[] = [
    {
      id: 'm1',
      userId: 'u1',
      title: 'Idea Prodotto',
      content: 'Automatizzare sync con webhook',
    },
  ];

  const md = formatObsidianDailyNote('2026-10-31', events, tasks, memos);

  assert.ok(md.includes('---'));
  assert.ok(md.includes('date: 2026-10-31'));
  assert.ok(md.includes('Sprint Planning'));
  assert.ok(md.includes('meet.google.com/abc-defg-hij'));
  assert.ok(md.includes('- [ ] Review Q4 Roadmap [priority:: high]'));
  assert.ok(md.includes('- [x] Inviare report settimanale [priority:: urgent]'));
  assert.ok(md.includes('Idea Prodotto'));
});

test('buildObsidianUri produces correct URI schema', () => {
  const uri = buildObsidianUri('MyVault', '2026-10-31', '# Hello');
  assert.ok(uri.startsWith('obsidian://new?vault=MyVault'));
  assert.ok(uri.includes('name=2026-10-31'));
  assert.ok(uri.includes('content=%23%20Hello'));
});

test('formatNotionTaskPayload builds valid Notion database schema object', () => {
  const task: AgendaTask = {
    id: 't-123',
    userId: 'u-1',
    title: 'Deploy to Cloud',
    completed: true,
    priority: 'urgent',
    category: 'DevOps',
    dueDate: '2026-10-31',
  };
  const payload = formatNotionTaskPayload(task, 'db-notion-999');

  assert.equal(payload.parent.database_id, 'db-notion-999');
  assert.equal(payload.properties.Name.title[0].text.content, 'Deploy to Cloud');
  assert.equal(payload.properties.Status.checkbox, true);
  assert.equal(payload.properties.Priority.select.name, 'urgent');
  assert.equal(payload.properties.Category.select.name, 'DevOps');
  assert.equal(payload.properties.DueDate?.date.start, '2026-10-31');
});

test('buildZapierPayload creates compliant webhook envelope', () => {
  const payload = buildZapierPayload('task.completed', { taskId: 't-1', title: 'Buy milk' });
  assert.equal(payload.event, 'task.completed');
  assert.equal(payload.source, 'Aura Agenda Smart');
  assert.equal((payload.data as any).taskId, 't-1');
  assert.ok(payload.timestamp);
});

test('generateMeetUrl generates valid Meet link pattern', () => {
  const meet = generateMeetUrl();
  assert.match(meet, /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
});

test('calculateDayStats aggregates productivity metrics accurately', () => {
  const events: AgendaEvent[] = [
    {
      id: 'e1',
      userId: 'u1',
      title: 'Deep Focus Work',
      category: 'focus',
      startTime: '2026-10-31T09:00:00',
      endTime: '2026-10-31T11:00:00', // 120 mins
    },
    {
      id: 'e2',
      userId: 'u1',
      title: 'Sync Call',
      category: 'meeting',
      meetLink: 'https://meet.google.com/xyz',
      startTime: '2026-10-31T14:00:00',
      endTime: '2026-10-31T14:30:00',
    },
  ];
  const tasks: AgendaTask[] = [
    { id: '1', userId: 'u1', title: 'A', completed: true },
    { id: '2', userId: 'u1', title: 'B', completed: false },
  ];

  const stats = calculateDayStats(events, tasks);
  assert.equal(stats.totalEvents, 2);
  assert.equal(stats.totalMeetings, 1);
  assert.equal(stats.focusMinutes, 120);
  assert.equal(stats.totalTasks, 2);
  assert.equal(stats.completedTasks, 1);
  assert.equal(stats.completionRate, 50);
});

test('detectScheduleConflicts finds overlapping events', () => {
  const events: AgendaEvent[] = [
    {
      id: 'e1',
      userId: 'u1',
      title: 'Meeting Alpha',
      startTime: '2026-10-31T10:00:00',
      endTime: '2026-10-31T11:30:00',
      status: 'scheduled',
    },
    {
      id: 'e2',
      userId: 'u1',
      title: 'Meeting Beta Conflict',
      startTime: '2026-10-31T11:00:00',
      endTime: '2026-10-31T12:00:00',
      status: 'scheduled',
    },
    {
      id: 'e3',
      userId: 'u1',
      title: 'Later Meeting No Conflict',
      startTime: '2026-10-31T14:00:00',
      endTime: '2026-10-31T15:00:00',
      status: 'scheduled',
    },
  ];

  const conflicts = detectScheduleConflicts(events);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].eventA.title, 'Meeting Alpha');
  assert.equal(conflicts[0].eventB.title, 'Meeting Beta Conflict');
  assert.equal(conflicts[0].overlapMinutes, 30);
});

test('generateMonthGrid returns 35 or 42 cells and aligns days with events correctly', () => {
  const events: AgendaEvent[] = [
    {
      id: 'e1',
      userId: 'u1',
      title: 'Halloween Meeting',
      startTime: '2026-10-31T20:00:00',
      endTime: '2026-10-31T22:00:00',
    },
  ];
  const tasks: AgendaTask[] = [
    {
      id: 't1',
      userId: 'u1',
      title: 'Costume prep',
      completed: false,
      dueDate: '2026-10-31',
    },
  ];

  // Month 9 is October (0-indexed)
  const grid = generateMonthGrid(2026, 9, '2026-10-31', events, tasks);

  // Must be multiple of 7 (35 or 42)
  assert.ok(grid.length === 35 || grid.length === 42);
  assert.equal(grid.length % 7, 0);

  // Oct 31, 2026 cell check
  const oct31 = grid.find((c) => c.dateStr === '2026-10-31');
  assert.ok(oct31);
  assert.equal(oct31?.isCurrentMonth, true);
  assert.equal(oct31?.isSelected, true);
  assert.equal(oct31?.events.length, 1);
  assert.equal(oct31?.events[0].title, 'Halloween Meeting');
  assert.equal(oct31?.tasks.length, 1);
});
