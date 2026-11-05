"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  Trash2,
  Tag,
  Users,
  BarChart2,
  Clock,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AiTopicStatus } from "@/lib/database/enum/ai.enum";

interface Topic {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  targetAudience: string;
  difficulty: string;
  status: AiTopicStatus;
  priority: number;
  suggestedBy: string;
  notes: string | null;
  createdAt: string;
}

export default function TopicsBacklogPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New topic modal state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newKeywords, setNewKeywords] = useState("");
  const [newAudience, setNewAudience] = useState("Tech Leads & Engineers");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");

  const loadTopics = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/ai/topics", window.location.origin);
      if (activeTab !== "ALL") {
        url.searchParams.set("status", activeTab);
      }
      if (search.trim()) {
        url.searchParams.set("search", search.trim());
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      }
    } catch {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, [activeTab, search]);

  const handleUpdateStatus = async (id: string, status: AiTopicStatus) => {
    try {
      const res = await fetch(`/api/admin/ai/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
        showMessage(`Topic updated to ${status}`);
      }
    } catch {
      showMessage("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic from backlog?")) return;
    try {
      const res = await fetch(`/api/admin/ai/topics/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTopics((prev) => prev.filter((t) => t.id !== id));
        showMessage("Topic removed");
      }
    } catch {
      showMessage("Failed to delete topic");
    }
  };

  const handleLaunchGeneration = async (id: string) => {
    try {
      showMessage("Launching autonomous generation pipeline...");
      const res = await fetch(`/api/admin/ai/topics/${id}/launch`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: AiTopicStatus.QUEUED } : t)),
        );
        showMessage(`Autonomous job created! Job ID: ${data.jobId.slice(0, 8)}...`);
      } else {
        showMessage(`Failed: ${data.error}`);
      }
    } catch {
      showMessage("Network error launching job");
    }
  };

  const handleAISuggest = async () => {
    try {
      setIsSuggesting(true);
      showMessage("AI Strategist generating high-ranking topic ideas...");
      const res = await fetch("/api/admin/ai/topics/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "Agentic AI & Next.js 16" }),
      });
      if (res.ok) {
        const data = await res.json();
        showMessage(`Generated ${data.count} new AI topic proposals!`);
        loadTopics();
      } else {
        showMessage("AI suggestion failed");
      }
    } catch {
      showMessage("Error connecting to AI service");
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

      const res = await fetch("/api/admin/ai/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          keywords,
          targetAudience: newAudience,
          difficulty: newDifficulty,
          priority: 1,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setNewTitle("");
        setNewKeywords("");
        showMessage("Topic added to backlog!");
        loadTopics();
      }
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Topic Backlog & Planning
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Curate high-intent content ideas, accept AI proposals, and trigger autonomous pipeline
            jobs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleAISuggest}
            disabled={isSuggesting}
            className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 hover:opacity-95"
          >
            <Sparkles className={`w-4 h-4 mr-2 ${isSuggesting ? "animate-spin" : ""}`} />
            {isSuggesting ? "Proposing Topics..." : "AI Suggest Topics"}
          </Button>

          <Button
            onClick={() => setIsCreating(true)}
            className="rounded-2xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Topic
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic backlog..."
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* New Topic Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h2 className="text-lg font-black text-slate-900 font-sora mb-1">
              Add New Topic to Backlog
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Create an editorial topic ready for autonomous or manual writing.
            </p>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic Title</label>
                <Input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Architecting Real-Time Microservices with Next.js 16"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Engineering"
                    className="text-xs rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white font-medium"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Keywords (comma-separated)
                </label>
                <Input
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="Next.js 16, Turbopack, High Performance"
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience
                </label>
                <Input
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Tech Leads & Senior Engineers"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
        <Card className="border-dashed border-2 border-slate-200 rounded-3xl p-12 text-center">
          <CardContent className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">No topics found</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Use AI suggestions or add a topic manually to fill your editorial queue.
              </p>
            </div>
            <Button
              onClick={handleAISuggest}
              disabled={isSuggesting}
              className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Suggest Topics with AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 ${
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

                  <Badge variant="secondary" className="text-[10px] rounded-lg">
                    {topic.category}
                  </Badge>

                  <span className="text-[10px] text-slate-400 font-medium">
                    By {topic.suggestedBy === "ai" ? "AI Strategist" : "Editorial Team"}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-sora">
                  {topic.title}
                </h3>

                {topic.keywords && topic.keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-0.5"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                {topic.status === AiTopicStatus.SUGGESTED && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(topic.id, AiTopicStatus.ACCEPTED)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-3"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(topic.id, AiTopicStatus.REJECTED)}
                      className="rounded-xl border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold h-8 px-3"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </>
                )}

                {topic.status === AiTopicStatus.ACCEPTED && (
                  <Button
                    size="sm"
                    onClick={() => handleLaunchGeneration(topic.id)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold h-8 px-3 shadow-md shadow-blue-500/20 hover:opacity-95"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Launch 1-Click
                  </Button>
                )}

                {topic.status === AiTopicStatus.QUEUED && (
                  <Link href="/admin/blog/ai">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold h-8 px-3"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      View Live Job
                    </Button>
                  </Link>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(topic.id)}
                  className="rounded-xl text-slate-400 hover:text-rose-600 h-8 w-8 p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
