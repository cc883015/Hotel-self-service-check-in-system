/** Full-viewport ~30s Brisbane CBD aerial loop (skyscrapers / metropolitan skyline). */
export default function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <video
        className="absolute inset-0 h-full w-full object-cover scale-110 video-tech"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src="/videos/queensland-bg.mp4"
      />
      {/* Cool tech tint + depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/45 via-cyan-950/25 to-indigo-950/50" />
      <div className="absolute inset-0 tech-grid opacity-[0.35]" />
      <div className="absolute inset-0 tech-scanlines opacity-[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-white/10 to-white/30" />
    </div>
  );
}
