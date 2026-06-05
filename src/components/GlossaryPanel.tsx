import { useEffect, useState } from 'react';
import { glossary, type GlossaryCategory } from '../data/glossary';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_TITLES: Record<GlossaryCategory, string> = {
  financial: 'Financial',
  sources: 'Sources',
  entitlement: 'Entitlement',
  compliance: 'Compliance',
};

export function GlossaryPanel({ open, onClose }: Props) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = q.trim()
    ? glossary.filter((e) => {
        const n = q.trim().toLowerCase();
        return e.term.toLowerCase().includes(n)
          || e.expansion.toLowerCase().includes(n)
          || e.definition.toLowerCase().includes(n);
      })
    : glossary;

  const byCategory: Record<GlossaryCategory, typeof glossary> = {
    financial: [], sources: [], entitlement: [], compliance: [],
  };
  for (const e of filtered) byCategory[e.category].push(e);

  return (
    <div
      data-glossary-panel
      className="fixed inset-y-0 right-0 w-full md:w-[40rem] bg-panel border-l border-line shadow-xl z-50 flex flex-col"
      role="dialog"
      aria-label="Glossary"
    >
      <div className="flex items-center justify-between p-4 border-b border-line">
        <h2 className="text-lg font-semibold">Glossary</h2>
        <button type="button" onClick={onClose} aria-label="Close glossary">×</button>
      </div>
      <div className="p-4 border-b border-line">
        <input
          type="text"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {(['financial', 'sources', 'entitlement', 'compliance'] as GlossaryCategory[]).map((cat) =>
          byCategory[cat].length > 0 ? (
            <section key={cat}>
              <h3 className="text-xs uppercase tracking-wide text-muted mb-2">{CATEGORY_TITLES[cat]}</h3>
              <div className="space-y-3">
                {byCategory[cat].map((e) => (
                  <div key={e.term} className="border border-line rounded-lg p-3">
                    <div className="font-semibold">{e.term}</div>
                    <div className="text-sm text-muted">{e.expansion}</div>
                    <div className="text-sm mt-1">{e.definition}</div>
                    <div className="text-sm mt-1 italic">{e.inGameContext}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
    </div>
  );
}
