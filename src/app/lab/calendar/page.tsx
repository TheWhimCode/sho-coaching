"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, useDraggable, useDroppable, DragEndEvent, closestCenter } from "@dnd-kit/core";

// --- Helpers ---------------------------------------------------------------
function toISO(d: Date) {
  return new Date(d.getTime() - d.getMilliseconds()).toISOString();
}

function addMinutes(d: Date, mins: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + mins);
  return x;
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Build 96 × 15-min slots for the given local day
function buildDaySlots(day = new Date()) {
  const start = startOfDayLocal(day);
  const rows: { id: string; startTime: Date; isOpen: boolean }[] = [];
  for (let i = 0; i < 96; i++) {
    const startTime = addMinutes(start, i * 15);
    const h = startTime.getHours();
    const m = startTime.getMinutes();
    // Bookable window: 13:00 through 23:45 inclusive
    const isOpen = (h > 13 || (h === 13 && m >= 0)) && (h < 23 || (h === 23 && m <= 45));
    rows.push({ id: toISO(startTime), startTime, isOpen });
  }
  return rows;
}

// Can a 60-min session (4 cells) start at this index?
function canStart60(rows: { isOpen: boolean }[], idx: number) {
  if (idx < 0 || idx + 3 >= rows.length) return false;
  for (let i = idx; i < idx + 4; i++) {
    if (!rows[i].isOpen) return false;
  }
  return true;
}

// --- DnD pieces ------------------------------------------------------------
function PaletteBlock({ height }: { height: number }) {
  // Draggable block before placement (same look as placed one)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: "session-pill" });
  const style: React.CSSProperties = {
    height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-xl shadow-lg border border-transparent text-white flex flex-col justify-center gap-1 px-3 select-none bg-gradient-to-r from-indigo-500 to-fuchsia-500 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-80" : ""
      }`}
      style={style}
    >
      <div className="text-sm font-semibold">Session · 60m</div>
      <div className="text-xs leading-5 opacity-90">Drag into the timeline</div>
    </div>
  );
}

function CellDroppable({ id, disabled, children }: { id: string; disabled?: boolean; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      data-slotid={id}
      className={`h-full w-full relative ${disabled ? "opacity-40" : isOver ? "outline outline-2 outline-indigo-500/60" : ""}`}
    >
      {children}
    </div>
  );
}

function PlacedBlock({ top, height, start, leftOffset }: { top: number; height: number; start: Date; leftOffset: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: "placed-session" });
  const style: React.CSSProperties = {
    top,
    left: leftOffset,
    right: 0,
    height,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute z-10 px-3 py-2 rounded-xl shadow-lg border border-transparent text-white flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-500 to-fuchsia-500 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-80 pointer-events-none" : ""
      }`}
      style={style}
    >
      <div className="text-sm font-semibold">Session · 60m</div>
      <div className="text-xs leading-5 opacity-90">
        {fmtTime(start)} – {fmtTime(addMinutes(start, 60))}
      </div>
    </div>
  );
}

