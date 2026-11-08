"use client";

import React, { useState } from "react";
import { Star, AlertTriangle, ArrowRight, Briefcase, Calendar } from "lucide-react";
import { ApplicationStatus } from "@/lib/constants/enums";
import type { ApplicationItem } from "./ApplicationsTable";
import { STAGE_CONFIG } from "./CandidateDrawer";
import { RejectionReasonDialog } from "./RejectionReasonDialog";
import { formatDateSafe } from "@/lib/utils/formatters";

interface ApplicationsKanbanProps {
  applications: ApplicationItem[];
  onSelectApplication: (id: string) => void;
  onStageChange?: (
    id: string,
    newStage: ApplicationStatus,
    reason?: string,
  ) => Promise<void> | void;
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

  const handleAdvanceStage = async (
    e: React.MouseEvent,
    app: ApplicationItem,
    nextStage?: ApplicationStatus,
  ) => {
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
      <div className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pt-1 pb-6">
        {KANBAN_STAGES.map((col) => {
          const colApps = applications.filter((app) => app.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex w-72 shrink-0 flex-col rounded-3xl border bg-slate-100/70 p-3 transition-colors dark:bg-slate-900/60 ${
                isOver
                  ? "border-[#1155CC] bg-blue-50/40 dark:bg-blue-950/20 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              {/* Column Header */}
              <div className="mb-2 flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  <h4 className="font-sora text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200">
                    {col.title}
                  </h4>
                </div>
                <span className="rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="min-h-[300px] space-y-2.5">
                {colApps.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                    <p className="text-[11px] font-medium text-slate-400">No candidates</p>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => onSelectApplication(app.id)}
                      className="group cursor-pointer space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition-all hover:border-[#1155CC]/50 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-[#1155CC]/50"
                    >
                      {/* Top row: Name & Knockout warning */}
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h5 className="text-xs leading-tight font-bold text-slate-900 transition-colors group-hover:text-[#1155CC] dark:text-white">
                            {app.candidateName}
                          </h5>
                          <span className="mt-0.5 block max-w-[190px] truncate text-[10px] text-slate-400">
                            {app.email}
                          </span>
                        </div>
                        {app.knockoutTriggered && (
                          <span
                            title="Knockout criterion failed"
                            className="shrink-0 rounded-md border border-rose-200 bg-rose-50 p-1 text-rose-600 dark:border-rose-900 dark:bg-rose-950/50"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Job Title */}
                      <div className="flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{app.jobTitle || "Open Role"}</span>
                      </div>

                      {/* Rating stars & Date */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[10px] text-slate-400 dark:border-slate-700/60">
                        <div className="flex items-center gap-0.5">
                          {app.rating ? (
                            [1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
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
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDateSafe(app.createdAt, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Quick stage advance button */}
                      {col.nextStage && onStageChange && (
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleAdvanceStage(e, app, col.nextStage)}
                            title={`Advance to ${STAGE_CONFIG[col.nextStage]?.label}`}
                            className="flex items-center gap-1 rounded-lg bg-blue-50/70 px-2 py-1 text-[10px] font-bold text-[#1155CC] transition-colors hover:bg-blue-100/70 hover:text-[#0c44a4] dark:bg-blue-950/40 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Advance to {STAGE_CONFIG[col.nextStage]?.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </button>
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
