"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  User,
  BookOpen,
  Filter,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { DemoExam } from "@/lib/exam/demo-exams";

export function AdminExamManagementView() {
  const [exams, setExams] = useState<DemoExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("MIDTERM");
  const [newSubjectId, setNewSubjectId] = useState("sub-cs601");
  const [newDate, setNewDate] = useState("2026-05-10");
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("11:30");
  const [newMaxMarks, setNewMaxMarks] = useState(50);
  const [newPassingMarks, setNewPassingMarks] = useState(20);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Scheduling modal state
  const [schedulingExam, setSchedulingExam] = useState<DemoExam | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedStartTime, setSchedStartTime] = useState("10:00");
  const [schedEndTime, setSchedEndTime] = useState("11:30");
  const [schedRoomId, setSchedRoomId] = useState("room-301");
  const [schedFacultyId, setSchedFacultyId] = useState("demo-faculty-001");
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Failed to load exams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCreate(true);
      setMessage(null);

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          examType: newType,
          academicYear: "2024-2025",
          semesterNumber: 6,
          departmentId: "dept-ce",
          divisionId: "div-comp-a",
          subjectId: newSubjectId,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime,
          maxMarks: newMaxMarks,
          passingMarks: newPassingMarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create exam");
      }

      setMessage({ type: "success", text: `Exam '${data.exam.title}' created successfully.` });
      setIsCreateOpen(false);
      fetchExams();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleOpenSchedule = (exam: DemoExam) => {
    setSchedulingExam(exam);
    setSchedDate(exam.date || "2026-05-15");
    setSchedStartTime(exam.startTime || "10:00");
    setSchedEndTime(exam.endTime || "11:30");
    setSchedRoomId(exam.roomId || "room-301");
    setSchedFacultyId(exam.facultyId || "demo-faculty-001");
    setConflictError(null);
  };

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingExam) return;

    try {
      setSubmittingSchedule(true);
      setConflictError(null);

      const res = await fetch(`/api/exams/${schedulingExam.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: schedDate,
          startTime: schedStartTime,
          endTime: schedEndTime,
          roomId: schedRoomId,
          facultyId: schedFacultyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule exam");
      }

      setMessage({ type: "success", text: `Exam '${schedulingExam.title}' scheduled without conflicts.` });
      setSchedulingExam(null);
      fetchExams();
    } catch (err: any) {
      setConflictError(err.message);
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handlePublishResults = async (id: string) => {
    if (!confirm("Are you sure you want to publish the results for this exam? Enrolled students will receive instant notifications.")) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish results");

      setMessage({ type: "success", text: "Results published and students notified." });
      fetchExams();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleLockResults = async (id: string) => {
    if (!confirm("Locking results prevents all further grade changes. Continue?")) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/${id}/lock`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to lock results");

      setMessage({ type: "success", text: "Exam results locked successfully." });
      fetchExams();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filteredExams = filterStatus === "ALL" ? exams : exams.filter((e) => e.status === filterStatus);

  // Top KPI counters
  const totalCount = exams.length;
  const scheduledCount = exams.filter((e) => e.status === "SCHEDULED").length;
  const pendingCount = exams.filter((e) => e.status === "RESULTS_PENDING" || e.status === "COMPLETED").length;
  const publishedCount = exams.filter((e) => e.status === "PUBLISHED").length;
  const lockedCount = exams.filter((e) => e.status === "LOCKED").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="h-6 w-6 text-indigo-600" />
            <span>Academic Exam Governance & Scheduling</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage institutional exam calendars, detect resource collisions, and publish verified results.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Examination</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Exams</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Institutional records</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{scheduledCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Upcoming sessions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase">Results Pending</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting moderation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase">Published</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Visible to candidates</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase">Locked</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{lockedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Archived & certified</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3">
        {["ALL", "SCHEDULED", "RESULTS_PENDING", "PUBLISHED", "LOCKED", "DRAFT"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              filterStatus === status
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Exams Roster Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Examination Title</th>
                <th className="px-5 py-3.5">Subject</th>
                <th className="px-5 py-3.5 text-center">Type</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Venue & Faculty</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{exam.title}</div>
                    <div className="text-[11px] text-slate-400">Semester {exam.semesterNumber} | Max: {exam.maxMarks} (Pass: {exam.passingMarks})</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{exam.subjectName}</div>
                    <div className="font-mono text-[11px] text-slate-400">{exam.subjectCode}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {exam.examType}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{exam.date}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{exam.roomNumber || "Unassigned"}</div>
                    <div className="text-[11px] text-slate-400">{exam.facultyName || "No invigilator"}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        exam.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : exam.status === "LOCKED"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : exam.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {exam.status === "DRAFT" && (
                      <button
                        onClick={() => handleOpenSchedule(exam)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition"
                      >
                        Schedule
                      </button>
                    )}
                    {exam.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleOpenSchedule(exam)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
                      >
                        Reschedule
                      </button>
                    )}
                    {exam.status === "RESULTS_PENDING" && (
                      <button
                        onClick={() => handlePublishResults(exam.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                      >
                        Publish Results
                      </button>
                    )}
                    {exam.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleLockResults(exam.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
                      >
                        Lock Results
                      </button>
                    )}
                    {exam.status === "LOCKED" && (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center justify-end gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Exam Modal with Instant Conflict Detection */}
      {schedulingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Schedule / Allocate Exam: {schedulingExam.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Validates room availability, invigilator clashing, division timetable overlap, and lab facility rules.
            </p>

            <form onSubmit={handleScheduleExam} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Date *
                </label>
                <input
                  type="date"
                  required
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Room / Venue *
                </label>
                <select
                  value={schedRoomId}
                  onChange={(e) => setSchedRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="room-301">LH-301 (Classroom, Cap: 70)</option>
                  <option value="room-302">LH-302 (Classroom, Cap: 70)</option>
                  <option value="room-lab-101">LAB-101 (Computer Systems Lab, Cap: 40)</option>
                  <option value="room-lab-102">LAB-102 (AI & Cloud Lab, Cap: 40)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Invigilator *
                </label>
                <select
                  value={schedFacultyId}
                  onChange={(e) => setSchedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="demo-faculty-001">Dr. Meera Patel (Computer Engineering)</option>
                  <option value="demo-faculty-002">Prof. Suresh Joshi (IT Department)</option>
                </select>
              </div>

              {conflictError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-medium">
                  {conflictError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSchedulingExam(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition"
                >
                  {submittingSchedule ? "Validating..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Examination
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Set up a formal assessment paper in draft state.
            </p>

            <form onSubmit={handleCreateExam} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Evaluation — Distributed Systems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assessment Type *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="MIDTERM">Midterm</option>
                    <option value="INTERNAL">Internal Assessment</option>
                    <option value="PRACTICAL">Practical Lab Viva</option>
                    <option value="END_SEMESTER">End Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Subject *
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="sub-cs601">CS601: Cloud Computing</option>
                    <option value="sub-cs602">CS602: Machine Learning</option>
                    <option value="sub-cs603">CS603: Information Security</option>
                    <option value="sub-cs604">CS604: Software Engineering</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newMaxMarks}
                    required
                    value={newPassingMarks}
                    onChange={(e) => setNewPassingMarks(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition"
                >
                  {submittingCreate ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
