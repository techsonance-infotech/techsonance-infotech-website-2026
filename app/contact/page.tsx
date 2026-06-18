import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.contact.title,
  description: SEO_METADATA.contact.description,
  keywords: SEO_METADATA.contact.keywords,
  alternates: {
    canonical: SEO_METADATA.contact.canonical,
  },
  openGraph: {
    title: SEO_METADATA.contact.ogTitle,
    description: SEO_METADATA.contact.ogDescription,
    url: SEO_METADATA.contact.canonical,
    images: [{ url: SEO_METADATA.contact.ogImage }],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
