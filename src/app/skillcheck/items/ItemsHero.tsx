"use client";

export default function ItemsHero({
  targets,
  inventory,
}: {
  targets: { id: string; name: string; icon: string }[];
  inventory: { id: string; name: string; icon: string }[];
}) {
  const SLOT_COUNT = 6; // 2x3
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => inventory[i] ?? null);

  const title =
    targets.length === 1
      ? targets[0].name
      : `${targets[0].name} + ${targets[1].name}`;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Item identity */}
      <div className="flex items-center gap-5">
        {/* Framed icon (left) */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-white/10 blur-sm" />
          <div className="relative rounded-2xl border border-white/15 bg-white/5 p-1 shadow-lg">
            <img
              src={targets[0].icon}
              alt={title}
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover"
            />
          </div>
        </div>

        {/* Name + chip */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            {title}
          </h1>

          {/* Small chip */}
          <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/80">
            <span className="leading-none">🪙</span>
            <span className="font-medium">???</span>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="w-full max-w-2xl">
        <div className="text-sm uppercase tracking-wide text-white/60 mb-2 text-center">
          Inventory
        </div>

        <div className="grid grid-cols-3 gap-2 justify-center mx-auto w-fit">
          {slots.map((it, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-black/30 p-1 w-14 h-14 flex items-center justify-center"
              title={it?.name ?? ""}
            >
              {it ? (
                <img
                  src={it.icon}
                  alt={it.name}
                  className="w-12 h-12 rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg opacity-30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
