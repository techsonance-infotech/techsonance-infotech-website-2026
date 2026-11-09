"use client";

import React from "react";
import { Star, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationStatus } from "@/lib/constants/enums";
import { safeInitials, formatDateSafe } from "@/lib/utils/formatters";

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
    class:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  },
  [ApplicationStatus.SHORTLISTED]: {
    label: "Shortlisted",
    class:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  [ApplicationStatus.INTERVIEW]: {
    label: "Interview",
    class: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
  [ApplicationStatus.OFFER]: {
    label: "Offer",
    class:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [ApplicationStatus.HIRED]: {
    label: "Hired",
    class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300",
  },
  [ApplicationStatus.ON_HOLD]: {
    label: "On Hold",
    class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
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

export function ApplicationsTable({ applications, onSelectApplication }: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
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
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-black tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Applied Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => onSelectApplication(app.id)}
                className="group cursor-pointer transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                {/* Candidate Name & Flags */}
                <td className="px-6 py-4" aria-label={`Candidate: ${app.candidateName}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1155CC]/10 font-bold text-[#1155CC]">
                      {safeInitials(app.candidateName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 transition-colors group-hover:text-[#1155CC] dark:text-white">
                          {app.candidateName}
                        </span>
                        {app.knockoutTriggered && (
                          <span
                            title="Knockout question failed"
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:border-rose-900 dark:bg-rose-950/40"
                          >
                            <AlertTriangle className="h-3 w-3" /> Knockout
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-400">{app.email}</span>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  {app.jobTitle || "Open Role"}
                </td>

                {/* Stage Badge */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      STAGE_STYLES[app.status]?.class || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STAGE_STYLES[app.status]?.label || app.status}
                  </span>
                </td>

                {/* Star Rating */}
                <td className="px-6 py-4">
                  {app.rating ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            app.rating! >= s
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-300 dark:text-slate-700">
                      —
                    </span>
                  )}
                </td>

                {/* Applied Date */}
                <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-500">
                  {formatDateSafe(app.createdAt)}
                </td>

                {/* Action CTA */}
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs group-hover:border-[#1155CC] group-hover:text-[#1155CC]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectApplication(app.id);
                    }}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" /> Review
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
