import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({ children, className = "", delay = 0, direction = "up" }: FadeInProps) {
  const directions = {
    up: { y: 80, x: 0 },
    down: { y: -80, x: 0 },
    left: { y: 0, x: 80 },
    right: { y: 0, x: -80 },
    none: { y: 0, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)", ...directions[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
        filter: { duration: 0.7, delay },
        scale: { duration: 0.7, delay },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
