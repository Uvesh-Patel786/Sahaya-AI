import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearTokens, setTokens } from "@/lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  language?: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, language?: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sahayak_access");
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then((d) => setUser(normalizeUser(d.user)))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(normalizeUser(data.user));
      },
      async register(name, email, password, language = "en") {
        const data = await api<{ user: User; accessToken: string; refreshToken: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, language }),
        });
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUser(normalizeUser(data.user));
      },
      logout() {
        clearTokens();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function normalizeUser(u: User & { _id?: string }): User {
  return { ...u, id: u.id || String(u._id) };
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
