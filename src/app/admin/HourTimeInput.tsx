"use client";

export function formatHourInput(raw: string) {
  const cleaned = raw.replace(/[^\d:]/g, "");
  if (cleaned.includes(":")) {
    const [hour, minute = ""] = cleaned.split(":");
    return `${hour.slice(0, 2)}:${minute.replace(/\D/g, "").slice(0, 2)}`;
  }
  const digits = cleaned.slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function normalizeHour(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function clockLabel(value: string) {
  const ampm = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    let hour = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === "pm") hour += 12;
    return `${String(hour).padStart(2, "0")}:${ampm[2]}`;
  }
  return normalizeHour(value) || value;
}

export function HourTimeInput({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  return <input
    required={required}
    type="text"
    inputMode="numeric"
    autoComplete="off"
    spellCheck={false}
    placeholder="14:30"
    pattern="(?:[01]\d|2[0-3]):[0-5]\d"
    maxLength={5}
    title="24-hour time, 00:00 to 23:59"
    aria-label="Time, 24-hour"
    value={value}
    onChange={event => onChange(formatHourInput(event.target.value))}
    onBlur={() => { const next = normalizeHour(value); if (next && next !== value) onChange(next); }}
  />;
}
