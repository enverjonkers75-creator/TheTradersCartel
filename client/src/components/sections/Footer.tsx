export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-16 text-neutral-500 text-sm relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <img src="/logo-v2.png" alt="TheTradersCartel" className="h-9 mb-4 opacity-70" />
            <p className="max-w-xs font-light">Invest In Yourself. The only shortcut in trading is mentorship.</p>
          </div>
          <div className="flex gap-8 uppercase tracking-widest text-xs">
            <a href="/#about" className="hover:text-white transition-colors">About</a>
            <a href="/#courses" className="hover:text-white transition-colors">Courses</a>
            <a href="/gallery" className="hover:text-white transition-colors">Gallery</a>
            <a href="/#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 space-y-4">
          <p className="text-[11px] leading-relaxed text-neutral-500 max-w-4xl mx-auto text-center" data-testid="text-legal-disclaimer">
            Trading involves substantial risk and may not be suitable for everyone. Past performance is not indicative of future results. Only trade with capital you can afford to lose.
          </p>
          <div className="flex justify-center pt-4">
             <p className="text-[10px] uppercase text-neutral-600">© {new Date().getFullYear()} TheTradersCartel. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
