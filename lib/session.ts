// Simulated session and score storage backed by localStorage (client only).

export interface User {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const listeners = new Set<() => void>();

// Cache keeps the snapshot referentially stable for useSyncExternalStore.
let cachedRaw: string | null | undefined;
let cachedUser: User | null = null;

export function readUser(): User | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(USER_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as User | null) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function writeUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // Storage unavailable (private mode, quota): the session is just not persisted.
  }
  listeners.forEach((l) => l());
}

export function subscribeUser(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === USER_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function readScores(): SavedScore[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as SavedScore[]) : [];
  } catch {
    return [];
  }
}

export function appendScore(entry: Omit<SavedScore, "at">): void {
  try {
    const all = readScores();
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage failures, same as the template.
  }
}
