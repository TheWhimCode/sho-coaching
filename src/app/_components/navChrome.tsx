// src/app/_components/NavChromeContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

type NavChrome = "auto" | "logoOnly" | "full";

const NavChromeContext = createContext<{
  chrome: NavChrome;
  setChrome: (c: NavChrome) => void;
} | null>(null);

export function NavChromeProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChrome] = useState<NavChrome>("auto");
  return (
    <NavChromeContext.Provider value={{ chrome, setChrome }}>
      {children}
    </NavChromeContext.Provider>
  );
}

export function useNavChrome() {
  const ctx = useContext(NavChromeContext);
  if (!ctx) throw new Error("useNavChrome must be used inside NavChromeProvider");
  return ctx;
}
