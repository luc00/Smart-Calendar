import React from 'react';
import { Calendar, CheckSquare, FileText, Sparkles, SlidersHorizontal } from 'lucide-react';

export type TabType = 'agenda' | 'tasks' | 'memos' | 'ai' | 'sync';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  taskCount: number;
  memoCount: number;
  hasConflicts: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  taskCount,
  memoCount,
  hasConflicts,
}) => {
  const tabs = [
    {
      id: 'agenda' as TabType,
      label: 'Agenda',
      count: null,
      alert: hasConflicts,
    },
    {
      id: 'tasks' as TabType,
      label: 'Attività',
      count: taskCount > 0 ? taskCount : null,
      alert: false,
    },
    {
      id: 'memos' as TabType,
      label: 'Note',
      count: memoCount > 0 ? memoCount : null,
      alert: false,
    },
    {
      id: 'ai' as TabType,
      label: 'Pianificazione',
      count: null,
      alert: false,
    },
    {
      id: 'sync' as TabType,
      label: 'Integrazioni',
      count: null,
      alert: false,
    },
  ];

  return (
    <nav
      aria-label="Navigazione principale"
      className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-6 min-w-max h-11">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative h-full flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-neutral-900 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>{tab.label}</span>

              {tab.count !== null && (
                <span className="text-[11px] text-neutral-400 font-mono">
                  {tab.count}
                </span>
              )}

              {tab.alert && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Conflitto orario rilevato" />
              )}

              {/* Bottom active underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 rounded-t" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
