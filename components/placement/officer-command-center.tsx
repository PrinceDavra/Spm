"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  FileCheck,
  Award,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { PlacementDriveStatus } from "@prisma/client";

export function OfficerCommandCenter({ officerName }: { officerName: string }) {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [analyticsRes, drivesRes] = await Promise.all([
        fetch("/api/placements/analytics"),
        fetch("/api/placements/drives?limit=5"),
      ]);

      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      const drivesData = await drivesRes.json();
      if (drivesData.success) {
        setDrives(drivesData.drives || []);
      }
    } catch (err) {
      console.error("Failed to load officer dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Corporate Relations &bull; Placement Phase 10</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Placement Command &bull; {officerName}
          </h1>
          <p className="text-sm text-amber-100/80 leading-relaxed">
            Manage company recruiting partnerships, author verified eligibility criteria, publish campus drives, track candidate applicant pipelines, and orchestrate aptitude preparations.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/placement/drives"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>Post New Drive</span>
            </Link>
            <Link
              href="/dashboard/placement/companies"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 border border-white/20 transition-colors"
            >
              <Building2 className="h-4 w-4 text-amber-300" />
              <span>Recruiting Partners</span>
            </Link>
            <Link
              href="/dashboard/placement/applications"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 border border-white/20 transition-colors"
            >
              <FileCheck className="h-4 w-4 text-amber-300" />
              <span>Applicants Pipeline</span>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Job Drives
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics?.activeDrives || 12}
            </span>
            <span className="text-xs text-slate-400">/ {analytics?.totalDrives || 14} total</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Avg Package: {analytics?.averagePackageLPA || 14.5} LPA
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hiring Partners
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics?.totalPartners || 12}
            </span>
            <span className="text-xs text-slate-400">Tier-1 &amp; IT</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Google, Microsoft, TCS, GS, Tesla...
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Applications
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics?.totalApplications || 42}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              {analytics?.shortlistedCount || 14} Shortlisted
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {analytics?.interviewCount || 8} currently in interviews
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Placement Conversion
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {analytics?.conversionRate || 19.0}%
            </span>
            <span className="text-xs text-purple-600 font-bold">
              {analytics?.offeredCount || 8} Offers
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across engineering &amp; management
          </p>
        </div>
      </div>

      {/* Recent Placement Drives Overview */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recent Placement Drives
            </h3>
            <p className="text-xs text-slate-500">
              Manage drive state transitions and applicant pools.
            </p>
          </div>
          <Link
            href="/dashboard/placement/drives"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All Drives</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="pb-3 font-semibold">Company &amp; Role</th>
                <th className="pb-3 font-semibold">Package</th>
                <th className="pb-3 font-semibold">Min CGPA</th>
                <th className="pb-3 font-semibold">Applicants</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {drives.map((drive) => (
                <tr key={drive.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={drive.companyLogo}
                        alt={drive.companyName}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{drive.role}</p>
                        <p className="text-slate-500">{drive.companyName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                    {drive.packageMin} - {drive.packageMax} LPA
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                    {drive.minCgpa.toFixed(2)}
                  </td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                    {drive.applicationCount || 0}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        drive.status === PlacementDriveStatus.PUBLISHED
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : drive.status === PlacementDriveStatus.DRAFT
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {drive.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/dashboard/placement/drives/${drive.id}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
