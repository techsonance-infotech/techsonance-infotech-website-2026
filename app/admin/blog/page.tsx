"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Edit, Trash2, RefreshCw, FileText, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { submitPostForReview, publishPost, deletePost, listPosts } from "@/lib/api/admin-posts.api";
import type { AdminPost } from "@/lib/types/admin.types";
import { AsyncState } from "@/components/feedback/AsyncState";
import { formatDateSafe } from "@/lib/utils/formatters";

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Deletion modal state
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Request race condition guard
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef<number>(0);

  const fetchPosts = useCallback(
    async (showLoader = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentSeq = ++requestSeqRef.current;

      if (showLoader) setLoading(true);
      setErrorMsg(null);

      try {
        const data = await listPosts(
          {
            status: activeTab !== "ALL" ? activeTab : undefined,
            search: debouncedSearch.trim() || undefined,
          },
          controller.signal,
        );

        if (currentSeq === requestSeqRef.current) {
          setPosts(data.posts || []);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (currentSeq === requestSeqRef.current) {
          const msg = err instanceof Error ? err.message : "Failed to load blog articles.";
          setErrorMsg(msg);
        }
      } finally {
        if (currentSeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [activeTab, debouncedSearch],
  );

  useEffect(() => {
    fetchPosts(true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPosts]);

  const handlePublish = async (id: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setActionLoadingId(id);
      await publishPost(id);
      setActionSuccess("Article published successfully to the live site.");
      await fetchPosts(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish post.";
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setActionLoadingId(id);
      await submitPostForReview(id);
      setActionSuccess("Article submitted for editorial review.");
      await fetchPosts(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit post for review.";
      setActionError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      setDeleting(true);
      setActionError(null);
      await deletePost(postToDelete.id);
      setPostToDelete(null);
      setActionSuccess("Article deleted successfully.");
      await fetchPosts(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete post.";
      setActionError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { label: "All Posts", value: "ALL" },
    { label: "Published", value: "PUBLISHED" },
    { label: "In Review", value: "IN_REVIEW" },
    { label: "Drafts", value: "DRAFT" },
  ];

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Blog Articles
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
            Create, edit, and publish engineering articles and technical insights.
          </p>
        </div>

        <Link href="/admin/blog/new">
          <Button
            variant="default"
            size="sm"
            className="rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-md shadow-[#1155CC]/20 hover:bg-[#0d44a4]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* Non-blocking Action Feedback */}
      {actionSuccess && (
        <div
          role="status"
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="cursor-pointer font-bold text-emerald-900 hover:opacity-80 dark:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="cursor-pointer font-bold text-rose-900 hover:opacity-80 dark:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === tab.value
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search articles by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-xl pl-9 pr-8 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Container wrapped in AsyncState */}
          <AsyncState
            loading={loading}
            error={errorMsg}
            data={posts}
            isEmpty={(items) => items.length === 0}
            onRetry={() => fetchPosts(true)}
            skeleton={
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))}
              </div>
            }
            emptyUI={
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {debouncedSearch || activeTab !== "ALL"
                    ? "No articles match current filters"
                    : "No blog articles found"}
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  {debouncedSearch || activeTab !== "ALL"
                    ? "Try adjusting your search terms or clearing status filters."
                    : "Click 'Create Article' to write your first technical publication."}
                </p>
                {debouncedSearch || activeTab !== "ALL" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setActiveTab("ALL");
                    }}
                    className="mt-4 rounded-xl text-xs"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 rounded-xl bg-[#1155CC] text-xs text-white hover:bg-[#0d44a4]"
                  >
                    <Link href="/admin/blog/new">Create Article</Link>
                  </Button>
                )}
              </div>
            }
          >
            {(renderedPosts) => (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Read Time</th>
                      <th className="px-4 py-3">Last Updated</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {renderedPosts.map((post) => (
                      <tr
                        key={post.id}
                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="max-w-sm px-4 py-3.5">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            className="line-clamp-1 block font-bold text-slate-900 transition-colors hover:text-[#1155CC] dark:text-white"
                          >
                            {post.title || "Untitled Article"}
                          </Link>
                          {post.excerpt && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                              {post.excerpt}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          /{post.slug || "article"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              post.status === "PUBLISHED"
                                ? "success"
                                : post.status === "IN_REVIEW"
                                  ? "warning"
                                  : "secondary"
                            }
                            dot={post.status === "PUBLISHED"}
                          >
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-500">
                          {post.readTime || "5 min read"}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-500">
                          {formatDateSafe(post.updatedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {post.status === "DRAFT" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoadingId === post.id}
                                onClick={() => handleSubmitForReview(post.id)}
                                className="h-7 rounded-lg px-2 text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                title="Submit for editorial review"
                              >
                                {actionLoadingId === post.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Submit"
                                )}
                              </Button>
                            )}
                            {post.status !== "PUBLISHED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoadingId === post.id}
                                onClick={() => handlePublish(post.id)}
                                className="h-7 rounded-lg px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                {actionLoadingId === post.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Publish"
                                )}
                              </Button>
                            )}
                            <Link href={`/admin/blog/${post.id}`}>
                              <button
                                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1155CC] dark:hover:bg-slate-800"
                                title="Edit Article"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                            {post.status === "PUBLISHED" && (
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <button
                                  className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                                  title="View Public Page"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              </Link>
                            )}
                            <button
                              disabled={actionLoadingId === post.id}
                              onClick={() =>
                                setPostToDelete({ id: post.id, title: post.title || "Article" })
                              }
                              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                              title="Delete Article"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AsyncState>
        </CardContent>
      </Card>

      {/* Non-blocking Deletion Confirmation Modal */}
      {postToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-sora text-base font-bold text-slate-900 dark:text-white">
              Permanently Delete Article?
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{postToDelete.title}"</strong>? This will permanently archive the article and remove it from the index.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setPostToDelete(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleting}
                onClick={confirmDeletePost}
                className="rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Delete Article"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
