"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ImageIcon,
  Sparkles,
  Lightbulb,
  Sliders,
  BarChart3,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  userRole?: string;
}

export function AdminShell({
  children,
  userEmail = "admin@techsonance.co.in",
  userRole = "owner",
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Do not render admin shell if on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    {
      title: "Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      title: "Blog Articles",
      href: "/admin/blog",
      icon: FileText,
      active:
        pathname === "/admin/blog" ||
        pathname.startsWith("/admin/blog/new") ||
        pathname.match(/\/admin\/blog\/[^/]+$/) !== null,
    },
    {
      title: "Topic Backlog",
      href: "/admin/blog/topics",
      icon: Lightbulb,
      active: pathname.startsWith("/admin/blog/topics"),
    },
    {
      title: "Prompt Studio",
      href: "/admin/blog/prompts",
      icon: Sliders,
      active: pathname.startsWith("/admin/blog/prompts"),
    },
    {
      title: "AI Pipeline",
      href: "/admin/blog/ai",
      icon: Sparkles,
      active: pathname === "/admin/blog/ai",
      badge: "Autonomous",
    },
    {
      title: "AI Telemetry",
      href: "/admin/blog/ai/usage",
      icon: BarChart3,
      active: pathname.startsWith("/admin/blog/ai/usage"),
    },
    {
      title: "Careers & Jobs",
      href: "/admin/careers/jobs",
      icon: Briefcase,
      active: pathname.startsWith("/admin/careers"),
    },
    {
      title: "Media Library",
      href: "/admin/media",
      icon: ImageIcon,
      active: pathname.startsWith("/admin/media"),
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <div
      data-lenis-prevent
      className="h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row overflow-hidden antialiased font-sans"
    >
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1155CC] to-[#22B6F6] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#1155CC]/20">
            TS
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 tracking-tight">TechSonance</h1>
            <p className="text-[10px] text-slate-500 font-medium">Control Platform</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full md:shrink-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo & Workspace header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#1155CC]/25">
                TS
              </div>
              <div>
                <span className="font-black text-base text-slate-900 tracking-tight block leading-tight font-sora">
                  TechSonance
                </span>
                <span className="text-[11px] font-semibold text-[#1155CC] uppercase tracking-wider block">
                  Studio CMS
                </span>
              </div>
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Content & Publishing
            </div>
            {navItems.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    item.active
                      ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/15"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        item.active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="info"
                      className="text-[9px] px-1.5 py-0 h-4 bg-white/20 text-white border-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">
                    {userEmail}
                  </p>
                  <span className="inline-block text-[10px] font-semibold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/blog"
                target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Live Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div data-lenis-prevent className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
