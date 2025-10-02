"use client";
import * as React from "react";

export type FooterState = {
  label?: string;       // default "Continue"
  disabled?: boolean;   // default true
  loading?: boolean;    // controls label/disabled externally
  onClick?: () => void; // parent triggers this
  hidden?: boolean;     // hide CTA for steps without a primary button
};

type FooterCtxValue = [FooterState, React.Dispatch<React.SetStateAction<FooterState>>];

const FooterCtx = React.createContext<FooterCtxValue | null>(null);

export function useFooter(): FooterCtxValue {
  const ctx = React.useContext(FooterCtx);
  if (!ctx) throw new Error("useFooter must be used inside <FooterProvider>");
  return ctx;
}

export function FooterProvider({ children }: { children: React.ReactNode }) {
  const state = React.useState<FooterState>({ disabled: true });
  return <FooterCtx.Provider value={state}>{children}</FooterCtx.Provider>;
}
