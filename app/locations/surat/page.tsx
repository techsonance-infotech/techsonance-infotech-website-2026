import { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPageTemplate from "@/app/components/landing/LandingPageTemplate";
import { landingPages } from "@/data/landing-pages";
import { BASE_URL } from "@/lib/seo-aeo-geo-config";

const pageData = landingPages.surat;

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
        alt: `${pageData.h1} - TechSonance Infotech Surat`,
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

export default function SuratLocationPage() {
  if (!pageData) {
    notFound();
  }

  // Structured data schemas for Surat location landing page
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}${pageData.route}#service`,
    name: "Custom Software & AI Development in Surat",
    serviceType: "Software Development Services",
    provider: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "TechSonance Infotech LLP",
      url: BASE_URL,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Surat",
        sameAs: "https://en.wikipedia.org/wiki/Surat",
      },
      {
        "@type": "Country",
        name: "India",
      },
      {
        "@type": "Country",
        name: "United States",
      },
      {
        "@type": "Country",
        name: "United Kingdom",
      },
      {
        "@type": "Country",
        name: "United Arab Emirates",
      },
    ],
    description: pageData.directAnswer,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software Engineering Offerings",
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

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BASE_URL}${pageData.route}#localbusiness`,
    name: "TechSonance Infotech LLP - Surat Headquarters",
    image: `${BASE_URL}/images/og/default-og.png`,
    url: `${BASE_URL}${pageData.route}`,
    telephone: "+919173101711",
    email: "info@techsonance.co.in",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "UG-15, Palladium Plaza, VIP Road, Vesu",
      addressLocality: "Surat",
      addressRegion: "Gujarat",
      postalCode: "395007",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 21.1418,
      longitude: 72.7709,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    parentOrganization: {
      "@id": `${BASE_URL}/#organization`,
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
        name: "Locations",
        item: `${BASE_URL}/locations/surat`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Surat",
        item: `${BASE_URL}/locations/surat`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
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
