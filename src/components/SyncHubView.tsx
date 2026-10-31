import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Send,
} from 'lucide-react';
import { AgendaEvent, AgendaTask, QuickMemo } from '../utils/agendaLogic';
import {
  ZapierLogo,
  ObsidianLogo,
  NotionLogo,
  GoogleMeetLogo,
} from './BrandIcons';
import {
  dispatchZapierWebhook,
  generateObsidianExport,
  downloadMarkdownFile,
  generateNotionExport,
  ZapierDispatchResult,
} from '../services/externalIntegrations';
import { createGoogleMeetSpace } from '../services/googleWorkspace';
import { SyncLogItem } from '../services/firestoreService';

interface SyncHubViewProps {
  events: AgendaEvent[];
  tasks: AgendaTask[];
  memos: QuickMemo[];
  selectedDate: string;
  zapierWebhookUrl: string;
  onUpdateZapierWebhook: (url: string) => Promise<void>;
  obsidianVaultName: string;
  onUpdateObsidianVault: (name: string) => Promise<void>;
  notionDatabaseId: string;
  onUpdateNotionDatabase: (id: string) => Promise<void>;
  syncLogs: SyncLogItem[];
  onAddSyncLog: (log: Omit<SyncLogItem, 'id' | 'userId'>) => Promise<void>;
}

