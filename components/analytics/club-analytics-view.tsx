"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  CalendarDays,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { ClubAnalyticsData } from "@/services/analytics.service";

export function ClubCoordinatorAnalyticsView() {
  const [analytics, setAnalytics] = useState<ClubAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubAnalytics();
  }, []);

  async function fetchClubAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/clubs");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load club coordinator analytics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-rose-200 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Club Coordinator Desk
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Club Engagement & Chapter Telemetry
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Membership telemetry, scheduled activities, and deterministic engagement index rankings.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-slate-500">Active Chapters</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {analytics?.activeClubsCount}
          </div>
          <div className="text-xs text-indigo-600 mt-1">Campus Organizations</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-slate-500">Total Members</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {analytics?.totalMembersCount}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Active student rosters</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-slate-500">Scheduled Activities</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {analytics?.totalActivitiesCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Workshops & sessions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
          <div className="text-xs text-slate-500">Average Engagement</div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {analytics?.averageEngagementScore}/100
          </div>
          <div className="text-xs text-slate-500 mt-1">Institutional Chapter Score</div>
        </div>
      </div>

      {/* Top Performing Chapters Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Top Performing Club Chapters
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Ranked by empirical engagement formula: activities, active members, and event linkages
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Club Chapter</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Active Members</th>
                <th className="py-2.5 px-3">Activities</th>
                <th className="py-2.5 px-3">Engagement Score</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {analytics?.topClubs.map((club) => (
                <tr key={club.clubId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {club.name}
                  </td>
                  <td className="py-3 px-3">{club.category}</td>
                  <td className="py-3 px-3">{club.memberCount}</td>
                  <td className="py-3 px-3">{club.activitiesCount}</td>
                  <td className="py-3 px-3 font-bold text-indigo-600">
                    {club.engagementScore}/100
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        club.engagementTier === "Elite"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : club.engagementTier === "High"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      }`}
                    >
                      {club.engagementTier}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href="/dashboard/club"
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
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
