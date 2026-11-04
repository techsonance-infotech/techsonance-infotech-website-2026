"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  UploadCloud,
  Eye,
  AlertCircle,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Post } from "@/lib/database/schema/core/post.schema";

interface PostEditorProps {
  initialPost?: Partial<Post>;
  isNew?: boolean;
}

export function PostEditor({ initialPost, isNew = false }: PostEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [content, setContent] = useState(initialPost?.content || "");
  const [heroImage, setHeroImage] = useState(initialPost?.heroImage || "");
  const [tagsInput, setTagsInput] = useState((initialPost?.tags || []).join(", "));
  const [status, setStatus] = useState(initialPost?.status || "DRAFT");
  const [readTime, setReadTime] = useState(initialPost?.readTime || "5 min read");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate slug from title if new or slug is empty
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  };

  // Auto-calculate word count & read time from content
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog/thumbnails");

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setHeroImage(data.secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (targetStatus?: string) => {
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title,
        slug,
        excerpt,
        content,
        heroImage,
        tags,
        readTime: estimatedReadTime,
        status: targetStatus || status,
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/posts/${initialPost?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save post");
      }

      if (targetStatus) setStatus(targetStatus);
      setSuccessMsg(
        targetStatus === "PUBLISHED"
          ? "Article published and CDN cache revalidated!"
          : "Article saved successfully!",
      );

      if (isNew && data.post?.id) {
        router.push(`/admin/blog/${data.post.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sora">
                {isNew ? "New Blog Article" : "Edit Article"}
              </h1>
              <Badge
                variant={
                  status === "PUBLISHED"
                    ? "success"
                    : status === "IN_REVIEW"
                      ? "warning"
                      : "secondary"
                }
                dot={status === "PUBLISHED"}
              >
                {status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {wordCount} words • {estimatedReadTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => handleSave("DRAFT")}
            className="rounded-xl text-xs font-bold text-slate-700"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save Draft</span>
          </Button>

          {status !== "IN_REVIEW" && status !== "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => handleSave("IN_REVIEW")}
              className="rounded-xl text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Submit for Review</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            disabled={saving}
            onClick={() => handleSave("PUBLISHED")}
            className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 text-xs font-bold"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>{saving ? "Publishing..." : "Publish to Live Site"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editor Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left main content column */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <label htmlFor="post-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Article Title
                </label>
                <Input
                  id="post-title"
                  required
                  placeholder="e.g. Architecting Scalable Next.js 16 Applications in 2026"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-base sm:text-lg font-bold font-sora h-12"
                />
              </div>

              <div>
                <label htmlFor="post-slug" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    /blog/
                  </span>
                  <Input
                    id="post-slug"
                    required
                    placeholder="architecting-scalable-nextjs-16"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="post-excerpt" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Article Summary / Excerpt
                </label>
                <Textarea
                  id="post-excerpt"
                  placeholder="A concise synopsis for search engines, cards, and RSS feeds..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="min-h-[70px] text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="post-content" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Article Body (Markdown)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {wordCount} words
                  </span>
                </div>
                <Textarea
                  id="post-content"
                  required
                  placeholder="Write in Markdown or HTML. Supports headings (##), bold (**text**), lists, and code blocks..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[420px] font-mono text-xs sm:text-sm leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar settings column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hero Thumbnail Box */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Hero Image / Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group aspect-video bg-slate-50">
                  <Image
                    src={heroImage}
                    alt="Hero Thumbnail Preview"
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroImage("")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="hero-upload-input" className="border-2 border-dashed border-slate-200 hover:border-[#1155CC]/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingImage ? "Uploading to Cloudinary..." : "Upload Hero Image"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, WebP up to 5MB
                  </span>
                  <input
                    id="hero-upload-input"
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}

              <div>
                <label htmlFor="hero-image-url" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Or Image URL
                </label>
                <Input
                  id="hero-image-url"
                  placeholder="https://res.cloudinary.com/..."
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags & Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                Categorization & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="post-tags" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Comma-separated Tags
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="post-tags"
                    placeholder="Next.js, Architecture, Supabase"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="post-readtime" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reading Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="post-readtime"
                    placeholder="5 min read"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google SERP Live Snippet Preview */}
          <Card className="bg-slate-50/50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#1155CC]" />
                <span>Search Engine Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-[11px] text-slate-600 truncate font-mono">
                https://techsonance.co.in/blog/{slug || "post-slug"}
              </p>
              <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                {title || "Article Title | TechSonance Blog"}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                {excerpt || content.slice(0, 140) || "Article summary snippet as it will appear on Google."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
