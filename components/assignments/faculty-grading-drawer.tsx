"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  FileText,
  Download,
  X,
  Loader2,
  User,
} from "lucide-react";
import { DemoAssignment } from "@/lib/assignment/demo-assignments";
import { SubmissionRosterItem } from "@/services/assignment.service";

interface Props {
  assignment: DemoAssignment;
  initialRoster: SubmissionRosterItem[];
}

export function FacultyGradingDrawer({ assignment, initialRoster }: Props) {
  const router = useRouter();
  const [roster, setRoster] = useState<SubmissionRosterItem[]>(initialRoster);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected student for evaluation in drawer
  const [selectedStudent, setSelectedStudent] = useState<SubmissionRosterItem | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerSuccess, setDrawerSuccess] = useState<string | null>(null);

  const openGrading = (student: SubmissionRosterItem) => {
    setSelectedStudent(student);
    setMarks(student.marksObtained ?? assignment.maxMarks * 0.85);
    setFeedback(student.feedback ?? "Good implementation and complete solution requirements satisfied.");
    setDrawerError(null);
    setDrawerSuccess(null);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudent.submissionId) return;

    setIsSavingGrade(true);
    setDrawerError(null);

    try {
      if (marks < 0 || marks > assignment.maxMarks) {
        throw new Error(`Marks must be between 0 and ${assignment.maxMarks}.`);
      }

      const res = await fetch(`/api/assignments/submissions/${selectedStudent.submissionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marks: Number(marks),
          feedback: feedback.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to grade submission.");
      }

      setDrawerSuccess(`Grade published: ${marks}/${assignment.maxMarks}`);

      // Update local roster
      setRoster((prev) =>
        prev.map((item) =>
          item.studentId === selectedStudent.studentId
            ? {
                ...item,
                submissionStatus: "GRADED",
                marksObtained: Number(marks),
                feedback: feedback.trim(),
                gradedAt: new Date().toISOString(),
              }
            : item
        )
      );

      router.refresh();
      setTimeout(() => {
        setSelectedStudent(null);
      }, 1000);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : "Grading failed.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const filteredRoster = roster.filter((item) => {
    if (statusFilter !== "ALL" && item.submissionStatus !== statusFilter) return false;
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      return item.studentName.toLowerCase().includes(q) || item.rollNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const gradedCount = roster.filter((r) => r.submissionStatus === "GRADED").length;
  const submittedCount = roster.filter((r) => r.submissionStatus !== "NOT_SUBMITTED").length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/faculty/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments Roster
        </Link>
      </div>

      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
              {assignment.subjectCode} — {assignment.subjectName}
            </span>
            <span className="text-xs text-slate-500 font-medium">Division {assignment.divisionName}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>{submittedCount} / {roster.length} Submitted</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">{gradedCount} Graded</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total Marks: {assignment.maxMarks} • Due on {new Date(assignment.dueDate).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="ALL">All Students ({roster.length})</option>
            <option value="SUBMITTED">Submitted / Pending</option>
            <option value="GRADED">Graded</option>
            <option value="LATE">Late Submissions</option>
            <option value="NOT_SUBMITTED">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5">Student Name</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Submitted At</th>
                <th className="px-5 py-3.5">Marks</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRoster.map((item) => (
                <tr key={item.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {item.rollNumber}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                    {item.studentName}
                  </td>
                  <td className="px-5 py-3.5">
                    {item.submissionStatus === "GRADED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        Graded
                      </span>
                    ) : item.submissionStatus === "LATE" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Late (-{item.latePenaltyApplied}%)
                      </span>
                    ) : item.submissionStatus === "SUBMITTED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                        Not Submitted
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {typeof item.marksObtained === "number" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {item.marksObtained} / {assignment.maxMarks}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {item.submissionStatus !== "NOT_SUBMITTED" ? (
                      <button
                        type="button"
                        onClick={() => openGrading(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors"
                      >
                        {item.submissionStatus === "GRADED" ? "Edit Evaluation" : "Grade Submission"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No submission</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Grading Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evaluate Student Submission</h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.studentName} ({selectedStudent.rollNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{drawerError}</span>
              </div>
            )}

            {drawerSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{drawerSuccess}</span>
              </div>
            )}

            {/* Submission Preview Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Submitted Files &amp; Artifacts</span>
                {selectedStudent.isLate && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Late (-{selectedStudent.latePenaltyApplied}%)
                  </span>
                )}
              </div>

              {selectedStudent.fileName && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-900 dark:text-white truncate">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{selectedStudent.fileName}</span>
                  </div>
                  {selectedStudent.fileUrl && (
                    <a
                      href={selectedStudent.fileUrl}
                      download
                      className="px-2.5 py-1 rounded text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                </div>
              )}

              {selectedStudent.submissionText && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">Student Solution Summary:</div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-line">
                    {selectedStudent.submissionText}
                  </div>
                </div>
              )}

              {selectedStudent.comments && (
                <div className="text-xs text-slate-500 italic">
                  Student Remarks: &ldquo;{selectedStudent.comments}&rdquo;
                </div>
              )}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marks Awarded (Max: {assignment.maxMarks}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={assignment.maxMarks}
                    step={0.5}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">/ {assignment.maxMarks}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Feedback &amp; Review Remarks *
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide constructive feedback, highlighting strong points or areas for improvement..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  {isSavingGrade ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving Evaluation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Grade &amp; Release Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
