import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import {
  refreshSession,
  setAccessToken,
  setSessionEndedHandler,
  type SessionEndReason,
} from "@/api/client";
import { usersApi } from "@/api/users";
import { normalizeError } from "@/lib/errors";
import type { User } from "@/types/models";
import type { UserRole } from "@/types/enums";

export const meKey = ["users", "me"] as const;

interface AuthValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isBooting: boolean;
  /** set when the boot refresh failed for a reason other than "no session" (e.g. offline) */
  bootError: boolean;
  endedReason: SessionEndReason | null;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  retryBoot(): void;
  clearEnded(): void;
}
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isBooting, setBooting] = useState(true);
  const [bootError, setBootError] = useState(false);
  const [endedReason, setEnded] = useState<SessionEndReason | null>(null);
  const bootRan = useRef(false);

  const boot = useCallback(async () => {
    setBooting(true);
    setBootError(false);
    try {
      await refreshSession(); // 1) cookie -> access token
      const me = await usersApi.me(); // 2) load the user
      qc.setQueryData(meKey, me);
      setUser(me);
    } catch (e) {
      const err = normalizeError(e);
      setAccessToken(null);
      // no response / 5xx / 429 on boot = we do not know (the /auth rate limit is 5 per minute, so a few quick
      // reloads must not look like a logout); a 401 simply means "logged out"
      if (err.status === 0 || err.status === 429 || err.status >= 500)
        setBootError(true);
      setUser(null);
    } finally {
      setBooting(false);
    }
  }, [qc]);

  useEffect(() => {
    if (bootRan.current) return; // StrictMode runs effects twice; refresh must run once
    bootRan.current = true;
    void boot();
  }, [boot]);

  // keep the auth user in sync with the ['users','me'] cache (profile edits, role selection, verification)
  useEffect(() => {
    return qc.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" && event.type !== "added") return;
      const key = event.query.queryKey;
      if (key[0] === "users" && key[1] === "me" && key.length === 2) {
        const data = event.query.state.data as User | undefined;
        if (data) setUser(data);
      }
    });
  }, [qc]);

  useEffect(() => {
    setSessionEndedHandler((reason) => {
      setUser(null);
      setEnded(reason);
      qc.clear();
    });
    return () => setSessionEndedHandler(null);
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      setAccessToken(res.accessToken);
      setEnded(null);
      qc.setQueryData(meKey, res.user);
      setUser(res.user);
      return res.user;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the server always answers 200; ignore transport errors */
    }
    setAccessToken(null);
    setUser(null);
    setEnded(null);
    qc.clear();
  }, [qc]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isBooting,
      bootError,
      endedReason,
      login,
      logout,
      retryBoot: () => void boot(),
      clearEnded: () => setEnded(null),
    }),
    [user, isBooting, bootError, endedReason, login, logout, boot],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
