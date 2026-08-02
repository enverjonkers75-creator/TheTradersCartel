import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/sections/Footer";

type GalleryCollection = { date: string; edition: string; location: string; photos: string[] };

const seminarPhotos = (folder: string, count: number) =>
  Array.from({ length: count }, (_, index) => `/gallery/${folder}/${String(index + 1).padStart(2, "0")}.webp`);

const collections: GalleryCollection[] = [
  { date: "09 May 2026", edition: "Seminar 03", location: "Cape Town", photos: seminarPhotos("seminar-3", 33) },
  { date: "07 February 2026", edition: "Seminar 01", location: "Cape Town", photos: seminarPhotos("seminar-1", 57) },
  { date: "26 July 2025", edition: "Seminar 02", location: "Cape Town", photos: seminarPhotos("seminar-2", 47) },
];

const tileClasses = [
  "col-span-2 aspect-[3/2] md:col-start-2 md:col-span-3 md:row-start-1 md:row-span-2 md:aspect-auto",
  "md:col-start-1 md:row-start-1",
  "md:col-start-1 md:row-start-2",
  "md:col-start-5 md:row-start-1",
  "md:col-start-5 md:row-start-2",
  "md:col-start-1 md:row-start-3",
  "md:col-start-2 md:row-start-3",
  "md:col-start-3 md:row-start-3",
  "md:col-start-4 md:row-start-3",
  "md:col-start-5 md:row-start-3",
];

function Mosaic({ collection }: { collection: GalleryCollection }) {
  const groups = Array.from(
    { length: Math.ceil(collection.photos.length / tileClasses.length) },
    (_, index) => collection.photos.slice(index * tileClasses.length, (index + 1) * tileClasses.length),
  );

  return <div className="space-y-3 md:space-y-5">
    {groups.map((photos, groupIndex) => {
      const isCompleteGroup = photos.length === tileClasses.length;

      return <div
        key={`${collection.date}-group-${groupIndex}`}
        className={`grid grid-cols-2 gap-2 sm:gap-3 ${isCompleteGroup ? "md:aspect-[5/3] md:grid-cols-5 md:grid-rows-3" : "md:grid-cols-4"}`}
      >
        {photos.map((photo, index) => {
          const photoNumber = groupIndex * tileClasses.length + index + 1;
          const layoutClass = isCompleteGroup
            ? `${index === 0 ? "aspect-[3/2]" : "aspect-square md:aspect-auto"} ${tileClasses[index]}`
            : index === 0
              ? "col-span-2 aspect-[2/1]"
              : "aspect-square";

          return <motion.div
            key={photo}
            className={`group relative min-h-0 overflow-hidden bg-[#0b0b0b] ${layoutClass}`}
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.75, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
          >
          <img
            src={photo}
            alt={`${collection.edition} moment ${photoNumber}`}
            className={`h-full w-full object-cover saturate-[0.92] transition duration-700 ease-out group-hover:scale-[1.035] group-hover:saturate-100 ${index === 0 ? "object-top" : ""}`}
            loading="lazy"
            decoding="async"
          />
            <span className="absolute bottom-4 left-4 font-mono text-[9px] tracking-widest text-white/45">
              {String(photoNumber).padStart(2, "0")}
            </span>
          </motion.div>;
        })}
      </div>;
    })}
  </div>;
}

export default function GalleryPage() {
  return <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
    <Navbar />
    <main className="pb-24 pt-32 sm:pt-40">
      <header className="container mx-auto px-4 pb-20">
        <a href="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/35 transition hover:text-white"><ArrowLeft className="size-3" />Back home</a>
        <div className="mt-14 grid gap-10 border-b border-white/10 pb-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div><p className="text-xs uppercase tracking-[0.34em] text-white/35">Seminar archive</p><h1 className="mt-5 text-6xl font-bold uppercase leading-[0.82] sm:text-8xl lg:text-9xl">In the<br />room.</h1></div>
          <p className="max-w-md text-sm leading-7 text-white/42 lg:justify-self-end">Real rooms. Real charts. Real conversations. A growing archive of TheTradersCartel seminars, organised by event date.</p>
        </div>
      </header>

      <div className="space-y-16 sm:space-y-20">
        {collections.map((collection, index) => <section key={collection.date} className="container mx-auto px-4">
          <div className="mb-7 flex flex-col gap-5 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5"><span className="font-display text-4xl text-white/15">{String(index + 1).padStart(2, "0")}</span><div><p className="text-[10px] uppercase tracking-[0.25em] text-white/30">{collection.edition}</p><h2 className="mt-1 text-2xl font-semibold uppercase sm:text-3xl">{collection.date}</h2></div></div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{collection.location} · {collection.photos.length} photographs</p>
          </div>
          <Mosaic collection={collection} />
        </section>)}
      </div>
    </main>
    <Footer />
  </div>;
}
