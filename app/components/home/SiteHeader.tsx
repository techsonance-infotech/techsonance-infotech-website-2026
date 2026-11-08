"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { services } from "@/data/services";
import GetQuoteModal from "@/app/components/home/GetQuoteModal";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "@/components/currency/CurrencySelector";
import { SHOW_PRICING_SECTION } from "@/lib/constants/pricing.constants";

export const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  ...(SHOW_PRICING_SECTION ? [{ name: "Pricing", href: "/pricing" }] : []),
  { name: "Portfolio", href: "/portfolio" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Career", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

export default function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isMobile = useSyncExternalStore(
    (notify) => {
      window.addEventListener("resize", notify);
      return () => window.removeEventListener("resize", notify);
    },
    () => window.innerWidth < 768,
    () => false,
  );

  useEffect(() => {
    if (!transparent) return;

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  return (
    <>
      <header
        className={
          transparent
            ? `fixed top-0 right-0 left-0 z-50 py-3 transition-all duration-300 ${
                isScrolled || isMobileMenuOpen
                  ? "border-b border-gray-100 bg-white md:bg-white/85 shadow-sm"
                  : "border-b border-transparent bg-transparent"
              }`
            : "fixed top-0 right-0 left-0 z-50 w-full border-b border-gray-100 bg-white md:sticky md:bg-white/80"
        }
        style={{
          ...((!transparent || isScrolled || isMobileMenuOpen) && (!mounted || !isMobile)
            ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
            : {}),
          transform: "translate3d(0, 0, 0)",
          WebkitTransform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-14 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3"
            aria-label="TechSonance home"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translate3d(0, 0, 0)",
              WebkitTransform: "translate3d(0, 0, 0)",
            }}
          >
            <Image
              src="/images/logo-icon.png"
              alt="TechSonance logo"
              width={56}
              height={56}
              className="h-8 w-8 object-contain sm:h-10 sm:w-10"
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <span className="flex flex-col items-center">
              <span className="flex items-center gap-1 font-sora text-[13px] leading-none font-bold tracking-[0.04em] sm:gap-1.5 sm:text-[20px]">
                <TechSvg className="text-[#071A35]" />
                <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">
                  SONΛNCE
                </span>
              </span>
              <span className="mt-0.5 flex w-full items-center gap-1 font-sans text-[6.5px] font-medium tracking-[0.24em] text-[#4B5563] uppercase sm:gap-2 sm:text-[9px]">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#DDE3EA]" />
                INFOTECH LLP
                <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#DDE3EA]" />
              </span>
            </span>
          </Link>

          {/* ─── DESKTOP NAVIGATION ─── */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => {
              // Dropdown Menu specifically for Services
              if (link.name === "Services") {
                return (
                  <div key={link.name} className="group relative py-4">
                    <Link
                      href={link.href}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-600 transition-colors hover:text-[#1155CC]"
                    >
                      {link.name}
                      <Icon
                        name="chevron"
                        className="h-3.5 w-3.5 text-gray-400 transition-transform duration-300 group-hover:rotate-180"
                      />
                    </Link>

                    {/* Mega-menu Submenu panel */}
                    <div className="pointer-events-none absolute top-[calc(100%-8px)] left-1/2 z-50 w-[740px] -translate-x-1/2 translate-y-3 rounded-[28px] border border-gray-100 bg-white p-6 opacity-0 shadow-[0_20px_50px_rgba(17, 85, 204,0.08)] transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            href={`/services/${service.slug}`}
                            className="group/item flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-blue-500/5 hover:bg-[#FAFBFD]"
                          >
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover/item:scale-105"
                              style={{
                                backgroundColor: `${service.accentColor}08`,
                                borderColor: `${service.accentColor}15`,
                                color: service.accentColor,
                              }}
                            >
                              <Icon name={service.icon as IconName} className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="mb-0.5 text-xs leading-snug font-bold text-gray-900 transition-colors group-hover/item:text-[#1155CC]">
                                {service.title}
                              </h4>
                              <p className="line-clamp-1 text-[10px] leading-normal text-gray-400">
                                {service.quickSummary}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Submenu footer panel */}
                      <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-4">
                        <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                          Growth Ecosystem
                        </span>
                        <Link
                          href="/services"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1155CC] hover:underline"
                        >
                          All Services
                          <Icon name="arrow" className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-600 transition-colors hover:text-[#1155CC]"
                >
                  {link.name}
                  {link.name === "Hire Developers" ? (
                    <Icon name="chevron" className="h-3.5 w-3.5 text-gray-400" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <CurrencySelector compact />
            <Button
              onClick={() => setIsQuoteModalOpen(true)}
              variant="primary"
              size="sm"
              showArrow
              className="hidden sm:inline-flex"
            >
              Get a Quote
            </Button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200/80 text-gray-700 hover:bg-gray-50 focus:outline-none sm:h-10 sm:w-10 lg:hidden"
              aria-label="Toggle navigation menu"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translate3d(0, 0, 0)",
                WebkitTransform: "translate3d(0, 0, 0)",
              }}
            >
              {isMobileMenuOpen ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ─── MOBILE DROP-DOWN MENU (lg and down) ─── */}
        {isMobileMenuOpen && (
          <div className="absolute top-full right-0 left-0 border-b border-gray-100 bg-white shadow-xl lg:hidden">
            <div className="flex max-h-[calc(100vh-48px)] flex-col gap-1.5 overflow-y-auto px-4 py-5 sm:max-h-[calc(100vh-56px)] sm:px-6">
              {navLinks.map((link) => {
                if (link.name === "Services") {
                  return (
                    <div key={link.name} className="border-b border-gray-100/50 py-1">
                      <button
                        onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                        className="flex w-full cursor-pointer items-center justify-between py-3 font-sans text-sm font-bold text-gray-700 transition-colors hover:text-[#1155CC]"
                      >
                        <span className="font-bold">{link.name}</span>
                        <Icon
                          name="chevron"
                          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                            isMobileServicesOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Mobile submenu list accordion layout */}
                      {isMobileServicesOpen && (
                        <div className="mt-1 flex flex-col gap-2.5 border-l-2 border-gray-100 pb-3 pl-4">
                          {services.map((service) => (
                            <Link
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              onClick={() => {
                                setIsMobileServicesOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                              className="group flex items-center gap-3 py-1.5"
                            >
                              <div
                                className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border"
                                style={{
                                  backgroundColor: `${service.accentColor}06`,
                                  borderColor: `${service.accentColor}12`,
                                  color: service.accentColor,
                                }}
                              >
                                <Icon name={service.icon as IconName} className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 transition-colors group-hover:text-[#1155CC]">
                                {service.title}
                              </span>
                            </Link>
                          ))}

                          {/* All Services Link */}
                          <div className="mt-2 flex items-center border-t border-gray-100/50 pt-2.5">
                            <Link
                              href="/services"
                              onClick={() => {
                                setIsMobileServicesOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-1.5 py-1 text-xs font-bold text-[#1155CC] hover:underline"
                            >
                              All Services
                              <Icon name="arrow" className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between border-b border-gray-100/50 py-3 font-sans text-sm font-bold text-gray-700 transition-colors last:border-0 hover:text-[#1155CC]"
                  >
                    <span className="font-bold">{link.name}</span>
                    <svg
                      className="h-4 w-4 text-gray-400"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })}

              <div className="mt-2 flex flex-col gap-3 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-gray-500">Currency</span>
                  <CurrencySelector compact />
                </div>
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsQuoteModalOpen(true);
                  }}
                  variant="primary"
                  size="default"
                  showArrow
                  className="w-full"
                >
                  Get a Quote
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      {!transparent && (
        <div className="pointer-events-none block h-12 w-full shrink-0 sm:h-14 md:hidden" />
      )}

      {/* Get a Quote Modal */}
      <GetQuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} />
    </>
  );
}

function TechSvg({ className = "text-[#071A35]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 74 24"
      className={`h-[0.72em] w-auto ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      {/* T */}
      <g transform="translate(0, 0)">
        <path d="M1.5,4.5 L16.5,4.5" />
        <path d="M9,4.5 L9,19.5" />
      </g>
      {/* E */}
      <g transform="translate(18, 0)">
        <path
          d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5"
          strokeLinejoin="round"
        />
        <path d="M4.5,12 L13.5,12" />
      </g>
      {/* C */}
      <g transform="translate(36, 0)">
        <path
          d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5"
          strokeLinejoin="round"
        />
      </g>
      {/* H */}
      <g transform="translate(54, 0)">
        <path d="M4.5,4.5 L4.5,19.5" />
        <path d="M16.5,4.5 L16.5,19.5" />
        <path d="M4.5,12 L16.5,12" />
      </g>
    </svg>
  );
}
