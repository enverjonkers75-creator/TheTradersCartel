import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is the mentorship live or self paced?",
    answer: "Our mentorship includes both live sessions and self paced study materials. The Zoom and In Person options feature live interactive sessions where you can ask questions and see real time market analysis."
  },
  {
    question: "Do I need prior trading experience?",
    answer: "No prior experience is strictly necessary, but a basic understanding of financial markets is helpful. We cover everything from foundational concepts to advanced institutional strategies."
  },
  {
    question: "How can I reach out if I have questions?",
    answer: "You can contact us directly via WhatsApp, email, or Instagram DM. We pride ourselves on being accessible to our students."
  },
  {
    question: "What makes this different from other courses?",
    answer: "TheTradersCartel is focused on live execution and psychology, not just theory. Imaad is a funded trader with verified results, teaching what actually works in live market conditions."
  }
];

export function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const sectionOpacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);
  const sectionY = useTransform(smooth, [0, 0.15], [80, 0]);
  const headingY = useTransform(smooth, [0.05, 0.25], [50, 0]);
  const headingOpacity = useTransform(smooth, [0.05, 0.2], [0, 1]);

  return (
    <motion.section
      ref={ref}
      id="faq"
      className="py-24 bg-transparent border-t border-white/5 relative"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-[-1]" />

      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          className="text-center mb-16"
          style={{ y: headingY, opacity: headingOpacity }}
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">Common Questions</h2>
          <h3 className="text-4xl md:text-5xl font-bold uppercase mb-6">FAQ</h3>
        </motion.div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <AccordionItem value={`item-${index}`} className="border border-white/10 bg-black/40 px-6 rounded-none data-[state=open]:border-white/30 transition-all duration-500 backdrop-blur-sm hover:bg-black/60 hover:border-white/20">
                <AccordionTrigger className="text-lg font-medium text-white hover:text-neutral-300 hover:no-underline uppercase tracking-wide py-6 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-400 pb-6 text-base leading-relaxed font-light">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </motion.section>
  );
}
