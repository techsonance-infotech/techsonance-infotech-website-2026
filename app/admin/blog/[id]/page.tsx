import React from "react";
import { notFound } from "next/navigation";
import { getContainer } from "@/lib/di/container";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { PostEditor } from "@/components/admin/PostEditor";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const container = getContainer();
  const postsService = container.get(AdminPostsService);
  const post = await postsService.getPostById(id);

  if (!post) {
    notFound();
  }

  return <PostEditor initialPost={post} isNew={false} />;
}
