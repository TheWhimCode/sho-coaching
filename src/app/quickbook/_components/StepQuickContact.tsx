"use client";

import * as React from "react";
import StepContact from "@/app/checkout/_components/checkout-steps/StepContact";
import {
  FooterProvider,
  useFooter,
} from "@/app/checkout/_components/checkout-steps/FooterContext";
import type { DiscordIdentity, RiotVerified } from "./types";

type FooterState = {
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  onSecondary?: () => void;
};

type Props = {
  riotTag: string;
  notes: string;
  setRiotTag: (v: string) => void;
  setNotes: (v: string) => void;

  discordIdentity: DiscordIdentity | null;
  onDiscordLinked: (u: DiscordIdentity) => void;
  onRiotVerified?: (d: RiotVerified) => void;

  contactErr: string | null;
  onNext: () => void;

  // ✅ parent footer is rendered in QuickbookClient
  setFooterState: (s: FooterState | null) => void;
};

function FooterBridge({
  setFooterState,
}: {
  setFooterState: (s: FooterState | null) => void;
}) {
  const [footer, setFooter] = useFooter();

  React.useEffect(() => {
    setFooterState({
      primaryLabel: footer.label ?? "Continue",
      primaryDisabled: !!footer.disabled || !!footer.loading,
      onPrimary: async () => {
        if (footer.disabled || footer.loading) return;
        setFooter((f: any) => ({ ...f, loading: true }));
        try {
          footer.onClick?.();
        } finally {
          setFooter((f: any) => ({ ...f, loading: false }));
        }
      },
    });

    return () => setFooterState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footer.label, footer.disabled, footer.loading, footer.onClick]);

  return null;
}

export default function StepQuickContact({
  riotTag,
  notes,
  setRiotTag,
  setNotes,
  discordIdentity,
  onDiscordLinked,
  onRiotVerified,
  contactErr,
  onNext,
  setFooterState,
}: Props) {
  const riotInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <FooterProvider>
      {/* ✅ this makes QuickbookClient’s footer reflect StepContact validation */}
      <FooterBridge setFooterState={setFooterState} />

      <div className="h-full min-h-0">
        <div className="h-full min-h-0 px-2 sm:px-4">
          <div className="h-full min-h-0 mx-auto w-full max-w-[400px] md:pt-20">
            <StepContact
              riotTag={riotTag}
              notes={notes}
              setRiotTag={setRiotTag}
              setNotes={setNotes}
              onDiscordLinked={onDiscordLinked}
              onRiotVerified={onRiotVerified}
              discordIdentity={discordIdentity}
              contactErr={contactErr}
              riotInputRef={riotInputRef}
              onSubmit={onNext}
            />
          </div>
        </div>
      </div>
    </FooterProvider>
  );
}