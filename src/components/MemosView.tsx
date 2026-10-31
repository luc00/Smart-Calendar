import React, { useState } from 'react';
import { Pin, Trash2, Plus, FileText } from 'lucide-react';
import { QuickMemo } from '../utils/agendaLogic';

interface MemosViewProps {
  memos: QuickMemo[];
  onAddMemo: (memo: { title?: string; content: string; color?: string; pinned?: boolean }) => Promise<void>;
  onDeleteMemo: (memo: QuickMemo) => void;
  onTogglePin: (memo: QuickMemo) => void;
}

export const MemosView: React.FC<MemosViewProps> = ({
  memos,
  onAddMemo,
  onDeleteMemo,
  onTogglePin,
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-white border-neutral-200');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { name: 'Carta Bianca', value: 'bg-white border-neutral-200' },
    { name: 'Carta Sabbia', value: 'bg-stone-50 border-stone-200' },
    { name: 'Ambra Calda', value: 'bg-amber-50/50 border-amber-200/60' },
    { name: 'Salvia Tenue', value: 'bg-emerald-50/40 border-emerald-200/60' },
    { name: 'Ardesia Chiara', value: 'bg-slate-50 border-slate-200' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMemo({
        title: title.trim() || undefined,
        content: content.trim(),
        color: selectedColor,
        pinned: false,
      });
      setContent('');
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedMemos = [...memos].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return (
    <div className="space-y-6">
      {/* Quick memo creation box */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            placeholder="Titolo appunto (opzionale)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none"
          />
          <textarea
            required
            rows={2}
            placeholder="Cattura un'idea, appunto di una riunione o nota da sincronizzare con Obsidian..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none resize-none font-normal leading-relaxed"
          />
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-4 h-4 rounded-full border transition cursor-pointer ${c.value} ${
                    selectedColor === c.value ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
                  }`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salva appunto</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grid of Memos */}
      {sortedMemos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="w-9 h-9 mx-auto rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-neutral-800">Nessuna nota presente</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Usa questo spazio per catturare pensieri rapidi da esportare direttamente nel tuo vault Obsidian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedMemos.map((memo) => (
            <div
              key={memo.id}
              className={`p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between group ${
                memo.color || 'bg-white border-neutral-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-xs font-semibold text-neutral-900 truncate">
                    {memo.title || 'Appunto rapido'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onTogglePin(memo)}
                    aria-label={memo.pinned ? 'Rimuovi dai fissati' : 'Fissa in alto'}
                    className={`p-1 rounded transition cursor-pointer ${
                      memo.pinned
                        ? 'text-neutral-900 bg-neutral-200/50'
                        : 'text-neutral-400 hover:text-neutral-800 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${memo.pinned ? 'fill-neutral-900' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {memo.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200/60 text-[10px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1">
                  {memo.pinned && <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block" />}
                  {memo.pinned ? 'In evidenza' : 'Nota'}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteMemo(memo)}
                  aria-label="Elimina nota"
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

