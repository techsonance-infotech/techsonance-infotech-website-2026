import React from "react";

interface JsonLdProps {
  schema: Record<string, any>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// 1. Organization Schema
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TechSonance Infotech LLP",
    "url": "https://techsonance.co.in",
    "logo": "https://techsonance.co.in/images/logo-icon.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 9173101711",
      "contactType": "customer service",
      "email": "info@techsonance.co.in",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/techsonance-infotech-llp",
      "https://x.com/techsonance"
    ]
  };
}

// 2. Website Schema
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TechSonance Infotech LLP",
    "url": "https://techsonance.co.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://techsonance.co.in/blog?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// 3. Local Business & Professional Service Schema
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://techsonance.co.in/#localbusiness",
    "name": "TechSonance Infotech LLP",
    "image": "https://techsonance.co.in/images/logo-icon.png",
    "url": "https://techsonance.co.in",
    "telephone": "+91 9173101711",
    "email": "info@techsonance.co.in",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Surat District",
      "addressLocality": "Surat",
      "addressRegion": "Gujarat",
      "postalCode": "395007",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 21.1702,
      "longitude": 72.8311
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    }
  };
}

// 4. FAQ Schema
export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// 5. Service Schema
export function getServiceSchema(
  name: string,
  description: string,
  providerUrl: string = "https://techsonance.co.in"
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "TechSonance Infotech LLP",
      "url": providerUrl,
      "logo": "https://techsonance.co.in/images/logo-icon.png"
    },
    "areaServed": [
      { "@type": "Country", "name": "India" },
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "United Kingdom" },
      { "@type": "Country", "name": "Canada" },
      { "@type": "Country", "name": "Australia" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Software Engineering Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": name
          }
        }
      ]
    }
  };
}

// 6. Breadcrumb Schema
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// 7. Review Schema
export function getReviewSchema(
  authorName: string,
  reviewBody: string,
  ratingValue: number = 5
) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Organization",
      "name": "TechSonance Infotech LLP"
    },
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": ratingValue,
      "bestRating": 5
    },
    "reviewBody": reviewBody
  };
}

// 8. Article/Blog Schema
export function getArticleSchema(
  title: string,
  description: string,
  imageUrl: string,
  publishDate: string,
  authorName: string,
  articleUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": imageUrl,
    "datePublished": publishDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "TechSonance Infotech LLP",
      "logo": {
        "@type": "ImageObject",
        "url": "https://techsonance.co.in/images/logo-icon.png"
      }
    }
  };
}
