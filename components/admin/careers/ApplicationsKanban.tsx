"use client";

import React, { useState } from "react";
import {
  Star,
  AlertTriangle,
  ArrowRight,
  Clock,
  MoreVertical,
  CheckCircle2,
  UserX,
  Calendar,
  Briefcase,
} from "lucide-react";
import { ApplicationStatus } from "@/lib/constants/enums";
import type { ApplicationItem } from "./ApplicationsTable";
import { STAGE_CONFIG } from "./CandidateDrawer";
import { RejectionReasonDialog } from "./RejectionReasonDialog";

interface ApplicationsKanbanProps {
  applications: ApplicationItem[];
  onSelectApplication: (id: string) => void;
  onStageChange?: (id: string, newStage: ApplicationStatus, reason?: string) => Promise<void> | void;
}

const KANBAN_STAGES: {
  status: ApplicationStatus;
  title: string;
  dotColor: string;
  nextStage?: ApplicationStatus;
}[] = [
  {
    status: ApplicationStatus.NEW,
    title: "New",
    dotColor: "bg-blue-500",
    nextStage: ApplicationStatus.SCREENING,
  },
  {
    status: ApplicationStatus.SCREENING,
    title: "Screening",
    dotColor: "bg-purple-500",
    nextStage: ApplicationStatus.SHORTLISTED,
  },
  {
    status: ApplicationStatus.SHORTLISTED,
    title: "Shortlisted",
    dotColor: "bg-indigo-500",
    nextStage: ApplicationStatus.INTERVIEW,
  },
  {
    status: ApplicationStatus.INTERVIEW,
    title: "Interview",
    dotColor: "bg-cyan-500",
    nextStage: ApplicationStatus.OFFER,
  },
  {
    status: ApplicationStatus.OFFER,
    title: "Offer",
    dotColor: "bg-emerald-500",
    nextStage: ApplicationStatus.HIRED,
  },
  {
    status: ApplicationStatus.HIRED,
    title: "Hired",
    dotColor: "bg-green-600",
  },
  {
    status: ApplicationStatus.REJECTED,
    title: "Rejected",
    dotColor: "bg-rose-500",
  },
  {
    status: ApplicationStatus.WITHDRAWN,
    title: "Withdrawn",
    dotColor: "bg-slate-400",
  },
];

export function ApplicationsKanban({
  applications,
  onSelectApplication,
  onStageChange,
}: ApplicationsKanbanProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);

  // Reject dialog state for quick-reject
  const [rejectingApp, setRejectingApp] = useState<{ id: string; name: string } | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const appId = e.dataTransfer.getData("text/plain") || draggedAppId;
    setDraggedAppId(null);

    if (!appId) return;

    const currentApp = applications.find((a) => a.id === appId);
    if (!currentApp || currentApp.status === targetStatus) return;

    if (targetStatus === ApplicationStatus.REJECTED) {
      setRejectingApp({ id: currentApp.id, name: currentApp.candidateName });
      return;
    }

    if (onStageChange) {
      await onStageChange(appId, targetStatus);
    }
  };

  const handleAdvanceStage = async (e: React.MouseEvent, app: ApplicationItem, nextStage?: ApplicationStatus) => {
    e.stopPropagation();
    if (!nextStage || !onStageChange) return;

    if (nextStage === ApplicationStatus.REJECTED) {
      setRejectingApp({ id: app.id, name: app.candidateName });
      return;
    }

    await onStageChange(app.id, nextStage);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start snap-x snap-mandatory">
        {KANBAN_STAGES.map((col) => {
          const colApps = applications.filter((app) => app.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`w-72 shrink-0 flex flex-col bg-slate-100/70 dark:bg-slate-900/60 border rounded-3xl p-3 transition-colors ${
                isOver
                  ? "border-[#1155CC] bg-blue-50/40 dark:bg-blue-950/20 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sora tracking-tight">
                    {col.title}
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 min-h-[300px]">
                {colApps.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 font-medium">No candidates</p>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => onSelectApplication(app.id)}
                      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-[#1155CC]/50 dark:hover:border-[#1155CC]/50 transition-all cursor-pointer space-y-2.5"
                    >
                      {/* Top row: Name & Knockout warning */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1155CC] transition-colors leading-tight">
                            {app.candidateName}
                          </h5>
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5 max-w-[190px]">
                            {app.email}
                          </span>
                        </div>
                        {app.knockoutTriggered && (
                          <span
                            title="Knockout criterion failed"
                            className="shrink-0 p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Job Title */}
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{app.jobTitle || "Open Role"}</span>
                      </div>

                      {/* Rating stars & Date */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <div className="flex items-center gap-0.5">
                          {app.rating ? (
                            [1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  app.rating! >= s
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            ))
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </div>

                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(app.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Quick stage advance button */}
                      {col.nextStage && onStageChange && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => handleAdvanceStage(e, app, col.nextStage)}
                            title={`Advance to ${STAGE_CONFIG[col.nextStage]?.label}`}
                            className="text-[10px] font-bold text-[#1155CC] hover:text-[#0c44a4] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 py-1 px-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 transition-colors"
                          >
                            Advance to {STAGE_CONFIG[col.nextStage]?.label}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Rejection Dialog */}
      <RejectionReasonDialog
        isOpen={!!rejectingApp}
        onClose={() => setRejectingApp(null)}
        candidateName={rejectingApp?.name}
        isSubmitting={isRejecting}
        onConfirm={async (reason) => {
          if (!rejectingApp || !onStageChange) return;
          setIsRejecting(true);
          try {
            await onStageChange(rejectingApp.id, ApplicationStatus.REJECTED, reason);
            setRejectingApp(null);
          } finally {
            setIsRejecting(false);
          }
        }}
      />
    </>
  );
}
