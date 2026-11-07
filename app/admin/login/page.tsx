"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.ADMIN.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || data.message || "Failed to sign in";
        throw new Error(errorMsg);
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFBFD] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience Waves */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#1155CC]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#22B6F6]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1155CC] via-[#1E6BEE] to-[#22B6F6] text-white shadow-xl shadow-[#1155CC]/30 mb-4">
            <span className="font-black text-xl font-sora">TS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Studio Control Platform
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Sign in to manage agency publishing & automation
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(17,85,204,0.08)] p-6 sm:p-8 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  placeholder="admin@techsonance.co.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm focus:bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-lg shadow-[#1155CC]/25 font-bold normal-case tracking-normal text-xs sm:text-sm mt-2 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Admin"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Protected by Native DB Auth & Secure Session
            </span>
            <Link href="/" className="hover:text-slate-600 underline">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
