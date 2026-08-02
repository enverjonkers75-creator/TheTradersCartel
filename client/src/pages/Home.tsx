import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Mentorship } from "@/components/sections/Mentorship";
import { Courses } from "@/components/sections/Courses";
import { LearningPath } from "@/components/sections/LearningPath";
import { Reviews } from "@/components/sections/Reviews";
import { Join } from "@/components/sections/Join";
import { FAQ } from "@/components/sections/FAQ";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { BlackHoleBackground } from "@/components/ui/black-hole-background";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-hidden relative">
      <BlackHoleBackground />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <About />
        <Mentorship />
        <Courses />
        <LearningPath />
        <Reviews />
        <Join />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
