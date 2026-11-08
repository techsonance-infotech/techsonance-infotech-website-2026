"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UploadCloud, Image as ImageIcon, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadMediaAsset } from "@/lib/api/media.api";

interface UploadedMedia {
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [uploads, setUploads] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const data = await uploadMediaAsset(file, "agency/media");

      const item: UploadedMedia = {
        secureUrl: data.secureUrl,
        publicId: data.publicId,
        format: data.format,
        width: data.width,
        height: data.height,
        createdAt: new Date().toLocaleTimeString(),
      };

      setUploads((prev) => [item, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 duration-300 animate-in fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Media & Asset Library
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Store and optimize high-resolution images powered by Cloudinary CDN.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition-colors hover:border-[#1155CC]/50 hover:bg-blue-50/20">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1155CC]/10 text-[#1155CC]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h3 className="font-sora text-sm font-bold text-slate-800">
              {uploading ? "Uploading & Transforming..." : "Click or drag images to upload"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Supports JPEG, PNG, WebP. Automatically delivered with webp/q_auto optimization.
            </p>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </CardContent>
      </Card>

      {/* Uploaded Gallery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-sora text-base font-bold text-slate-900">
            Uploaded Assets
          </CardTitle>
          <CardDescription className="text-xs">
            Assets uploaded in this session ready for insertion into blog articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <span>No media uploaded yet. Use the upload area above to upload assets.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((item) => (
                <div
                  key={item.publicId}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                >
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-slate-100">
                    <Image
                      src={item.secureUrl}
                      alt={item.publicId}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <p
                      className="truncate font-mono text-[11px] text-slate-500"
                      title={item.publicId}
                    >
                      {item.publicId}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.secureUrl, item.publicId)}
                        className="h-8 flex-1 rounded-lg text-[11px] font-semibold"
                      >
                        {copiedId === item.publicId ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3 text-slate-400" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </Button>
                      <a
                        href={item.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
