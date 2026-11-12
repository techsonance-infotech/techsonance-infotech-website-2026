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
  Sparkles,
  RefreshCw,
  ZoomIn,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import {
  submitPostForReview,
  publishPost,
  deletePost,
  createPost,
  updatePost,
  generatePostThumbnail,
  aiRevisePost,
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
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailFeedback, setThumbnailFeedback] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // AI Revision states
  const [showAiReviseDialog, setShowAiReviseDialog] = useState(false);
  const [reviseInstruction, setReviseInstruction] = useState("");
  const [reviseTargetSection, setReviseTargetSection] = useState("");
  const [reviseAutoPublish, setReviseAutoPublish] = useState(false);
  const [revising, setRevising] = useState(false);

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

  const handleGenerateThumbnail = async () => {
    const currentTitle = getValues("title")?.trim();
    if (!currentTitle) {
      setThumbnailFeedback("Please enter an article title first.");
      return;
    }

    setGeneratingThumbnail(true);
    setThumbnailFeedback(null);
    try {
      const currentExcerpt = getValues("excerpt")?.trim();
      const currentContent = getValues("content")?.trim();
      const currentTags = getValues("tagsInput")
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await generatePostThumbnail({
        postId: initialPost?.id,
        title: currentTitle,
        prompt: initialPost?.thumbnailPrompt || currentTitle,
        summary: currentExcerpt,
        contentExcerpt: currentContent?.slice(0, 1500),
        keywords: currentTags,
      });

      if (res.data?.url) {
        setValue("heroImage", res.data.url, { shouldDirty: true, shouldValidate: true });
        if (res.data.thumbnailMissing) {
          setThumbnailFeedback(
            "AI generation failed across providers (quota/auth). Fallback hero image was applied.",
          );
        } else {
          setThumbnailFeedback("AI thumbnail generated successfully!");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate thumbnail.";
      setThumbnailFeedback(`Generation failed: ${msg}`);
    } finally {
      setGeneratingThumbnail(false);
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
  const handleDeletePost = () => {
    if (!initialPost?.id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!initialPost?.id) return;
    setError(null);
    setSuccessMsg(null);
    setDeleting(true);

    try {
      await deletePost(initialPost.id);
      setShowDeleteConfirm(false);
      router.push("/admin/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setDeleting(false);
    }
  };

  /**
   * Endpoint Integration: POST /api/admin/blog/posts/[id]/ai-revise
   * Assigns flawed/awful content or broken diagrams to the AI agent pipeline
   * to surgically fix, re-validate, and either submit for review or republish.
   */
  const handleAiRevise = async () => {
    if (!initialPost?.id || !reviseInstruction.trim()) return;
    setRevising(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await aiRevisePost(initialPost.id, {
        instruction: reviseInstruction.trim(),
        targetSectionHeading: reviseTargetSection.trim() || undefined,
        autoPublish: reviseAutoPublish,
      });

      if (res.ok) {
        setSuccessMsg(
          `AI Agent successfully revised content: ${res.data.summary}. ${
            reviseAutoPublish ? "Changes are published live!" : "Submitted for editorial review."
          }`,
        );
        setShowAiReviseDialog(false);
        setReviseInstruction("");
        router.refresh();
      } else {
        setError(res.message || "AI content revision failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI content revision");
    } finally {
      setRevising(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Top action bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog">
            <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sora text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
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
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-600 uppercase">
                  Unsaved changes
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
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
              className="rounded-xl border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </Button>
          )}

          {!isNew && initialPost?.id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || submitting || publishing || deleting || revising}
              onClick={() => setShowAiReviseDialog(true)}
              className="rounded-xl border-purple-200 bg-purple-50/50 text-xs font-bold text-purple-700 hover:bg-purple-100/70 shadow-2xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
              <span>AI Revise / Fix</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={saving || submitting || publishing || deleting}
            onClick={() => handleSave("DRAFT")}
            className="rounded-xl text-xs font-bold text-slate-700"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            <span>Save Draft</span>
          </Button>

          {status !== "IN_REVIEW" && status !== "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving || submitting || publishing || deleting}
              onClick={handleSubmitForReview}
              className="rounded-xl border-amber-200 text-xs font-bold text-amber-700 hover:bg-amber-50"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              <span>{submitting ? "Submitting..." : "Submit for Review"}</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            disabled={saving || submitting || publishing || deleting}
            onClick={handlePublish}
            className="rounded-xl bg-[#1155CC] text-xs font-bold text-white shadow-md shadow-[#1155CC]/20 hover:bg-[#0d44a4]"
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
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
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editor Grid: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left main content column */}
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="post-title"
                  className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
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
                  className="h-12 font-sora text-base font-bold sm:text-lg"
                />
                {errors.title && (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="post-slug"
                  className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                >
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-xs text-slate-400">
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
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="post-excerpt"
                  className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
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
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="post-content"
                    className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
                  >
                    Article Body (Markdown) <span className="text-rose-500">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-slate-400">{wordCount} words</span>
                </div>
                <Textarea
                  id="post-content"
                  placeholder="Write in Markdown or HTML. Supports headings (##), bold (**text**), lists, and code blocks..."
                  {...register("content", {
                    required: "Article content is required",
                    minLength: { value: 10, message: "Content must be at least 10 characters" },
                  })}
                  className="min-h-[420px] font-mono text-xs leading-relaxed sm:text-sm"
                />
                {errors.content && (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar settings column */}
        <div className="space-y-6 lg:col-span-4">
          {/* Hero Thumbnail Box */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Hero Image / Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroImage ? (
                <div
                  onClick={() => setShowImagePreview(true)}
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xs transition-all hover:border-[#1155CC]/50"
                  title="Click to zoom and inspect image"
                >
                  <Image
                    src={heroImage}
                    alt="Hero Thumbnail Preview"
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top-Right Delete Action Button (Isolated from center click) */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteImageConfirm(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950/80 text-rose-300 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-rose-600 hover:text-white"
                      title="Remove hero image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Center Click-To-Zoom Hover Cue */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                      <ZoomIn className="h-3.5 w-3.5 text-[#38bdf8]" />
                      <span>Click to zoom & inspect</span>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="hero-upload-input"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-colors hover:border-[#1155CC]/50 hover:bg-blue-50/20"
                >
                  <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingImage ? "Uploading to Cloudinary..." : "Upload Hero Image"}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
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

              {/* AI Thumbnail Generation Trigger */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={generatingThumbnail}
                  onClick={handleGenerateThumbnail}
                  className="w-full gap-2 rounded-xl border-[#1155CC]/30 bg-blue-50/50 text-xs font-bold text-[#1155CC] hover:bg-blue-100/60 hover:text-[#0c409c]"
                >
                  {generatingThumbnail ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Generating Thumbnail with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[#1155CC]" />
                      {heroImage ? "Regenerate AI Thumbnail" : "Generate AI Thumbnail"}
                    </>
                  )}
                </Button>
                {thumbnailFeedback && (
                  <p
                    className={`text-[11px] font-medium ${
                      thumbnailFeedback.includes("Fallback")
                        ? "text-amber-600"
                        : thumbnailFeedback.includes("failed")
                          ? "text-rose-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {thumbnailFeedback}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="hero-image-url"
                  className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase"
                >
                  Or Image URL
                </label>
                <Input
                  id="hero-image-url"
                  placeholder="https://res.cloudinary.com/..."
                  {...register("heroImage")}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags & Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Categorization & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="post-tags"
                  className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                >
                  Comma-separated Tags
                </label>
                <div className="relative">
                  <Tag className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
                  className="mb-2 block text-xs font-bold tracking-wider text-slate-700 uppercase"
                >
                  Reading Time
                </label>
                <div className="relative">
                  <Clock className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
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
          <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <Eye className="h-3.5 w-3.5 text-[#1155CC]" />
                <span>Search Engine Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="truncate font-mono text-[11px] text-slate-600">
                https://techsonance.co.in/blog/{slug || "post-slug"}
              </p>
              <h4 className="line-clamp-1 cursor-pointer text-sm font-semibold text-[#1a0dab] hover:underline">
                {title || "Article Title | TechSonance Blog"}
              </h4>
              <p className="line-clamp-2 text-xs text-slate-600">
                {excerpt ||
                  (content ? content.slice(0, 140) : "") ||
                  "Article summary snippet as it will appear on Google."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Non-blocking Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <dialog
            open
            aria-labelledby="delete-post-title"
            className="m-0 block w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              id="delete-post-title"
              className="font-sora text-base font-bold text-slate-900 dark:text-white"
            >
              Permanently Delete Article?
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                "{getValues("title") || "this article"}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
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
                {deleting ? "Deleting…" : "Delete Article"}
              </Button>
            </div>
          </dialog>
        </div>
      )}
      {/* Full-Screen Zoom Lightbox Modal */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl overflow-hidden border-slate-800 bg-slate-950 p-0 text-white sm:rounded-2xl">
          <DialogHeader className="border-b border-slate-800 p-4">
            <DialogTitle className="text-sm font-bold text-slate-200">
              Hero Graphic Preview — {title || "Article Image"}
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex aspect-video w-full items-center justify-center bg-slate-950 p-2">
            {heroImage && (
              <Image
                src={heroImage}
                alt="Full resolution hero graphic"
                fill
                unoptimized
                className="object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-400">
            <span>16:9 Editorial Graphic</span>
            {heroImage && (
              <a
                href={heroImage}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#38bdf8] hover:underline"
              >
                Open Full Resolution &rarr;
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={showDeleteImageConfirm} onOpenChange={setShowDeleteImageConfirm}>
        <AlertDialogContent className="rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sora text-base font-bold text-slate-900">
              Remove Hero Image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to remove the current hero image from this article? You can
              upload a replacement or generate a new AI graphic at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDeleteImageConfirm(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValue("heroImage", "", { shouldDirty: true });
                setShowDeleteImageConfirm(false);
              }}
              className="rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
            >
              Remove Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* AI Revise / Fix Dialog */}
      <Dialog open={showAiReviseDialog} onOpenChange={setShowAiReviseDialog}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-sora text-base font-bold text-slate-900">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Assign to Agentic Revision Pipeline</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600">
              Assign a flawed, broken, or awful section (such as overlapping Mermaid diagrams, technical inaccuracies, or outdated APIs) to the agentic pipeline. The AI will surgically fix and validate the content without altering the rest of the post.
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="revise-instruction"
                className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Fix Instructions <span className="text-rose-500">*</span>
              </label>
              <Textarea
                id="revise-instruction"
                rows={4}
                value={reviseInstruction}
                onChange={(e) => setReviseInstruction(e.target.value)}
                placeholder="e.g. Fix the Mermaid architecture diagrams in Section 4 and Section 5 so that labels never collide or overlap, and use clean sequenceDiagram syntax for the RPC steps."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="revise-target-section"
                className="block text-xs font-bold tracking-wider text-slate-700 uppercase"
              >
                Target Section Heading (Optional)
              </label>
              <Input
                id="revise-target-section"
                value={reviseTargetSection}
                onChange={(e) => setReviseTargetSection(e.target.value)}
                placeholder="e.g. 4. Full request-response flow diagram"
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="revise-auto-publish"
                checked={reviseAutoPublish}
                onChange={(e) => setReviseAutoPublish(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#1155CC] focus:ring-[#1155CC]"
              />
              <label htmlFor="revise-auto-publish" className="text-xs font-semibold text-slate-700">
                Auto-publish to live site after validation (purges CDN cache tags)
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={revising}
              onClick={() => setShowAiReviseDialog(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={revising || !reviseInstruction.trim()}
              onClick={handleAiRevise}
              className="rounded-xl bg-purple-600 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
            >
              {revising ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span>Agent Revising Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  <span>Run Agent Revision</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
