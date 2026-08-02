import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useRef } from "react";
import heroTrader from "@/assets/hero-trader.png";
import tradingScreenshot from "@/assets/trading-screenshot.jpg";

export function Hero() {
  const recommendedBrokerUrl = import.meta.env.VITE_RECOMMENDED_BROKER_URL || "https://one.exnessonelink.com/boarding/sign-up/a/f1adx192mf";
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const bgY = useTransform(smooth, [0, 1], [0, 250]);
  const bgScale = useTransform(smooth, [0, 1], [1, 1.4]);
  const bgOpacity = useTransform(smooth, [0, 0.6], [0.25, 0]);
  const bgRotate = useTransform(smooth, [0, 1], [0, 3]);

  const phoneY = useTransform(smooth, [0, 1], [0, 150]);
  const phoneRotateZ = useTransform(smooth, [0, 1], [0, -8]);
  const phoneScale = useTransform(smooth, [0, 0.5, 1], [1, 1.03, 0.8]);
  const phoneOpacity = useTransform(smooth, [0, 0.6, 0.8], [1, 0.9, 0]);

  const contentY = useTransform(smooth, [0, 1], [0, -100]);
  const contentOpacity = useTransform(smooth, [0, 0.5, 0.8], [1, 0.7, 0]);

  const headingY = useTransform(smooth, [0, 0.5], [0, -30]);
  const headingOpacity = useTransform(smooth, [0.1, 0.4], [1, 0]);
  const headingX = useTransform(smooth, [0, 0.5], [0, -60]);


  const descOpacity = useTransform(smooth, [0.1, 0.35], [1, 0]);

  const ctaOpacity = useTransform(smooth, [0.05, 0.3], [1, 0]);
  const ctaScale = useTransform(smooth, [0, 0.3], [1, 0.9]);

  const overlayOpacity = useTransform(smooth, [0, 0.5], [0, 0.6]);

  const lineVariants = {
    hidden: { opacity: 0, y: 50, filter: "blur(8px)", scale: 0.95 },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
    visible: (delay: number) => ({
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] as const }
    })
  };

  return (
    <section ref={ref} id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-12 md:pb-0">
      <motion.div
        className="absolute inset-0 z-[1]"
        style={{ y: bgY, scale: bgScale, opacity: bgOpacity, rotate: bgRotate }}
      >
        <img
          src={heroTrader}
          alt=""
          className="w-full h-full object-cover object-center filter grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_80%)]" />
      </motion.div>

      <motion.div
        className="absolute inset-0 z-[3] bg-black pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      <div className="container relative z-10 px-4 mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-12">
          <motion.div
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
            style={{ y: contentY, opacity: contentOpacity }}
          >
            <motion.div
              className="mb-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
            >
              <span className="inline-block py-1.5 px-4 border border-white/20 bg-black/40 backdrop-blur-md text-[10px] md:text-xs uppercase tracking-[0.25em] text-white/80" data-testid="text-welcome-badge">
                Welcome To TheTradersCartel
              </span>
            </motion.div>

            <motion.div
              className="mb-7 w-full max-w-[760px] drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              style={{ y: headingY, opacity: headingOpacity, x: headingX }}
              data-testid="text-hero-heading"
            >
              <img
                src="/logo-v2.png"
                alt="TheTradersCartel. InvestInYourself"
                className="h-auto w-full object-contain object-left"
              />
            </motion.div>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-lg mb-8 md:mb-10 font-light leading-relaxed"
              style={{ opacity: descOpacity }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.7}
              data-testid="text-hero-description"
            >
              Real Mentorship For Traders Who Want Real Results. Join a community dedicated to precision, discipline, and consistent profitability.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full sm:w-auto"
              style={{ opacity: ctaOpacity, scale: ctaScale }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.9}
            >
              <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-widest px-6 sm:px-8 h-12 sm:h-14 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]" data-testid="button-book-call">
                <a href="https://wa.me/27836864370?text=Hi%2C%20I%27d%20like%20to%20book%20a%20free%2015%20minute%20call" target="_blank" rel="noopener noreferrer">
                  Book Free 15 Minute Call
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/60 text-white hover:bg-white hover:text-black rounded-none uppercase tracking-widest px-6 sm:px-8 h-12 sm:h-14 text-xs sm:text-sm font-bold bg-black/20 backdrop-blur-sm transition-all duration-300 hover:scale-105" data-testid="button-join-mentorship">
                <a href="#courses">
                  View Courses <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 text-white/75 hover:border-white hover:bg-white hover:text-black rounded-none uppercase tracking-widest px-6 sm:px-8 h-12 sm:h-14 text-xs sm:text-sm font-bold bg-black/20 backdrop-blur-sm transition-all duration-300 hover:scale-105" data-testid="button-recommended-broker">
                <a href={recommendedBrokerUrl} target="_blank" rel="noopener noreferrer">
                  Recommended Broker <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[260px] xl:w-[280px]"
            style={{
              y: phoneY,
              rotateZ: phoneRotateZ,
              scale: phoneScale,
              opacity: phoneOpacity,
            }}
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <motion.div
              className="relative rounded-[32px] sm:rounded-[36px] lg:rounded-[40px] border-[5px] sm:border-[6px] border-neutral-700 bg-black shadow-[0_0_40px_rgba(0,0,0,0.6),0_0_80px_rgba(255,255,255,0.02)] overflow-hidden"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] sm:w-[90px] lg:w-[100px] h-[22px] sm:h-[25px] lg:h-[28px] bg-black rounded-b-xl sm:rounded-b-2xl z-10" />
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[27px] sm:rounded-[30px] lg:rounded-[34px]">
                <img
                  src={tradingScreenshot}
                  alt="Live trading results"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 w-[80px] sm:w-[90px] lg:w-[100px] h-[3px] sm:h-[4px] bg-neutral-600 rounded-full" />
              <motion.div
                className="absolute inset-0 rounded-[27px] sm:rounded-[30px] lg:rounded-[34px] border border-white/10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 hidden md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{ opacity: useTransform(smooth, [0, 0.15], [0.5, 0]) }}
      >
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">Scroll</span>
        <motion.div
          className="w-[1px] h-10 bg-gradient-to-b from-white/50 to-transparent"
          animate={{ scaleY: [1, 0.5, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
