// Re-export layer - keeps nav, homepage, and overview pages working
export type {
  Service as ServiceData,
  PainPoint,
  Capability,
  TechItem,
  TechStackGroup,
  Metric,
  ProjectCard,
} from "@/lib/services-data";

export {
  services as rawServices,
  getServiceBySlug as getRawServiceBySlug,
  getProofOfWorkForService,
  SHARED_METRICS,
} from "@/lib/services-data";

import {
  services as rawServices,
  getServiceBySlug as getRawServiceBySlug,
  type Service as ServiceData,
  type ProcessStep,
  type FAQ,
} from "@/lib/services-data";

// Legacy interfaces for existing consumers
export type { ProcessStep, FAQ };

export interface TechGroup {
  category: string;
  items: string[];
}

export interface Benefit {
  metric: string;
  label: string;
  description: string;
}

export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  icon: string;
  accentColor: string;
  gradient: string;
  nodePosition: { angle: number; orbitRadiusX: number; orbitRadiusY: number };
  quickSummary: string;
  keyTech: string[];
  whatWeBuild: string[];
  process: ProcessStep[];
  techStack: TechGroup[];
  benefits: Benefit[];
  faq: FAQ[];
  caseStudySlug?: string;
}

function toLegacy(service: ServiceData): Service {
  return {
    slug: service.slug,
    title: service.name,
    shortTitle: service.shortTitle,
    tagline: service.tagline,
    icon: service.icon,
    accentColor: service.accentColor,
    gradient: service.gradient,
    nodePosition: service.nodePosition,
    quickSummary: service.quickSummary,
    keyTech: service.keyTech,
    whatWeBuild: service.capabilities.map((c) => c.title),
    process: service.process,
    techStack: service.techStack.map((g) => ({
      category: g.category,
      items: g.items.map((i) => i.name),
    })),
    benefits: service.metrics.map((m) => ({
      metric: m.value,
      label: m.label,
      description: "",
    })),
    faq: service.faqs,
    caseStudySlug: service.caseStudySlug,
  };
}

export const services: Service[] = rawServices.map(toLegacy);

export function getServiceBySlug(slug: string): Service | undefined {
  const raw = getRawServiceBySlug(slug);
  return raw ? toLegacy(raw) : undefined;
}

export function getFullServiceBySlug(slug: string): ServiceData | undefined {
  return getRawServiceBySlug(slug);
}
