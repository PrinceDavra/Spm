"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
  Download,
  Users,
  Building2,
  GraduationCap,
  Layers,
  Award,
  Briefcase,
  Search,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  ExternalLink,
  BookOpen,
  BellRing,
} from "lucide-react";
import {
  ExecutiveOverviewData,
  AttendanceAnalyticsData,
  AtRiskStudent,
  AcademicPerformanceData,
  AssignmentAnalyticsData,
  FacultyWorkloadAnalyticsData,
  TimetableUtilizationData,
  EventAnalyticsData,
  ClubAnalyticsData,
  PlacementAnalyticsData,
  LostFoundAnalyticsData,
  NotificationAnalyticsData,
  DepartmentComparisonItem,
} from "@/services/analytics.service";
import { AnalyticsFilterInput, ReportType } from "@/validators/analytics.schema";
import { AnalyticsFilterBar } from "./analytics-filter-bar";
import { AttendanceTrendChart } from "./charts/attendance-trend-chart";
import { DistributionPieChart } from "./charts/distribution-pie-chart";
import { DepartmentBarChart } from "./charts/department-bar-chart";
import { WorkloadBarChart } from "./charts/workload-bar-chart";

type TabKey =
  | "overview"
  | "attendance"
  | "academics"
  | "workload"
  | "campus-life"
  | "placement"
  | "notifications";

