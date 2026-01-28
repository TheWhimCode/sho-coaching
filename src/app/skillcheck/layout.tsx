export default function SkillcheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Ambient page background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 22% 70%, rgba(0,130,255,0.22), transparent 58%), radial-gradient(circle at 78% 80%, rgba(255,100,30,0.18), transparent 58%)",
        }}
      />

      {/* Actual page content */}
      <div className="relative z-10">{children}</div>
    </>
  );
}
