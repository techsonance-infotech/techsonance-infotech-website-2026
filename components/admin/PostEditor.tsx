"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import {
  submitPostForReview,
  publishPost,
  deletePost,
  createPost,
  updatePost,
} from "@/lib/api/admin-posts.api";
import { uploadMediaAsset } from "@/lib/api/media.api";
import type { AdminPost } from "@/lib/types/admin.types";

export interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImage: string;
  tagsInput: string;
  readTime: string;
  status: string;
}

interface PostEditorProps {
  initialPost?: Partial<AdminPost>;
  isNew?: boolean;
}

export function PostEditor({ initialPost, isNew = false }: PostEditorProps) {
  const router = useRouter();

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize React Hook Form for full state and validation management
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<PostFormData>({
    defaultValues: {
      title: initialPost?.title || "",
      slug: initialPost?.slug || "",
      excerpt: initialPost?.excerpt || "",
      content: initialPost?.content || "",
      heroImage: initialPost?.heroImage || "",
      tagsInput: (initialPost?.tags || []).join(", "),
      status: initialPost?.status || "DRAFT",
      readTime: initialPost?.readTime || "5 min read",
    },
  });

  // Watch reactive fields for real-time calculation and previews
  const title = watch("title");
  const slug = watch("slug");
  const excerpt = watch("excerpt");
  const content = watch("content");
  const heroImage = watch("heroImage");
  const status = watch("status");
  const readTime = watch("readTime");

  // Auto-generate slug from title if new or slug is empty
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("title", val, { shouldValidate: true, shouldDirty: true });
    if (isNew || !getValues("slug")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generated, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Auto-calculate word count & read time from content
  const wordCount = content?.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const data = await uploadMediaAsset(file, "blog/thumbnails");
      setValue("heroImage", data.secureUrl, { shouldDirty: true, shouldValidate: true });
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
      const formValues = getValues();
      const tags = formValues.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formValues.title,
        slug: formValues.slug,
        excerpt: formValues.excerpt,
        content: formValues.content,
        heroImage: formValues.heroImage,
        tags,
        readTime: formValues.readTime || estimatedReadTime,
        status: targetStatus || formValues.status,
      };

      let savedPost: AdminPost;
      if (isNew) {
        savedPost = await createPost(payload);
      } else {
        savedPost = await updatePost(initialPost!.id!, payload);
      }

      if (targetStatus) {
        setValue("status", targetStatus, { shouldDirty: false });
      }
      reset(formValues);

      setSuccessMsg(
        targetStatus === "PUBLISHED"
          ? "Article published and CDN cache revalidated!"
          : "Article saved successfully!",
      );

      if (isNew && savedPost?.id) {
        router.push(`/admin/blog/${savedPost.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Endpoint 1 Integration: POST /api/admin/blog/posts/[id]/submit
   * Submits a draft post for editorial review.
   */
  const handleSubmitForReview = async () => {
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      let postId = initialPost?.id;
      const formValues = getValues();

      const tags = formValues.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Ensure post exists in DRAFT state first
      if (isNew || !postId) {
        const payload = {
          title: formValues.title,
          slug: formValues.slug,
          excerpt: formValues.excerpt,
          content: formValues.content,
          heroImage: formValues.heroImage,
          tags,
          readTime: formValues.readTime || estimatedReadTime,
          status: "DRAFT",
        };

        const post = await createPost(payload);
        postId = post.id;
      } else {
        // Save latest modifications prior to submission
        const payload = {
          title: formValues.title,
          slug: formValues.slug,
          excerpt: formValues.excerpt,
          content: formValues.content,
          heroImage: formValues.heroImage,
          tags,
          readTime: formValues.readTime || estimatedReadTime,
        };

        await updatePost(postId, payload);
      }

      if (!postId) {
        throw new Error("Missing post identifier for submission");
      }

      // Call dedicated submission endpoint: POST /api/admin/blog/posts/[id]/submit
      const res = await submitPostForReview(postId);

      setValue("status", "IN_REVIEW", { shouldDirty: false });
      reset({ ...formValues, status: "IN_REVIEW" });
      setSuccessMsg(res.message || "Post submitted for editorial review successfully");

      if (isNew && postId) {
        router.push(`/admin/blog/${postId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit post for review");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Endpoint 2 Integration: POST /api/admin/blog/posts/[id]/publish
   * Publishes a draft or in-review article to the live site with ISR cache revalidation.
   */
  const handlePublish = async () => {
    setError(null);
    setSuccessMsg(null);
    setPublishing(true);

    try {
      let postId = initialPost?.id;
      const formValues = getValues();

      const tags = formValues.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Ensure post exists first if new
      if (isNew || !postId) {
        const payload = {
          title: formValues.title,
          slug: formValues.slug,
          excerpt: formValues.excerpt,
          content: formValues.content,
          heroImage: formValues.heroImage,
          tags,
          readTime: formValues.readTime || estimatedReadTime,
          status: "DRAFT",
        };

        const post = await createPost(payload);
        postId = post.id;
      } else {
        // Save latest modifications prior to publishing
        const payload = {
          title: formValues.title,
          slug: formValues.slug,
          excerpt: formValues.excerpt,
          content: formValues.content,
          heroImage: formValues.heroImage,
          tags,
          readTime: formValues.readTime || estimatedReadTime,
        };

        await updatePost(postId, payload);
      }

      if (!postId) {
        throw new Error("Missing post identifier for publishing");
      }

      // Call dedicated publish endpoint: POST /api/admin/blog/posts/[id]/publish
      const res = await publishPost(postId);

      setValue("status", "PUBLISHED", { shouldDirty: false });
      reset({ ...formValues, status: "PUBLISHED" });
      setSuccessMsg(res.message || "Article published and CDN cache revalidated!");

      if (isNew && postId) {
        router.push(`/admin/blog/${postId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish article");
    } finally {
      setPublishing(false);
    }
  };

  /**
   * Endpoint 3 Integration: DELETE /api/admin/blog/posts/[id]
   * Deletes a blog post and redirects back to the post management list.
   */
  const handleDeletePost = async () => {
    if (!initialPost?.id) return;
    const titleVal = getValues("title") || "this article";
    if (!confirm(`Are you sure you want to delete "${titleVal}"? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setDeleting(true);

    try {
      await deletePost(initialPost.id);
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setDeleting(false);
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
              {isDirty && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {wordCount} words • {estimatedReadTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isNew && initialPost?.id && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving || submitting || publishing || deleting}
              onClick={handleDeletePost}
              className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={saving || submitting || publishing || deleting}
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
              disabled={saving || submitting || publishing || deleting}
              onClick={handleSubmitForReview}
              className="rounded-xl text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>{submitting ? "Submitting..." : "Submit for Review"}</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            disabled={saving || submitting || publishing || deleting}
            onClick={handlePublish}
            className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 text-xs font-bold"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>
              {publishing
                ? "Publishing..."
                : status === "PUBLISHED"
                  ? "Republish Live Site"
                  : "Publish to Live Site"}
            </span>
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
                <label
                  htmlFor="post-title"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="post-title"
                  placeholder="e.g. Architecting Scalable Next.js 16 Applications in 2026"
                  {...register("title", {
                    required: "Article title is required",
                    minLength: { value: 3, message: "Title must be at least 3 characters" },
                  })}
                  onChange={handleTitleChange}
                  className="text-base sm:text-lg font-bold font-sora h-12"
                />
                {errors.title && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="post-slug"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    /blog/
                  </span>
                  <Input
                    id="post-slug"
                    placeholder="architecting-scalable-nextjs-16"
                    {...register("slug", {
                      required: "URL slug is required",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: "Slug must be lowercase alphanumeric with hyphens",
                      },
                    })}
                    className="font-mono text-xs"
                  />
                </div>
                {errors.slug && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="post-excerpt"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Article Summary / Excerpt
                </label>
                <Textarea
                  id="post-excerpt"
                  placeholder="A concise synopsis for search engines, cards, and RSS feeds..."
                  {...register("excerpt")}
                  className="min-h-[70px] text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="post-content"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Article Body (Markdown) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">{wordCount} words</span>
                </div>
                <Textarea
                  id="post-content"
                  placeholder="Write in Markdown or HTML. Supports headings (##), bold (**text**), lists, and code blocks..."
                  {...register("content", {
                    required: "Article content is required",
                    minLength: { value: 10, message: "Content must be at least 10 characters" },
                  })}
                  className="min-h-[420px] font-mono text-xs sm:text-sm leading-relaxed"
                />
                {errors.content && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1.5">
                    {errors.content.message}
                  </p>
                )}
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
                      onClick={() => setValue("heroImage", "", { shouldDirty: true })}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="hero-upload-input"
                  className="border-2 border-dashed border-slate-200 hover:border-[#1155CC]/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
                >
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
                <label
                  htmlFor="hero-image-url"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Or Image URL
                </label>
                <Input
                  id="hero-image-url"
                  placeholder="https://res.cloudinary.com/..."
                  {...register("heroImage")}
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
                <label
                  htmlFor="post-tags"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Comma-separated Tags
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="post-tags"
                    placeholder="Next.js, Architecture, Supabase"
                    {...register("tagsInput")}
                    className="pl-8 text-xs"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="post-readtime"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Reading Time
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="post-readtime"
                    placeholder="5 min read"
                    {...register("readTime")}
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
                {excerpt ||
                  (content ? content.slice(0, 140) : "") ||
                  "Article summary snippet as it will appear on Google."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
