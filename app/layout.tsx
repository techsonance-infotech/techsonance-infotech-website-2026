import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LenisProvider from "@/app/components/LenisProvider";
import CookieConsent from "@/app/components/home/CookieConsent";
import JsonLd, { getUnifiedRootEntityGraph } from "@/app/components/JsonLd";
import ChatWidget from "@/components/chat/ChatWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.techsonance.co.in"),
  title: "TechSonance - Custom Software & AI Engineering Partner",
  description:
    "TechSonance designs and builds custom software, logistics SaaS, Point of Sale systems, and AI-powered web applications for modern enterprises.",
  icons: {
    icon: [
      { url: "/images/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/images/favicons/apple-touch-icon.png",
    shortcut: "/images/favicons/favicon.ico",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${sora.variable} antialiased`}
    >
      <body className="flex flex-col">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <JsonLd schema={getUnifiedRootEntityGraph()} />
        <LenisProvider>
          {children}
          <CookieConsent />
          <ChatWidget />
        </LenisProvider>
      </body>
    </html>
  );
}
