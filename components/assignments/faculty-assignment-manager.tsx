"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  Upload,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
} from "lucide-react";
import { FacultyAssignmentSummaryItem } from "@/services/assignment.service";
import { AssignmentStatus } from "@prisma/client";

interface Props {
  initialAssignments: FacultyAssignmentSummaryItem[];
  facultyId: string;
  mappedSubjects: Array<{
    id: string;
    code: string;
    name: string;
    divisionId: string;
    divisionName: string;
  }>;
}

export function FacultyAssignmentManager({
  initialAssignments,
  mappedSubjects,
}: Props) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<FacultyAssignmentSummaryItem[]>(initialAssignments);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states for creation
  const [subjectId, setSubjectId] = useState(mappedSubjects[0]?.id || "");
  const [divisionId, setDivisionId] = useState(mappedSubjects[0]?.divisionId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [allowLateSubmission, setAllowLateSubmission] = useState(true);
  const [latePenalty, setLatePenalty] = useState(10);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(["pdf", "docx", "zip"]);
  const [statusToSet, setStatusToSet] = useState<AssignmentStatus>(AssignmentStatus.PUBLISHED);

  const availableExtensions = ["pdf", "docx", "zip", "sql", "py", "java", "cpp", "txt"];

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSubjectId(sId);
    const sub = mappedSubjects.find((s) => s.id === sId);
    if (sub) {
      setDivisionId(sub.divisionId);
    }
  };

  const toggleFileType = (ext: string) => {
    if (selectedFileTypes.includes(ext)) {
      if (selectedFileTypes.length > 1) {
        setSelectedFileTypes(selectedFileTypes.filter((e) => e !== ext));
      }
    } else {
      setSelectedFileTypes([...selectedFileTypes, ext]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (!dueDate) {
        throw new Error("Please specify an assignment due date and time.");
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subjectId,
          divisionId,
          description,
          instructions,
          maxMarks: Number(maxMarks),
          dueDate: new Date(dueDate).toISOString(),
          allowLateSubmission,
          latePenalty: Number(latePenalty),
          allowedFileTypes: selectedFileTypes,
          status: statusToSet,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create assignment.");
      }

      setShowCreateModal(false);
      setActionSuccess(`Assignment "${title}" created successfully!`);
      // Reset form
      setTitle("");
      setDescription("");
      setInstructions("");
      setDueDate("");
      router.refresh();

      // Refresh list
      const listRes = await fetch("/api/assignments");
      const listData = await listRes.json();
      if (listData.assignments) {
        setAssignments(listData.assignments);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Publish failed.");

      setActionSuccess(`"${title}" is now published.`);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: AssignmentStatus.PUBLISHED } : a))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not publish assignment.");
    }
  };

  const handleClose = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Close failed.");

      setActionSuccess(`"${title}" has been closed.`);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: AssignmentStatus.CLOSED } : a))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not close assignment.");
    }
  };

  // KPIs
  const totalSubmissions = assignments.reduce((acc, a) => acc + a.submittedCount, 0);
  const totalPendingGrading = assignments.reduce((acc, a) => acc + a.pendingGradingCount, 0);
  const activeCount = assignments.filter((a) => a.status === AssignmentStatus.PUBLISHED).length;
  const avgSubmissionRate =
    assignments.length > 0
      ? Math.round(assignments.reduce((acc, a) => acc + a.submissionRate, 0) / assignments.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Assignments &amp; Coursework
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Author academic coursework, review student submissions, and release grades.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Coursework</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalSubmissions}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Submissions Received</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalPendingGrading}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Grading</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgSubmissionRate}%</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Submission Rate</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No assignments created yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Click &quot;Create Assignment&quot; to publish your first academic assignment to enrolled students.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
                      {assignment.subjectCode} — {assignment.subjectName}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Division {assignment.divisionName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        assignment.status === AssignmentStatus.PUBLISHED
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : assignment.status === AssignmentStatus.DRAFT
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {assignment.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>•</span>
                    <span>{assignment.maxMarks} Max Marks</span>
                    {assignment.averageMarks !== null && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Class Avg: {assignment.averageMarks}/{assignment.maxMarks}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Submission Progress bar */}
                <div className="w-full md:w-56 space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Submissions</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {assignment.submittedCount} / {assignment.totalEnrolled} ({assignment.submissionRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${assignment.submissionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{assignment.gradedCount} Graded</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {assignment.pendingGradingCount} Pending
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {assignment.status === AssignmentStatus.DRAFT && (
                    <button
                      type="button"
                      onClick={() => handlePublish(assignment.id, assignment.title)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      Publish
                    </button>
                  )}

                  {assignment.status === AssignmentStatus.PUBLISHED && (
                    <button
                      type="button"
                      onClick={() => handleClose(assignment.id, assignment.title)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                    >
                      Close
                    </button>
                  )}

                  <Link
                    href={`/dashboard/faculty/assignments/${assignment.id}/submissions`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                  >
                    View Submissions &amp; Grade
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Create Academic Assignment
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject &amp; Division *
                </label>
                <select
                  value={subjectId}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  required
                >
                  {mappedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} ({s.divisionName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Relational Schema Normalization & BCNF Decomposition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Problem Description / Objectives *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the problem, requirements, and theoretical background..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  required
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Instructions &amp; Rubric Criteria
                </label>
                <textarea
                  rows={3}
                  placeholder="Step-by-step submission instructions, formatting guidelines..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                />
              </div>

              {/* Due Date & Max Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    required
                  />
                </div>
              </div>

              {/* Late Submission Settings */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow-late"
                    checked={allowLateSubmission}
                    onChange={(e) => setAllowLateSubmission(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="allow-late" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Allow late submissions after deadline
                  </label>
                </div>

                {allowLateSubmission && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs text-slate-600 dark:text-slate-400">
                      Late Penalty Deduction (%):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={latePenalty}
                      onChange={(e) => setLatePenalty(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Allowed File Extensions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Allowed Submission File Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableExtensions.map((ext) => (
                    <button
                      type="button"
                      key={ext}
                      onClick={() => toggleFileType(ext)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selectedFileTypes.includes(ext)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }`}
                    >
                      .{ext}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setStatusToSet(AssignmentStatus.DRAFT)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setStatusToSet(AssignmentStatus.PUBLISHED)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
