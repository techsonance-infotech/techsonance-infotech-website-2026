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
        <div className="mb-12 reveal-up md:mb-16">
          <span className="section-label">Proof of Work</span>
          <h2
            className="font-medium tracking-tight text-[var(--text-primary)]"
            style={{ fontSize: "var(--text-section-title)" }}
          >
            Projects We&apos;ve Shipped
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[var(--text-secondary)] md:text-lg">
            Real-world applications delivered for our clients. Built with the same engineering
            standards we bring to your project.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={project.href}
              className="group card service-card flex flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-base)] !p-0 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--accent-blue)]"
            >
              {/* Image Container (16:9 aspect-video) */}
              <div className="relative aspect-video w-full overflow-hidden border-b border-[var(--border)] bg-[var(--bg-muted)]">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <span className="mb-2 text-[11px] font-bold tracking-wider text-[var(--accent-blue)] uppercase">
                  {project.industry}
                </span>

                <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent-blue)] md:text-xl">
                  {project.name}
                </h3>

                <p className="mb-5 flex-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                  {project.outcome}
                </p>

                {/* Tech Stack Badges */}
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Link Indicator */}
                <div className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-blue)]">
                  View Case Study
                  <span className="translate-x-0 transform transition-transform duration-200 group-hover:translate-x-1">
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
