import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuth,
  googleSignIn,
  logoutUser,
  getAccessToken,
  testConnection,
} from './services/firebase';
import {
  saveAgendaEvent,
  deleteAgendaEvent,
  subscribeToEvents,
  saveAgendaTask,
  toggleAgendaTaskCompleted,
  deleteAgendaTask,
  subscribeToTasks,
  saveQuickMemo,
  deleteQuickMemo,
  subscribeToMemos,
  logSyncActivity,
  saveUserProfile,
  SyncLogItem,
} from './services/firestoreService';
import {
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  fetchGoogleTasks,
  createGoogleTask,
  createGoogleMeetSpace,
} from './services/googleWorkspace';
import { dispatchZapierWebhook } from './services/externalIntegrations';
import {
  AgendaEvent,
  AgendaTask,
  QuickMemo,
  generateMeetUrl,
  detectScheduleConflicts,
} from './utils/agendaLogic';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { AgendaTimelineView } from './components/AgendaTimelineView';
import { TasksView } from './components/TasksView';
import { MemosView } from './components/MemosView';
import { AiAssistantView } from './components/AiAssistantView';
import { SyncHubView } from './components/SyncHubView';
import { SmartAddModal } from './components/SmartAddModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ConfirmDialog } from './components/ConfirmDialog';

// Initial demo seed data for immediate interactivity and testing
const INITIAL_DEMO_EVENTS: AgendaEvent[] = [
  {
    id: 'demo-event-1',
    userId: 'demo-user',
    title: 'Allineamento Strategico Settimanale',
    description: 'Revisione priorità operative e obiettivi Q4 con il team.',
    startTime: `${new Date().toISOString().split('T')[0]}T09:30:00`,
    endTime: `${new Date().toISOString().split('T')[0]}T10:30:00`,
    category: 'meeting',
    meetLink: generateMeetUrl('aur-meet-prd'),
    status: 'scheduled',
    isGoogleCalendar: false,
  },
  {
    id: 'demo-event-2',
    userId: 'demo-user',
    title: 'Deep Focus: Architettura Automazioni',
    description: 'Sviluppo webhook di sincronizzazione con Zapier e Notion.',
    startTime: `${new Date().toISOString().split('T')[0]}T11:00:00`,
    endTime: `${new Date().toISOString().split('T')[0]}T13:00:00`,
    category: 'focus',
    status: 'scheduled',
  },
  {
    id: 'demo-event-3',
    userId: 'demo-user',
    title: 'Call Revisione Note con Obsidian',
    description: 'Sincronizzazione della knowledge base con vault personale.',
    startTime: `${new Date().toISOString().split('T')[0]}T15:00:00`,
    endTime: `${new Date().toISOString().split('T')[0]}T15:45:00`,
    category: 'meeting',
    meetLink: generateMeetUrl('obs-sync-call'),
    status: 'scheduled',
  },
];

const INITIAL_DEMO_TASKS: AgendaTask[] = [
  {
    id: 'demo-task-1',
    userId: 'demo-user',
    title: 'Configurare Webhook Zapier per sincronizzazione automatica',
    notes: 'Inviare i task completati su Notion e Slack',
    priority: 'urgent',
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    category: 'Automazioni',
  },
  {
    id: 'demo-task-2',
    userId: 'demo-user',
    title: 'Esportare Daily Note in formato Markdown su Obsidian',
    notes: 'Verificare che i tag e le priorità siano corretti nel frontmatter',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    category: 'Obsidian',
  },
  {
    id: 'demo-task-3',
    userId: 'demo-user',
    title: 'Testare creazione rapida stanza Google Meet',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    completed: true,
    category: 'Meeting',
  },
];

