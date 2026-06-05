import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { lookup } from '../data/glossary';
import { useJargonScope } from './JargonScreenScope';

interface Props {
  term: string;
  children: ReactNode;
}

export function TooltipTerm({ term, children }: Props) {
  const scope = useJargonScope();
  const entry = lookup(term);

  const isFirstInstance = useMemo(() => {
    if (!scope || !entry) return false;
    const key = entry.term.toLowerCase();
    if (scope.seen.has(key)) return false;
    scope.seen.add(key);
    return true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!entry && process.env.NODE_ENV !== 'production') {
      console.warn(`TooltipTerm: no glossary entry for "${term}"`);
    }
  }, [entry, term]);

  if (!entry || !isFirstInstance) {
    return <>{children}</>;
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="jargon-term"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span
          className="absolute bottom-full left-0 mb-1 w-72 z-20 rounded-lg border border-line bg-panel p-3 text-sm shadow-lg"
          role="tooltip"
        >
          <div className="font-semibold">{entry.expansion}</div>
          <div className="text-muted mt-1">{entry.definition}</div>
          <div className="text-ink mt-2">{entry.inGameContext}</div>
        </span>
      )}
    </span>
  );
}
