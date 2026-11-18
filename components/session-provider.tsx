"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { appendScore, readUser, subscribeUser, writeUser, type SavedScore, type User } from "@/lib/session";

interface SessionContextValue {
  user: User | null;
  login: (user: User | null) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Server (and hydration) snapshot is always "no user" to avoid mismatches.
const getServerUser = () => null;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribeUser, readUser, getServerUser);

  const login = useCallback((u: User | null) => writeUser(u), []);
  const signOut = useCallback(() => writeUser(null), []);
  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => appendScore(entry), []);

  const value = useMemo(() => ({ user, login, signOut, saveScore }), [user, login, signOut, saveScore]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
