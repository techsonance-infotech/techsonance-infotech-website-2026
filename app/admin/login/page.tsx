"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAdmin } from "@/lib/api/admin-governance.api";
import { ApiError } from "@/lib/http/safeFetch";
import { ErrorCode } from "@/lib/errors";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    // Abort previous in-flight request if any
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setIsRateLimited(false);
    setLoading(true);

    try {
      await loginAdmin({ email: email.trim(), password }, { signal: controller.signal });

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: unknown) {
      // Ignore manual aborts when unmounting
      if (controller.signal.aborted) {
        return;
      }

      if (err instanceof ApiError) {
        if (err.code === ErrorCode.RATE_LIMITED || err.status === 429) {
          setIsRateLimited(true);
          setError(
            err.message || "Too many login attempts. Please wait 60 seconds before trying again.",
          );
        } else if (err.code === ErrorCode.UNAUTHENTICATED || err.status === 401) {
          setError(err.message || "Invalid work email or password. Please try again.");
        } else if (err.code === ErrorCode.FORBIDDEN || err.status === 403) {
          setError(
            err.message || "Access denied. Your account may be deactivated or unauthorized.",
          );
        } else {
          setError(
            err.message || "Authentication service temporarily unavailable. Please try again.",
          );
        }
      } else if (err instanceof Error) {
        setError(err.message || "Invalid credentials");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#FAFBFD] p-4">
      {/* Background Ambience Waves */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#1155CC]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#22B6F6]/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-white shadow-xl shadow-[#1155CC]/30">
            <span className="font-sora text-xl font-black">TS</span>
          </div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Studio Control Platform
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Sign in to manage agency publishing & automation
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(17,85,204,0.08)] backdrop-blur-xl sm:p-8">
          {error && (
            <div
              id="login-error-msg"
              role="alert"
              aria-live="polite"
              className={`mb-6 flex items-start gap-2.5 rounded-2xl border p-4 text-xs font-semibold animate-in fade-in ${
                isRateLimited
                  ? "border-amber-200/90 bg-amber-50 text-amber-900"
                  : "border-rose-200/80 bg-rose-50 text-rose-700"
              }`}
            >
              {isRateLimited ? (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              )}
              <div className="flex-1">
                <span className="block font-bold">
                  {isRateLimited ? "Security Lockout" : "Authentication Failed"}
                </span>
                <span className="mt-0.5 block leading-relaxed font-normal">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@techsonance.co.in"
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error-msg" : undefined}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "login-error-msg" : undefined}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-10 text-sm focus:bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1155CC] text-xs font-bold tracking-normal text-white normal-case shadow-lg shadow-[#1155CC]/25 hover:bg-[#0d44a4] disabled:opacity-70 sm:text-sm"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Admin"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Protected by Native DB Auth & Secure Session
            </span>
            <Link href="/" className="underline hover:text-slate-600">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
