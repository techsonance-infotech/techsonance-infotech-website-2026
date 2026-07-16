"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { services } from "@/data/services";
import GetQuoteModal from "@/app/components/home/GetQuoteModal";

export const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen
              ? "border-b border-gray-100 bg-white md:bg-white/85 shadow-sm"
              : "border-b border-transparent bg-transparent"
            }`
            : "fixed top-0 left-0 right-0 md:sticky z-50 border-b border-gray-100 bg-white md:bg-white/80 w-full"
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
        <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
              priority
            />
            <span className="flex flex-col items-center">
              <span className="flex items-center gap-1 sm:gap-1.5 text-[13px] sm:text-[20px] font-bold font-sora leading-none tracking-[0.04em]">
                <TechSvg className="text-[#071A35]" />
                <span className="bg-gradient-to-r from-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">SONΛNCE</span>
              </span>
              <span className="w-full flex items-center gap-1 sm:gap-2 text-[6.5px] sm:text-[9px] font-medium font-sans uppercase tracking-[0.24em] text-[#4B5563] mt-0.5">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#DDE3EA]" />
                INFOTECH LLP
                <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#DDE3EA]" />
              </span>
              <span className="hidden sm:block text-[7.5px] font-medium font-sans uppercase tracking-[0.15em] text-[#374151] mt-1.5 text-center">
                Where Innovation Finds Its Resonance
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
                      <Icon name="chevron" className="h-3.5 w-3.5 text-gray-400 transition-transform duration-300 group-hover:rotate-180" />
                    </Link>

                    {/* Mega-menu Submenu panel */}
                    <div className="absolute top-[calc(100%-8px)] left-1/2 -translate-x-1/2 w-[740px] bg-white border border-gray-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(17, 85, 204,0.08)] pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 z-50">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {services.map((service) => (
                          <Link
                            key={service.slug}
                            href={`/services/${service.slug}`}
                            className="flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-[#FAFBFD] border border-transparent hover:border-blue-500/5 group/item"
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-300 group-hover/item:scale-105"
                              style={{
                                backgroundColor: `${service.accentColor}08`,
                                borderColor: `${service.accentColor}15`,
                                color: service.accentColor
                              }}
                            >
                              <Icon name={service.icon as IconName} className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-gray-900 group-hover/item:text-[#1155CC] transition-colors leading-snug mb-0.5">
                                {service.title}
                              </h4>
                              <p className="text-[10px] text-gray-400 leading-normal line-clamp-1">
                                {service.quickSummary}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Submenu footer panel */}
                      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Growth Ecosystem</span>
                        <Link
                          href="/services"
                          className="text-xs font-bold text-[#1155CC] hover:underline inline-flex items-center gap-1"
                        >
                          All Services
                          <Icon name="arrow" className="w-3.5 h-3.5" />
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

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="hidden items-center gap-2 rounded-full btn-primary px-6 py-2.5 text-sm font-semibold text-white sm:flex cursor-pointer"
            >
              Get a Quote
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                <Icon name="arrow" className="h-3 w-3" />
              </span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-gray-200/80 text-gray-700 hover:bg-gray-50 focus:outline-none lg:hidden"
              aria-label="Toggle navigation menu"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translate3d(0, 0, 0)",
                WebkitTransform: "translate3d(0, 0, 0)",
              }}
            >
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ─── MOBILE DROP-DOWN MENU (lg and down) ─── */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 border-b border-gray-100 bg-white shadow-xl lg:hidden">
            <div className="flex flex-col gap-1.5 px-4 py-5 sm:px-6 max-h-[calc(100vh-48px)] sm:max-h-[calc(100vh-56px)] overflow-y-auto">
              {navLinks.map((link) => {
                if (link.name === "Services") {
                  return (
                    <div key={link.name} className="border-b border-gray-100/50 py-1">
                      <button
                        onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                        className="flex items-center justify-between text-sm font-bold font-sans text-gray-700 hover:text-[#1155CC] transition-colors py-3 w-full cursor-pointer"
                      >
                        <span className="font-bold">{link.name}</span>
                        <Icon name="chevron" className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isMobileServicesOpen ? "rotate-180" : ""
                          }`} />
                      </button>

                      {/* Mobile submenu list accordion layout */}
                      {isMobileServicesOpen && (
                        <div className="pl-4 pb-3 flex flex-col gap-2.5 mt-1 border-l-2 border-gray-100">
                          {services.map((service) => (
                            <Link
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              onClick={() => {
                                setIsMobileServicesOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                              className="flex items-center gap-3 py-1.5 group"
                            >
                              <div
                                className="w-7.5 h-7.5 rounded-lg flex items-center justify-center border shrink-0"
                                style={{
                                  backgroundColor: `${service.accentColor}06`,
                                  borderColor: `${service.accentColor}12`,
                                  color: service.accentColor
                                }}
                              >
                                <Icon name={service.icon as IconName} className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 group-hover:text-[#1155CC] transition-colors">
                                {service.title}
                              </span>
                            </Link>
                          ))}

                          {/* All Services Link */}
                          <div className="mt-2 pt-2.5 border-t border-gray-100/50 flex items-center">
                            <Link
                              href="/services"
                              onClick={() => {
                                setIsMobileServicesOpen(false);
                                setIsMobileMenuOpen(false);
                              }}
                              className="text-xs font-bold text-[#1155CC] hover:underline flex items-center gap-1.5 py-1"
                            >
                              All Services
                              <Icon name="arrow" className="w-3.5 h-3.5" />
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
                    className="flex items-center justify-between text-sm font-bold font-sans text-gray-700 hover:text-[#1155CC] transition-colors py-3 border-b border-gray-100/50 last:border-0"
                  >
                    <span className="font-bold">{link.name}</span>
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })}

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsQuoteModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl btn-primary px-6 py-3 text-sm font-semibold text-white w-full cursor-pointer"
                >
                  Get a Quote
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                    <Icon name="arrow" className="h-3 w-3" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      {!transparent && (
        <div className="block md:hidden h-12 sm:h-14 w-full shrink-0 pointer-events-none" />
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
        <path d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5" strokeLinejoin="round" />
        <path d="M4.5,12 L13.5,12" />
      </g>
      {/* C */}
      <g transform="translate(36, 0)">
        <path d="M16.5,4.5 L8.5,4.5 C6.2,4.5 4.5,6.2 4.5,8.5 L4.5,15.5 C4.5,17.8 6.2,19.5 8.5,19.5 L16.5,19.5" strokeLinejoin="round" />
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
