"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Award,
  ExternalLink,
  Layers,
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface CriteriaItem {
  name: string;
  required: string;
  actual: string;
  passed: boolean;
}

interface EligibilityData {
  isEligible: boolean;
  criteria: CriteriaItem[];
  failureReasons: string[];
}

export function StudentDriveDetail({ driveId }: { driveId: string }) {
  const router = useRouter();
  const [drive, setDrive] = useState<any | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [existingApplication, setExistingApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("https://campussphere.edu/resumes/tirth-resume.pdf");
  const [coverNote, setCoverNote] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDriveDetails();
  }, [driveId]);

  async function fetchDriveDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/placements/drives/${driveId}`);
      const data = await res.json();
      if (data.success) {
        setDrive(data.drive);
        setEligibility(data.eligibility);
        setExistingApplication(data.existingApplication);
      }
    } catch (err) {
      console.error("Failed to load drive details", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/placements/drives/${driveId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeUrl,
          coverNote: coverNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }

      setApplySuccess(true);
      setExistingApplication(data.application);
      setTimeout(() => {
        setApplyModalOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Drive Not Found
        </h2>
        <p className="text-sm text-slate-500">
          The requested recruitment drive could not be retrieved or is in draft status.
        </p>
        <Link
          href="/dashboard/student/placements"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Opportunities</span>
        </Link>
      </div>
    );
  }

  const isEligible = eligibility?.isEligible ?? true;
  const isDeadlinePassed = new Date(drive.applicationDeadline) < new Date();
  const alreadyApplied = !!existingApplication && existingApplication.status !== "WITHDRAWN";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/dashboard/student/placements"
          className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Placement Opportunities</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {drive.companyName} &bull; {drive.role}
        </span>
      </div>

      {/* Main Drive Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={drive.companyLogo}
              alt={drive.companyName}
              className="h-16 w-16 rounded-2xl object-cover border border-slate-100 shadow-sm dark:border-slate-800"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {drive.role}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {drive.employmentType.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-base font-semibold text-slate-700 dark:text-slate-300">
                {drive.companyName}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                  <span>
                    {drive.currency} {drive.packageMin === drive.packageMax ? `${drive.packageMin} LPA` : `${drive.packageMin} - ${drive.packageMax} LPA`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{drive.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA Block */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {alreadyApplied ? (
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-sm">
                  <FileCheck className="h-4 w-4" />
                  <span>Status: {existingApplication.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Applied on {new Date(existingApplication.appliedAt).toLocaleDateString()}
                </p>
                <Link
                  href="/dashboard/student/placements/applications"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <span>Track Pipeline</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : isDeadlinePassed ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                <span>Deadline Passed</span>
              </span>
            ) : isEligible ? (
              <button
                type="button"
                onClick={() => setApplyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all text-sm"
              >
                <FileCheck className="h-4 w-4" />
                <span>Apply to Drive</span>
              </button>
            ) : (
              <div className="text-right">
                <button
                  disabled
                  className="px-6 py-3 rounded-2xl bg-slate-200 text-slate-500 text-sm font-bold cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                >
                  Ineligible to Apply
                </button>
                <p className="mt-1 text-xs text-rose-500 font-medium">
                  Review criteria evaluation below
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Description & Server Eligibility Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Drive Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Role &amp; Opportunity Description
            </h3>
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {drive.description}
            </div>

            {/* Selection Rounds Timeline */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Selection Rounds Process</span>
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {drive.selectionRounds.map((round: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs dark:bg-slate-800 dark:text-slate-200">
                      {idx + 1}. {round}
                    </span>
                    {idx < drive.selectionRounds.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            {drive.requiredSkills.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {drive.requiredSkills.map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium dark:bg-indigo-950/60 dark:text-indigo-300"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Server Eligibility Engine Breakdown */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Eligibility Verification</span>
              </h3>
              {isEligible ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Passed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  Failed
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Calculated dynamically on the server against your official student record. Client manipulations are prevented.
            </p>

            {/* Criteria Breakdown Table */}
            <div className="space-y-2.5 pt-2">
              {eligibility?.criteria.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    c.passed
                      ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40"
                      : "bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40"
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Req: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.required}</span> &bull; You: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.actual}</span>
                    </p>
                  </div>
                  {c.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Failure Explanations */}
            {!isEligible && eligibility && eligibility.failureReasons.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p className="font-bold">Reasons for Ineligibility:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {eligibility.failureReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirm Application
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Applying for {drive.role} at {drive.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {applySuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 dark:bg-emerald-950/50 dark:border-emerald-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                  Application Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Your profile and verified credentials have been transmitted to the placement cell and recruiter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Verified Digital Resume Link
                  </label>
                  <input
                    type="url"
                    required
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Public Google Drive, Dropbox, or Campus Portfolio URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cover Note / Special Highlights (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly state your relevant project experience, algorithmic proficiencies, or certifications..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-600 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-slate-300">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200">Institutional Notice:</p>
                  <p className="mt-0.5 text-[11px]">
                    By submitting, you authorize the placement cell to share your academic scores, attendance history, and aptitude metrics with {drive.companyName}.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    {submitting ? "Submitting..." : "Confirm & Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
