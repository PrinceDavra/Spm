"use client";

import { useState } from "react";
import {
  History,
  AlertTriangle,
  Users,
  TrendingDown,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import { AttendanceStatus } from "@prisma/client";
import { FacultySubjectItem } from "./faculty-attendance-register";
import { DemoSessionRecord } from "@/lib/attendance/demo-attendance";

export interface AtRiskStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  prn: string;
  totalClasses: number;
  presentClasses: number;
  percentage: number;
  risk: "SAFE" | "WARNING" | "CRITICAL";
  classesNeeded: number;
  canMiss: number;
}

export interface FacultyAnalyticsData {
  subject: FacultySubjectItem;
  totalStudents: number;
  avgPercentage: number;
  below75Count: number;
  below65Count: number;
  studentStats: AtRiskStudent[];
  atRiskStudents: AtRiskStudent[];
}

export function FacultyAttendanceHistoryView({
  assignedSubjects,
  initialAnalytics,
  initialRecords,
}: {
  assignedSubjects: FacultySubjectItem[];
  initialAnalytics: FacultyAnalyticsData | null;
  initialRecords: DemoSessionRecord[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    assignedSubjects[0]?.facultySubjectId || ""
  );
  const [analytics, setAnalytics] = useState<FacultyAnalyticsData | null>(
    initialAnalytics
  );
  const [records, setRecords] = useState<DemoSessionRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DemoSessionRecord | null>(
    null
  );
  const [editStatus, setEditStatus] = useState<AttendanceStatus>(
    AttendanceStatus.PRESENT
  );
  const [editReason, setEditReason] = useState<string>("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Switch subject analytics
  const handleSubjectChange = async (facultySubjectId: string) => {
    setSelectedSubjectId(facultySubjectId);
    setIsLoadingSubject(true);

    try {
      const res = await fetch(
        `/api/attendance/analytics?facultySubjectId=${facultySubjectId}`
      );
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to load subject analytics:", err);
    } finally {
      setIsLoadingSubject(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = (rec: DemoSessionRecord) => {
    setEditingRecord(rec);
    setEditStatus(
      rec.status === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : AttendanceStatus.PRESENT
    );
    setEditReason("");
    setEditFeedback(null);
  };

  // Submit record correction with audit log
  const handleSaveCorrection = async () => {
    if (!editingRecord) return;
    if (!editReason.trim()) {
      setEditFeedback({
        type: "error",
        message: "Mandatory audit reason required for attendance modifications.",
      });
      return;
    }

    setIsSubmittingEdit(true);
    setEditFeedback(null);

    try {
      const res = await fetch(`/api/attendance/${editingRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          reasonForEdit: editReason,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEditFeedback({
          type: "success",
          message: "Record updated and logged to institutional audit trail.",
        });

        // Update local records state
        setRecords((prev) =>
          prev.map((r) =>
            r.id === editingRecord.id
              ? {
                  ...r,
                  status: editStatus,
                  remarks: `Edited. Reason: ${editReason}`,
                  updatedAt: new Date().toISOString(),
                }
              : r
          )
        );

        setTimeout(() => {
          setEditingRecord(null);
        }, 1200);
      } else {
        setEditFeedback({
          type: "error",
          message: data.message || "Failed to update record.",
        });
      }
    } catch (err) {
      setEditFeedback({
        type: "error",
        message: "Network error occurred while submitting correction.",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Filtered records
  const subjectRecords = records.filter(
    (r) => r.facultySubjectId === selectedSubjectId
  );
  const filteredRecords = subjectRecords.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.date.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Attendance Logs &amp; Class Risk Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review past lecture attendance archives, inspect students at risk of debarment, and perform audited attendance adjustments.
          </p>
        </div>

        {/* Subject Switcher */}
        <div className="w-full sm:w-72">
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded-xl font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {assignedSubjects.map((sub) => (
              <option key={sub.facultySubjectId} value={sub.facultySubjectId}>
                {sub.code} — {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Class Average
              </span>
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-foreground">
              {analytics.avgPercentage}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {analytics.totalStudents} enrolled students
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Warning Threshold (&lt;75%)
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-amber-600 dark:text-amber-400">
              {analytics.below75Count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Require consecutive attendance to pass
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Critical (&lt;65%)
              </span>
              <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-800">
                <TrendingDown className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-rose-600 dark:text-rose-400">
              {analytics.below65Count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              High risk of semester exam debarment
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Safe Zone (&ge;75%)
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-600 dark:text-emerald-400">
              {analytics.totalStudents - analytics.below75Count}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Meeting university mandatory guidelines
            </div>
          </div>
        </div>
      )}

      {/* Students At Risk Table */}
      {analytics && analytics.atRiskStudents.length > 0 && (
        <div className="bg-card border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Students At Risk of Debarment ({analytics.atRiskStudents.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50/50 dark:bg-amber-950/20 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Roll No</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Attendance</th>
                  <th className="px-4 py-2.5">Risk Level</th>
                  <th className="px-4 py-2.5">Classes Needed (75% Target)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.atRiskStudents.map((st) => (
                  <tr key={st.studentId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-bold text-xs">
                      {st.rollNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{st.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {st.prn}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {st.percentage}% ({st.presentClasses}/{st.totalClasses})
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          st.risk === "CRITICAL"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {st.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">
                      Attend next {st.classesNeeded} consecutive lecture{st.classesNeeded > 1 ? "s" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recorded Sessions & Records Log Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recorded Attendance Sessions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any individual record to amend its status with an audited justification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or date (YYYY-MM-DD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Date &amp; Period</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Remarks / Topic</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 50).map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {rec.date}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Period {rec.periodNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-xs">
                      {rec.rollNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {rec.studentName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          rec.status === AttendanceStatus.PRESENT
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {rec.remarks || rec.topicCovered || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Audit-Logged Attendance Correction
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-bold text-foreground">
                  {editingRecord.studentName} ({editingRecord.rollNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session:</span>
                <span className="font-medium text-foreground">
                  {editingRecord.date} &bull; Period {editingRecord.periodNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="font-bold text-foreground">
                  {editingRecord.status}
                </span>
              </div>
            </div>

            {/* Target Status Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                New Attendance Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditStatus(AttendanceStatus.PRESENT)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    editStatus === AttendanceStatus.PRESENT
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Mark PRESENT
                </button>
                <button
                  type="button"
                  onClick={() => setEditStatus(AttendanceStatus.ABSENT)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    editStatus === AttendanceStatus.ABSENT
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Mark ABSENT
                </button>
              </div>
            </div>

            {/* Mandatory Audit Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Reason For Correction (Mandatory Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Student submitted official medical certificate / OD certificate verified by HOD."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Feedback alert */}
            {editFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  editFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                }`}
              >
                {editFeedback.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                disabled={isSubmittingEdit}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={isSubmittingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
              >
                {isSubmittingEdit && (
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                )}
                Save &amp; Log Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