// --- Page ------------------------------------------------------------------
export default function CalendarLabPage() {
  const [rowH, setRowH] = useState<number>(24); // px per 15-min row (zoom)
  const [placedIdx, setPlacedIdx] = useState<number | null>(null); // start row index of the placed 60m block
  const rows = useMemo(() => buildDaySlots(new Date()), []);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to first open row
  useEffect(() => {
    const firstOpen = rows.findIndex((r) => r.isOpen);
    if (firstOpen > -1 && containerRef.current) {
      containerRef.current.scrollTop = Math.max(0, firstOpen * rowH - 4 * rowH);
    }
  }, [rows, rowH]);

  function onDragEnd(ev: DragEndEvent) {
    const overId = typeof ev?.over?.id === "string" ? (ev.over.id as string) : null;
    if (!overId) return;
    const idx = rows.findIndex((r) => r.id === overId);
    if (!canStart60(rows, idx)) return;
    setPlacedIdx(idx);
  }

  // Less-sensitive scroll handler (~30% speed)
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    e.preventDefault();
    containerRef.current.scrollTop += e.deltaY * 0.3;
  }

  // For overlay alignment: left column is 80px
  const leftGutterPx = 80;

  return (
    <div className="p-6 bg-slate-950 min-h-[100svh] text-slate-100">
      {/* Narrow container: ~30% viewport width, with a sensible min width */}
      <style jsx global>{`
          /* Hide scrollbars for the calendar only */
          .scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="space-y-4 mx-auto w-[30vw] min-w-[340px]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Calendar Lab</h1>
          <div className="flex items-center gap-2 text-xs">
            <label>Row height</label>
            <select
              className="border rounded px-2 py-1 bg-slate-900 border-slate-700"
              value={rowH}
              onChange={(e) => setRowH(Number(e.target.value))}
            >
              <option value={16}>Compact</option>
              <option value={24}>Comfort</option>
              <option value={36}>Large</option>
            </select>
          </div>
        </div>

        <DndContext onDragEnd={onDragEnd} collisionDetection={closestCenter}>
          {/* Two-column layout: left palette, right calendar */}
          <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
            {/* Left: palette (draggable block matching placed style) */}
            <div className="sticky top-4">
              {placedIdx === null && <PaletteBlock height={rowH * 4} />}
              {placedIdx !== null && (
                <div className="text-xs opacity-70 pt-2">Drag the block in the timeline to move it.</div>
              )}
            </div>

            {/* Right: calendar */}
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid bg-slate-900" style={{ gridTemplateColumns: "80px 1fr" }}>
                <div className="border-b border-slate-800 px-3 py-2 text-[10px] font-medium uppercase tracking-wide">Local time</div>
                <div className="border-b border-slate-800 px-3 py-2 text-[10px]">Today</div>
              </div>

              {/* Scrollable grid (relative for overlay positioning) */}
              <div
                ref={containerRef}
                onWheel={handleWheel}
                className="max-h-[60vh] overflow-auto relative bg-slate-900 scrollbar-hide"
              >
                {/* Absolute overlay for the placed 60m block */}
                {placedIdx !== null && (
                  <PlacedBlock
                    top={placedIdx * rowH}
                    height={rowH * 4}
                    start={rows[placedIdx].startTime}
                    leftOffset={leftGutterPx}
                  />
                )}

                {/* Grid rows */}
                <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
                  {rows.map((r, idx) => {
                    const m = r.startTime.getMinutes();
                    const isHour = m === 0;
                    const isHalf = m === 30;
                    const borderClass = isHour ? "border-slate-700" : isHalf ? "border-slate-800" : "border-transparent";
                    const startOk = canStart60(rows, idx);
                    const isWithinPlaced = placedIdx !== null && idx >= placedIdx && idx < placedIdx + 4;
                    return (
                      <React.Fragment key={r.id}>
                        {/* Time gutter */}
                        <div
                          className={`border-b ${borderClass} text-right pr-3 text-[10px] select-none ${isHour ? "font-medium" : "text-slate-500"}`}
                          style={{ height: rowH }}
                        >
                          {isHour ? fmtTime(r.startTime) : ""}
                        </div>

                        {/* Cell */}
                        <div style={{ height: rowH }}>
                          <CellDroppable id={r.id} disabled={!startOk}>
                            <div className={`h-full w-full ${r.isOpen ? "bg-slate-800/40" : "bg-slate-900"}`} />
                            {/* Highlight the placed region behind the block (helps match height) */}
                            {isWithinPlaced && (
                              <div className="absolute inset-y-0 right-0 left-[80px] bg-indigo-500/10 pointer-events-none" />
                            )}
                          </CellDroppable>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </DndContext>

        <div className="text-xs text-slate-400">
          Narrow view (~30% width), less sensitive scroll, identical pre/post-drag block on the left, and 60‑minute block that matches the covered height.
        </div>
      </div>
    </div>
  );
}
