"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UploadCloud, Image as ImageIcon, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "agency/media");

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Media & Asset Library
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Store and optimize high-resolution images powered by Cloudinary CDN.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <label className="border-2 border-dashed border-slate-200 hover:border-[#1155CC]/50 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1155CC]/10 text-[#1155CC] flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 font-sora">
              {uploading ? "Uploading & Transforming..." : "Click or drag images to upload"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
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
          <CardTitle className="text-base font-bold text-slate-900 font-sora">
            Uploaded Assets
          </CardTitle>
          <CardDescription className="text-xs">
            Assets uploaded in this session ready for insertion into blog articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No media uploaded yet. Use the upload area above to upload assets.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map((item) => (
                <div
                  key={item.publicId}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white group shadow-2xs"
                >
                  <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.secureUrl}
                      alt={item.publicId}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <p
                      className="text-[11px] font-mono text-slate-500 truncate"
                      title={item.publicId}
                    >
                      {item.publicId}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(item.secureUrl, item.publicId)}
                        className="flex-1 h-8 text-[11px] font-semibold rounded-lg"
                      >
                        {copiedId === item.publicId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 mr-1" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1 text-slate-400" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </Button>
                      <a
                        href={item.secureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
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
