"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BitkubCredentials } from "@/features/exchanges/lib/bitkub-credentials";
import { useAuthSession } from "@/lib/auth/session-context";

const EMPTY_CREDENTIALS: BitkubCredentials = {
  apiKey: "",
  apiSecret: "",
};

interface BitkubCredentialDraftContextValue {
  credentials: BitkubCredentials;
  updateCredentials: (patch: Partial<BitkubCredentials>) => void;
  clearCredentials: () => void;
}

const BitkubCredentialDraftContext =
  createContext<BitkubCredentialDraftContextValue | null>(null);

export function BitkubCredentialDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const userId = useAuthSession()?.user?.id ?? null;
  const key = userId ? `user:${userId}` : "anonymous";

  return (
    <ScopedBitkubCredentialDraftProvider key={key}>
      {children}
    </ScopedBitkubCredentialDraftProvider>
  );
}

function ScopedBitkubCredentialDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [credentials, setCredentials] =
    useState<BitkubCredentials>(EMPTY_CREDENTIALS);
  const updateCredentials = useCallback((patch: Partial<BitkubCredentials>) => {
    setCredentials((current) => ({ ...current, ...patch }));
  }, []);
  const clearCredentials = useCallback(
    () => setCredentials(EMPTY_CREDENTIALS),
    [],
  );
  const value = useMemo(
    () => ({ credentials, updateCredentials, clearCredentials }),
    [credentials, updateCredentials, clearCredentials],
  );

  return (
    <BitkubCredentialDraftContext.Provider value={value}>
      {children}
    </BitkubCredentialDraftContext.Provider>
  );
}

export function useBitkubCredentialDraft() {
  const context = useContext(BitkubCredentialDraftContext);
  if (!context) {
    throw new Error(
      "useBitkubCredentialDraft must be used inside BitkubCredentialDraftProvider",
    );
  }

  return context;
}
