import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";
import tradingCityscape from "@/assets/trading-cityscape.png";

const steps = [
  {
    num: "01",
    title: "Choose Your Option",
    desc: "Select the mentorship path that fits your learning style: In Person, Zoom, or Seminar."
  },
  {
    num: "02",
    title: "Secure Your Spot",
    desc: "Complete the payment to lock in your mentorship. Spaces are strictly limited."
  },
  {
    num: "03",
    title: "Get Access",
    desc: "Receive immediate access to our community and scheduling details for your sessions."
  }
];

function StepItem({ step, index }: { step: typeof steps[0]; index: number }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(itemRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={itemRef}
      className="flex gap-6 group cursor-default"
      data-testid={`step-${step.num}`}
      initial={{ opacity: 0, x: -80, scale: 0.9 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="text-4xl font-display font-bold text-neutral-700 transition-colors duration-300 group-hover:text-neutral-500"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: index * 0.2 + 0.2, type: "spring", stiffness: 200 }}
      >
        {step.num}
      </motion.div>
      <div>
        <h4 className="text-xl font-bold uppercase text-white mb-2 transition-transform duration-300 group-hover:translate-x-2">{step.title}</h4>
        <p className="text-neutral-400 max-w-sm transition-colors duration-300 group-hover:text-neutral-300">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export function Join() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const imgScale = useTransform(smooth, [0, 0.3, 0.7, 1], [1.3, 1.1, 1, 1.15]);
  const imgY = useTransform(smooth, [0, 1], [-40, 40]);
  const imgRotate = useTransform(smooth, [0, 1], [-1, 1]);

  const sectionOpacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);
  const sectionY = useTransform(smooth, [0, 0.15], [80, 0]);

  const quoteX = useTransform(smooth, [0.2, 0.5], [100, 0]);
  const quoteOpacity = useTransform(smooth, [0.2, 0.45], [0, 1]);
  const quoteScale = useTransform(smooth, [0.2, 0.5], [0.9, 1]);

  return (
    <motion.section
      ref={ref}
      id="join"
      className="relative border-t border-white/5 overflow-hidden"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <motion.div
        className="absolute inset-0 z-[-2]"
        style={{ y: imgY, scale: imgScale, rotate: imgRotate }}
      >
        <img
          src={tradingCityscape}
          alt=""
          className="w-full h-full object-cover filter grayscale contrast-125 brightness-[0.15]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/70 z-[-1]" />

      <div className="grid lg:grid-cols-2">
        <div className="p-8 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/30 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">Start Your Journey</h2>
            <h3 className="text-4xl md:text-5xl font-bold uppercase mb-12">How Do I Join?</h3>
          </motion.div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <StepItem key={index} step={step} index={index} />
            ))}
          </div>

          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-300 rounded-none uppercase tracking-widest px-10 h-14 text-sm font-bold w-full md:w-auto hover:scale-105 transition-all duration-300">
              <a href="#contact">Contact To Enroll</a>
            </Button>
          </motion.div>
        </div>

        <div className="relative p-8 md:p-16 lg:p-24 flex items-center bg-black/40 overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />

          <motion.div
            className="relative z-10"
            style={{ x: quoteX, opacity: quoteOpacity, scale: quoteScale }}
          >
            <div className="border-l-4 border-white pl-8 md:pl-12 py-4">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase leading-tight text-white mb-6">
                "I Don't Take On Just Anyone. This Is A Focused Space For Traders Who Are Ready To Grow."
              </h3>
              <p className="text-xl text-neutral-400 font-light">
                If you are looking for a quick money scheme, this isn't for you. We build discipline, patience, and skill.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
