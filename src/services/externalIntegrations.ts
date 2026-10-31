import {
  AgendaEvent,
  AgendaTask,
  QuickMemo,
  buildZapierPayload,
  buildObsidianUri,
  formatObsidianDailyNote,
  formatNotionTaskPayload,
} from '../utils/agendaLogic';

export interface ZapierDispatchResult {
  success: boolean;
  statusCode?: number;
  message: string;
  timestamp: string;
}

/**
 * Dispatch an event to user's Zapier Webhook URL
 */
export async function dispatchZapierWebhook(
  webhookUrl: string,
  triggerType: 'task.completed' | 'event.created' | 'daily.summary',
  data: Record<string, unknown>
): Promise<ZapierDispatchResult> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL webhook di Zapier non configurato o non valido.',
      timestamp: new Date().toISOString(),
    };
  }

  const payload = buildZapierPayload(triggerType, data);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Standard for Zapier catch hooks from client
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      statusCode: res.status || 200,
      message: `Webhook inviato con successo a Zapier (${triggerType})`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Zapier Webhook Error:', err);
    return {
      success: false,
      message: `Errore durante l'invio a Zapier: ${err.message || 'Network error'}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generate Obsidian Daily Note export data
 */
export function generateObsidianExport(
  vaultName: string,
  dateStr: string,
  events: AgendaEvent[],
  tasks: AgendaTask[],
  memos: QuickMemo[]
) {
  const content = formatObsidianDailyNote(dateStr, events, tasks, memos);
  const filename = `${dateStr}.md`;
  const uri = buildObsidianUri(vaultName || 'Personal', dateStr, content);

  return {
    content,
    filename,
    uri,
  };
}

/**
 * Trigger browser file download for Obsidian markdown note
 */
export function downloadMarkdownFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Notion task items
 */
export function generateNotionExport(tasks: AgendaTask[], databaseId: string) {
  return tasks.map((t) => formatNotionTaskPayload(t, databaseId || 'default-database'));
}
