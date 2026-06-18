import type { Metadata } from "next";
import PrivacyPolicyClient from "./PrivacyPolicyClient";
import { SEO_METADATA } from "@/lib/seo-aeo-geo-config";

export const metadata: Metadata = {
  title: SEO_METADATA.privacyPolicy.title,
  description: SEO_METADATA.privacyPolicy.description,
  keywords: SEO_METADATA.privacyPolicy.keywords,
  alternates: {
    canonical: SEO_METADATA.privacyPolicy.canonical,
  },
  openGraph: {
    title: SEO_METADATA.privacyPolicy.ogTitle,
    description: SEO_METADATA.privacyPolicy.ogDescription,
    url: SEO_METADATA.privacyPolicy.canonical,
    images: [{ url: SEO_METADATA.privacyPolicy.ogImage }],
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
