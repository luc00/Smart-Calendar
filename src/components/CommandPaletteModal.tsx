import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  CheckSquare,
  Video,
  FileText,
  Zap,
  Share2,
  X,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { TabType } from './Navigation';
import {
  ZapierLogo,
  ObsidianLogo,
  NotionLogo,
  GoogleMeetLogo,
} from './BrandIcons';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabType) => void;
  onOpenSmartAdd: () => void;
  onGenerateInstantMeet: () => void;
  onExportObsidian: () => void;
  onTriggerZapierTest: () => void;
  onRunAiOptimization: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenSmartAdd,
  onGenerateInstantMeet,
  onExportObsidian,
  onTriggerZapierTest,
  onRunAiOptimization,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'smart-add',
      title: 'Acquisizione rapida',
      subtitle: 'Inserisci testo naturale per creare eventi o attività',
      icon: Plus,
      action: () => {
        onClose();
        onOpenSmartAdd();
      },
      category: 'Creazione',
    },
    {
      id: 'instant-meet',
      title: 'Genera stanza Google Meet',
      subtitle: 'Crea subito un link Google Meet e copialo negli appunti',
      icon: GoogleMeetLogo,
      action: () => {
        onClose();
        onGenerateInstantMeet();
      },
      category: 'Workspace',
    },
    {
      id: 'ai-optimize',
      title: 'Pianificazione & Bilanciamento del giorno',
      subtitle: 'Calcola carico orario e individua blocchi di concentrazione',
      icon: SlidersHorizontal,
      action: () => {
        onClose();
        onSelectTab('ai');
        onRunAiOptimization();
      },
      category: 'Pianificazione',
    },
    {
      id: 'export-obsidian',
      title: 'Esporta Daily Note per Obsidian',
      subtitle: 'Genera e scarica file Markdown o apri via obsidian://',
      icon: ObsidianLogo,
      action: () => {
        onClose();
        onSelectTab('sync');
        onExportObsidian();
      },
      category: 'Integrazioni',
    },
    {
      id: 'export-notion',
      title: 'Esporta per database Notion',
      subtitle: 'Genera payload JSON pronto per i database di Notion',
      icon: NotionLogo,
      action: () => {
        onClose();
        onSelectTab('sync');
      },
      category: 'Integrazioni',
    },
    {
      id: 'test-zapier',
      title: 'Invia webhook di test a Zapier',
      subtitle: 'Verifica la ricezione del payload per le automazioni',
      icon: ZapierLogo,
      action: () => {
        onClose();
        onSelectTab('sync');
        onTriggerZapierTest();
      },
      category: 'Integrazioni',
    },
    {
      id: 'nav-agenda',
      title: 'Vai all’Agenda',
      subtitle: 'Timeline giornaliera, orari e statistiche di produttività',
      icon: Calendar,
      action: () => {
        onClose();
        onSelectTab('agenda');
      },
      category: 'Navigazione',
    },
    {
      id: 'nav-calendar-physical',
      title: 'Apri calendario fisico mensile',
      subtitle: 'Vista a griglia con eventi, meeting e date',
      icon: Calendar,
      action: () => {
        onClose();
        onSelectTab('agenda');
      },
      category: 'Navigazione',
    },
    {
      id: 'nav-tasks',
      title: 'Vai alle Attività',
      subtitle: 'Elenco to-do con priorità e scadenze',
      icon: CheckSquare,
      action: () => {
        onClose();
        onSelectTab('tasks');
      },
      category: 'Navigazione',
    },
    {
      id: 'nav-sync',
      title: 'Apri Hub Integrazioni',
      subtitle: 'Configura Zapier, Obsidian, Notion e credenziali Workspace',
      icon: Share2,
      action: () => {
        onClose();
        onSelectTab('sync');
      },
      category: 'Integrazioni',
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-neutral-900/30 backdrop-blur-xs animate-in fade-in duration-100"
    >
      <div className="relative w-full max-w-xl bg-white rounded-xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            id="command-palette-title"
            placeholder="Digita un comando o cerca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs font-normal text-neutral-900 placeholder-neutral-400 focus:outline-none bg-transparent"
          />
          <button
            onClick={onClose}
            aria-label="Chiudi menu comandi"
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of actions */}
        <div className="max-h-80 overflow-y-auto p-1.5 divide-y divide-neutral-50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Nessun comando trovato per &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 group-hover:bg-neutral-200/60 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-neutral-900 group-hover:text-neutral-950 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider ml-2 shrink-0 font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">{item.subtitle}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Seleziona</span>
            <span>↵ Conferma</span>
          </div>
          <span>ESC Chiudi</span>
        </div>
      </div>
    </div>
  );
};

