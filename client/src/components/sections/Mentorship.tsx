import { CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";
import mentorshipGroup from "@/assets/mentorship-group.png";

const curriculum = [
  "Understanding Market Structure",
  "Institutional Price Action",
  "Supply & Demand Zones",
  "Liquidity Concepts",
  "Risk Management Protocols",
  "Psychology & Mindset Mastery",
  "Funding Challenge Strategy",
  "Daily Trading Routine",
  "Trade Execution & Management",
  "Backtesting & Journaling",
  "Top Down Analysis",
  "Entries, Exits & Stop Losses"
];

function CurriculumItem({ item, index }: { item: string; index: number }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(itemRef, { once: true, margin: "-50px" });
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={itemRef}
      className="flex items-start gap-4 p-4 border border-white/5 bg-black/40 hover:bg-white/5 transition-all duration-500 group backdrop-blur-md hover:border-white/20"
      initial={{ opacity: 0, x: isLeft ? -60 : 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <CheckCircle2 className="w-6 h-6 text-white shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
      <span className="text-lg text-neutral-300 font-light group-hover:text-white transition-colors">
        {item}
      </span>
    </motion.div>
  );
}

export function Mentorship() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const bgY = useTransform(smooth, [0, 1], [-80, 80]);
  const bgScale = useTransform(smooth, [0, 0.3, 0.7, 1], [1.3, 1.1, 1.05, 1.2]);
  const bgRotate = useTransform(smooth, [0, 1], [-2, 2]);

  const sectionOpacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);
  const sectionY = useTransform(smooth, [0, 0.15], [80, 0]);

  const headingY = useTransform(smooth, [0.1, 0.3], [60, 0]);
  const headingOpacity = useTransform(smooth, [0.1, 0.25], [0, 1]);
  const headingScale = useTransform(smooth, [0.1, 0.3], [0.9, 1]);

  return (
    <motion.section
      ref={ref}
      id="mentorship"
      className="py-24 relative overflow-hidden border-t border-white/5"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <motion.div
        className="absolute inset-0 z-[-2]"
        style={{ y: bgY, scale: bgScale, rotate: bgRotate }}
      >
        <img
          src={mentorshipGroup}
          alt=""
          className="w-full h-full object-cover filter grayscale contrast-110 brightness-50"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/80 z-[-1]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_80%)] z-[-1]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            style={{ y: headingY, opacity: headingOpacity, scale: headingScale }}
          >
            <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">What You Will Learn</h2>
            <h3 className="text-4xl md:text-5xl font-bold uppercase mb-6">Mentorship Curriculum</h3>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              A comprehensive breakdown of the skills and strategies you need to master to become a consistently profitable trader.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            {curriculum.map((item, index) => (
              <CurriculumItem key={index} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
