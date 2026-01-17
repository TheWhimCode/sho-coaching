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
  return (
    <div
      onClick={onClick}
      className={[
        "w-16 h-16 rounded-lg border-2 relative overflow-hidden",
        "flex items-center justify-center transition",
        "bg-gray-900",
        "shadow-[0_10px_15px_rgba(0,0,0,0.9),0_4px_6px_rgba(0,0,0,0.8)]",

        // optional attention animation (user choosing)
        pulse && "animate-pulse",

        // base borders (no container opacity)
        state === "empty" && "border-gray-700",
        state === "hover" && "border-gray-500",
        state === "blocked" && "border-gray-700",

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

        onClick ? "cursor-pointer" : "cursor-not-allowed",
      ].join(" ")}
    >
      {champ ? (
        <img
          src={champ}
          alt=""
          className={[
            "w-full h-full object-cover",
            state === "hover" && "opacity-50",
            state === "blocked" && "opacity-25",
          ].join(" ")}
        />
      ) : (
        <div
          className={[
            "w-full h-full bg-gray-800",
            state === "blocked" ? "opacity-20" : "opacity-40",
          ].join(" ")}
        />
      )}

      {/* HOVERING overlay */}
      {state === "hover" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/50 text-[8px] font-semibold tracking-wide pointer-events-none">
          HOVERING
        </div>
      )}

      {/* BLOCKED diagonal */}
      {state === "blocked" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[140%] h-[3px] bg-gray-700 -rotate-45" />
        </div>
      )}
    </div>
  );
}
