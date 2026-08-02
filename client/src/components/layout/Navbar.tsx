import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "framer-motion";

const navItems = [
  { name: "About", href: "/#about" },
  { name: "Mentorship", href: "/#mentorship" },
  { name: "Courses", href: "/#courses" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass-nav py-2 md:py-3" : "bg-transparent py-3 md:py-5"
      )}
    >
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-white origin-left z-50"
        style={{ scaleX }}
      />

      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group shrink-0">
          <img
            src="/logo-v2.png"
            alt="TheTradersCartel"
            className="h-8 sm:h-9 md:h-10 w-auto"
          />
        </a>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-[11px] xl:text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
          <a href="/signup" className="ml-1 text-[11px] uppercase tracking-widest text-white/60 transition-colors duration-200 hover:text-white">Create account</a>
          <Button asChild variant="outline" size="sm" className="ml-2 border-white/60 text-white hover:bg-white hover:text-black rounded-none uppercase tracking-wide text-[11px] h-9 px-5">
            <a href="/login">Member sign in</a>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10 h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-black border-l border-white/10 p-0 w-[280px]">
            <div className="flex flex-col h-full p-6 pt-12">
              <div className="mb-8">
                <img src="/logo-v2.png" alt="TheTradersCartel" className="h-8 w-auto mb-2" />
              </div>
              <nav className="flex flex-col gap-5">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-sm uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
                <a href="/signup" className="text-sm uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white">Create account</a>
                <Button asChild className="mt-4 bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-wide w-full h-11 text-sm">
                  <a href="/login">Member sign in</a>
                </Button>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
