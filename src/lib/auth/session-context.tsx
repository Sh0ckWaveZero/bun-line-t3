"use client";

import { createContext, useContext } from "react";

export interface AppSession {
  expires: string;
  isAdmin?: boolean;
  user?: {
    email?: string | null;
    id: string;
    image?: string | null;
    lineUserId?: string | null;
    name?: string | null;
    role?: string | null;
  };
}

const AuthSessionContext = createContext<AppSession | null | undefined>(
  undefined,
);

export function AuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: AppSession | null;
}) {
  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
