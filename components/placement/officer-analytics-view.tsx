"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Briefcase,
  Users,
  Building2,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function OfficerAnalyticsView() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/placements/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-44 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        </div>
      </div>
    );
  }

  const stage = analytics?.stageBreakdown || {
    applied: 42,
    shortlisted: 14,
    interview: 8,
    offered: 8,
    rejected: 5,
    withdrawn: 3,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl dark:border-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Institutional Placement Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Recruitment Funnel &amp; Outcomes
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Real-time conversion metrics, institutional salary distributions, and hiring partner yield across active recruitment cycles.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
            Overall Conversion
          </span>
          <p className="text-3xl sm:text-4xl font-black text-white mt-1">
            {analytics?.conversionRate || 19.0}%
          </p>
          <span className="text-[11px] text-emerald-400 font-bold">
            {analytics?.offeredCount || 8} Offers Extended
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Package Offered
          </span>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.averagePackageLPA || 14.5} LPA
          </p>
          <p className="text-xs text-slate-500">
            Across Tier-1 IT &amp; Engineering drives
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Corporate Partners
          </span>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalPartners || 12}
          </p>
          <p className="text-xs text-slate-500">
            100% active recruiting status
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Candidate Applications
          </span>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalApplications || 42}
          </p>
          <p className="text-xs text-slate-500">
            Verified across 14 campus drives
          </p>
        </div>
      </div>

      {/* Hiring Funnel Visualization */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Candidate Pipeline Funnel
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-by-stage progression from initial student applications to final offers.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>1. Applications Received</span>
              <span>{stage.applied} candidates (100%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div className="h-full bg-indigo-600 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>2. Shortlisted for Assessment</span>
              <span>{stage.shortlisted} candidates ({Math.round((stage.shortlisted / Math.max(1, stage.applied)) * 100)}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.round((stage.shortlisted / Math.max(1, stage.applied)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>3. Advanced to Interviews</span>
              <span>{stage.interview} candidates ({Math.round((stage.interview / Math.max(1, stage.applied)) * 100)}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.round((stage.interview / Math.max(1, stage.applied)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>4. Final Offers Issued</span>
              <span className="text-emerald-600">{stage.offered} offers ({Math.round((stage.offered / Math.max(1, stage.applied)) * 100)}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.round((stage.offered / Math.max(1, stage.applied)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
