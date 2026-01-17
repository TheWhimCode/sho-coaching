"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type DropdownItem<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

function asText(x: unknown) {
  return typeof x === "string" ? x : String(x ?? "");
}

export default function SearchDropdown<T extends string>({
  items,
  value,
  onChange,
  placeholder,
}: {
  items: DropdownItem<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((i) =>
      asText(i.label).toLowerCase().includes(q)
    );
  }, [items, query]);

  const selected = items.find((i) => i.value === value);

  return (
    <div ref={ref} className="relative w-[420px]">
      {/* TRIGGER */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          w-full h-14 px-4 rounded-lg
          bg-black/40 border border-white/15
          text-white text-lg
          flex items-center gap-3
        "
      >
        {selected?.icon && <img src={selected.icon} className="w-7 h-7" />}

        <span className="flex-1 text-left">
          {selected ? selected.label : placeholder}
        </span>

        <span className="opacity-60 text-xl">▾</span>
      </button>

      {open && (
        <div
          className="
            absolute z-50 mt-2 w-full max-h-[420px]
            overflow-y-auto
            bg-black/90 border border-white/15
            rounded-xl
          "
        >
          {/* SEARCH */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="
              w-full h-14 px-4 text-lg
              bg-black/70 border-b border-white/10
              text-white outline-none
            "
          />

          {/* ITEMS */}
          {filtered.map((i) => (
            <button
              key={i.value}
              onClick={() => {
                onChange(i.value);
                setOpen(false);
                setQuery("");
              }}
              className="
                w-full h-14 px-4
                flex items-center gap-3
                hover:bg-white/10
                text-left
              "
            >
              {i.icon && <img src={i.icon} className="w-7 h-7" />}
              <span className="text-lg text-white">{i.label}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-4 py-4 text-lg text-gray-400">No results</div>
          )}
        </div>
      )}
    </div>
  );
}
