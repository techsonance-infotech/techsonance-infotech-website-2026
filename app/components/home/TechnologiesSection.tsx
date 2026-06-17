"use client";
import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@/app/components/icons/Icon";

export type TechLogoItem = {
  label: string;
  src: string;
  color?: string;
};

export type TechCard = {
  iconSvg: string;
  iconColor: string;
  title: string;
  description: string;
  items: TechLogoItem[];
};

export const techCards: TechCard[] = [
  {
    iconSvg: `<path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>`,
    iconColor: "#FF9900",
    title: "CLOUD PROVIDERS",
    description: "Scalable cloud platforms for every need.",
    items: [
      { label: "AWS", src: "/tech-icons/aws.svg", color: "#FF9900" },
      { label: "Azure", src: "/tech-icons/azure.svg", color: "#0078D4" },
      { label: "Google Cloud", src: "/tech-icons/googlecloud.svg", color: "#4285F4" },
    ],
  },
  {
    iconSvg: `<rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>`,
    iconColor: "#326CE5",
    title: "CONTAINER & ORCHESTRATION",
    description: "Build, ship and run applications anywhere.",
    items: [
      { label: "Kubernetes", src: "/tech-icons/kubernetes.svg", color: "#326CE5" },
      { label: "Docker", src: "/tech-icons/docker.svg", color: "#2496ED" },
      { label: "AWS EKS", src: "/tech-icons/aws.svg", color: "#FF9900" },
    ],
  },
  {
    iconSvg: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`,
    iconColor: "#4169E1",
    title: "DATABASES",
    description: "Robust, secure and high-performance databases.",
    items: [
      { label: "PostgreSQL", src: "/tech-icons/postgresql.svg", color: "#4169E1" },
      { label: "MySQL", src: "/tech-icons/mysql.svg", color: "#4479A1" },
      { label: "MongoDB", src: "/tech-icons/mongodb.svg", color: "#47A248" },
      { label: "Redis", src: "/tech-icons/redis.svg", color: "#DC382D" },
      { label: "Firebase", src: "/tech-icons/firebase.svg", color: "#FFCA28" },
    ],
  },
  {
    iconSvg: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    iconColor: "#F38020",
    title: "STORAGE & CDN",
    description: "Blazing fast storage and global content delivery.",
    items: [
      { label: "AWS S3", src: "/tech-icons/aws.svg", color: "#FF9900" },
      { label: "Cloudflare", src: "/tech-icons/cloudflare.svg", color: "#F38020" },
      { label: "BunnyCDN", src: "/tech-icons/aws.svg", color: "#F8A800" },
    ],
  },
  {
    iconSvg: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    iconColor: "#339933",
    title: "BACKEND & FRAMEWORKS",
    description: "Modern frameworks and backend technologies.",
    items: [
      { label: "Node.js", src: "/tech-icons/nodejs.svg", color: "#339933" },
      { label: "Python", src: "/tech-icons/python.svg", color: "#3776AB" },
      { label: ".NET", src: "/tech-icons/dotnet.svg", color: "#512BD4" },
    ],
  },
  {
    iconSvg: `<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>`,
    iconColor: "#412991",
    title: "AI / ML PLATFORMS",
    description: "Leading AI models and ML platforms.",
    items: [
      { label: "OpenAI", src: "/tech-icons/openai.svg", color: "#412991" },
      { label: "Claude", src: "/tech-icons/claude.svg", color: "#D97757" },
      { label: "Gemini", src: "/tech-icons/gemini.svg", color: "#4285F4" },
    ],
  },
  {
    iconSvg: `<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M20.94 9A10 10 0 0 0 3.05 9M20.94 15a10 10 0 0 1-17.89 0M19.07 19.07a10 10 0 0 1-14.14 0"/>`,
    iconColor: "#22C55E",
    title: "VECTOR DATABASES",
    description: "Powerful vector databases for AI applications.",
    items: [
      { label: "Pinecone", src: "/tech-icons/pinecone.svg", color: "#000000" },
      { label: "Weaviate", src: "/tech-icons/weaviate.svg", color: "#22C55E" },
      { label: "Qdrant", src: "/tech-icons/sentry.svg", color: "#BA1A1A" },
    ],
  },
  {
    iconSvg: `<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`,
    iconColor: "#F46800",
    title: "MONITORING & DEVOPS",
    description: "Monitor, log and optimize your applications.",
    items: [
      { label: "Grafana", src: "/tech-icons/grafana.svg", color: "#F46800" },
      { label: "Prometheus", src: "/tech-icons/prometheus.svg", color: "#E6522C" },
      { label: "Sentry", src: "/tech-icons/sentry.svg", color: "#362D59" },
    ],
  },
  {
    iconSvg: `<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>`,
    iconColor: "#61DAFB",
    title: "FRONTEND SYSTEMS",
    description: "Interactive user interfaces and client-side systems.",
    items: [
      { label: "React", src: "/tech-icons/react.svg", color: "#61DAFB" },
      { label: "Next.js", src: "/tech-icons/nextjs.svg", color: "#000000" },
      { label: "TypeScript", src: "/tech-icons/typescript.svg", color: "#3178C6" },
      { label: "Tailwind CSS", src: "/tech-icons/tailwind.svg", color: "#38BDF8" },
      { label: "Redux", src: "/tech-icons/redux.svg", color: "#764ABC" },
    ],
  },
  {
    iconSvg: `<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`,
    iconColor: "#E0234E",
    title: "BACKEND ENGINEERING",
    description: "Scalable backend APIs and serverless backends.",
    items: [
      { label: "Express.js", src: "/tech-icons/express.svg", color: "#353535" },
      { label: "NestJS", src: "/tech-icons/nestjs.svg", color: "#E0234E" },
      { label: "GraphQL", src: "/tech-icons/graphql.svg", color: "#E10098" },
      { label: "Supabase", src: "/tech-icons/supabase.svg", color: "#3ECF8E" },
    ],
  },
  {
    iconSvg: `<path d="M12 2a10 10 0 0 1 10 10v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1a10 10 0 0 1 10-10zm0 4a6 6 0 0 0-6 6v1h12v-1a6 6 0 0 0-6-6z"/>`,
    iconColor: "#FF6D5A",
    title: "AI AUTOMATION",
    description: "AI orchestrators, agents, and automated scraping.",
    items: [
      { label: "Langchain", src: "/tech-icons/langchain.svg", color: "#000000" },
      { label: "n8n", src: "/tech-icons/n8n.svg", color: "#FF6D5A" },
      { label: "Puppeteer", src: "/tech-icons/puppeteer.svg", color: "#04D0BF" },
    ],
  },
  {
    iconSvg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    iconColor: "#1B223C",
    title: "DEV TOOLS & ORM",
    description: "Object-relational mapping and deployment pipelines.",
    items: [
      { label: "Prisma", src: "/tech-icons/prisma.svg", color: "#1B223C" },
      { label: "Vercel", src: "/tech-icons/vercel.svg", color: "#000000" },
      { label: "GitHub Actions", src: "/tech-icons/githubactions.svg", color: "#2088FF" },
      { label: "Nginx", src: "/tech-icons/nginx.svg", color: "#009639" },
    ],
  },
];

