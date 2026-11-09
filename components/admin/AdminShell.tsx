"use client";

import React, { useState, useEffect } from "react";
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
  KeyRound,
  ExternalLink,
  LogOut,
  Menu,
  X,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { logoutAdmin } from "@/lib/api/admin-governance.api";
import { CacheRevalidateDialog } from "@/components/admin/CacheRevalidateDialog";

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
  const [revalidateOpen, setRevalidateOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Rehydrate collapsed state from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_sidebar_collapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // LocalStorage not available or restricted
    }
  }, []);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const target = e.target as HTMLElement | null;
        const isEditing =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
        if (!isEditing) {
          e.preventDefault();
          setIsCollapsed((prev) => {
            const next = !prev;
            try {
              localStorage.setItem("admin_sidebar_collapsed", String(next));
            } catch {
              // Ignore
            }
            return next;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Do not render admin shell if on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isPostDetail =
    pathname.startsWith("/admin/blog/") &&
    !pathname.startsWith("/admin/blog/topics") &&
    !pathname.startsWith("/admin/blog/prompts") &&
    !pathname.startsWith("/admin/blog/ai");

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
      active: pathname === "/admin/blog" || isPostDetail,
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
      title: "AI Vault & Keys",
      href: "/admin/ai/credentials",
      icon: KeyRound,
      active: pathname.startsWith("/admin/ai"),
      badge: "Encrypted",
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
      await logoutAdmin();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <div
      data-lenis-prevent
      className="flex h-[100dvh] flex-col overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased md:flex-row"
    >
      {/* Mobile Top Bar */}
      <div className="z-30 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-[#1155CC] to-[#22B6F6] text-sm font-bold text-white shadow-md shadow-[#1155CC]/20">
            TS
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">TechSonance</h1>
            <p className="text-[10px] font-medium text-slate-500">Control Platform</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        aria-label="Admin Navigation Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out md:static md:h-full md:shrink-0 ${
          mobileMenuOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${
          isCollapsed
            ? "md:w-0 md:opacity-0 md:-translate-x-full md:pointer-events-none md:border-r-0 overflow-hidden"
            : "md:w-64 md:opacity-100 md:translate-x-0"
        }`}
      >
        <div className="flex h-full w-64 flex-col overflow-y-auto">
          {/* Logo & Workspace header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-base font-black text-white shadow-lg shadow-[#1155CC]/25">
                TS
              </div>
              <div>
                <span className="block font-sora text-base leading-tight font-black tracking-tight text-slate-900">
                  TechSonance
                </span>
                <span className="block text-[11px] font-semibold tracking-wider text-[#1155CC] uppercase">
                  Studio CMS
                </span>
              </div>
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1155CC]"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="flex-1 space-y-1 px-3 py-2">
            <div className="px-3 pt-1 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Content & Publishing
            </div>
            {navItems.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-[#1155CC] text-white shadow-md shadow-[#1155CC]/15"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp
                      className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                        item.active ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="info"
                      className="h-4 border-0 bg-white/20 px-1.5 py-0 text-[9px] text-white"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="border-t border-slate-100 bg-slate-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-slate-700 to-slate-900 text-xs font-bold text-white">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="mb-1 truncate text-xs leading-none font-bold text-slate-900">
                    {userEmail}
                  </p>
                  <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 uppercase">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href="/blog"
                target="_blank"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Site</span>
              </Link>
              <button
                type="button"
                onClick={() => setRevalidateOpen(true)}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#1155CC]"
                title="Purge cache"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Cache Revalidation Dialog */}
      <CacheRevalidateDialog isOpen={revalidateOpen} onClose={() => setRevalidateOpen(false)} />

      {/* Main Content Area */}
      <div data-lenis-prevent className="relative flex h-full min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Floating Expand Sidebar Button (Desktop only when collapsed) */}
        {isCollapsed && (
          <div className="sticky top-4 z-30 ml-4 self-start animate-in fade-in slide-in-from-left-3 duration-200 hidden md:block">
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md transition-all hover:border-blue-200 hover:bg-white hover:text-[#1155CC] hover:shadow-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1155CC]"
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4 text-[#1155CC] transition-transform group-hover:scale-110" />
              <span>Expand Sidebar</span>
              <kbd className="ml-1 hidden items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 lg:inline-flex">
                Ctrl+B
              </kbd>
            </button>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
