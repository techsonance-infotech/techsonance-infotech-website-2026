import React from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ApplicationsInboxPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Job Applications Inbox
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Review candidate resumes, candidate portfolios, and hiring submissions.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1155CC] flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 font-sora">No New Applications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When candidates submit applications through the careers portal, their profiles and
            resume links will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
