import { createContext, useContext, useRef, type ReactNode } from 'react';

interface JargonScopeValue {
  seen: Set<string>;
}

const JargonScopeContext = createContext<JargonScopeValue | null>(null);

export function JargonScreenScope({ children }: { children: ReactNode }) {
  const ref = useRef<Set<string>>(new Set());
  return (
    <JargonScopeContext.Provider value={{ seen: ref.current }}>
      {children}
    </JargonScopeContext.Provider>
  );
}

export function useJargonScope(): JargonScopeValue | null {
  return useContext(JargonScopeContext);
}
