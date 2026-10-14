import { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPageTemplate from "@/app/components/landing/LandingPageTemplate";
import { landingPages } from "@/data/landing-pages";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

const pageData = landingPages.nextjs;

export const metadata: Metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
  keywords: pageData.keywords,
  alternates: {
    canonical: `${BASE_URL}${pageData.route}`,
  },
  openGraph: {
    title: pageData.metaTitle,
    description: pageData.metaDescription,
    url: `${BASE_URL}${pageData.route}`,
    siteName: "TechSonance Infotech",
    images: [
      {
        url: `${BASE_URL}/images/og/default-og.png`,
        width: 1200,
        height: 630,
        alt: `${pageData.h1} - TechSonance Infotech`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageData.metaTitle,
    description: pageData.metaDescription,
    images: [`${BASE_URL}/images/og/default-og.png`],
  },
};

export default function NextjsTechnologyPage() {
  if (!pageData) {
    notFound();
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}${pageData.route}#service`,
    name: pageData.h1,
    serviceType: "Next.js & React 19 Web Application Development",
    provider: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "TechSonance Infotech LLP",
      url: BASE_URL,
    },
    areaServed: ["United States", "United Kingdom", "United Arab Emirates", "India", "Canada"],
    description: pageData.directAnswer,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Next.js Web Offerings",
      itemListElement: pageData.capabilities.map((cap) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: cap.title,
          description: cap.description,
        },
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Technologies",
        item: `${BASE_URL}/technologies/nextjs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Next.js",
        item: `${BASE_URL}${pageData.route}`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pageData.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPageTemplate data={pageData} />
    </>
  );
}
