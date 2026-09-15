"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  Users,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Activity,
} from "lucide-react";
import { StudentPersonalAnalytics } from "@/services/analytics.service";

export function StudentAnalyticsView() {
  const [analytics, setAnalytics] = useState<StudentPersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  async function fetchStudentAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/student");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load student personal analytics", err);
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

  const att = analytics?.attendance;
  const asgn = analytics?.assignments;
  const prep = analytics?.placementReadiness;

  const attStatusColor =
    att?.overallRisk === "SAFE"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200"
      : att?.overallRisk === "WARNING"
      ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200"
      : "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Academic Self-Growth Hub
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Academic Performance & Growth Metrics
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Personal learning trajectory, attendance health projections, coursework completion, and career readiness.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-right">
          <div className="text-xs text-indigo-200 font-medium">Enrolled Division</div>
          <div className="text-lg font-bold">
            {analytics?.student.departmentName} • {analytics?.student.divisionName}
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            Roll: {analytics?.student.rollNumber}
          </div>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Attendance
              </span>
              <span
                className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${attStatusColor}`}
              >
                {att?.overallRisk}
              </span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-3">
              {att?.overallPercentage}%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
              {att?.projectionMessage}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {att?.totalPresent} attended of {att?.totalConducted} classes
            </span>
            <Link
              href="/dashboard/student/attendance"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Full Ledger
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Assignment Completion Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Coursework Completion
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-3">
              {asgn?.completionRate}%
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {asgn?.kpi.submitted} assignments turned in • {asgn?.kpi.pending} pending submission
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Avg Marks: {asgn?.averageMarksObtained !== null ? `${asgn?.averageMarksObtained}%` : "Evaluating"}
            </span>
            <Link
              href="/dashboard/student/assignments"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Assignments Desk
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Career Readiness Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Placement Readiness
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-3">
              {prep?.readinessScore}/100
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
              Tier: <span className="font-bold text-slate-900 dark:text-white">{prep?.readinessTier}</span> •{" "}
              {prep?.quizAccuracy}% quiz accuracy
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{prep?.quizzesCompleted} mock assessments completed</span>
            <Link
              href="/dashboard/student/placements/preparation"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Prep Bank
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Subject-Wise Attendance Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Empirical session counts with mathematical projections for each assigned subject
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {att?.subjectBreakdown.map((s) => (
            <div
              key={s.subjectCode}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white mr-2">
                    {s.subjectCode}: {s.subjectName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({s.present} of {s.conducted} classes attended)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      s.percentage >= 75
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : s.percentage >= 65
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {s.percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.percentage >= 75
                      ? "bg-emerald-500"
                      : s.percentage >= 65
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, s.percentage)}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {s.projectionText}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Engagement & Life */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Events */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              Registered Campus Events
            </h2>
            <Link
              href="/dashboard/student/events"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Browse Events
            </Link>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.events.registeredEventsCount} Events
          </div>
          <p className="text-xs text-slate-500">
            {analytics?.events.upcomingRegisteredCount} upcoming scheduled event seats confirmed
          </p>
        </div>

        {/* Clubs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Club Chapters & Memberships
            </h2>
            <Link
              href="/dashboard/student/clubs/my-clubs"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              My Chapters
            </Link>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.clubs.joinedClubsCount} Chapters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analytics?.clubs.approvedClubs.map((clubName, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold"
              >
                {clubName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
