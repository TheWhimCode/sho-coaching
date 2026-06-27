export default function GuideCrossOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[145%] w-[145%] shrink-0 drop-shadow-sm"
      >
        <line
          x1="1"
          y1="1"
          x2="23"
          y2="23"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="23"
          y1="1"
          x2="1"
          y2="23"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
