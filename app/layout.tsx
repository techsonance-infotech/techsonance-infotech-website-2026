import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/app/components/LenisProvider";
import CookieConsent from "@/app/components/home/CookieConsent";
import JsonLd, { getOrganizationSchema, getLocalBusinessSchema, getWebsiteSchema } from "@/app/components/JsonLd";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://techsonance.com"),
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${sora.variable} antialiased`}
    >
      <body className="flex flex-col">
        <JsonLd schema={getOrganizationSchema()} />
        <JsonLd schema={getLocalBusinessSchema()} />
        <JsonLd schema={getWebsiteSchema()} />
        <LenisProvider>
          {children}
          <CookieConsent />
        </LenisProvider>
      </body>
    </html>
  );
}
