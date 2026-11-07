"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Edit, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { submitPostForReview, publishPost, deletePost, listPosts } from "@/lib/api/admin-posts.api";
import type { AdminPost } from "@/lib/types/admin.types";

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const data = await listPosts({
          status: activeTab !== "ALL" ? activeTab : undefined,
          search: search.trim() || undefined,
        });
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Failed to load posts", err);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, search],
  );

  useEffect(() => {
    void fetchPosts(false);
  }, [fetchPosts]);

  const handlePublish = async (id: string) => {
    try {
      setActionLoadingId(id);
      await publishPost(id);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitForReview = async (id: string) => {
    try {
      setActionLoadingId(id);
      await submitPostForReview(id);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to submit post for review");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      setActionLoadingId(id);
      await deletePost(id);
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setActionLoadingId(null);
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
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Blog Articles
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
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

      {/* Filter Tabs & Search Bar */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === tab.value
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
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
                className="h-9 rounded-xl pl-9 text-xs"
              />
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Read Time</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#1155CC]" />
                      <span>Loading articles...</span>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No blog articles found. Click "Create Article" to get started!
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="group transition-colors hover:bg-slate-50/80">
                      <td className="max-w-sm px-4 py-3.5">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="line-clamp-1 block font-bold text-slate-900 transition-colors hover:text-[#1155CC]"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                            {post.excerpt}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        /{post.slug}
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
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoadingId === post.id}
                              onClick={() => handleSubmitForReview(post.id)}
                              className="h-7 rounded-lg px-2 text-[11px] font-bold text-amber-600 hover:bg-amber-50"
                              title="Submit for editorial review"
                            >
                              Submit
                            </Button>
                          )}
                          {post.status !== "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoadingId === post.id}
                              onClick={() => handlePublish(post.id)}
                              className="h-7 rounded-lg px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50"
                            >
                              Publish
                            </Button>
                          )}
                          <Link href={`/admin/blog/${post.id}`}>
                            <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1155CC]">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          {post.status === "PUBLISHED" && (
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                          )}
                          <button
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleDelete(post.id, post.title)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
