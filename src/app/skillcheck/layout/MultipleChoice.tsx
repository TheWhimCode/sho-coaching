"use client";

export default function MultipleChoiceLayout({
  header,
  children,
  className = "",
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "w-full",
        "py-6",
        "text-white",
        className,
      ].join(" ")}
    >
      <div className="max-w-3xl mx-auto px-6 flex flex-col gap-8">
        {/* Header Placement (text provided by caller) */}
        {header && (
          <div className="text-center">
            {header}
          </div>
        )}

        {/* Multiple choice content */}
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </div>
    </section>
  );
}
