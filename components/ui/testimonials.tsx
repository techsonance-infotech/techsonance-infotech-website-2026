"use client";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "motion/react";

const testimonials = [
  {
    text: "Before partnering with TechSonance, we were drowning in physical LRs and manual trip-cost Excel sheets. The custom platform they built gave us real-time visibility into route profitability. Our operations are now 100% digital.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Rajesh Grover",
    role: "Founder, Grover Roadlines",
  },
  {
    text: "TechSonance solved all our GST compliance headaches with HisaabKitaab. Their real-time validation logic means zero manual calculation errors. Creating compliance-ready invoices now takes under 5 minutes.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Sunita Sharma",
    role: "Managing Director, Sharma Trading Co.",
  },
  {
    text: "TechSonance's SyncServe POS is an absolute lifesaver. The offline-first implementation they designed ensures our checkouts never stop even when connection drops. Stock discrepancies are now zero.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Rohan Malhotra",
    role: "Operations Head, Choice Supermarkets",
  },
  {
    text: "Managing three isolated portals for customers, vendors, and admins in one app seemed impossible. TechSonance delivered under-200ms cart updates and a robust Redux state middleware that works flawlessly.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Priya Patel",
    role: "E-Commerce Director, SoundSphere Ltd.",
  },
  {
    text: "The custom NFC attendance system designed by TechSonance is frictionless. Auto-syncing from local hardware buffers to our HR dashboard has eliminated buddy-punching and saved tons of payroll time.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Devendra Prasad",
    role: "HR Director, NeoTech Solutions",
  },
  {
    text: "Our industrial painting business had zero digital footprint. TechSonance redesigned our brand online with high-performing SEO schemas. We were indexed on Google within 48 hours and saw a 3x jump in inbound leads.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    name: "Mahendra Agraj",
    role: "Managing Partner, Agraj Enterprise",
  },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

export const Testimonials = () => {
  return (
    <section className="bg-transparent my-20 relative">
      <div className="container z-10 mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center">
            <div className="bg-[#F1F5F9] border border-[#1155CC]/15 rounded-full px-4 py-1.5 text-xs font-bold text-[#1155CC] tracking-wide uppercase">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-5 text-slate-900">
            What our clients say
          </h2>
          <p className="text-center mt-5 text-slate-600">
            See what our clients have to say about us and how our solutions transformed their workflows.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[600px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
