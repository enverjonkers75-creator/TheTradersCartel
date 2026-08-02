import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Mail, Phone, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const contactMethods = [
  {
    icon: Mail,
    label: "Email Us",
    value: "thetraderscartelcpt@gmail.com",
    href: "mailto:thetraderscartelcpt@gmail.com",
  },
  {
    icon: Phone,
    label: "Call / WhatsApp",
    value: "+27 83 686 4370",
    href: "tel:+27836864370",
  },
  {
    icon: Instagram,
    label: "Follow On Instagram",
    value: "@thetraderscartel",
    href: "https://instagram.com/thetraderscartel",
    external: true,
  },
];

export function Contact() {
  const { toast } = useToast();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  const sectionOpacity = useTransform(smooth, [0, 0.15], [0, 1]);
  const sectionY = useTransform(smooth, [0, 0.15], [80, 0]);
  const leftX = useTransform(smooth, [0.05, 0.3], [-60, 0]);
  const leftOpacity = useTransform(smooth, [0.05, 0.25], [0, 1]);
  const rightX = useTransform(smooth, [0.1, 0.35], [60, 0]);
  const rightOpacity = useTransform(smooth, [0.1, 0.3], [0, 1]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        let message = "Please try again or contact us directly.";
        try {
          const body = await res.json();
          if (typeof body?.message === "string") {
            message = body.message;
          }
        } catch {
          // Ignore malformed response bodies and keep the fallback message.
        }
        throw new Error(message);
      }
      toast({
        title: "Message Sent",
        description: "We'll get back to you shortly.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Message could not be sent",
        description:
          error instanceof Error
            ? error.message
            : "Please try again or contact us directly.",
        variant: "destructive",
      });
    }
  }

  return (
    <motion.section
      ref={ref}
      id="contact"
      className="py-24 bg-transparent border-t border-white/5 relative"
      style={{ opacity: sectionOpacity, y: sectionY }}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[-1]" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <motion.div style={{ x: leftX, opacity: leftOpacity }}>
            <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">Get In Touch</h2>
            <h3 className="text-4xl md:text-5xl font-bold uppercase mb-8">Contact Us</h3>
            <p className="text-neutral-400 text-lg mb-12 font-light">
              Ready to take your trading to the next level? Have questions about the mentorship? Reach out to us directly.
            </p>

            <div className="space-y-8">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={index}
                  href={method.href}
                  target={method.external ? "_blank" : undefined}
                  rel={method.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-6 group"
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ x: 8, transition: { duration: 0.2 } }}
                >
                  <div className="h-12 w-12 border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 bg-black/30 backdrop-blur-sm group-hover:scale-110">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-widest text-neutral-500 mb-1">{method.label}</span>
                    <span className="text-xl text-white font-medium group-hover:text-neutral-300 transition-colors">{method.value}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-black/40 p-8 border border-white/10 backdrop-blur-md"
            style={{ x: rightX, opacity: rightOpacity }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs tracking-widest text-neutral-400">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="bg-black/50 border-white/10 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white text-white backdrop-blur-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs tracking-widest text-neutral-400">Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} className="bg-black/50 border-white/10 h-12 rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white text-white backdrop-blur-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase text-xs tracking-widest text-neutral-400">Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How can we help you?" {...field} className="bg-black/50 border-white/10 min-h-[150px] rounded-none focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white text-white resize-none backdrop-blur-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-300 rounded-none uppercase tracking-widest h-12 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  Send Message <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
