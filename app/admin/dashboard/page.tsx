import React, { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Briefcase,
  Clock,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  PlusCircle,
  Inbox,
} from "lucide-react";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPostsService } from "@/lib/services/admin-posts.service";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { JobStatus, PostStatus } from "@/lib/constants/enums";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateSafe } from "@/lib/utils/formatters";
import {
  dashboardPostItemSchema,
  dashboardMetricsBoundarySchema,
  type DashboardPostItem,
} from "@/lib/validations/admin-dashboard-boundary.schema";
import AdminDashboardLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const container = getContainer();
  const authService = container.get(AdminAuthService);

  try {
    const session = await authService.getCurrentSession();
    if (!session) {
      redirect("/admin/login");
    }
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      const digest = String((err as { digest?: string }).digest || "");
      if (digest.includes("NEXT_REDIRECT")) {
        throw err;
      }
    }
    redirect("/admin/login");
  }

  const postsService = container.get(AdminPostsService);
  const jobsService = container.get(AdminJobsService);

  const [postsSettled, inReviewSettled, publishedSettled, jobsSettled] =
    await Promise.allSettled([
      postsService.listPosts({ limit: 10 }),
      postsService.listPosts({ status: PostStatus.IN_REVIEW, limit: 5 }),
      postsService.listPosts({ status: PostStatus.PUBLISHED, limit: 1 }),
      jobsService.listJobs({ status: JobStatus.OPEN, limit: 5 }),
    ]);

  const hasPartialFailure =
    postsSettled.status === "rejected" ||
    inReviewSettled.status === "rejected" ||
    publishedSettled.status === "rejected" ||
    jobsSettled.status === "rejected";

  const postsRes =
    postsSettled.status === "fulfilled" && postsSettled.value
      ? postsSettled.value
      : { posts: [], total: 0 };
  const inReviewRes =
    inReviewSettled.status === "fulfilled" && inReviewSettled.value
      ? inReviewSettled.value
      : { posts: [], total: 0 };
  const publishedRes =
    publishedSettled.status === "fulfilled" && publishedSettled.value
      ? publishedSettled.value
      : { posts: [], total: 0 };
  const jobsRes =
    jobsSettled.status === "fulfilled" && jobsSettled.value
      ? jobsSettled.value
      : { jobs: [], total: 0 };

  const metrics = dashboardMetricsBoundarySchema.parse({
    totalArticles: postsRes.total,
    publishedArticles: publishedRes.total,
    inReviewArticles: inReviewRes.total,
    openJobs: jobsRes.total,
  });

  const recentPosts: DashboardPostItem[] = (postsRes.posts || [])
    .map((p) => dashboardPostItemSchema.safeParse(p))
    .filter((res): res is { success: true; data: DashboardPostItem } => res.success)
    .map((res) => res.data);

  const inReviewPosts: DashboardPostItem[] = (inReviewRes.posts || [])
    .map((p) => dashboardPostItemSchema.safeParse(p))
    .filter((res): res is { success: true; data: DashboardPostItem } => res.success)
    .map((res) => res.data);

  const kpis = [
    {
      title: "Total Articles",
      value: metrics.totalArticles.toLocaleString(),
      subtext: `${metrics.publishedArticles} published live`,
      icon: FileText,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Editorial Review",
      value: metrics.inReviewArticles.toLocaleString(),
      subtext: metrics.inReviewArticles > 0 ? "Requires approval" : "All drafts processed",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      badge: metrics.inReviewArticles > 0 ? "Action Needed" : undefined,
    },
    {
      title: "Open Job Positions",
      value: metrics.openJobs.toLocaleString(),
      subtext: "Careers portal active",
      icon: Briefcase,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "AI Generation Pipeline",
      value: "Active",
      subtext: "Autonomous Content & Images",
      icon: Sparkles,
      color: "from-purple-600 to-pink-600",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <div className="animate-in fade-in space-y-8 duration-500">
        {/* Partial Outage Warning Banner */}
        {hasPartialFailure && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs font-semibold text-amber-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="flex-1">
              Some operational metrics could not be synchronized with the database. Displaying
              currently available metrics.
            </p>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Studio Dashboard
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
              Real-time control over blog articles, career opportunities, and autonomous AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/blog">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:text-[#1155CC]"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                <span>Blog Articles</span>
              </Button>
            </Link>
            <Link href="/admin/careers/jobs">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:text-[#1155CC]"
              >
                <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                <span>Manage Jobs</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const IconComp = kpi.icon;
            return (
              <Card
                key={kpi.title}
                className="relative overflow-hidden border-slate-200/80 bg-white/80 backdrop-blur transition-all duration-300 hover:border-slate-300"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    {kpi.title}
                  </CardTitle>
                  <div
                    className={`h-8 w-8 rounded-xl ${kpi.bgColor} flex items-center justify-center`}
                  >
                    <IconComp className={`h-4 w-4 ${kpi.textColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="font-sora text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      {kpi.value}
                    </div>
                    {kpi.badge && (
                      <Badge variant="warning" className="text-[10px] font-bold">
                        {kpi.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 border-t border-slate-50 pt-2">
                    <p className="text-[11px] font-medium text-slate-400">{kpi.subtext}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Required: In-Review Articles */}
        {inReviewPosts.length > 0 && (
          <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot={true}>
                    Requires Review
                  </Badge>
                  <CardTitle className="font-sora text-base font-bold text-slate-900">
                    Submissions Awaiting Approval
                  </CardTitle>
                </div>
                <CardDescription className="mt-1 text-xs">
                  Drafts submitted by editors or autonomous AI agents that require approval before
                  publishing.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {inReviewPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-xs font-bold text-amber-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="mb-1 block text-sm leading-tight font-bold text-slate-900 transition-colors hover:text-[#1155CC]"
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
              <CardTitle className="font-sora text-base font-bold text-slate-900">
                Recent Blog Articles
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Latest created or published stories in the database
              </CardDescription>
            </div>
            <Link
              href="/admin/blog"
              className="flex items-center gap-1 text-xs font-bold text-[#1155CC] hover:underline"
            >
              <span>View All ({metrics.totalArticles})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentPosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Title & Slug</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPosts.slice(0, 5).map((post) => (
                      <tr key={post.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="max-w-xs truncate px-4 py-3.5 font-semibold text-slate-900">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            className="block truncate font-medium hover:text-[#1155CC]"
                          >
                            {post.title}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-400">/{post.slug}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600">
                          {post.categoryId ? "Engineering" : "General"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              post.status === PostStatus.PUBLISHED
                                ? "success"
                                : post.status === PostStatus.IN_REVIEW
                                  ? "warning"
                                  : "secondary"
                            }
                            dot={post.status === PostStatus.PUBLISHED}
                          >
                            {post.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-500">
                          {formatDateSafe(post.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
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
            ) : (
              <div className="py-12 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800">No blog articles created yet</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Get started by writing your first article or generating autonomous drafts with AI.
                </p>
                <div className="mt-4">
                  <Link href="/admin/blog">
                    <Button size="sm" className="rounded-xl bg-[#1155CC] text-white hover:bg-[#0d44a4]">
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                      Create New Article
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
