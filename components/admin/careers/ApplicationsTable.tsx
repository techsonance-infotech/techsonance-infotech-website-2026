"use client";

import React from "react";
import { Star, AlertTriangle, Eye, Clock, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/database/enum/content.enum";

export interface ApplicationItem {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  status: ApplicationStatus;
  jobTitle?: string;
  rating?: number | null;
  knockoutTriggered: boolean;
  createdAt: string | Date;
}

interface ApplicationsTableProps {
  applications: ApplicationItem[];
  onSelectApplication: (id: string) => void;
}

const STAGE_STYLES: Record<ApplicationStatus, { label: string; class: string }> = {
  [ApplicationStatus.NEW]: {
    label: "New",
    class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
  },
  [ApplicationStatus.SCREENING]: {
    label: "Screening",
    class: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  },
  [ApplicationStatus.SHORTLISTED]: {
    label: "Shortlisted",
    class: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  [ApplicationStatus.INTERVIEW]: {
    label: "Interview",
    class: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  [ApplicationStatus.OFFER]: {
    label: "Offer",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [ApplicationStatus.HIRED]: {
    label: "Hired",
    class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300",
  },
  [ApplicationStatus.REJECTED]: {
    label: "Rejected",
    class: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  [ApplicationStatus.WITHDRAWN]: {
    label: "Withdrawn",
    class: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  },
};

export function ApplicationsTable({
  applications,
  onSelectApplication,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          No applications match current filters
        </h4>
        <p className="text-xs text-slate-400">
          Try clearing your search query or choosing a different stage.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-4 px-6">Candidate</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Stage</th>
              <th className="py-4 px-6">Rating</th>
              <th className="py-4 px-6">Applied Date</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => onSelectApplication(app.id)}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                {/* Candidate Name & Flags */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1155CC]/10 text-[#1155CC] font-bold flex items-center justify-center shrink-0">
                      {app.candidateName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#1155CC] transition-colors">
                          {app.candidateName}
                        </span>
                        {app.knockoutTriggered && (
                          <span
                            title="Knockout question failed"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-1.5 py-0.5 rounded-md"
                          >
                            <AlertTriangle className="w-3 h-3" /> Knockout
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{app.email}</span>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                  {app.jobTitle || "Open Role"}
                </td>

                {/* Stage Badge */}
                <td className="py-4 px-6">
                  <span
                    className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      STAGE_STYLES[app.status]?.class || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STAGE_STYLES[app.status]?.label || app.status}
                  </span>
                </td>

                {/* Star Rating */}
                <td className="py-4 px-6">
                  {app.rating ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            app.rating! >= s
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-700 font-mono text-[11px]">
                      —
                    </span>
                  )}
                </td>

                {/* Applied Date */}
                <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                  {new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>

                {/* Action CTA */}
                <td className="py-4 px-6 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs h-8 group-hover:border-[#1155CC] group-hover:text-[#1155CC]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectApplication(app.id);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