const INITIAL_DEMO_MEMOS: QuickMemo[] = [
  {
    id: 'demo-memo-1',
    userId: 'demo-user',
    title: 'Idea Automazione Notion',
    content: 'Mappare lo status dell’agenda con la board Kanban di Notion tramite webhook Zapier.',
    pinned: true,
    color: 'bg-amber-50/50 border-amber-200/60',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-memo-2',
    userId: 'demo-user',
    title: 'Template Obsidian',
    content: 'Aggiungere tag #deep-work alle sessioni di oltre 90 minuti per tracciare le ore di concentrazione.',
    pinned: false,
    color: 'bg-white border-neutral-200',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isWorkspaceConnected, setIsWorkspaceConnected] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Core navigation state
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data states
  const [events, setEvents] = useState<AgendaEvent[]>(INITIAL_DEMO_EVENTS);
  const [tasks, setTasks] = useState<AgendaTask[]>(INITIAL_DEMO_TASKS);
  const [memos, setMemos] = useState<QuickMemo[]>(INITIAL_DEMO_MEMOS);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  // User configuration preferences
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');
  const [obsidianVaultName, setObsidianVaultName] = useState('Personal');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');

  // Modals & Confirmation
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Deletion confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Syncing loaders
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check connection on boot
  useEffect(() => {
    testConnection().then((connected) => setIsFirebaseConnected(connected));
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsWorkspaceConnected(Boolean(token));
        if (user) {
          showToast(`Benvenuto in Aura, ${user.displayName || user.email}!`);
        }
      },
      () => {
        setCurrentUser(null);
        setIsWorkspaceConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];

    // Listen to Events
    unsubs.push(
      subscribeToEvents(currentUser.uid, (remoteEvents) => {
        if (remoteEvents.length > 0) {
          setEvents(remoteEvents);
        }
      })
    );

    // Listen to Tasks
    unsubs.push(
      subscribeToTasks(currentUser.uid, (remoteTasks) => {
        if (remoteTasks.length > 0) {
          setTasks(remoteTasks);
        }
      })
    );

    // Listen to Memos
    unsubs.push(
      subscribeToMemos(currentUser.uid, (remoteMemos) => {
        if (remoteMemos.length > 0) {
          setMemos(remoteMemos);
        }
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setIsWorkspaceConnected(true);
        setIsFirebaseConnected(true);
        await saveUserProfile({
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          zapierWebhookUrl,
          obsidianVaultName,
          notionDatabaseId,
        });
        showToast('Accesso Google e sincronizzazione completati.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('Errore durante l’accesso Google.');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsWorkspaceConnected(false);
    showToast('Disconnessione effettuata.');
  };

  // Sync log helper
  const handleAddSyncLog = async (log: Omit<SyncLogItem, 'id' | 'userId'>) => {
    const item: SyncLogItem = {
      ...log,
      id: `log_${Date.now()}`,
      userId: currentUser?.uid || 'demo-user',
    };
    setSyncLogs((prev) => [item, ...prev.slice(0, 49)]);

    if (currentUser) {
      await logSyncActivity(currentUser.uid, log);
    }
  };

  // Event Handlers
  const handleAddEvent = async (eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    category: 'work' | 'meeting' | 'focus' | 'personal' | 'routine';
    meetLink?: string;
    syncToGoogleCalendar: boolean;
  }) => {
    const newId = `event_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newEvent: AgendaEvent = {
      id: newId,
      userId: currentUser?.uid || 'demo-user',
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      category: eventData.category,
      meetLink: eventData.meetLink,
      status: 'scheduled',
      isGoogleCalendar: eventData.syncToGoogleCalendar,
    };

    // Google Calendar Sync if requested and authenticated
    if (eventData.syncToGoogleCalendar && isWorkspaceConnected) {
      try {
        await createGoogleCalendarEvent({
          summary: eventData.title,
          description: eventData.description,
          start: { dateTime: new Date(eventData.startTime).toISOString() },
          end: { dateTime: new Date(eventData.endTime).toISOString() },
          createMeetConference: Boolean(eventData.meetLink),
        });
        await handleAddSyncLog({
          service: 'google_calendar',
          action: 'Evento sincronizzato su Google Calendar',
          status: 'success',
          payloadSummary: eventData.title,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Google Calendar event error:', err);
      }
    }

    // Save to Firestore if authenticated
    if (currentUser) {
      await saveAgendaEvent(currentUser.uid, newEvent);
    }

    setEvents((prev) => [...prev, newEvent]);

    // Dispatch Zapier trigger if configured
    if (zapierWebhookUrl) {
      dispatchZapierWebhook(zapierWebhookUrl, 'event.created', {
        title: newEvent.title,
        startTime: newEvent.startTime,
        meetLink: newEvent.meetLink,
      }).then((res) => {
        handleAddSyncLog({
          service: 'zapier',
          action: 'Trigger automatico event.created',
          status: res.success ? 'success' : 'failed',
          payloadSummary: res.message,
          timestamp: new Date().toISOString(),
        });
      });
    }

    showToast(`Evento "${newEvent.title}" creato con successo.`);
  };

  const handleDeleteEventClick = (event: AgendaEvent) => {
    // Google Workspace skill requirement: user confirmation before destructive operations!
    setConfirmDialog({
      isOpen: true,
      title: 'Elimina evento dall’agenda',
      message: `Sei sicuro di voler eliminare definitivamente "${event.title}" dalle ${event.startTime.split('T')[1]?.slice(0, 5)}? Questa operazione non può essere annullata.`,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, isOpen: false }));
        if (currentUser) {
          await deleteAgendaEvent(currentUser.uid, event.id);
        }
        if (event.isGoogleCalendar && isWorkspaceConnected) {
          try {
            await deleteGoogleCalendarEvent(event.id);
          } catch (e) {
            console.warn(e);
          }
        }
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        showToast(`Evento "${event.title}" eliminato.`);
      },
    });
  };

  // Tasks Handlers
  const handleAddTask = async (taskData: {
    title: string;
    notes?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    dueDate?: string;
    category: string;
    syncToGoogleTasks: boolean;
  }) => {
    const newId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newTask: AgendaTask = {
      id: newId,
      userId: currentUser?.uid || 'demo-user',
      title: taskData.title,
      notes: taskData.notes,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      completed: false,
      category: taskData.category,
    };

    if (taskData.syncToGoogleTasks && isWorkspaceConnected) {
      try {
        await createGoogleTask({
          title: taskData.title,
          notes: taskData.notes,
          due: taskData.dueDate,
        });
        await handleAddSyncLog({
          service: 'google_tasks',
          action: 'Task creato in Google Tasks',
          status: 'success',
          payloadSummary: taskData.title,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Google Tasks error:', err);
      }
    }

    if (currentUser) {
      await saveAgendaTask(currentUser.uid, newTask);
    }

    setTasks((prev) => [newTask, ...prev]);
    showToast(`Attività "${newTask.title}" aggiunta.`);
  };

  const handleToggleTask = async (task: AgendaTask) => {
    const newCompleted = !task.completed;
    if (currentUser) {
      await toggleAgendaTaskCompleted(currentUser.uid, task.id, newCompleted);
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t))
    );

    // If task was completed, trigger Zapier automation!
    if (newCompleted && zapierWebhookUrl) {
      dispatchZapierWebhook(zapierWebhookUrl, 'task.completed', {
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        category: task.category,
      }).then((res) => {
        handleAddSyncLog({
          service: 'zapier',
          action: 'Trigger task.completed inviato a Zapier',
          status: res.success ? 'success' : 'failed',
          payloadSummary: res.message,
          timestamp: new Date().toISOString(),
        });
      });
    }

    showToast(newCompleted ? `✓ Completato: ${task.title}` : `Ripristinato: ${task.title}`);
  };

  const handleDeleteTaskClick = (task: AgendaTask) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Elimina attività',
      message: `Confermi l'eliminazione del task "${task.title}"?`,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, isOpen: false }));
        if (currentUser) {
          await deleteAgendaTask(currentUser.uid, task.id);
        }
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        showToast('Attività eliminata.');
      },
    });
  };

  // Quick Memos Handlers
  const handleAddMemo = async (memoData: {
    title?: string;
    content: string;
    color?: string;
    pinned?: boolean;
  }) => {
    const newId = `memo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newMemo: QuickMemo = {
      id: newId,
      userId: currentUser?.uid || 'demo-user',
      title: memoData.title,
      content: memoData.content,
      color: memoData.color,
      pinned: memoData.pinned,
      createdAt: new Date().toISOString(),
    };

    if (currentUser) {
      await saveQuickMemo(currentUser.uid, newMemo);
    }

    setMemos((prev) => [newMemo, ...prev]);
    showToast('Nota salvata nel blocco appunti.');
  };

  const handleToggleMemoPin = async (memo: QuickMemo) => {
    const updated = { ...memo, pinned: !memo.pinned };
    if (currentUser) {
      await saveQuickMemo(currentUser.uid, updated);
    }
    setMemos((prev) => prev.map((m) => (m.id === memo.id ? updated : m)));
  };

  const handleDeleteMemoClick = (memo: QuickMemo) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Elimina nota',
      message: `Vuoi rimuovere la nota "${memo.title || memo.content.slice(0, 30)}"?`,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, isOpen: false }));
        if (currentUser) {
          await deleteQuickMemo(currentUser.uid, memo.id);
        }
        setMemos((prev) => prev.filter((m) => m.id !== memo.id));
        showToast('Nota eliminata.');
      },
    });
  };

  // Google Workspace Sync Handlers
  const handleSyncGoogleCalendar = async () => {
    if (!isWorkspaceConnected) {
      handleLogin();
      return;
    }
    setIsSyncingCalendar(true);
    try {
      const gEvents = await fetchGoogleCalendarEvents();
      if (gEvents && gEvents.length > 0) {
        const mapped: AgendaEvent[] = gEvents.map((ge) => ({
          id: `gcal_${ge.id}`,
          userId: currentUser?.uid || 'demo-user',
          title: ge.summary || 'Evento Google Calendar',
          description: ge.description || '',
          startTime: ge.start?.dateTime || ge.start?.date || new Date().toISOString(),
          endTime: ge.end?.dateTime || ge.end?.date || new Date().toISOString(),
          category: 'meeting',
          meetLink: ge.hangoutLink || ge.conferenceData?.entryPoints?.[0]?.uri,
          status: 'scheduled',
          isGoogleCalendar: true,
        }));

        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newOnes = mapped.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });

        await handleAddSyncLog({
          service: 'google_calendar',
          action: 'Sincronizzazione completata',
          status: 'success',
          payloadSummary: `${mapped.length} eventi importati`,
          timestamp: new Date().toISOString(),
        });

        showToast(`${mapped.length} eventi sincronizzati da Google Calendar!`);
      } else {
        showToast('Nessun nuovo evento trovato in Google Calendar.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Errore durante la sincronizzazione con Google Calendar.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleSyncGoogleTasks = async () => {
    if (!isWorkspaceConnected) {
      handleLogin();
      return;
    }
    setIsSyncingTasks(true);
    try {
      const gTasks = await fetchGoogleTasks();
      if (gTasks && gTasks.length > 0) {
        const mapped: AgendaTask[] = gTasks.map((gt) => ({
          id: `gtask_${gt.id}`,
          userId: currentUser?.uid || 'demo-user',
          title: gt.title || 'Attività Google Tasks',
          notes: gt.notes,
          completed: gt.status === 'completed',
          priority: 'medium',
          dueDate: gt.due ? gt.due.split('T')[0] : undefined,
          category: 'Google Tasks',
        }));

        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newOnes = mapped.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });

        await handleAddSyncLog({
          service: 'google_tasks',
          action: 'Sincronizzazione completata',
          status: 'success',
          payloadSummary: `${mapped.length} task importati`,
          timestamp: new Date().toISOString(),
        });

        showToast(`${mapped.length} task sincronizzati da Google Tasks!`);
      } else {
        showToast('Nessun task trovato in Google Tasks.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Errore durante la sincronizzazione con Google Tasks.');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Preference updates
  const handleUpdateZapierWebhook = async (url: string) => {
    setZapierWebhookUrl(url);
    if (currentUser) {
      await saveUserProfile({
        userId: currentUser.uid,
        email: currentUser.email || '',
        zapierWebhookUrl: url,
        obsidianVaultName,
        notionDatabaseId,
      });
    }
    showToast('URL Webhook Zapier salvato.');
  };

  const handleUpdateObsidianVault = async (vault: string) => {
    setObsidianVaultName(vault);
    if (currentUser) {
      await saveUserProfile({
        userId: currentUser.uid,
        email: currentUser.email || '',
        zapierWebhookUrl,
        obsidianVaultName: vault,
        notionDatabaseId,
      });
    }
    showToast(`Vault Obsidian impostato su "${vault}".`);
  };

  const handleUpdateNotionDatabase = async (id: string) => {
    setNotionDatabaseId(id);
    if (currentUser) {
      await saveUserProfile({
        userId: currentUser.uid,
        email: currentUser.email || '',
        zapierWebhookUrl,
        obsidianVaultName,
        notionDatabaseId: id,
      });
    }
    showToast('ID Database Notion salvato.');
  };

  // Global keyboard shortcuts (1-5 to switch tabs, Cmd+K for command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const conflicts = detectScheduleConflicts(events);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenSmartAdd={() => setIsSmartAddOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isWorkspaceConnected={isWorkspaceConnected}
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        taskCount={tasks.filter((t) => !t.completed).length}
        memoCount={memos.length}
        hasConflicts={conflicts.length > 0}
      />

      {/* Body View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'agenda' && (
          <AgendaTimelineView
            events={events}
            tasks={tasks}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            onOpenAddModal={() => setIsSmartAddOpen(true)}
            onDeleteEvent={handleDeleteEventClick}
            onSyncGoogleCalendar={handleSyncGoogleCalendar}
            isSyncingCalendar={isSyncingCalendar}
            isWorkspaceConnected={isWorkspaceConnected}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTaskClick}
            onAddTask={handleAddTask}
            onSyncGoogleTasks={handleSyncGoogleTasks}
            isSyncingTasks={isSyncingTasks}
            isWorkspaceConnected={isWorkspaceConnected}
            zapierConfigured={Boolean(zapierWebhookUrl)}
          />
        )}

        {activeTab === 'memos' && (
          <MemosView
            memos={memos}
            onAddMemo={handleAddMemo}
            onDeleteMemo={handleDeleteMemoClick}
            onTogglePin={handleToggleMemoPin}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistantView
            events={events}
            tasks={tasks}
            onAddSubtaskToAgenda={async (task) => {
              await handleAddTask({
                title: task.title,
                category: task.category,
                priority: task.priority,
                dueDate: selectedDate,
                syncToGoogleTasks: isWorkspaceConnected,
              });
            }}
          />
        )}

        {activeTab === 'sync' && (
          <SyncHubView
            events={events}
            tasks={tasks}
            memos={memos}
            selectedDate={selectedDate}
            zapierWebhookUrl={zapierWebhookUrl}
            onUpdateZapierWebhook={handleUpdateZapierWebhook}
            obsidianVaultName={obsidianVaultName}
            onUpdateObsidianVault={handleUpdateObsidianVault}
            notionDatabaseId={notionDatabaseId}
            onUpdateNotionDatabase={handleUpdateNotionDatabase}
            syncLogs={syncLogs}
            onAddSyncLog={handleAddSyncLog}
          />
        )}
      </main>

      {/* Toast popup */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-normal px-3.5 py-2 rounded-lg shadow-xl border border-neutral-800 animate-in fade-in duration-150 flex items-center gap-2 font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <SmartAddModal
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
        onAddEvent={handleAddEvent}
        onAddTask={handleAddTask}
        isWorkspaceConnected={isWorkspaceConnected}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onOpenSmartAdd={() => setIsSmartAddOpen(true)}
        onGenerateInstantMeet={async () => {
          const url = await createGoogleMeetSpace();
          navigator.clipboard.writeText(url);
          showToast(`Stanza Google Meet creata e copiata: ${url}`);
        }}
        onExportObsidian={() => {
          setActiveTab('sync');
          showToast('Aperta sezione Obsidian');
        }}
        onTriggerZapierTest={() => {
          setActiveTab('sync');
        }}
        onRunAiOptimization={() => {
          setActiveTab('ai');
        }}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Elimina"
        isDestructive={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
