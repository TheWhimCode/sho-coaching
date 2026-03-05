"use client";

import { createContext, useContext } from "react";

const SkillcheckBackgroundContext = createContext<string | null>(null);

export function SkillcheckBackgroundProvider({
  dailyBackgroundPath,
  children,
}: {
  dailyBackgroundPath: string;
  children: React.ReactNode;
}) {
  return (
    <SkillcheckBackgroundContext.Provider value={dailyBackgroundPath}>
      {children}
    </SkillcheckBackgroundContext.Provider>
  );
}

export function useSkillcheckBackground(): string {
  const path = useContext(SkillcheckBackgroundContext);
  return path ?? "background.jpg";
}
