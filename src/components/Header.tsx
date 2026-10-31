import React from 'react';
import { Plus, Command, LogOut, Check } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSmartAdd: () => void;
  onOpenCommandPalette: () => void;
  isWorkspaceConnected: boolean;
  isFirebaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onOpenSmartAdd,
  onOpenCommandPalette,
  isWorkspaceConnected,
  isFirebaseConnected,
}) => {
  const todayFormatted = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand & Date */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_564199be.png"
              alt="Aura"
              className="h-5 w-auto object-contain select-none"
              loading="eager"
            />
            <span className="text-xs text-neutral-400 capitalize hidden sm:inline">
              {todayFormatted}
            </span>
          </div>

          {/* Quiet status indicators */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-neutral-500 border-l border-neutral-200 pl-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isFirebaseConnected ? 'bg-neutral-800' : 'bg-neutral-300'
                }`}
              />
              <span>{isFirebaseConnected ? 'Sincronizzato' : 'Offline'}</span>
            </span>

            <span className="text-neutral-300" aria-hidden="true">
              ·
            </span>

            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isWorkspaceConnected ? 'bg-neutral-800' : 'bg-neutral-300'
                }`}
              />
              <span>{isWorkspaceConnected ? 'Google Workspace connesso' : 'Google non connesso'}</span>
            </span>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label="Cerca o esegui comandi (Ctrl+K o Cmd+K)"
            className="hidden md:flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1.5 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
          >
            <Command className="w-3.5 h-3.5 text-neutral-400" />
            <span>Cerca o comandi...</span>
            <kbd className="font-mono text-[10px] bg-white text-neutral-400 px-1 rounded border border-neutral-200">
              ⌘K
            </kbd>
          </button>

          {/* New Event / Add button */}
          <button
            type="button"
            onClick={onOpenSmartAdd}
            aria-label="Aggiungi impegno o attività"
            className="inline-flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuovo</span>
          </button>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Utente'}
                  className="w-7 h-7 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-medium text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <button
                onClick={onLogout}
                aria-label="Disconnetti account"
                title="Disconnetti"
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              aria-label="Accedi con Google"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <span>Accedi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
