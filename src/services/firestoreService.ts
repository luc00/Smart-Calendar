import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AgendaEvent, AgendaTask, QuickMemo } from '../utils/agendaLogic';

export interface UserPreferences {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  defaultMeetEnabled?: boolean;
  obsidianVaultName?: string;
  zapierWebhookUrl?: string;
  notionDatabaseId?: string;
}

export interface SyncLogItem {
  id: string;
  userId: string;
  service: 'zapier' | 'obsidian' | 'notion' | 'google_meet' | 'google_calendar' | 'google_tasks';
  action: string;
  status: 'success' | 'failed' | 'pending';
  payloadSummary?: string;
  timestamp: string;
}

// ----------------- USER PROFILE -----------------
export async function saveUserProfile(profile: UserPreferences): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    await setDoc(doc(db, 'users', profile.userId), {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- EVENTS -----------------
export async function saveAgendaEvent(userId: string, event: AgendaEvent): Promise<void> {
  const path = `users/${userId}/events/${event.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'events', event.id), {
      ...event,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAgendaEvent(userId: string, eventId: string): Promise<void> {
  const path = `users/${userId}/events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToEvents(
  userId: string,
  onUpdate: (events: AgendaEvent[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/events`;
  return onSnapshot(
    collection(db, 'users', userId, 'events'),
    (snapshot) => {
      const items: AgendaEvent[] = [];
      snapshot.forEach((d) => items.push(d.data() as AgendaEvent));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError?.(error);
    }
  );
}

// ----------------- TASKS -----------------
export async function saveAgendaTask(userId: string, task: AgendaTask): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), {
      ...task,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleAgendaTaskCompleted(userId: string, taskId: string, completed: boolean): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
      completed,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAgendaTask(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToTasks(
  userId: string,
  onUpdate: (tasks: AgendaTask[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/tasks`;
  return onSnapshot(
    collection(db, 'users', userId, 'tasks'),
    (snapshot) => {
      const items: AgendaTask[] = [];
      snapshot.forEach((d) => items.push(d.data() as AgendaTask));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError?.(error);
    }
  );
}

// ----------------- MEMOS -----------------
export async function saveQuickMemo(userId: string, memo: QuickMemo): Promise<void> {
  const path = `users/${userId}/memos/${memo.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'memos', memo.id), {
      ...memo,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuickMemo(userId: string, memoId: string): Promise<void> {
  const path = `users/${userId}/memos/${memoId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'memos', memoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToMemos(
  userId: string,
  onUpdate: (memos: QuickMemo[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/memos`;
  return onSnapshot(
    collection(db, 'users', userId, 'memos'),
    (snapshot) => {
      const items: QuickMemo[] = [];
      snapshot.forEach((d) => items.push(d.data() as QuickMemo));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      onError?.(error);
    }
  );
}

// ----------------- SYNC LOGS -----------------
export async function logSyncActivity(userId: string, log: Omit<SyncLogItem, 'id' | 'userId'>): Promise<void> {
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const path = `users/${userId}/syncLogs/${id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'syncLogs', id), {
      ...log,
      id,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
