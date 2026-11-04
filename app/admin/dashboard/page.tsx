import React from "react";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  Clock,
  Sparkles,
  ArrowUpRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { getContainer } from "@/lib/di/container";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const container = getContainer();
  const postsService = container.get(AdminPostsService);
  const jobsService = container.get(AdminJobsService);

  const [postsRes, inReviewRes, publishedRes, jobsRes] = await Promise.all([
    postsService.listPosts({ limit: 10 }),
    postsService.listPosts({ status: "IN_REVIEW", limit: 5 }),
    postsService.listPosts({ status: "PUBLISHED", limit: 1 }),
    jobsService.listJobs({ status: "OPEN", limit: 5 }),
  ]);

  const kpis = [
    {
      title: "Total Articles",
      value: postsRes.total.toString(),
      subtext: `${publishedRes.total} live on techsonance.co.in`,
      icon: FileText,
      trend: "+12% this month",
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Editorial Review",
      value: inReviewRes.total.toString(),
      subtext: inReviewRes.total > 0 ? "Requires approval" : "All drafts processed",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: inReviewRes.total > 0 ? "Action Needed" : undefined,
    },
    {
      title: "Open Job Positions",
      value: jobsRes.total.toString(),
      subtext: "Careers portal active",
      icon: Briefcase,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "AI Generation Pipeline",
      value: "Ready",
      subtext: "QStash + FLUX.1-schnell",
      icon: Sparkles,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      badge: "FD-1–7",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#1155CC] uppercase tracking-wider bg-[#1155CC]/10 px-2 py-0.5 rounded-full">
              Main Agency Workspace
            </span>
            <span className="text-[10px] font-semibold text-slate-400">• Native Postgres DB Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
            Studio Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Real-time control over blog articles, career opportunities, and autonomous AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/careers/jobs">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-slate-700 hover:text-[#1155CC] font-bold text-xs"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              <span>Manage Jobs</span>
            </Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button
              variant="default"
              size="sm"
              className="rounded-xl bg-[#1155CC] hover:bg-[#0d44a4] text-white shadow-md shadow-[#1155CC]/20 font-bold text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Article</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <Card
              key={kpi.title}
              className="relative overflow-hidden border-slate-200/80 bg-white/80 backdrop-blur hover:border-slate-300 transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                  <IconComp className={`w-4 h-4 ${kpi.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sora">
                    {kpi.value}
                  </div>
                  {kpi.badge && (
                    <Badge variant="warning" className="text-[10px] font-bold">
                      {kpi.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                  <p className="text-[11px] font-medium text-slate-400">{kpi.subtext}</p>
                  {kpi.trend && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {kpi.trend}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Required: In-Review Articles */}
      {inReviewRes.posts.length > 0 && (
        <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="warning" dot={true}>
                  Requires Review
                </Badge>
                <CardTitle className="text-base font-bold text-slate-900 font-sora">
                  Submissions Awaiting Approval
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                Drafts submitted by editors or autonomous AI agents that require approval before publishing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {inReviewRes.posts.map((post) => (
                <div
                  key={post.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-[#1155CC] transition-colors leading-tight block mb-1"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>slug: /{post.slug}</span>
                        <span>•</span>
                        <span>{post.readTime || "5 min"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-semibold"
                      >
                        Review Draft
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Blog Posts Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 font-sora">
              Recent Blog Articles
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Latest created or published stories in the database
            </CardDescription>
          </div>
          <Link
            href="/admin/blog"
            className="text-xs font-bold text-[#1155CC] hover:underline flex items-center gap-1"
          >
            <span>View All ({postsRes.total})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postsRes.posts.slice(0, 5).map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="hover:text-[#1155CC] block truncate font-medium"
                      >
                        {post.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">/{post.slug}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {post.categoryId ? "Engineering" : "General"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          post.status === "PUBLISHED"
                            ? "success"
                            : post.status === "IN_REVIEW"
                              ? "warning"
                              : "secondary"
                        }
                        dot={post.status === "PUBLISHED"}
                      >
                        {post.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-xs font-bold text-[#1155CC] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
