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
  className,
  listClassName,
  placeholderClassName,
  disabled,
  searchable = true,
  searchClassName,
  itemClassName,
}: {
  items: DropdownItem<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
  className?: string;
  /** Optional class for the open dropdown list (e.g. max-h-[240px] no-scrollbar) */
  listClassName?: string;
  /** Optional class for the placeholder text when no value selected */
  placeholderClassName?: string;
  disabled?: boolean;
  /** When false, opens a plain list (no search field). For small fixed option sets. */
  searchable?: boolean;
  /** Optional class for the search input (e.g. h-10 px-3 text-sm) */
  searchClassName?: string;
  /** Optional class for each list item button (e.g. h-10 px-3 text-sm) */
  itemClassName?: string;
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
    if (!searchable) return items;
    const q = query.toLowerCase();
    return items.filter((i) =>
      asText(i.label).toLowerCase().includes(q)
    );
  }, [items, query, searchable]);

  const selected = items.find((i) => i.value === value);

  const openInputClass = `w-full rounded-lg bg-black/40 border border-white/15 text-white outline-none placeholder:text-white/50 ${searchClassName ?? "h-14 px-4 text-lg"}`;

  const itemBtnClass = `
                  w-full flex items-center gap-2 hover:bg-white/10 text-left
                  ${itemClassName ?? "h-14 px-4"}
                `;

  const listPanelClass = `
              absolute z-50 left-0 right-0 top-full mt-1 w-full overflow-y-auto
              bg-black/90 border border-white/15 rounded-xl shadow-lg
              ${listClassName ?? "max-h-[420px]"}
            `;

  if (!searchable) {
    return (
      <div
        ref={ref}
        className={`relative ${open ? "z-50" : ""} ${className ?? "w-[420px]"}`}
      >
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
          }}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`
            w-full h-14 px-4 rounded-lg
            bg-black/40 border border-white/15
            text-white text-lg
            flex items-center gap-3
            ${open ? "ring-1 ring-white/25" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {selected?.icon && <img src={selected.icon} className="w-7 h-7" alt="" />}
          <span
            className={`flex-1 text-left ${!selected && placeholderClassName ? placeholderClassName : ""}`}
          >
            {selected ? selected.label : placeholder}
          </span>
          <span className="opacity-60 text-xl" aria-hidden>
            ▾
          </span>
        </button>
        {open && (
          <div className={listPanelClass} role="listbox">
            {items.map((i) => (
              <button
                key={i.value}
                type="button"
                role="option"
                aria-selected={i.value === value}
                onClick={() => {
                  onChange(i.value);
                  setOpen(false);
                }}
                className={itemBtnClass}
              >
                {i.icon && (
                  <img
                    src={i.icon}
                    className={itemClassName ? "w-5 h-5 shrink-0" : "w-7 h-7"}
                    alt=""
                  />
                )}
                <span
                  className={itemClassName ? "text-white" : "text-lg text-white"}
                >
                  {i.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${open ? "z-50" : ""} ${className ?? "w-[420px]"}`}>
      {open ? (
        <>
          <div
            className={`
              absolute z-0 top-full left-0 right-0 -mt-2 pt-2 w-full overflow-y-auto
              bg-black/90 border border-t-0 border-white/15 rounded-t-none rounded-b-xl
              ${listClassName ?? "max-h-[420px]"}
            `}
            role="listbox"
          >
            {filtered.map((i) => (
              <button
                key={i.value}
                type="button"
                role="option"
                onClick={() => {
                  onChange(i.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={itemBtnClass}
              >
                {i.icon && <img src={i.icon} className={itemClassName ? "w-5 h-5 shrink-0" : "w-7 h-7"} alt="" />}
                <span className={itemClassName ? "text-white" : "text-lg text-white"}>{i.label}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className={`px-4 py-4 text-gray-400 ${itemClassName ? "text-sm" : "text-lg"}`}>No results</div>
            )}
          </div>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className={`relative z-10 ${openInputClass}`}
            aria-expanded="true"
            aria-haspopup="listbox"
          />
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (disabled) return;
            setQuery("");
            setOpen(true);
          }}
          disabled={disabled}
          className={`
            w-full h-14 px-4 rounded-lg
            bg-black/40 border border-white/15
            text-white text-lg
            flex items-center gap-3
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          aria-expanded="false"
          aria-haspopup="listbox"
        >
          {selected?.icon && <img src={selected.icon} className="w-7 h-7" alt="" />}

          <span className={`flex-1 text-left ${!selected && placeholderClassName ? placeholderClassName : ""}`}>
            {selected ? selected.label : placeholder}
          </span>

          <span className="opacity-60 text-xl" aria-hidden>▾</span>
        </button>
      )}
    </div>
  );
}
