import { AnimatedCounter } from "@/components/ui/animated-counter";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import imaadPortrait from "@/assets/imaad-seminar-upper.png";

const ease = [0.22, 1, 0.36, 1] as const;

export function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/5 bg-[#202020] py-20 sm:py-24 lg:py-0"
    >
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.08)_48%,transparent_72%)]" />
      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-16 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-20 xl:gap-28">
          <motion.div
            className="relative order-2 min-h-[560px] sm:min-h-[650px] lg:order-1 lg:min-h-[calc(100vh-64px)]"
            initial={{ opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease }}
          >
            <div className="absolute inset-x-[8%] bottom-16 top-[8%] rounded-[48%] bg-black/75 blur-[70px]" />
            <motion.img
              src={imaadPortrait}
              alt="Imaad, founder of TheTradersCartel"
              className="absolute inset-x-0 bottom-16 z-10 h-[calc(100%_-_7rem)] w-full object-contain object-bottom"
              initial={{ scale: 0.96 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.05, ease }}
              style={{
                filter:
                  "drop-shadow(0 0 9px rgba(0,0,0,1)) drop-shadow(0 0 24px rgba(0,0,0,0.96)) drop-shadow(0 0 52px rgba(0,0,0,0.72))",
              }}
            />
            <div className="absolute bottom-2 left-2 z-20 sm:left-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45 sm:text-xs">
                Founder &amp; Mentor
              </p>
              <p className="mt-2 font-display text-4xl font-bold uppercase leading-none text-white sm:text-5xl">
                Imaad
              </p>
            </div>
          </motion.div>

          <motion.div
            className="order-1 max-w-2xl lg:order-2 lg:py-12"
            initial={{ opacity: 0, x: 48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.08, ease }}
          >
            <p className="text-xs uppercase tracking-[0.34em] text-white/35">About The Mentor</p>
            <h2 className="mt-5 text-5xl font-bold uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Hi, I&apos;m Imaad.
            </h2>

            <div className="mt-10 max-w-xl space-y-5 text-base font-light leading-7 text-white/48 sm:text-lg sm:leading-8">
              <p>
                I&apos;ve been trading the markets for over <strong className="font-medium text-white">11 years</strong>. Through discipline and a relentless pursuit of understanding price action, I&apos;ve built a repeatable approach to the markets.
              </p>
              <p>
                As a <strong className="font-medium text-white">6 figure funded trader</strong>, I teach from live experience. I trade, risk my own capital and show students how the process works in real market conditions.
              </p>
              <p>
                TheTradersCartel is mentorship built to shorten the learning curve and help aspiring traders become disciplined, consistent professionals.
              </p>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 gap-5 sm:gap-10">
              <Stat value={<AnimatedCounter value={11} suffix="+" />} label="Years experience" />
              <Stat value="6 Fig" label="Funded trader" />
              <Stat value={<AnimatedCounter value={500} suffix="+" />} label="Students" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
    >
      <span className="block font-display text-3xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-1 sm:text-4xl">
        {value}
      </span>
      <span className="mt-2 block text-[9px] uppercase tracking-[0.2em] text-white/28 sm:text-[10px]">
        {label}
      </span>
    </motion.div>
  );
}
