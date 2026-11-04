"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Job } from "@/lib/database/schema/core/job.schema";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New job form state
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDept, setNewDept] = useState("Engineering");
  const [newLoc, setNewLoc] = useState("Remote / Hybrid");
  const [newType, setNewType] = useState<"Full Time" | "Internship" | "Contract" | "Partner">("Full Time");
  const [newDesc, setNewDesc] = useState("");
  const [savingJob, setSavingJob] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        params.set("status", activeTab);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingJob(true);
    try {
      const generatedSlug =
        newSlug ||
        newTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: generatedSlug,
          department: newDept,
          location: newLoc,
          type: newType,
          description: newDesc,
          status: "OPEN",
        }),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setNewTitle("");
        setNewSlug("");
        setNewDesc("");
        await fetchJobs();
      }
    } catch (err) {
      console.error("Failed to create job", err);
    } finally {
      setSavingJob(false);
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { label: "All Roles", value: "ALL" },
    { label: "Open Positions", value: "OPEN" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Closed", value: "CLOSED" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Careers & Job Openings
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage open positions displayed on the agency careers portal.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 font-bold text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Post New Position</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black font-sora text-slate-900">
                Post New Job Position
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Define the title, role requirements, and team details for this position.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateJob} className="space-y-4 py-2">
              <div>
                <label htmlFor="job-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title
                </label>
                <Input
                  id="job-title"
                  required
                  placeholder="e.g. Senior Fullstack Engineer (Next.js / Node)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="job-dept" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <Input
                    id="job-dept"
                    required
                    placeholder="Engineering / Design"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="job-loc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <Input
                    id="job-loc"
                    required
                    placeholder="Remote / Bangalore"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="job-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employment Type
                </label>
                <select
                  id="job-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as typeof newType)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1155CC]/30 focus:border-[#1155CC]"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>

              <div>
                <label htmlFor="job-desc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Description & Qualifications
                </label>
                <textarea
                  id="job-desc"
                  required
                  rows={4}
                  placeholder="Responsibilities, experience needed, technical skills..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#1155CC]/30 focus:border-[#1155CC]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingJob}
                  className="rounded-xl bg-[#1155CC] text-white text-xs font-bold"
                >
                  {savingJob ? "Posting..." : "Publish Position"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs & Search */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Role Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1155CC]" />
                      <span>Loading positions...</span>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No jobs posted yet. Click "Post New Position" above!
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span>{job.title}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          /{job.slug}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {job.department}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{job.location}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {job.type}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={job.status === "OPEN" ? "success" : "secondary"}
                          dot={job.status === "OPEN"}
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
