import Link from "next/link";
import { Compass, Home, PhoneCall, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-[#1155CC] dark:bg-blue-950/40 dark:text-blue-400">
        <Compass className="h-10 w-10 animate-pulse" />
      </div>

      <span className="rounded-full bg-blue-100/60 px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#1155CC] uppercase dark:bg-blue-950/60 dark:text-blue-300">
        404 — Page Not Found
      </span>

      <h1 className="mt-4 font-sora text-3xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Lost in Cyberspace?
      </h1>

      <p className="mt-3 max-w-md text-xs font-medium leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
        The destination you are attempting to reach has either been relocated, deprecated, or does not exist on this domain.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl bg-[#1155CC] px-6 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md"
        >
          <Home className="h-4 w-4" />
          Back to Homepage
        </Link>

        <Link
          href="/contact"
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <PhoneCall className="h-4 w-4" />
          Contact Support
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
