import React from "react";

interface JsonLdProps {
  schema: Record<string, unknown>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// 1. Unified Root Entity Graph (Google Recommended Connected Graph)
export function getUnifiedRootEntityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "Corporation"],
        "@id": "https://www.techsonance.co.in/#organization",
        "name": "TechSonance Infotech LLP",
        "legalName": "TechSonance Infotech LLP",
        "url": "https://www.techsonance.co.in",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.techsonance.co.in/#logo",
          "url": "https://www.techsonance.co.in/images/logo-icon.png",
          "caption": "TechSonance Infotech LLP Logo"
        },
        "foundingDate": "2021",
        "founder": {
          "@type": "Person",
          "@id": "https://www.techsonance.co.in/#founder",
          "name": "Someshwari Adeya",
          "jobTitle": "Founder & CEO",
          "image": "https://www.techsonance.co.in/images/about-headshot-v2.png",
          "sameAs": "https://www.linkedin.com/company/techsonance-infotech-llp"
        },
        "employee": [
          {
            "@type": "Person",
            "@id": "https://www.techsonance.co.in/#founder"
          },
          {
            "@type": "Person",
            "@id": "https://www.techsonance.co.in/#cto",
            "name": "Sajeshkumar Adeya",
            "jobTitle": "Chief Technology Officer"
          },
          {
            "@type": "Person",
            "@id": "https://www.techsonance.co.in/#lead-developer",
            "name": "Manish Kushwaha",
            "jobTitle": "Lead Full-Stack Engineer"
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "UG-15, Palladium Plaza, VIP Road, Vesu",
          "addressLocality": "Surat",
          "addressRegion": "Gujarat",
          "postalCode": "395007",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 21.1418,
          "longitude": 72.7709
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91 9173101711",
          "contactType": "customer service",
          "email": "info@techsonance.co.in",
          "areaServed": [
            "India",
            "United States",
            "United Kingdom",
            "Canada",
            "Australia",
            "United Arab Emirates"
          ],
          "availableLanguage": ["en", "hi", "gu"]
        },
        "sameAs": [
          "https://linkedin.com/company/techsonance-infotech/",
          "https://x.com/techsonance_in",
          "https://github.com/techsonance-infotech",
          "https://www.instagram.com/techsonance_infotech/",
          "https://www.facebook.com/people/TechSonance-InfoTech/61583918872159/",
          "https://clutch.co/profile/techsonance-infotech",
          "https://www.goodfirms.co/company/techsonance-infotech",
          "https://www.crunchbase.com/organization/techsonance-infotech",
          "https://cal.id/techsonance-infotech/connect-with-founder"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.techsonance.co.in/#website",
        "url": "https://www.techsonance.co.in",
        "name": "TechSonance Infotech LLP",
        "publisher": {
          "@id": "https://www.techsonance.co.in/#organization"
        }
      },
      {
        "@type": ["ProfessionalService", "LocalBusiness"],
        "@id": "https://www.techsonance.co.in/#localbusiness",
        "name": "TechSonance Infotech LLP",
        "parentOrganization": {
          "@id": "https://www.techsonance.co.in/#organization"
        },
        "url": "https://www.techsonance.co.in",
        "image": "https://www.techsonance.co.in/images/logo-icon.png",
        "telephone": "+91 9173101711",
        "email": "info@techsonance.co.in",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "UG-15, Palladium Plaza, VIP Road, Vesu",
          "addressLocality": "Surat",
          "addressRegion": "Gujarat",
          "postalCode": "395007",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 21.1418,
          "longitude": 72.7709
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
      }
    ]
  };
}

