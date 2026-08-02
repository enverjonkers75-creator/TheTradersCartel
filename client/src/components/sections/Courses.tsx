import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useRef } from "react";

const courses = [
  {
    title: "Seminars",
    price: "Free",
    features: [
      "One Day Intensive Event",
      "Market Overview",
      "Networking Opportunity",
      "Q&A Session",
      "Introduction to Strategy"
    ],
    cta: "Reserve Your Seat",
    popular: false,
    paymentUrl: "https://wa.me/27836864370?text=Hi%2C%20I%27d%20like%20to%20reserve%20a%20seat%20at%20the%20next%20free%20seminar"
  },
  {
    title: "Video Conference Mentorship",
    price: "R 1999",
    features: [
      "Live Online Sessions",
      "Access to Recordings",
      "Discord Community Access",
      "Weekly Market Breakdown",
      "Direct Support"
    ],
    cta: "Buy Now",
    popular: true,
    paymentUrl: "https://pay.yoco.com/r/73raEK"
  },
  {
    title: "In Person Mentorship",
    price: "R 2999",
    features: [
      "Physical Classroom Setting",
      "Hands on Guidance",
      "Live Trading Floor Experience",
      "Personal One on One Feedback",
      "Lifetime Community Access"
    ],
    cta: "Buy Now",
    popular: false,
    paymentUrl: "https://pay.yoco.com/r/7ygEnO"
  }
];

function CourseCard({ course, index }: { course: typeof courses[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-80px" });
  const rotations = [-3, 0, 3];

  return (
    <motion.div
      ref={cardRef}
      className="h-full perspective-[1000px]"
      initial={{ opacity: 0, y: 100, rotateY: rotations[index] * 3, scale: 0.85 }}
      animate={isInView ? { opacity: 1, y: 0, rotateY: 0, scale: 1 } : {}}
      transition={{
        duration: 0.9,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -12,
        rotateY: rotations[index],
        scale: 1.02,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
    >
      <Card className={`h-full border flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] ${course.popular ? 'border-white bg-neutral-900 shadow-[0_0_30px_rgba(255,255,255,0.05)] md:-mt-4 md:mb-4' : 'border-white/10 bg-neutral-900/80 hover:bg-neutral-900 hover:border-white/30'}`} data-testid={`card-course-${index}`}>
        {course.popular && (
          <div className="absolute top-0 inset-x-0 bg-white text-black text-center text-xs font-bold uppercase tracking-widest py-1">
            Most Popular
          </div>
        )}
        <CardHeader className="pt-12 text-center pb-2">
          <CardTitle className="text-xl uppercase tracking-wider text-neutral-400 font-light">{course.title}</CardTitle>
          <div className="text-5xl font-bold text-white mt-4 font-display">{course.price}</div>
        </CardHeader>
        <CardContent className="flex-grow pt-8">
          <ul className="space-y-4">
            {course.features.map((feature, i) => (
              <motion.li
                key={i}
                className="flex items-center gap-3 text-sm text-neutral-300"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.15 + i * 0.08 + 0.3, duration: 0.5 }}
              >
                <div className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                {feature}
              </motion.li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pb-8 pt-4">
          {/* BUY NOW BUTTON: Links to external payment URL. Replace placeholder URLs in the courses array above with real payment links. */}
          {/* POST-PAYMENT FLOW: After purchase, your payment provider (e.g. PayFast, Yoco, Stripe) should redirect users to a Google Form for onboarding. */}
          {/* Configure the redirect URL in your payment provider's dashboard. Do not embed the Google Form on this page. */}
          <Button asChild className={`w-full rounded-none uppercase tracking-widest h-12 text-sm font-bold transition-all duration-300 ${course.popular ? 'bg-white text-black hover:bg-neutral-300 hover:scale-[1.02]' : 'bg-transparent border border-white text-white hover:bg-white hover:text-black hover:scale-[1.02]'}`} data-testid={`button-buy-${index}`}>
            <a href={course.paymentUrl} target="_blank" rel="noopener noreferrer">{course.cta}</a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function Courses() {
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
      id="courses"
      className="py-24 relative overflow-hidden border-t border-white/5 bg-neutral-800"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          style={{ y: headingY, opacity: headingOpacity }}
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">Choose Your Path</h2>
          <h3 className="text-4xl md:text-5xl font-bold uppercase mb-6">Invest In Yourself</h3>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course, index) => (
            <CourseCard key={index} course={course} index={index} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
