"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, type IconName } from "@/app/components/icons/Icon";
import { services } from "@/data/services";

export const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "About", href: "/about" },
  { name: "Career", href: "#" },
  { name: "Contact", href: "/contact" },
];

export default function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    <header
      className={
        transparent
          ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
              isScrolled || isMobileMenuOpen
                ? "border-b border-gray-100 bg-white/85 shadow-sm"
                : "border-b border-transparent bg-transparent"
            }`
          : "sticky top-0 z-50 border-b border-gray-100 bg-white/80"
      }
      style={
        !transparent || isScrolled || isMobileMenuOpen
          ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
          : undefined
      }
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="TechSonance home">
          <Image
            src="/images/logo-icon.png"
            alt="TechSonance logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="hidden sm:block">
            <span className="block text-xl font-extrabold leading-tight tracking-[0.03em] text-[#0F172A]">
              TECH<span className="bg-gradient-to-r from-[#0A1A2E] via-[#1155CC] to-[#22B6F6] bg-clip-text text-transparent">SONΛNCE</span>
            </span>
            <span className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.24em] text-gray-500 mt-0.5">
              <span className="h-[1.5px] w-2.5 bg-gray-300" />
              INFOTECH LLP
              <span className="h-[1.5px] w-2.5 bg-gray-300" />
            </span>
          </span>
        </Link>

        {/* ─── DESKTOP NAVIGATION ─── */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            // Dropdown Menu specifically for Services
            if (link.name === "Services") {
              return (
                <div key={link.name} className="group relative py-6">
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm font-semibold text-gray-600 transition-colors hover:text-[#0D47A1]"
                  >
                    {link.name}
                    <Icon name="chevron" className="h-3.5 w-3.5 text-gray-400 transition-transform duration-300 group-hover:rotate-180" />
                  </Link>

                  {/* Mega-menu Submenu panel */}
                  <div className="absolute top-[calc(100%-8px)] left-1/2 -translate-x-1/2 w-[740px] bg-white border border-gray-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(13,71,161,0.08)] pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300 z-50">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {services.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/services/${service.slug}`}
                          className="flex items-start gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-[#F8FBFF] border border-transparent hover:border-blue-500/5 group/item"
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
                            <h4 className="text-xs font-bold text-gray-900 group-hover/item:text-[#0D47A1] transition-colors leading-snug mb-0.5">
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
                        className="text-xs font-bold text-[#0D47A1] hover:underline inline-flex items-center gap-1"
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
                className="flex items-center gap-1 text-sm font-semibold text-gray-600 transition-colors hover:text-[#0D47A1]"
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
          <Link
            href="/contact"
            className="hidden items-center gap-2 rounded-full btn-primary px-6 py-2.5 text-sm font-semibold text-white sm:flex"
          >
            Get a Quote
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <Icon name="arrow" className="h-3 w-3" />
            </span>
          </Link>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200/80 text-gray-700 hover:bg-gray-50 focus:outline-none lg:hidden"
            aria-label="Toggle navigation menu"
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
          <div className="flex flex-col gap-1.5 px-4 py-5 sm:px-6 max-h-[calc(100vh-80px)] overflow-y-auto">
            {navLinks.map((link) => {
              if (link.name === "Services") {
                return (
                  <div key={link.name} className="border-b border-gray-100/50 py-1">
                    <button
                      onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                      className="flex items-center justify-between text-sm font-bold text-gray-700 hover:text-[#0D47A1] transition-colors py-3 w-full"
                    >
                      <span>{link.name}</span>
                      <Icon name="chevron" className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                        isMobileServicesOpen ? "rotate-180" : ""
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
                            <span className="text-xs font-semibold text-gray-600 group-hover:text-[#0D47A1] transition-colors">
                              {service.title}
                            </span>
                          </Link>
                        ))}
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
                  className="flex items-center justify-between text-sm font-bold text-gray-700 hover:text-[#0D47A1] transition-colors py-3 border-b border-gray-100/50 last:border-0"
                >
                  <span>{link.name}</span>
                  <svg className="h-4 w-4 text-gray-350" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-gray-100">
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl btn-primary px-6 py-3 text-sm font-semibold text-white w-full"
              >
                Get a Quote
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Icon name="arrow" className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
