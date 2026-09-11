"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Award,
  Loader2,
  X,
  FileCode,
} from "lucide-react";
import { DemoAssignment, DemoSubmission } from "@/lib/assignment/demo-assignments";

interface Props {
  assignment: DemoAssignment;
  initialSubmission?: DemoSubmission;
  urgencyText: string;
  isUrgent: boolean;
  isOverdue: boolean;
  canSubmit: boolean;
}

export function StudentAssignmentDetail({
  assignment,
  initialSubmission,
  urgencyText,
  isUrgent,
  isOverdue,
  canSubmit,
}: Props) {
  const router = useRouter();
  const [submission, setSubmission] = useState<DemoSubmission | undefined>(initialSubmission);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size
      if (file.size > assignment.maxFileSize) {
        const maxMb = (assignment.maxFileSize / (1024 * 1024)).toFixed(1);
        setErrorMsg(`File size exceeds maximum permitted limit of ${maxMb}MB.`);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > assignment.maxFileSize) {
        const maxMb = (assignment.maxFileSize / (1024 * 1024)).toFixed(1);
        setErrorMsg(`File size exceeds maximum permitted limit of ${maxMb}MB.`);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const executeSubmission = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;
      let fileType = "";

      // 1. Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("allowedTypes", assignment.allowedFileTypes.join(","));

        const uploadRes = await fetch("/api/assignments/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.message || "Failed to upload file.");
        }

        fileUrl = uploadData.file.fileUrl;
        fileName = uploadData.file.fileName;
        fileSize = uploadData.file.fileSize;
        fileType = uploadData.file.fileType;
      }

      // 2. Submit to assignment
      const submitRes = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: fileUrl || (submission?.fileUrl ?? undefined),
          fileName: fileName || (submission?.fileName ?? undefined),
          fileSize: fileSize || (submission?.fileSize ?? undefined),
          fileType: fileType || (submission?.fileType ?? undefined),
          submissionText: submissionText.trim() || undefined,
          comments: comments.trim() || undefined,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.message || "Submission failed.");
      }

      setSubmission(submitData.submission);
      setIsResubmitting(false);
      setSelectedFile(null);
      setSubmissionText("");
      setComments("");
      setSuccessMsg(submitData.message || "Work successfully submitted!");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadySubmitted = !!submission && !isResubmitting;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/dashboard/student/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments Hub
        </Link>
      </div>

      {/* Assignment Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              {assignment.subjectCode} — {assignment.subjectName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Division: {assignment.divisionName} (Sem {assignment.semester})
            </span>
          </div>

          {/* Urgency Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isOverdue
                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                : isUrgent
                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900"
                : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {urgencyText}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {assignment.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Course Instructor: <span className="font-semibold text-slate-900 dark:text-white">{assignment.facultyName}</span>
          </p>
        </div>

        {/* Key Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <div className="text-slate-500 dark:text-slate-400">Total Marks</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{assignment.maxMarks} Marks</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Due Date</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Late Submissions</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {assignment.allowLateSubmission ? `Permitted (-${assignment.latePenalty}%)` : "Disabled"}
            </div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Allowed Formats</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 uppercase">
              {assignment.allowedFileTypes.join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2-Column Work Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Problem Statement & Instructions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Description */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Overview &amp; Problem Statement
            </h2>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {assignment.description}
            </div>
          </div>

          {/* Detailed Instructions */}
          {assignment.instructions && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600" />
                Submission Guidelines &amp; Criteria
              </h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {assignment.instructions}
              </div>
            </div>
          )}

          {/* Reference Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                Course Resources &amp; Attachments
              </h2>
              <div className="space-y-2">
                {assignment.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{att.fileName}</div>
                        <div className="text-xs text-slate-500">{(att.fileSize / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                    <a
                      href={att.fileUrl}
                      download
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Submission Station (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Graded Card */}
          {submission && submission.status === "GRADED" && (
            <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                  <Award className="w-5 h-5 text-emerald-600" />
                  Graded Submission
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                  {submission.marksObtained} / {assignment.maxMarks}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/50 space-y-2">
                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Faculty Evaluation Feedback:</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 italic">
                  &ldquo;{submission.feedback || "Good work. Completed requirements satisfied."}&rdquo;
                </div>
                {submission.gradedAt && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    Evaluated on {new Date(submission.gradedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submission Station Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                Submission Station
              </span>
              {submission && (
                <span className="text-xs font-normal text-slate-500">v{submission.version}</span>
              )}
            </h2>

            {/* Already Submitted View */}
            {isAlreadySubmitted ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Submission Status</span>
                    {submission.isLate ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Late Submission (-{submission.latePenaltyApplied}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Submitted On-Time
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {submission.fileName || "Submitted Solution Document"}
                  </div>

                  {submission.submissionText && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      {submission.submissionText}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400">
                    Recorded on {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>

                {/* Resubmission Trigger if not graded */}
                {submission.status !== "GRADED" && canSubmit && (
                  <button
                    type="button"
                    onClick={() => setIsResubmitting(true)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
                  >
                    Resubmit Revised Solution
                  </button>
                )}
              </div>
            ) : !canSubmit ? (
              /* Submissions Closed */
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm space-y-1 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Submissions Closed
                </div>
                <p className="text-xs">
                  The deadline for this assignment has expired, and late submissions are not accepted.
                </p>
              </div>
            ) : (
              /* Active Upload & Submission Form */
              <div className="space-y-4">
                {isResubmitting && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium dark:bg-amber-950/50 dark:text-amber-300">
                    <span>Resubmitting will supersede previous submission (v{submission?.version}).</span>
                    <button
                      type="button"
                      onClick={() => setIsResubmitting(false)}
                      className="text-amber-600 hover:text-amber-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/30"
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={assignment.allowedFileTypes.map((t) => `.${t}`).join(",")}
                  />
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drag file here
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Allowed: {assignment.allowedFileTypes.join(", ").toUpperCase()} (Max {(assignment.maxFileSize / (1024 * 1024)).toFixed(0)}MB)
                  </div>
                </div>

                {/* Selected File Pill */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-900 dark:text-indigo-200 truncate">
                      <FileText className="w-4 h-4 shrink-0 text-indigo-600" />
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="text-slate-400 shrink-0">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded text-indigo-500 hover:text-indigo-800 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Submission Text Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Solution Notes / Verification Comments
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide a brief summary, deployment links, or repository notes..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  />
                </div>

                {/* Ready to submit CTA */}
                <button
                  type="button"
                  disabled={isSubmitting || (!selectedFile && !submissionText.trim())}
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Work...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Ready to submit?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please review your attached files and solution summary. Once submitted, your work will be timestamped and sent to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{assignment.facultyName}</span> for grading.
            </p>

            {isOverdue && assignment.allowLateSubmission && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900">
                Notice: The deadline has passed. This will be marked as a LATE submission with a {assignment.latePenalty}% penalty applied.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Confirm &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
