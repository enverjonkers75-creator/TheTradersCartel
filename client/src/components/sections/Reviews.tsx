import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";
import lifestyleTrading from "@/assets/lifestyle-trading.png";

const reviews = [
  {
    name: "Michael T.",
    quote: "TheTradersCartel changed my perspective entirely. I was gambling before; now I have a system.",
    rating: 5
  },
  {
    name: "Sarah J.",
    quote: "Imaad's mentorship is direct and focused. Exactly what I needed to pass my funding challenge.",
    rating: 5
  },
  {
    name: "David K.",
    quote: "The community support alone is worth the price. Being around serious traders makes all the difference.",
    rating: 5
  },
  {
    name: "Thabo M.",
    quote: "Simple, effective, and focused on results. I finally understood liquidity concepts after struggling for years.",
    rating: 5
  }
];

function ReviewCard({ review, index }: { review: typeof reviews[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, rotateX: 10, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
    >
      <Card className="bg-black/50 border-white/10 h-full min-h-[250px] flex flex-col justify-between p-6 hover:bg-black/70 hover:border-white/20 transition-all duration-500 backdrop-blur-md">
        <CardContent className="p-0">
          <div className="flex gap-1 mb-4">
            {[...Array(review.rating)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.12 + i * 0.1 + 0.3, duration: 0.3, type: "spring" }}
              >
                <Star className="h-4 w-4 fill-white text-white" />
              </motion.div>
            ))}
          </div>
          <p className="text-lg text-neutral-300 italic mb-6 leading-relaxed">"{review.quote}"</p>
        </CardContent>
        <div className="pt-4 border-t border-white/5">
          <p className="font-display font-bold uppercase text-white tracking-wide">{review.name}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Verified Student</p>
        </div>
      </Card>
    </motion.div>
  );
}

export function Reviews() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const imgY = useTransform(smooth, [0, 1], [60, -60]);
  const imgScale = useTransform(smooth, [0, 0.3, 0.7, 1], [1.3, 1.1, 1, 1.15]);
  const imgRotate = useTransform(smooth, [0, 1], [-1, 1]);

  const sectionOpacity = useTransform(smooth, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);
  const sectionY = useTransform(smooth, [0, 0.15], [80, 0]);
  const headingY = useTransform(smooth, [0.05, 0.25], [50, 0]);
  const headingOpacity = useTransform(smooth, [0.05, 0.2], [0, 1]);
  const headingScale = useTransform(smooth, [0.05, 0.25], [0.9, 1]);

  return (
    <motion.section
      ref={ref}
      id="reviews"
      className="py-24 relative overflow-hidden border-t border-white/5"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <motion.div
        className="absolute inset-0 z-[-2]"
        style={{ y: imgY, scale: imgScale, rotate: imgRotate }}
      >
        <img
          src={lifestyleTrading}
          alt=""
          className="w-full h-full object-cover filter grayscale contrast-110 brightness-[0.2]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-black/70 z-[-1]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,black_85%)] z-[-1]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          style={{ y: headingY, opacity: headingOpacity, scale: headingScale }}
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">Success Stories</h2>
          <h3 className="text-4xl md:text-5xl font-bold uppercase mb-6">Student Reviews</h3>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {reviews.map((review, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <ReviewCard review={review} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-8 md:mt-12">
              <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-none border border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105" />
              <CarouselNext className="static translate-y-0 h-12 w-12 rounded-none border border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105" />
            </div>
          </Carousel>
        </div>
      </div>
    </motion.section>
  );
}