export function AdminAnalyticsView() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilterInput>({ dateRange: "THIS_SEMESTER" });

  // Data states
  const [overview, setOverview] = useState<ExecutiveOverviewData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceAnalyticsData | null>(null);
  const [atRisk, setAtRisk] = useState<{ atRiskStudents: AtRiskStudent[]; criticalCount: number; warningCount: number } | null>(null);
  const [academics, setAcademics] = useState<AcademicPerformanceData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentAnalyticsData | null>(null);
  const [workload, setWorkload] = useState<FacultyWorkloadAnalyticsData | null>(null);
  const [timetable, setTimetable] = useState<TimetableUtilizationData | null>(null);
  const [events, setEvents] = useState<EventAnalyticsData | null>(null);
  const [clubs, setClubs] = useState<ClubAnalyticsData | null>(null);
  const [placement, setPlacement] = useState<PlacementAnalyticsData | null>(null);
  const [lostFound, setLostFound] = useState<LostFoundAnalyticsData | null>(null);
  const [notifications, setNotifications] = useState<NotificationAnalyticsData | null>(null);
  const [deptComparison, setDeptComparison] = useState<DepartmentComparisonItem[]>([]);

  // Export state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportingReport, setExportingReport] = useState<ReportType>("attendance");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAllAnalytics(filters);
  }, [filters]);

  async function fetchAllAnalytics(filterInput: AnalyticsFilterInput) {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterInput.departmentId) q.set("departmentId", filterInput.departmentId);
      if (filterInput.semester) q.set("semester", String(filterInput.semester));
      if (filterInput.divisionId) q.set("divisionId", filterInput.divisionId);
      if (filterInput.dateRange) q.set("dateRange", filterInput.dateRange);
      if (filterInput.startDate) q.set("startDate", filterInput.startDate);
      if (filterInput.endDate) q.set("endDate", filterInput.endDate);
      const queryStr = q.toString() ? `?${q.toString()}` : "";

      const [
        overviewRes,
        attendanceRes,
        atRiskRes,
        academicsRes,
        assignmentsRes,
        workloadRes,
        timetableRes,
        eventsRes,
        clubsRes,
        placementRes,
        lostFoundRes,
        notificationsRes,
        deptComparisonRes,
      ] = await Promise.all([
        fetch(`/api/analytics/overview${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/attendance${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/at-risk${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/academic${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/assignments${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/faculty-workload${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/timetable${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/events${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/clubs${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/placement${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/lost-found${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/notifications${queryStr}`).then((r) => r.json()),
        fetch(`/api/analytics/department-comparison`).then((r) => r.json()),
      ]);

      if (overviewRes.success) setOverview(overviewRes.overview);
      if (attendanceRes.success) setAttendance(attendanceRes.analytics);
      if (atRiskRes.success) setAtRisk(atRiskRes);
      if (academicsRes.success) setAcademics(academicsRes.performance);
      if (assignmentsRes.success) setAssignments(assignmentsRes.analytics);
      if (workloadRes.success) setWorkload(workloadRes.workload);
      if (timetableRes.success) setTimetable(timetableRes.utilization);
      if (eventsRes.success) setEvents(eventsRes.analytics);
      if (clubsRes.success) setClubs(clubsRes.analytics);
      if (placementRes.success) setPlacement(placementRes.analytics);
      if (lostFoundRes.success) setLostFound(lostFoundRes.analytics);
      if (notificationsRes.success) setNotifications(notificationsRes.analytics);
      if (deptComparisonRes.success) setDeptComparison(deptComparisonRes.comparison);
    } catch (err) {
      console.error("Failed to load analytics telemetry", err);
    } finally {
      setLoading(false);
    }
  }

  function handleTriggerExport(type: ReportType) {
    const q = new URLSearchParams();
    if (filters.departmentId) q.set("departmentId", filters.departmentId);
    if (filters.semester) q.set("semester", String(filters.semester));
    if (filters.divisionId) q.set("divisionId", filters.divisionId);
    if (filters.startDate) q.set("startDate", filters.startDate);
    if (filters.endDate) q.set("endDate", filters.endDate);
    const queryStr = q.toString() ? `?${q.toString()}` : "";

    window.open(`/api/analytics/export/${type}${queryStr}`, "_blank");
    setExportModalOpen(false);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Institutional Intelligence Layer
          </div>
          <h1 className="text-3xl font-black tracking-tight">Institutional Analytics & Reporting</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Real-time authoritative telemetry across students, faculty workload, attendance health,
            corporate placements, campus life, and configuration integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md"
          >
            <Download className="w-4 h-4" />
            Export CSV Reports
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar onFilterChange={(newFilters) => setFilters(newFilters)} isLoading={loading} />

      {/* Configuration Health Alert Banner */}
      {overview?.configurationHealth && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            overview.configurationHealth.status === "HEALTHY"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : overview.configurationHealth.status === "WARNING"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                overview.configurationHealth.status === "HEALTHY"
                  ? "bg-emerald-200 dark:bg-emerald-800"
                  : overview.configurationHealth.status === "WARNING"
                  ? "bg-amber-200 dark:bg-amber-800"
                  : "bg-rose-200 dark:bg-rose-800"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                Academic Configuration Integrity: {overview.configurationHealth.status}
              </div>
              <div className="text-xs opacity-90">
                {overview.configurationHealth.passCount} checks passing •{" "}
                {overview.configurationHealth.warningCount} warnings •{" "}
                {overview.configurationHealth.criticalCount} critical issues detected
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/admin/configuration-health"
            className="flex items-center gap-1 text-xs font-bold underline hover:opacity-80 shrink-0"
          >
            Review Health Checks
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 10 Master Executive KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(overview.kpis).map(([key, kpi]) => {
            const statusBg =
              kpi.status === "SAFE"
                ? "border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400"
                : kpi.status === "WARNING"
                ? "border-amber-200 dark:border-amber-900/40 hover:border-amber-400"
                : kpi.status === "CRITICAL"
                ? "border-rose-200 dark:border-rose-900/40 hover:border-rose-400"
                : "border-slate-200 dark:border-slate-800 hover:border-indigo-300";

            return (
              <Link
                key={key}
                href={kpi.href}
                className={`bg-white dark:bg-slate-900 border ${statusBg} p-4 rounded-2xl shadow-sm transition hover:shadow-md flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                    <span>{kpi.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {kpi.value}
                  </div>
                  {kpi.subValue && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {kpi.subValue}
                    </div>
                  )}
                </div>
                {kpi.changeDescription && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        kpi.status === "SAFE"
                          ? "bg-emerald-500"
                          : kpi.status === "WARNING"
                          ? "bg-amber-500"
                          : kpi.status === "CRITICAL"
                          ? "bg-rose-500"
                          : "bg-indigo-500"
                      }`}
                    />
                    <span>{kpi.changeDescription}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: "overview", label: "Overview & Benchmarks", icon: Activity },
          { key: "attendance", label: "Attendance & At-Risk", icon: TrendingUp },
          { key: "academics", label: "Academics & Assignments", icon: BookOpen },
          { key: "workload", label: "Faculty & Facilities", icon: Building2 },
          { key: "campus-life", label: "Campus Life (Events/Clubs/L&F)", icon: Award },
          { key: "placement", label: "Placements & Careers", icon: Briefcase },
          { key: "notifications", label: "Communication Hub", icon: BellRing },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Benchmarks */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance Area Chart */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Institutional Attendance Trajectory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chronological class attendance progression vs 75% bar
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
                  {attendance?.overallPercentage}% Average
                </span>
              </div>
              <AttendanceTrendChart data={attendance?.attendanceTrend || []} />
            </div>

            {/* Threshold Distribution Donut */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Attendance Risk Tiering
                </h2>
                <p className="text-xs text-slate-500">
                  Student population classified by regulatory threshold
                </p>
              </div>
              <DistributionPieChart
                data={[
                  {
                    name: "Safe (>= 75%)",
                    value: attendance?.thresholdDistribution.safeCount || 0,
                    color: "#10b981",
                  },
                  {
                    name: "Warning (65-74.9%)",
                    value: attendance?.thresholdDistribution.warningCount || 0,
                    color: "#f59e0b",
                  },
                  {
                    name: "Critical (< 65%)",
                    value: attendance?.thresholdDistribution.criticalCount || 0,
                    color: "#ef4444",
                  },
                ]}
              />
            </div>
          </div>

          {/* Department Comparison Table & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Department Benchmarking
                </h2>
                <p className="text-xs text-slate-500">
                  Comparative performance across academic faculties
                </p>
              </div>
              <DepartmentBarChart data={deptComparison} />
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Departmental Scorecard
                  </h2>
                  <p className="text-xs text-slate-500">
                    Normalized comparison across all accredited branches
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Students</th>
                      <th className="py-2.5 px-3">Faculty</th>
                      <th className="py-2.5 px-3">Attendance</th>
                      <th className="py-2.5 px-3">Assignment Submissions</th>
                      <th className="py-2.5 px-3">Placement Apps</th>
                      <th className="py-2.5 px-3">Config Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deptComparison.map((d) => (
                      <tr key={d.departmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {d.departmentName} ({d.code})
                        </td>
                        <td className="py-3 px-3">{d.studentCount}</td>
                        <td className="py-3 px-3">{d.facultyCount}</td>
                        <td className="py-3 px-3 font-medium">
                          <span
                            className={
                              d.attendanceRate >= 75
                                ? "text-emerald-600 font-bold"
                                : "text-amber-600 font-bold"
                            }
                          >
                            {d.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3">{d.assignmentSubmissionRate}%</td>
                        <td className="py-3 px-3">{d.placementApplications}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.configurationStatus === "HEALTHY"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {d.configurationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance & At-Risk */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-500">Overall Attendance</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {attendance?.overallPercentage}%
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                {attendance?.overallStatus} Tier
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-500">Safe Students (&gt;= 75%)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {attendance?.thresholdDistribution.safeCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Compliant with regulations</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-500">Warning (65% - 74.9%)</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {attendance?.thresholdDistribution.warningCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Require academic nudge</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-500">Critical Risk (&lt; 65%)</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {attendance?.thresholdDistribution.criticalCount}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">Immediate intervention</div>
            </div>
          </div>

          {/* Deterministic At-Risk Registry Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Deterministic Academic At-Risk Registry
                </h2>
                <p className="text-xs text-slate-500">
                  Formula-driven identification with transparent, empirical justification signals
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-lg">
                {atRisk?.atRiskStudents.length || 0} Students Flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Student</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                    <th className="py-2.5 px-3">Attendance</th>
                    <th className="py-2.5 px-3">Assignments</th>
                    <th className="py-2.5 px-3">Overdue</th>
                    <th className="py-2.5 px-3">Placement Readiness</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                    <th className="py-2.5 px-3">Transparent Factor Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {atRisk?.atRiskStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {s.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{s.rollNumber}</td>
                      <td className="py-3 px-3 font-bold">
                        <span
                          className={
                            s.attendancePercentage < 65
                              ? "text-rose-600"
                              : s.attendancePercentage < 75
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }
                        >
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3">{s.assignmentCompletionRate}%</td>
                      <td className="py-3 px-3">
                        {s.overdueAssignmentsCount > 0 ? (
                          <span className="font-bold text-rose-600">{s.overdueAssignmentsCount}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-3 px-3">{s.placementReadinessScore}/100</td>
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
                  {(!atRisk?.atRiskStudents || atRisk.atRiskStudents.length === 0) && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Zero students currently meet academic risk criteria for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Academics & Assignments */}
      {activeTab === "academics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject Performance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Subject-Wise Grade Performance
                </h2>
                <p className="text-xs text-slate-500">
                  Empirically calculated from coursework submissions and quiz attempts
                </p>
              </div>

              <div className="space-y-3">
                {academics?.subjectPerformance.map((subj) => (
                  <div key={subj.subjectCode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>
                        {subj.subjectCode}: {subj.subjectName}
                      </span>
                      <span className={subj.averageMarks >= 75 ? "text-emerald-600" : "text-amber-600"}>
                        {subj.averageMarks}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          subj.averageMarks >= 75
                            ? "bg-emerald-500"
                            : subj.averageMarks >= 65
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${subj.averageMarks}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Tiering Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Grade Bracket Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Percentage grading breakdown across evaluated submissions
                </p>
              </div>

              <DistributionPieChart
                data={[
                  { name: "Grade A (>= 85%)", value: academics?.gradeDistribution.gradeA || 0, color: "#10b981" },
                  { name: "Grade B (70-84.9%)", value: academics?.gradeDistribution.gradeB || 0, color: "#4f46e5" },
                  { name: "Grade C (55-69.9%)", value: academics?.gradeDistribution.gradeC || 0, color: "#06b6d4" },
                  { name: "Grade D (40-54.9%)", value: academics?.gradeDistribution.gradeD || 0, color: "#f59e0b" },
                  { name: "Grade F (< 40%)", value: academics?.gradeDistribution.gradeF || 0, color: "#ef4444" },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Faculty & Facilities */}
      {activeTab === "workload" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Assigned vs Scheduled Faculty Workload
                </h2>
                <p className="text-xs text-slate-500">
                  Weekly allocated teaching hours evaluated against the institutional 20-hour maximum threshold
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
                {workload?.averageWeeklyHours}h / week average
              </span>
            </div>
            <WorkloadBarChart data={workload?.facultySummaries || []} />
          </div>

          {/* Physical Facilities Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500">Classrooms Utilization</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {timetable?.classroomUtilizationRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {timetable?.totalClassrooms} physical lecture rooms
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500">Laboratories Utilization</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {timetable?.laboratoryUtilizationRate}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {timetable?.totalLaboratories} specialized hardware/software labs
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="text-xs text-slate-500">Timetable Versions</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {timetable?.publishedTimetables} Published
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {timetable?.draftTimetables} drafts in solver staging
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Campus Life (Events / Clubs / Lost & Found) */}
      {activeTab === "campus-life" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event Telemetry */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Campus Events Telemetry
              </h2>
              <p className="text-xs text-slate-500">Registrations & capacity metrics</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Registered Seats:</span>
                <span className="font-bold">{events?.totalRegistrations}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Capacity Utilization:</span>
                <span className="font-bold text-indigo-600">{events?.capacityUtilizationRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Attendance Conversion:</span>
                <span className="font-bold text-emerald-600">{events?.attendanceConversionRate}%</span>
              </div>
            </div>
          </div>

          {/* Club Engagement */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Club Chapters & Telemetry
              </h2>
              <p className="text-xs text-slate-500">Deterministic engagement scoring</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Active Chapters:</span>
                <span className="font-bold">{clubs?.activeClubsCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Club Memberships:</span>
                <span className="font-bold">{clubs?.totalMembersCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Average Engagement Score:</span>
                <span className="font-bold text-indigo-600">{clubs?.averageEngagementScore}/100</span>
              </div>
            </div>
          </div>

          {/* Lost & Found */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Lost & Found Resolution
              </h2>
              <p className="text-xs text-slate-500">Community item recovery metrics</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Reported Items:</span>
                <span className="font-bold">{lostFound?.totalReports}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Resolution Rate:</span>
                <span className="font-bold text-emerald-600">{lostFound?.resolutionRate}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Avg Resolution Window:</span>
                <span className="font-bold">{lostFound?.averageResolutionDays} days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Placements & Careers */}
      {activeTab === "placement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Recruitment Funnel Pipeline
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real application progression through screening, assessments, interviews, and offers
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Total Applications Submitted:</span>
                <span className="font-bold">{placement?.totalApplications}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Shortlisted for Rounds:</span>
                <span className="font-bold text-indigo-600">{placement?.statusFunnel.shortlisted}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Interview Stage:</span>
                <span className="font-bold text-amber-600">{placement?.statusFunnel.interview}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Job Offers Extended:</span>
                <span className="font-bold text-emerald-600">{placement?.statusFunnel.offered}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Student Placement Readiness
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Multi-factor assessment score (30% Quiz + 20% Consistency + 20% Skills + 15% Academic + 15% Apps)
            </p>
            <DistributionPieChart
              data={[
                { name: "Placement Ready (>= 80)", value: placement?.readinessDistribution.placementReady || 0, color: "#10b981" },
                { name: "High Potential (60-79)", value: placement?.readinessDistribution.highPotential || 0, color: "#4f46e5" },
                { name: "Developing Skills (40-59)", value: placement?.readinessDistribution.developingSkills || 0, color: "#f59e0b" },
                { name: "Early Stage (< 40)", value: placement?.readinessDistribution.earlyStage || 0, color: "#ef4444" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Tab 7: Notifications & Communication */}
      {activeTab === "notifications" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Communication Delivery Reach
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Telemetry on in-app notifications generated, read, and unread rates
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Total Notifications Dispatched:</span>
                <span className="font-bold">{notifications?.totalNotifications}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Read Rate:</span>
                <span className="font-bold text-emerald-600">{notifications?.readRate}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Unread Volume:</span>
                <span className="font-bold text-amber-600">{notifications?.unreadNotifications}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Dispatch Priority Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Categorization by urgency and priority levels
            </p>
            <DistributionPieChart
              data={
                notifications?.priorityDistribution.map((p) => ({
                  name: p.priority,
                  value: p.count,
                })) || []
              }
            />
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Export Institutional Reports
                </h2>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose an official administrative report dataset to generate in standard RFC 4180 CSV format.
            </p>

            <div className="space-y-2">
              {[
                { id: "attendance", label: "Attendance Summary", desc: "Student attendance % & threshold risk" },
                { id: "assignments", label: "Assignment Telemetry", desc: "Submissions, overdue & marks" },
                { id: "faculty-workload", label: "Faculty Workload Roster", desc: "Assigned vs scheduled teaching hours" },
                { id: "placement", label: "Placement Drive Funnel", desc: "Recruiting partners, applicants & offers" },
                { id: "events", label: "Campus Events Summary", desc: "Registrations & seat capacity utilization" },
                { id: "clubs", label: "Club Chapters Telemetry", desc: "Active members & engagement scores" },
                { id: "lost-found", label: "Lost & Found Case Audit", desc: "Recovery times, claims & status" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTriggerExport(item.id as ReportType)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-left transition group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
