export type SlotState =
  | "empty"
  | "filled"
  | "hover"
  | "blocked"
  | "solution";

export function DraftSlot({
  champ,
  state,
  side,
  highlight = false,
  pulse = false,
  onClick,
}: {
  champ?: string | null;
  state: SlotState;
  side?: "blue" | "red";
  highlight?: boolean;
  pulse?: boolean;
  onClick?: () => void;
}) {
  const isBlocked = state === "blocked";

  return (
    <div
      onClick={onClick}
      className={[
        "group w-16 h-16 rounded-lg border-2 relative overflow-hidden",
        "flex items-center justify-center transition",
        "bg-gray-900",
        "shadow-[0_10px_15px_rgba(0,0,0,0.9),0_4px_6px_rgba(0,0,0,0.8)]",

        // optional attention animation (user choosing)
        pulse && "animate-pulse",

        // base borders (no container opacity)
        state === "empty" && "border-gray-700",
        state === "hover" && "border-gray-500",
        isBlocked && "border-gray-700 opacity-80",

        // filled = team color
        state === "filled" &&
          (side === "blue"
            ? "border-blue-500"
            : side === "red"
            ? "border-red-500"
            : "border-white/20"),

        // solution / focus
        state === "solution" && "border-yellow-400",
        highlight && "border-yellow-400",

        // cursor: disabled when blocked, else pointer if clickable
        isBlocked ? "cursor-not-allowed" : onClick ? "cursor-pointer" : "cursor-not-allowed",
      ].join(" ")}
    >
      {champ ? (
        <img
          src={champ}
          alt=""
          className={[
            "w-full h-full object-cover",
            state === "hover" && "opacity-50",
          ].join(" ")}
        />
      ) : (
        <div
          className={[
            "w-full h-full bg-gray-800",
            "opacity-40",
          ].join(" ")}
        />
      )}

      {/* Blocked: dark overlay */}
      {isBlocked && (
        <div className="absolute inset-0 bg-black/80 pointer-events-none" aria-hidden />
      )}

      {/* HOVERING overlay */}
      {state === "hover" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/50 text-[8px] font-semibold tracking-wide pointer-events-none">
          HOVERING
        </div>
      )}

      {/* BLOCKED diagonal */}
      {isBlocked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[140%] h-[3px] bg-gray-700 -rotate-45" />
        </div>
      )}

      {/* Blocked: hover hint "Pick-order locked" */}
      {isBlocked && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-black/30"
          aria-hidden
        >
          <span className="text-[9px] font-medium text-white/80 text-center px-1 leading-tight">
            Locked by pick-order
          </span>
        </div>
      )}
    </div>
  );
}
