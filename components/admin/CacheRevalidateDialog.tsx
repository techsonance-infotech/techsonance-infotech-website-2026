"use client";

import React, { useState } from "react";
import { RefreshCw, X, CheckCircle2, AlertTriangle, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidateAdminCache } from "@/lib/api/admin-governance.api";

interface CacheRevalidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CacheRevalidateDialog({ isOpen, onClose }: CacheRevalidateDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(["posts", "jobs"]);
  const [customPath, setCustomPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableTags = ["posts", "jobs", "blog", "careers", "all"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleRevalidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const pathsToRevalidate = customPath.trim() ? [customPath.trim()] : undefined;

    try {
      const res = await revalidateAdminCache({
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        paths: pathsToRevalidate,
      });

      const tagsCount = res.revalidatedTags?.length || 0;
      const pathsCount = res.revalidatedPaths?.length || 0;
      setSuccessMsg(`Cache revalidated! (${tagsCount} tags, ${pathsCount} paths updated)`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cache revalidation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200">
      <dialog
        open
        aria-modal="true"
        aria-labelledby="cache-revalidate-title"
        className="animate-in zoom-in-95 m-0 block w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1155CC] dark:bg-blue-950/60 dark:text-blue-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="cache-revalidate-title"
                className="font-sora text-base font-bold text-slate-900 dark:text-white"
              >
                On-Demand Cache Purge
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Revalidate Next.js ISR tags and edge routes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRevalidate} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
              Select Cache Tags to Invalidate
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#1155CC] text-white border-[#1155CC] shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="custom-revalidate-path"
              className="mb-1.5 block text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400"
            >
              Optional Custom Path (e.g. /blog, /careers)
            </label>
            <Input
              id="custom-revalidate-path"
              type="text"
              placeholder="/careers"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || (selectedTags.length === 0 && !customPath.trim())}
              className="gap-1.5 rounded-xl bg-[#1155CC] text-xs font-bold text-white hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Revalidate Cache
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
