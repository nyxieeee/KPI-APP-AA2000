import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Value = {
  /** Kapag true: bukas ang menu — may labels; mas malapad ang rail (272px). */
  railOpen: boolean;
  toggleRail: () => void;
  setRailOpen: (v: boolean) => void;
};

const RoleSidenavRailContext = createContext<Value | null>(null);

export function RoleSidenavRailProvider({ children }: { children: React.ReactNode }) {
  const [railOpen, setRailOpen] = useState(false);
  const toggleRail = useCallback(() => setRailOpen((v) => !v), []);
  const value = useMemo(() => ({ railOpen, toggleRail, setRailOpen }), [railOpen, toggleRail]);
  return (
    <RoleSidenavRailContext.Provider value={value}>
      {children}
    </RoleSidenavRailContext.Provider>
  );
}

export function useRoleSidenavRail(): Value {
  const ctx = useContext(RoleSidenavRailContext);
  if (!ctx) throw new Error('useRoleSidenavRail must be used within RoleSidenavRailProvider');
  return ctx;
}
