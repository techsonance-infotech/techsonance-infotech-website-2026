"use client";

import Link from "next/link";
import Image from "next/image";
import { getProofOfWorkForService } from "@/lib/services-data";
import type { Service } from "@/lib/services-data";

interface ProofOfWorkProps {
  service: Service;
}

export default function ProofOfWork({ service }: ProofOfWorkProps) {
  const projects = getProofOfWorkForService(service.proofOfWork);

  return (
    <section id="proof-of-work" className="service-section bg-[var(--bg-subtle)] py-20 md:py-28">
      <div className="service-container">
        <div className="reveal-up mb-12 md:mb-16">
          <span className="section-label">Proof of Work</span>
          <h2
            className="text-[var(--text-primary)] font-extrabold tracking-tight"
            style={{ fontSize: "var(--text-section-title)" }}
          >
            Projects We&apos;ve Shipped
          </h2>
          <p className="text-[var(--text-secondary)] mt-3 text-base md:text-lg max-w-2xl">
            Real-world applications delivered for our clients. Built with the same engineering standards we bring to your project.
          </p>
        </div>

        <div className="card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={project.href}
              className="group card service-card flex flex-col overflow-hidden !p-0 bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--accent-blue)] transition-all duration-300 shadow-[var(--shadow-card)] rounded-[24px]"
            >
              {/* Image Container (16:9 aspect-video) */}
              <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-muted)] border-b border-[var(--border)]">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-blue)] mb-2">
                  {project.industry}
                </span>
                
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-blue)] transition-colors duration-200">
                  {project.name}
                </h3>
                
                <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed mb-5 flex-1">
                  {project.outcome}
                </p>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-medium px-2.5 py-0.5 bg-[var(--bg-muted)] border border-[var(--border)] rounded-full text-[var(--text-secondary)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Link Indicator */}
                <div className="text-[14px] font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors inline-flex items-center gap-1.5 mt-auto">
                  View Case Study
                  <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
