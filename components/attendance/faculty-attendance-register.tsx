"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  BookOpen,
  Search,
  CheckCheck,
  Ban,
  AlertTriangle,
  Send,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { AttendanceStatus } from "@prisma/client";

export interface FacultySubjectItem {
  facultySubjectId: string;
  code: string;
  name: string;
  credits: number;
  divisionId: string;
  divisionName: string;
  semester: number;
  facultyId: string;
  facultyName: string;
}

export interface RosterStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  prn: string;
  currentPercentage: number;
  status: AttendanceStatus;
  recordId?: string;
  remarks?: string;
}

const PERIODS = [
  { period: 1, label: "Period 1 (09:00 - 10:00)" },
  { period: 2, label: "Period 2 (10:00 - 11:00)" },
  { period: 3, label: "Period 3 (11:15 - 12:15)" },
  { period: 4, label: "Period 4 (12:15 - 01:15)" },
  { period: 5, label: "Period 5 (02:00 - 03:00)" },
  { period: 6, label: "Period 6 (03:00 - 04:00)" },
];

export function FacultyAttendanceRegister({
  assignedSubjects,
}: {
  assignedSubjects: FacultySubjectItem[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    assignedSubjects[0]?.facultySubjectId || ""
  );
  const [date, setDate] = useState<string>("2026-09-11");
  const [period, setPeriod] = useState<number>(1);
  const [topicCovered, setTopicCovered] = useState<string>("");

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [isAlreadyRecorded, setIsAlreadyRecorded] = useState<boolean>(false);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const activeSubject = assignedSubjects.find(
    (s) => s.facultySubjectId === selectedSubjectId
  );

  // Fetch roster when subject, date, or period changes
  const loadRoster = async () => {
    if (!selectedSubjectId || !activeSubject) return;

    setIsLoadingRoster(true);
    setFeedback(null);

    try {
      const res = await fetch(
        `/api/attendance/sheet?facultySubjectId=${selectedSubjectId}&divisionId=${activeSubject.divisionId}&date=${date}&period=${period}`
      );
      const data = await res.json();

      if (data.success && data.sheet) {
        setRoster(
          data.sheet.roster.map((s: any) => ({
            ...s,
            remarks: s.remarks || "",
          }))
        );
        setIsAlreadyRecorded(data.sheet.isAlreadyRecorded);
        if (data.sheet.existingTopic) {
          setTopicCovered(data.sheet.existingTopic);
        }
        if (data.sheet.isAlreadyRecorded) {
          setFeedback({
            type: "info",
            message: `Attendance for Period ${period} on ${date} has already been recorded. Duplicate submissions are blocked by server constraints.`,
          });
        }
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to load class roster.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Network error occurred while fetching student roster.",
      });
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [selectedSubjectId, date, period]);

  // Bulk status changes
  const markAllStatus = (newStatus: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((student) => ({
        ...student,
        status: newStatus,
      }))
    );
  };

  // Toggle individual student status
  const toggleStudentStatus = (studentId: string, newStatus: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((student) =>
        student.studentId === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  // Update remarks
  const updateRemarks = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((student) =>
        student.studentId === studentId ? { ...student, remarks } : student
      )
    );
  };

  // Submit attendance to API
  const handleSubmitAttendance = async () => {
    if (roster.length === 0) {
      setFeedback({ type: "error", message: "Student roster is empty." });
      return;
    }

    if (!activeSubject) {
      setFeedback({ type: "error", message: "Please select a valid subject." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        facultySubjectId: selectedSubjectId,
        divisionId: activeSubject.divisionId,
        date,
        periodNumber: period,
        topicCovered: topicCovered || "Standard Lecture Session",
        records: roster.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Success: Recorded attendance for ${data.result.recordsMarked} students. Server duplicate locks are now active for this session.`,
        });
        setIsAlreadyRecorded(true);
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to submit attendance.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred while communicating with the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered roster by search
  const filteredRoster = roster.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = roster.filter(
    (s) => s.status === AttendanceStatus.PRESENT
  ).length;
  const absentCount = roster.filter(
    (s) => s.status === AttendanceStatus.ABSENT
  ).length;
  const presentPct =
    roster.length > 0 ? Math.round((presentCount / roster.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
              Official Faculty Attendance Register
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Class Attendance Sheet
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Server-authorized attendance recording with real-time enrolled roster verification, duplicate conflict blocking, and audit tracking.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <Users className="h-8 w-8 text-blue-200" />
            <div>
              <div className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Assigned Classes
              </div>
              <div className="text-lg font-bold">
                {assignedSubjects.length} Subject Allocation{assignedSubjects.length > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration & Selection Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Subject & Division
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {assignedSubjects.map((sub) => (
                  <option key={sub.facultySubjectId} value={sub.facultySubjectId}>
                    {sub.code} — {sub.name} ({sub.divisionName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Attendance Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Period Slot
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PERIODS.map((p) => (
                  <option key={p.period} value={p.period}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Covered */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Lecture Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 4: Normalization"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            <span>Division: <strong>{activeSubject?.divisionName}</strong> &bull; Semester: <strong>{activeSubject?.semester}</strong></span>
          </div>
          <button
            type="button"
            onClick={loadRoster}
            disabled={isLoadingRoster}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoadingRoster ? "animate-spin" : ""}`} />
            Refresh Roster
          </button>
        </div>
      </div>

      {/* Feedback / Alert Banners */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
              : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : feedback.type === "error" ? (
            <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Roster Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Roster Controls & Stats Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => markAllStatus(AttendanceStatus.PRESENT)}
              disabled={isAlreadyRecorded}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAllStatus(AttendanceStatus.ABSENT)}
              disabled={isAlreadyRecorded}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              <Ban className="h-4 w-4" />
              Mark All Absent
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-background border border-border rounded-xl text-xs font-bold">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-foreground">{roster.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>Present:</span>
              <span>
                {presentCount} ({presentPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              <span>Absent:</span>
              <span>{absentCount}</span>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="p-4 border-b border-border bg-background flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 text-center">Historical %</th>
                <th className="px-4 py-3 text-center">Status Toggle</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingRoster ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 font-medium">
                      <RotateCcw className="h-4 w-4 animate-spin text-primary" />
                      Loading division student roster...
                    </div>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No students match your query.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((student) => {
                  const isPresent = student.status === AttendanceStatus.PRESENT;
                  const isAbsent = student.status === AttendanceStatus.ABSENT;

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">
                        {student.rollNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {student.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          PRN: {student.prn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            student.currentPercentage >= 75
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                              : student.currentPercentage >= 65
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                              : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {student.currentPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStudentStatus(
                                student.studentId,
                                AttendanceStatus.PRESENT
                              )
                            }
                            disabled={isAlreadyRecorded}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            } disabled:opacity-50 disabled:pointer-events-none`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toggleStudentStatus(
                                student.studentId,
                                AttendanceStatus.ABSENT
                              )
                            }
                            disabled={isAlreadyRecorded}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isAbsent
                                ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-400"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            } disabled:opacity-50 disabled:pointer-events-none`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Optional remark..."
                          value={student.remarks || ""}
                          disabled={isAlreadyRecorded}
                          onChange={(e) =>
                            updateRemarks(student.studentId, e.target.value)
                          }
                          className="w-full px-2.5 py-1 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Submission Bar */}
        <div className="p-4 sm:p-5 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            {isAlreadyRecorded ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 justify-center sm:justify-start">
                <AlertTriangle className="h-4 w-4" />
                This session attendance has already been finalized and locked against duplicate entry.
              </span>
            ) : (
              <span>
                Please verify present/absent states. Once submitted, records are securely archived to PostgreSQL.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmitAttendance}
            disabled={isSubmitting || isAlreadyRecorded || roster.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Finalizing Attendance...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Attendance Register ({roster.length} Students)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