// 2. Organization Schema
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.techsonance.co.in/#organization",
    "name": "TechSonance Infotech LLP",
    "url": "https://www.techsonance.co.in",
    "logo": "https://www.techsonance.co.in/images/logo-icon.png",
    "foundingDate": "2021",
    "founder": {
      "@type": "Person",
      "@id": "https://www.techsonance.co.in/#founder",
      "name": "Someshwari Adeya",
      "jobTitle": "Founder & CEO"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 9173101711",
      "contactType": "customer service",
      "email": "info@techsonance.co.in",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi", "gu"]
    },
    "sameAs": [
      "https://linkedin.com/company/techsonance-infotech/",
      "https://x.com/techsonance_in",
      "https://github.com/techsonance-infotech",
      "https://www.instagram.com/techsonance_infotech/",
      "https://www.facebook.com/people/TechSonance-InfoTech/61583918872159/",
      "https://clutch.co/profile/techsonance-infotech",
      "https://www.goodfirms.co/company/techsonance-infotech",
      "https://www.crunchbase.com/organization/techsonance-infotech",
      "https://cal.id/techsonance-infotech/connect-with-founder"
    ]
  };
}

// 3. Website Schema
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.techsonance.co.in/#website",
    "name": "TechSonance Infotech LLP",
    "url": "https://www.techsonance.co.in",
    "publisher": {
      "@id": "https://www.techsonance.co.in/#organization"
    }
  };
}

// 4. Local Business & Professional Service Schema
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://www.techsonance.co.in/#localbusiness",
    "name": "TechSonance Infotech LLP",
    "parentOrganization": {
      "@id": "https://www.techsonance.co.in/#organization"
    },
    "image": "https://www.techsonance.co.in/images/logo-icon.png",
    "url": "https://www.techsonance.co.in",
    "telephone": "+91 9173101711",
    "email": "info@techsonance.co.in",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "UG-15, Palladium Plaza, VIP Road, Vesu",
      "addressLocality": "Surat",
      "addressRegion": "Gujarat",
      "postalCode": "395007",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 21.1418,
      "longitude": 72.7709
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

// 5. FAQ Schema
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

// 6. Service Schema
export function getServiceSchema(
  name: string,
  description: string,
  providerUrl: string = "https://www.techsonance.co.in"
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": name,
    "description": description,
    "provider": {
      "@type": "Organization",
      "@id": "https://www.techsonance.co.in/#organization",
      "name": "TechSonance Infotech LLP",
      "url": providerUrl,
      "logo": "https://www.techsonance.co.in/images/logo-icon.png"
    },
    "isPartOf": {
      "@id": "https://www.techsonance.co.in/#website"
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

// 7. Breadcrumb Schema
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

// 8. Review Schema
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
      "@id": "https://www.techsonance.co.in/#organization",
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

// 9. Article/Blog Schema
export function getArticleSchema(
  title: string,
  description: string,
  imageUrl: string,
  publishDate: string,
  authorName: string,
  articleUrl: string,
  modifiedDate?: string
) {
  let authorId = "https://www.techsonance.co.in/#organization";
  let authorRole = "Software Engineer";
  if (authorName.toLowerCase().includes("someshwari")) {
    authorId = "https://www.techsonance.co.in/#founder";
    authorRole = "Founder & CEO";
  } else if (authorName.toLowerCase().includes("sajeshkumar")) {
    authorId = "https://www.techsonance.co.in/#cto";
    authorRole = "Chief Technology Officer";
  } else if (authorName.toLowerCase().includes("manish")) {
    authorId = "https://www.techsonance.co.in/#lead-developer";
    authorRole = "Lead Full-Stack Engineer";
  }

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "image": imageUrl,
    "datePublished": publishDate,
    "dateModified": modifiedDate || publishDate,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "isPartOf": {
      "@id": "https://www.techsonance.co.in/#website"
    },
    "author": {
      "@type": "Person",
      "@id": authorId,
      "name": authorName,
      "jobTitle": authorRole,
      "worksFor": {
        "@id": "https://www.techsonance.co.in/#organization"
      }
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://www.techsonance.co.in/#organization",
      "name": "TechSonance Infotech LLP",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.techsonance.co.in/images/logo-icon.png"
      }
    }
  };
}