export const SyncHubView: React.FC<SyncHubViewProps> = ({
  events,
  tasks,
  memos,
  selectedDate,
  zapierWebhookUrl,
  onUpdateZapierWebhook,
  obsidianVaultName,
  onUpdateObsidianVault,
  notionDatabaseId,
  onUpdateNotionDatabase,
  syncLogs,
  onAddSyncLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'zapier' | 'obsidian' | 'notion' | 'meet' | 'logs'>('zapier');

  // Zapier state
  const [zapierUrlInput, setZapierUrlInput] = useState(zapierWebhookUrl || '');
  const [zapierStatus, setZapierStatus] = useState<ZapierDispatchResult | null>(null);
  const [isTestingZapier, setIsTestingZapier] = useState(false);
  const [isSavingZapier, setIsSavingZapier] = useState(false);

  // Obsidian state
  const [vaultInput, setVaultInput] = useState(obsidianVaultName || 'Personal');
  const [copiedObsidian, setCopiedObsidian] = useState(false);

  // Notion state
  const [notionDbInput, setNotionDbInput] = useState(notionDatabaseId || '');
  const [copiedNotion, setCopiedNotion] = useState(false);

  // Meet state
  const [generatedMeet, setGeneratedMeet] = useState<string | null>(null);
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);

  // Generate Obsidian preview
  const obsidianExport = generateObsidianExport(
    vaultInput,
    selectedDate,
    events,
    tasks,
    memos
  );

  // Notion payload preview
  const notionExport = generateNotionExport(tasks, notionDbInput);

  const handleSaveZapierUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingZapier(true);
    try {
      await onUpdateZapierWebhook(zapierUrlInput.trim());
      await onAddSyncLog({
        service: 'zapier',
        action: 'Webhook URL aggiornato',
        status: 'success',
        payloadSummary: zapierUrlInput.slice(0, 35),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSavingZapier(false);
    }
  };

  const handleTestZapier = async () => {
    setIsTestingZapier(true);
    setZapierStatus(null);
    try {
      const result = await dispatchZapierWebhook(zapierUrlInput, 'daily.summary', {
        test: true,
        date: selectedDate,
        totalEvents: events.length,
        totalTasks: tasks.length,
        sampleEvent: events[0]?.title || 'Evento di test Aura',
      });
      setZapierStatus(result);
      await onAddSyncLog({
        service: 'zapier',
        action: 'Test webhook inviato',
        status: result.success ? 'success' : 'failed',
        payloadSummary: result.message,
        timestamp: result.timestamp,
      });
    } finally {
      setIsTestingZapier(false);
    }
  };

  const handleSaveObsidianVault = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateObsidianVault(vaultInput.trim());
  };

  const handleCopyObsidianMarkdown = () => {
    navigator.clipboard.writeText(obsidianExport.content);
    setCopiedObsidian(true);
    setTimeout(() => setCopiedObsidian(false), 2000);
  };

  const handleDownloadObsidian = () => {
    downloadMarkdownFile(obsidianExport.filename, obsidianExport.content);
    onAddSyncLog({
      service: 'obsidian',
      action: 'File Daily Note scaricato',
      status: 'success',
      payloadSummary: obsidianExport.filename,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCopyNotionJson = () => {
    navigator.clipboard.writeText(JSON.stringify(notionExport, null, 2));
    setCopiedNotion(true);
    setTimeout(() => setCopiedNotion(false), 2000);
  };

  const handleGenerateInstantMeet = async () => {
    setIsGeneratingMeet(true);
    try {
      const url = await createGoogleMeetSpace();
      setGeneratedMeet(url);
      await onAddSyncLog({
        service: 'google_meet',
        action: 'Stanza Google Meet creata',
        status: 'success',
        payloadSummary: url,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsGeneratingMeet(false);
    }
  };

  const handleCopyMeet = () => {
    if (!generatedMeet) return;
    navigator.clipboard.writeText(generatedMeet);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight">
            Integrazioni & Connessioni Esterne
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configurazione di Zapier, Obsidian Vault, Notion e Google Meet.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('zapier')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'zapier' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ZapierLogo className="w-3.5 h-3.5" />
            <span>Zapier</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('obsidian')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'obsidian' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ObsidianLogo className="w-3.5 h-3.5" />
            <span>Obsidian</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('notion')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'notion' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <NotionLogo className="w-3.5 h-3.5" />
            <span>Notion</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('meet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'meet' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <GoogleMeetLogo className="w-3.5 h-3.5" />
            <span>Google Meet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeSubTab === 'logs' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Log ({syncLogs.length})
          </button>
        </div>
      </div>

      {/* ---------------- ZAPIER ---------------- */}
      {activeSubTab === 'zapier' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <ZapierLogo className="w-5 h-5 shadow-2xs rounded-md" />
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">Webhook Zapier</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Invia gli eventi e le attività completate a qualsiasi Zap.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveZapierUrl} className="space-y-2">
                <label className="block text-[11px] font-medium text-neutral-600">
                  Catch hook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={zapierUrlInput}
                    onChange={(e) => setZapierUrlInput(e.target.value)}
                    className="flex-1 text-xs font-mono p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={isSavingZapier}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    {isSavingZapier ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Invia payload di prova</span>
                <button
                  type="button"
                  onClick={handleTestZapier}
                  disabled={isTestingZapier || !zapierUrlInput.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isTestingZapier ? 'Invio...' : 'Invia test'}</span>
                </button>
              </div>

              {zapierStatus && (
                <div className="p-2.5 rounded-lg text-xs bg-neutral-50 border border-neutral-200 text-neutral-700">
                  <p className="font-medium">{zapierStatus.message}</p>
                </div>
              )}
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-2 text-xs">
              <h4 className="font-semibold text-neutral-900">Trigger attivi</h4>
              <div className="divide-y divide-neutral-100">
                <div className="py-2 flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-neutral-900">task.completed</span>
                    <p className="text-neutral-500 text-[11px]">Scatta al completamento di una to-do</p>
                  </div>
                  <span className="text-neutral-400 text-[11px]">Automatico</span>
                </div>
                <div className="py-2 flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-neutral-900">event.created</span>
                    <p className="text-neutral-500 text-[11px]">Scatta alla creazione di un nuovo evento</p>
                  </div>
                  <span className="text-neutral-400 text-[11px]">Automatico</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 text-neutral-200 p-4 rounded-xl space-y-2 font-mono text-xs">
            <p className="text-neutral-400 text-[11px] font-sans font-medium uppercase tracking-wider">
              Schema payload
            </p>
            <pre className="overflow-x-auto text-[11px] text-neutral-300 leading-relaxed max-h-72">
              {JSON.stringify(
                {
                  event: 'task.completed',
                  timestamp: new Date().toISOString(),
                  source: 'Aura Agenda',
                  data: {
                    taskId: 'sample-123',
                    title: tasks[0]?.title || 'Verifica trimestrale',
                    priority: 'high',
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* ---------------- OBSIDIAN ---------------- */}
      {activeSubTab === 'obsidian' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <ObsidianLogo className="w-5 h-5 shadow-2xs rounded-md" />
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">Obsidian Vault</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Generazione note giornaliere Markdown con frontmatter e checklist compatibili con Obsidian.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveObsidianVault} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome vault (es: Personal)..."
                  value={vaultInput}
                  onChange={(e) => setVaultInput(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Salva
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                <a
                  href={obsidianExport.uri}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  <ObsidianLogo className="w-3.5 h-3.5" />
                  <span>Apri in app Obsidian</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>

                <button
                  type="button"
                  onClick={handleDownloadObsidian}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica .md</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyObsidianMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  {copiedObsidian ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-neutral-700" />
                      <span>Copiato</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <ObsidianLogo className="w-3 h-3" />
                <span>Anteprima Daily Note ({obsidianExport.filename})</span>
              </span>
              <pre className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-800 font-mono overflow-x-auto leading-relaxed max-h-80 whitespace-pre-wrap">
                {obsidianExport.content}
              </pre>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2 text-xs text-neutral-600 leading-relaxed">
            <div className="flex items-center gap-1.5">
              <ObsidianLogo className="w-4 h-4" />
              <h4 className="font-semibold text-neutral-900">Specifiche Obsidian</h4>
            </div>
            <p>
              La nota include metadati YAML frontmatter per Dataview, timeline strutturata delle ore e to-do in formato <code>- [ ]</code> con tag di priorità.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- NOTION ---------------- */}
      {activeSubTab === 'notion' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2">
                <NotionLogo className="w-5 h-5 shadow-2xs rounded-md" />
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900">Notion Database</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Esportazione e mapping per database e board Kanban di Notion.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-neutral-600">
                  ID Database (opzionale)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ID Notion a 32 caratteri..."
                    value={notionDbInput}
                    onChange={(e) => setNotionDbInput(e.target.value)}
                    className="flex-1 text-xs font-mono p-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateNotionDatabase(notionDbInput.trim())}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    Salva
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleCopyNotionJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  <NotionLogo className="w-3.5 h-3.5" />
                  {copiedNotion ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-neutral-200" />
                      <span>Copiato</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia payload Notion</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.notion.so"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg transition"
                >
                  <NotionLogo className="w-3.5 h-3.5" />
                  <span>Apri Notion</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <NotionLogo className="w-3 h-3" />
                <span>Proprietà mappate</span>
              </span>
              <pre className="p-3 bg-neutral-50 rounded-lg text-xs text-neutral-800 font-mono overflow-x-auto leading-relaxed max-h-72">
                {JSON.stringify(notionExport.slice(0, 2), null, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 text-xs text-neutral-600 space-y-2">
            <div className="flex items-center gap-1.5">
              <NotionLogo className="w-4 h-4" />
              <h4 className="font-semibold text-neutral-900">Mappatura Proprietà Notion</h4>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <p><strong>Name</strong>: Titolo dell&apos;attività</p>
              <p><strong>Status</strong>: Checkbox completato</p>
              <p><strong>Priority</strong>: Select (urgent, high, medium, low)</p>
              <p><strong>DueDate</strong>: Data scadenza</p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MEET ---------------- */}
      {activeSubTab === 'meet' && (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center gap-2">
            <GoogleMeetLogo className="w-5 h-5 shadow-2xs rounded-md" />
            <div>
              <h3 className="text-xs font-semibold text-neutral-900">Google Meet</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generazione diretta di stanze di videoconferenza con link univoci.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-600">Nuovo link immediato</span>
            <button
              type="button"
              onClick={handleGenerateInstantMeet}
              disabled={isGeneratingMeet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <GoogleMeetLogo className="w-3.5 h-3.5" />
              <span>{isGeneratingMeet ? 'Creazione...' : 'Genera link Google Meet'}</span>
            </button>
          </div>

          {generatedMeet && (
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-neutral-800">
                <div className="flex items-center gap-2 min-w-0">
                  <GoogleMeetLogo className="w-4 h-4 shrink-0" />
                  <span className="truncate">{generatedMeet}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMeet}
                  className="p-1 hover:bg-neutral-200 rounded transition cursor-pointer"
                >
                  {copiedMeet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <a
                href={generatedMeet}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-neutral-900 font-medium hover:underline text-xs"
              >
                <GoogleMeetLogo className="w-3.5 h-3.5" />
                <span>Accedi alla videochiamata Google Meet</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ---------------- AUDIT LOGS ---------------- */}
      {activeSubTab === 'logs' && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="text-xs font-semibold text-neutral-900">Registro attività recenti</h3>
            <span className="text-xs text-neutral-400 font-mono">{syncLogs.length}</span>
          </div>

          {syncLogs.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">Nessuna attività registrata.</p>
          ) : (
            <div className="divide-y divide-neutral-100 text-xs">
              {syncLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-baseline justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 font-medium text-neutral-900 capitalize">
                      {log.service === 'zapier' && <ZapierLogo className="w-3.5 h-3.5" />}
                      {log.service === 'obsidian' && <ObsidianLogo className="w-3.5 h-3.5" />}
                      {log.service === 'notion' && <NotionLogo className="w-3.5 h-3.5" />}
                      {log.service === 'google_meet' && <GoogleMeetLogo className="w-3.5 h-3.5" />}
                      <span>{log.service.replace('_', ' ')}</span>
                    </span>
                    <span className="text-neutral-400 ml-2">· {log.action}</span>
                    {log.payloadSummary && (
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate max-w-md">
                        {log.payloadSummary}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
