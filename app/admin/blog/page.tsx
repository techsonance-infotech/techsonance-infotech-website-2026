"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Edit, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
        const params = new URLSearchParams();
        if (activeTab !== "ALL") {
          params.set("status", activeTab);
        }
        if (search.trim()) {
          params.set("search", search.trim());
        }
        const res = await fetch(`/api/admin/posts?${params.toString()}`);
        const data = await res.json();
        if (data.ok) {
          setPosts(data.posts || []);
        }
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
      const res = await fetch(`/api/admin/posts/${id}/publish`, { method: "POST" });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (err) {
      console.error(err);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Blog Articles
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Create, edit, and publish engineering articles and technical insights.
          </p>
        </div>

        <Link href="/admin/blog/new">
          <Button
            variant="default"
            size="sm"
            className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create Article</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search articles by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Read Time</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1155CC]" />
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
                    <tr key={post.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="font-bold text-slate-900 hover:text-[#1155CC] transition-colors block line-clamp-1"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {post.excerpt}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        /{post.slug}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {post.readTime || "5 min read"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {post.status !== "PUBLISHED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoadingId === post.id}
                              onClick={() => handlePublish(post.id)}
                              className="h-7 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            >
                              Publish
                            </Button>
                          )}
                          <Link href={`/admin/blog/${post.id}`}>
                            <button className="p-1.5 text-slate-400 hover:text-[#1155CC] rounded-lg hover:bg-slate-100 transition-colors">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          {post.status === "PUBLISHED" && (
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          )}
                          <button
                            disabled={actionLoadingId === post.id}
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