export default function TechnologiesSection() {
  return (
    <section className="relative z-20 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8 bg-[#0D47A1]/40" />
            <span className="text-xs font-extrabold text-[#0D47A1] tracking-[0.15em] uppercase">Infrastructure & Technologies</span>
            <div className="h-px w-8 bg-[#0D47A1]/40" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Infrastructure &amp; Tech<br className="hidden sm:block" /> <span className="brand-gradient-text">We Work With</span>
          </h2>
          <p className="text-[16px] text-gray-500 leading-relaxed max-w-xl mx-auto">
            Enterprise-grade platforms and technologies to build, scale and secure your applications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {techCards.map((card) => (
            <motion.article
              key={card.title}
              whileHover={{ y: -5, scale: 1.02, boxShadow: "0 20px 40px rgba(13,71,161,0.10), 0 4px 12px rgba(0,0,0,0.04)" }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-blue-100/70 transition-colors cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: card.iconColor + "18" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={card.iconColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4.5 w-4.5"
                    dangerouslySetInnerHTML={{ __html: card.iconSvg }}
                  />
                </div>
                <div>
                  <h3 className="text-[11px] font-extrabold text-gray-800 uppercase tracking-[0.1em] leading-tight mb-1">{card.title}</h3>
                  <p className="text-[12px] text-gray-500 leading-snug">{card.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
                {card.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 group">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 p-1 flex items-center justify-center transition-all group-hover:border-blue-100 group-hover:bg-white group-hover:shadow-sm">
                      <img
                        src={item.src}
                        alt={item.label}
                        width={28}
                        height={28}
                        className="w-full h-full object-contain"
                        style={{ filter: item.color === "#000000" ? "none" : undefined }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
