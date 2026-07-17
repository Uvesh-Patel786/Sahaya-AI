import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeCtx = { dark: boolean; toggle: () => void };

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("sahayak_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("sahayak_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  return useContext(Ctx);
}
