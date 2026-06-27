export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossOrigin="anonymous" />
      {children}
    </>
  );
}
