import React, { createContext, useContext } from 'react';

type AuthActions = {
  logout: () => void;
};

const AuthActionsContext = createContext<AuthActions | null>(null);

export function AuthActionsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AuthActions;
}) {
  return <AuthActionsContext.Provider value={value}>{children}</AuthActionsContext.Provider>;
}

export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) {
    throw new Error('useAuthActions must be used within AuthActionsProvider');
  }
  return ctx;
}

