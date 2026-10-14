"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import BookConsultationModal from "@/app/components/home/BookConsultationModal";
import { Button } from "@/components/ui/button";

function HeroCTAButtons({ onBookClick }: { onBookClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <Button
        onClick={onBookClick}
        variant="primary"
        size="default"
        showArrow
      >
        Book Free Consultation
      </Button>

      <Button
        asChild
        variant="secondary"
        size="default"
        showArrow
      >
        <Link href="/portfolio">View Case Studies</Link>
      </Button>
    </div>
  );
}

function HeroHeadline() {
  return (
    <h1 className="text-[2.25rem] font-medium leading-[1.15] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-[4rem] 2xl:text-[4.5rem]">
      We Build <span className="italic text-[#1155CC]">Digital Products</span>
      <br />
      That Drive Growth.
    </h1>
  );
}

/**
 * ---------------------------------------------------------------------------
 * Trusted-clients marquee
 * ---------------------------------------------------------------------------
 * Real client logos, shown in full color at all times (no grayscale
 * treatment — these are polished brand marks, not placeholder text, so
 * desaturating them would waste that work). Each logo card is a fixed
 * height with `object-contain`, so wildly different logo aspect ratios
 * (a wide horizontal wordmark vs. a compact square mark) all sit on the
 * same visual baseline instead of some looking huge and others tiny.
 *
 * Mechanics: the track is duplicated once and the whole pair animates with
 * a single `translateX(-50%)` keyframe — since the second copy is
 * pixel-identical to the first, the loop point is invisible, so it reads as
 * a genuinely infinite stream rather than a strip that resets/jumps.
 */
interface ClientLogoData {
  name: string;
  url: string;
  src: string;
  /** Some logos (e.g. wide wordmarks) need more width than others to render
   * at a comparable visual size — kept per-logo rather than forcing one
   * fixed width on every card. */
  width: number;
  className?: string;
}

const trustedClients: ClientLogoData[] = [
  { name: "Zion", url: "/portfolio/zion", src: "/images/clients/zion.png", width: 180, className: "h-10 sm:h-12 scale-125" },
  { name: "Utsav", url: "/portfolio/utsav", src: "/images/clients/utsav.png", width: 150, className: "h-9 sm:h-11 scale-110" },
  { name: "AccuNest", url: "https://accunest.techsonance.co.in/", src: "/images/clients/accunest.webp", width: 150 },
  { name: "TechSonance Marketplace", url: "https://marketplace.techsonance.co.in/", src: "/images/clients/marketplace.png", width: 170 },
  { name: "SyncServe", url: "https://syncserve.techsonance.co.in/", src: "/images/clients/syncserve.png", width: 140 },
  { name: "FreightFlow", url: "https://freightflow.techsonance.co.in/", src: "/images/clients/freightflow.png", width: 240 },
  { name: "Masterweg", url: "https://masterweg.com/", src: "/images/clients/masterweg.png", width: 150 },
];

function ClientLogo({ client }: { client: ClientLogoData }) {
  const isExternal = client.url.startsWith("http");
  return (
    <a
      href={client.url}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-16 shrink-0 items-center justify-center px-8 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-105"
      aria-label={client.name}
    >
      <Image
        src={client.src}
        alt={client.name}
        width={client.width}
        height={48}
        loading="eager"
        className={`w-auto object-contain ${client.className || "h-8 sm:h-10"}`}
      />
    </a>
  );
}

function TrustedClientsMarquee() {
  return (
    <div className="w-full border-t border-gray-100 py-10">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
        Engineered &amp; Trusted by Global Clients
      </p>

      <div
        className="relative w-full overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
      >
        <div className="marquee-track flex w-max items-center">
          {[...trustedClients, ...trustedClients].map((client, i) => (
            <ClientLogo key={`${client.name}-${i}`} client={client} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

export default function HeroSection() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  return (
    <>
      <section className="relative flex flex-col items-center overflow-hidden bg-white px-4 sm:px-6 xl:px-10 min-[1920px]:px-15 pb-4 pt-30 sm:pt-36 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        >
          <HeroHeadline />

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
            From startups to global brands. we design, develop, and deliver
            high-performing web and mobile solutions that turn ideas into
            impact.
          </p>

          <div className="mt-10">
            <HeroCTAButtons onBookClick={() => setIsBookModalOpen(true)} />
          </div>
        </motion.div>

        <div className="mt-20 w-full max-w-7xl mx-auto">
          <TrustedClientsMarquee />
        </div>
      </section>
      <BookConsultationModal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} />
    </>
  );
}
