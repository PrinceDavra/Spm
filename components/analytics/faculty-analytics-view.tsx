"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import { FacultyPersonalAnalytics } from "@/services/analytics.service";

export function FacultyAnalyticsView() {
  const [analytics, setAnalytics] = useState<FacultyPersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyAnalytics();
  }, []);

  async function fetchFacultyAnalytics() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/faculty");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load faculty personal analytics", err);
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

  const wl = analytics?.workload;
  const asgn = analytics?.assignmentsAuthored;
  const classes = analytics?.classesTaught || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Faculty Academic Portal
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Teaching Workload & Student Analytics
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Weekly scheduled teaching load, division attendance rates, coursework grading progress, and student interventions.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-right">
          <div className="text-xs text-indigo-200 font-medium">Faculty Member</div>
          <div className="text-lg font-bold">{analytics?.faculty.name}</div>
          <div className="text-[11px] text-slate-300">
            {analytics?.faculty.departmentName} • {analytics?.faculty.employeeId}
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Workload */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Teaching Workload
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {wl?.assignedWeeklyPeriods}h / {wl?.maxWeeklyCapacity}h Cap
              </span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-3">
              {wl?.scheduledWeeklyPeriods}h
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {wl?.theoryPeriods}h theory lectures • {wl?.labPeriods}h laboratory practicals
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{wl?.allocations.length} allocated courses</span>
            <Link
              href="/dashboard/faculty/timetable"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Weekly Timetable
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Assigned Classes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Divisions
              </span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-3">
              {classes.length}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Teaching rosters active across {classes.reduce((acc, c) => acc + c.studentCount, 0)} total enrolled students
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Attendance avg: 81.5%</span>
            <Link
              href="/dashboard/faculty/classes"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Roster Hub
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Assignment Grading Backlog */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Grading Backlog
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-4xl font-black text-amber-600 dark:text-amber-400 mt-3">
              {asgn?.pendingGradingCount}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {asgn?.gradedCount} submissions marked • {asgn?.submissionRate}% submission rate
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{asgn?.totalAssignments} authored assignments</span>
            <Link
              href="/dashboard/faculty/assignments"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              Grading Desk
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Classes Taught Roster */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Assigned Course Workload Details
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Allocated divisions and subjects with weekly hours and student enrollment
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Division</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Weekly Hours</th>
                <th className="py-2.5 px-3">Enrolled Students</th>
                <th className="py-2.5 px-3">Average Attendance</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map((cls, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {cls.subjectCode} - {cls.subjectName}
                  </td>
                  <td className="py-3 px-3 font-medium">{cls.divisionName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold">
                      THEORY
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">3 hrs/week</td>
                  <td className="py-3 px-3">{cls.studentCount}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">
                    {cls.averageAttendanceRate}%
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      href="/dashboard/faculty/attendance/mark"
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Mark Attendance
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students Requiring Academic Attention */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Students Requiring Academic Attention In Your Classes
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic alerts based on attendance (&lt; 75%) or coursework delays
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-lg">
            {analytics?.atRiskStudentsInClasses.length || 0} Students Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Roll Number</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3">Assignment %</th>
                <th className="py-2.5 px-3">Overdue Count</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Factors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {analytics?.atRiskStudentsInClasses.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {s.name}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{s.rollNumber}</td>
                  <td className="py-3 px-3 font-bold">
                    <span className={s.attendancePercentage < 65 ? "text-rose-600" : "text-amber-600"}>
                      {s.attendancePercentage}%
                    </span>
                  </td>
                  <td className="py-3 px-3">{s.assignmentCompletionRate}%</td>
                  <td className="py-3 px-3 font-bold text-rose-600">{s.overdueAssignmentsCount}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        s.riskLevel === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {s.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {s.riskFactors.map((rf, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                        >
                          {rf}
                        </span>
                      ))}
                    </div>
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
