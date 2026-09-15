"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  BookOpen,
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { DemoExam } from "@/lib/exam/demo-exams";

export function FacultyGradebookView() {
  const [exams, setExams] = useState<DemoExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Revaluation state
  const [revaluations, setRevaluations] = useState<any[]>([]);
  const [reviewRemarks, setReviewRemarks] = useState<Record<string, string>>({});
  const [reviewedMarks, setReviewedMarks] = useState<Record<string, number>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Fetch faculty assigned exams
  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
        if (data.exams?.length > 0 && !selectedExamId) {
          setSelectedExamId(data.exams[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch exams", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch gradebook for selected exam
  const fetchGradebook = async (examId: string) => {
    if (!examId) return;
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch(`/api/exams/${examId}/gradebook`);
      if (res.ok) {
        const data = await res.json();
        setGradebookData(data.gradebook);
      }
    } catch (err) {
      console.error("Failed to fetch gradebook", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending revaluations
  const fetchRevaluations = async () => {
    try {
      const res = await fetch("/api/revaluation");
      if (res.ok) {
        const data = await res.json();
        setRevaluations(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch revaluations", err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchRevaluations();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchGradebook(selectedExamId);
    }
  }, [selectedExamId]);

  const handleMarkChange = (studentId: string, value: string) => {
    if (!gradebookData) return;
    const num = value === "" ? null : parseFloat(value);
    const updated = gradebookData.entries.map((row: any) => {
      if (row.studentId === studentId) {
        return { ...row, marksObtained: num, isAbsent: false };
      }
      return row;
    });
    setGradebookData({ ...gradebookData, entries: updated });
  };

  const handleAbsentToggle = (studentId: string, checked: boolean) => {
    if (!gradebookData) return;
    const updated = gradebookData.entries.map((row: any) => {
      if (row.studentId === studentId) {
        return {
          ...row,
          isAbsent: checked,
          marksObtained: checked ? 0 : row.marksObtained,
        };
      }
      return row;
    });
    setGradebookData({ ...gradebookData, entries: updated });
  };

  const handleRemarksChange = (studentId: string, text: string) => {
    if (!gradebookData) return;
    const updated = gradebookData.entries.map((row: any) => {
      if (row.studentId === studentId) {
        return { ...row, remarks: text };
      }
      return row;
    });
    setGradebookData({ ...gradebookData, entries: updated });
  };

  const handleSaveGradebook = async () => {
    if (!selectedExamId || !gradebookData) return;

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        entries: gradebookData.entries.map((r: any) => ({
          studentId: r.studentId,
          marksObtained: r.isAbsent ? 0 : r.marksObtained,
          isAbsent: r.isAbsent,
          remarks: r.remarks,
        })),
      };

      const res = await fetch(`/api/exams/${selectedExamId}/gradebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save grades");
      }

      setMessage({ type: "success", text: `Successfully saved ${data.savedCount} gradebook records!` });
      fetchGradebook(selectedExamId);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReviewRevaluation = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setReviewingId(requestId);
      const res = await fetch(`/api/revaluation/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewedMarks: reviewedMarks[requestId],
          reviewerRemarks: reviewRemarks[requestId] || (status === "APPROVED" ? "Marks revised upon review." : "Original evaluation verified."),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update review");
      }

      fetchRevaluations();
      if (selectedExamId) fetchGradebook(selectedExamId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const isLocked = selectedExam?.status === "LOCKED" || selectedExam?.status === "ARCHIVED";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="h-6 w-6 text-emerald-600" />
            <span>Faculty Evaluation Gradebook</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Record student exam marks, absent status, and process academic revaluation requests.
          </p>
        </div>

        {selectedExam && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveGradebook}
              disabled={saving || isLocked}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Grades..." : "Save Gradebook"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Exam Selector Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3">
        {exams.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExamId(ex.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 ${
              selectedExamId === ex.id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            <span>{ex.subjectCode}: {ex.title}</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded font-bold uppercase ${
                ex.status === "PUBLISHED"
                  ? "bg-emerald-800 text-emerald-200"
                  : ex.status === "LOCKED"
                  ? "bg-slate-700 text-slate-200"
                  : "bg-amber-700 text-amber-200"
              }`}
            >
              {ex.status}
            </span>
          </button>
        ))}
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

      {/* Active Exam Overview & Grading Progress */}
      {selectedExam && gradebookData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase">Maximum Marks</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {selectedExam.maxMarks}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Passing Mark: {selectedExam.passingMarks}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase">Grading Progress</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {gradebookData.stats?.gradedCount} / {gradebookData.stats?.totalEnrolled}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${gradebookData.stats?.completionPercentage || 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase">Exam Date & Venue</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {selectedExam.date} ({selectedExam.startTime} - {selectedExam.endTime})
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Room: {selectedExam.roomNumber || "Assigned Hall"}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase">Security State</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              {isLocked ? <Lock className="h-4 w-4 text-slate-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              <span>{selectedExam.status}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {isLocked ? "Results locked; edit requires revaluation" : "Editable by mapped faculty"}
            </div>
          </div>
        </div>
      )}

      {/* Gradebook Matrix Table */}
      {selectedExam && gradebookData && (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Enrolled Candidates & Mark Entries</span>
            </h2>
            <div className="text-xs text-slate-400">
              Auto-calculates standard 10-point grades (A+, A, B+, B, C, D, F)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-5 py-3">Candidate Name</th>
                  <th className="px-5 py-3 text-center">Hall Ticket</th>
                  <th className="px-5 py-3 text-center">Absent?</th>
                  <th className="px-5 py-3 text-center">Marks (Max {selectedExam.maxMarks})</th>
                  <th className="px-5 py-3 text-center">Grade Preview</th>
                  <th className="px-5 py-3">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {gradebookData.entries?.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {row.rollNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {row.studentName}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-500">
                      {row.hallTicketNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        disabled={isLocked}
                        onChange={(e) => handleAbsentToggle(row.studentId, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max={selectedExam.maxMarks}
                        step="0.5"
                        disabled={row.isAbsent || isLocked}
                        value={row.marksObtained !== null && row.marksObtained !== undefined ? row.marksObtained : ""}
                        onChange={(e) => handleMarkChange(row.studentId, e.target.value)}
                        placeholder="Enter mark"
                        className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-slate-900 dark:text-white disabled:opacity-40"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold font-mono">
                      {row.isAbsent ? (
                        <span className="text-rose-600">F (ABSENT)</span>
                      ) : row.marksObtained !== null && row.marksObtained !== undefined ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {row.marksObtained >= selectedExam.maxMarks * 0.9
                            ? "A+ (10.0)"
                            : row.marksObtained >= selectedExam.maxMarks * 0.8
                            ? "A (9.0)"
                            : row.marksObtained >= selectedExam.maxMarks * 0.7
                            ? "B+ (8.0)"
                            : row.marksObtained >= selectedExam.maxMarks * 0.6
                            ? "B (7.0)"
                            : row.marksObtained >= selectedExam.maxMarks * 0.5
                            ? "C (6.0)"
                            : row.marksObtained >= selectedExam.passingMarks
                            ? "D (5.0)"
                            : "F (0.0)"}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={row.remarks || ""}
                        onChange={(e) => handleRemarksChange(row.studentId, e.target.value)}
                        placeholder="Optional remarks..."
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Revaluation Petitions Desk */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Student Revaluation Petitions</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and amend marks for contested evaluations with an auditable decision trail.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            {revaluations.filter((r) => r.status === "PENDING").length} Pending
          </span>
        </div>

        {revaluations.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No active revaluation requests recorded for your subjects.
          </div>
        ) : (
          <div className="space-y-4">
            {revaluations.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{rev.studentName} ({rev.rollNumber})</span>
                    <span className="text-slate-400 ml-2">Course: {rev.subjectName} ({rev.subjectCode})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rev.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : rev.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-500 font-semibold mb-1">Student Stated Reason:</div>
                  <p className="text-slate-700 dark:text-slate-300">{rev.reason}</p>
                  <div className="mt-2 text-slate-400 flex items-center gap-4">
                    <span>Recorded Marks: <strong>{rev.currentMarks}</strong></span>
                    {rev.requestedMarks && <span>Claimed: <strong>{rev.requestedMarks}</strong></span>}
                    {rev.reviewedMarks && <span>Awarded: <strong>{rev.reviewedMarks}</strong></span>}
                  </div>
                </div>

                {rev.status === "PENDING" && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <input
                      type="number"
                      placeholder="Revised marks (if approving)"
                      value={reviewedMarks[rev.id] || ""}
                      onChange={(e) =>
                        setReviewedMarks({ ...reviewedMarks, [rev.id]: parseFloat(e.target.value) })
                      }
                      className="w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Reviewer remarks..."
                      value={reviewRemarks[rev.id] || ""}
                      onChange={(e) =>
                        setReviewRemarks({ ...reviewRemarks, [rev.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewRevaluation(rev.id, "APPROVED")}
                        disabled={reviewingId === rev.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewRevaluation(rev.id, "REJECTED")}
                        disabled={reviewingId === rev.id}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
