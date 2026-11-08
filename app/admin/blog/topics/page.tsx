"use client";

import React, { useState, useEffect, useCallback, useRef, startTransition } from "react";
import Link from "next/link";
import { Sparkles, Plus, Search, CheckCircle2, XCircle, Play, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AiTopicStatus } from "@/lib/constants/enums/ai.enum";
import {
  listAdminAiTopics,
  createAdminAiTopic,
  updateAdminAiTopicStatus,
  deleteAdminAiTopic,
  suggestAdminAiTopics,
  launchAdminAiTopic,
  type AdminAiTopicItem,
} from "@/lib/api/admin-ai.api";

export default function TopicsBacklogPage() {
  const [topics, setTopics] = useState<AdminAiTopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New topic modal state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newKeywords, setNewKeywords] = useState("");
  const [newAudience, setNewAudience] = useState("Tech Leads & Engineers");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTopics = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const data = await listAdminAiTopics(
        {
          status: activeTab !== "ALL" ? (activeTab as AiTopicStatus) : undefined,
          search: search.trim() || undefined,
        },
        controller.signal,
      );
      startTransition(() => {
        setTopics(data.topics);
      });
    } catch {
      // Handled cleanly via boundary
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    startTransition(() => {
      void loadTopics();
    });
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTopics]);

  const handleUpdateStatus = async (id: string, status: AiTopicStatus) => {
    try {
      await updateAdminAiTopicStatus(id, status);
      setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      showMessage(`Topic updated to ${status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      showMessage(msg);
    }
  };

  const handleDelete = (id: string, title: string) => {
    setTopicToDelete({ id, title });
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      setDeleting(true);
      await deleteAdminAiTopic(topicToDelete.id);
      setTopics((prev) => prev.filter((t) => t.id !== topicToDelete.id));
      showMessage("Topic removed");
      setTopicToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete topic";
      showMessage(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleLaunchGeneration = async (id: string) => {
    try {
      showMessage("Launching autonomous generation pipeline...");
      const res = await launchAdminAiTopic(id);
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: AiTopicStatus.QUEUED } : t)),
      );
      const shortId = res.jobId ? `${res.jobId.slice(0, 8)}...` : "queued";
      showMessage(`Autonomous job created! Job ID: ${shortId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error launching job";
      showMessage(msg);
    }
  };

  const handleAISuggest = async () => {
    try {
      setIsSuggesting(true);
      showMessage("AI Strategist generating high-ranking topic ideas...");
      const data = await suggestAdminAiTopics("Agentic AI & Next.js 16");
      showMessage(`Generated ${data.count} new AI topic proposals!`);
      void loadTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to AI service";
      showMessage(msg);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const keywords = newKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      await createAdminAiTopic({
        title: newTitle.trim(),
        category: newCategory,
        keywords,
        targetAudience: newAudience,
        difficulty: newDifficulty,
        priority: 1,
      });

      setIsCreating(false);
      setNewTitle("");
      setNewKeywords("");
      showMessage("Topic added to backlog!");
      void loadTopics();
    } catch {
      showMessage("Failed to create topic");
    }
  };

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const tabs = [
    { label: "All Topics", value: "ALL" },
    { label: "Accepted", value: AiTopicStatus.ACCEPTED },
    { label: "Suggested", value: AiTopicStatus.SUGGESTED },
    { label: "Queued", value: AiTopicStatus.QUEUED },
    { label: "Generated", value: AiTopicStatus.GENERATED },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed right-6 bottom-6 z-50 flex slide-in-from-bottom items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Topic Backlog & Planning
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Curate high-intent content ideas, accept AI proposals, and trigger autonomous pipeline
            jobs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAISuggest}
            disabled={isSuggesting}
            className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-95"
          >
            <Sparkles className={`mr-2 h-4 w-4 ${isSuggesting ? "animate-spin" : ""}`} />
            {isSuggesting ? "Proposing Topics..." : "AI Suggest Topics"}
          </Button>

          <Button
            onClick={() => setIsCreating(true)}
            className="rounded-2xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Topic
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row">
        <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic backlog..."
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9 text-xs"
          />
        </div>
      </div>

      {/* New Topic Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 sm:p-8">
            <h2 className="mb-1 font-sora text-lg font-black text-slate-900">
              Add New Topic to Backlog
            </h2>
            <p className="mb-6 text-xs font-medium text-slate-500">
              Create an editorial topic ready for autonomous or manual writing.
            </p>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label
                  htmlFor="new-topic-title"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  Topic Title
                </label>
                <Input
                  id="new-topic-title"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Architecting Real-Time Microservices with Next.js 16"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="new-topic-category"
                    className="mb-1 block text-xs font-bold text-slate-700"
                  >
                    Category
                  </label>
                  <Input
                    id="new-topic-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Engineering"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-topic-difficulty"
                    className="mb-1 block text-xs font-bold text-slate-700"
                  >
                    Difficulty
                  </label>
                  <select
                    id="new-topic-difficulty"
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-topic-keywords"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  Target Keywords (comma-separated)
                </label>
                <Input
                  id="new-topic-keywords"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="Next.js 16, Turbopack, High Performance"
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="new-topic-audience"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  Target Audience
                </label>
                <Input
                  id="new-topic-audience"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Tech Leads & Senior Engineers"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Save Topic
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topics List */}
      {loading ? (
        <div className="py-16 text-center text-xs font-semibold text-slate-400">
          Loading topic backlog...
        </div>
      ) : topics.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No topics found</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Use AI suggestions or add a topic manually to fill your editorial queue.
              </p>
            </div>
            <Button
              onClick={handleAISuggest}
              disabled={isSuggesting}
              className="rounded-2xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Suggest Topics with AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                      topic.status === AiTopicStatus.ACCEPTED
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : topic.status === AiTopicStatus.QUEUED
                          ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          : topic.status === AiTopicStatus.GENERATED
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : topic.status === AiTopicStatus.REJECTED
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    {topic.status}
                  </Badge>

                  <Badge variant="secondary" className="rounded-lg text-[10px]">
                    {topic.category}
                  </Badge>

                  <span className="text-[10px] font-medium text-slate-400">
                    By {topic.suggestedBy === "ai" ? "AI Strategist" : "Editorial Team"}
                  </span>
                </div>

                <h3 className="font-sora text-sm font-bold text-slate-900 sm:text-base">
                  {topic.title}
                </h3>

                {topic.keywords && topic.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {topic.keywords.map((kw: string) => (
                      <span
                        key={`kw-${topic.id}-${kw}`}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-2 md:border-t-0 md:pt-0">
                {topic.status === AiTopicStatus.SUGGESTED && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(topic.id, AiTopicStatus.ACCEPTED)}
                      className="h-8 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(topic.id, AiTopicStatus.REJECTED)}
                      className="h-8 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-600"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </>
                )}

                {topic.status === AiTopicStatus.ACCEPTED && (
                  <Button
                    size="sm"
                    onClick={() => handleLaunchGeneration(topic.id)}
                    className="h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95"
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                    Launch 1-Click
                  </Button>
                )}

                {topic.status === AiTopicStatus.QUEUED && (
                  <Link href="/admin/blog/ai">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-800"
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      View Live Job
                    </Button>
                  </Link>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(topic.id, topic.title)}
                  className="h-8 w-8 rounded-xl p-0 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Non-blocking Topic Deletion Modal */}
      {topicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <dialog
            open
            aria-labelledby="delete-topic-title"
            className="m-0 block w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h3
              id="delete-topic-title"
              className="font-sora text-base font-bold text-slate-900 dark:text-white"
            >
              Delete Topic Proposal?
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                "{topicToDelete.title}"
              </strong>{" "}
              from the backlog?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setTopicToDelete(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={deleting}
                onClick={confirmDeleteTopic}
                className="rounded-xl bg-rose-600 text-xs text-white hover:bg-rose-700"
              >
                {deleting ? "Deleting…" : "Delete Topic"}
              </Button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
