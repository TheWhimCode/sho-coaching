import React from "react";

export default function CoachingTimeline() {
  const steps = [
    "Profile review",
    "Initial assessment",
    "Gameplay analysis",
    "Setting focus",
    "Summary",
  ];

  return (
    <div className="relative w-full py-20 select-none">
      {/* Rail */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
        <div
          className="h-[2px] w-full"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.25) 10%, rgba(255,255,255,0.25) 90%, rgba(255,255,255,0))",
          }}
        />
      </div>

      {/* Steps */}
      <div
        className="relative grid z-10"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}
      >
        {steps.map((title, i) => {
          const isAbove = i % 2 === 0; // alternate placement
          return (
            <div key={title} className="relative flex flex-col items-center">
              {/* Connector */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-px bg-white/30 ${
                  isAbove
                    ? "top-0 bottom-1/2"
                    : "top-1/2 bottom-0"
                }`}
              />

              {/* Content */}
              <div
                className={`flex flex-col items-center ${
                  isAbove ? "mb-20" : "mt-20 flex-col-reverse"
                }`}
              >
                {/* Ghost number */}
                <span className="absolute text-6xl md:text-7xl font-bold text-white/5 pointer-events-none select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Label */}
                <span className="relative text-sm md:text-base font-medium text-white/90 whitespace-nowrap">
                  {title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
