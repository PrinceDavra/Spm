"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  ArrowRight,
  ExternalLink,
  History,
  Trash2,
  ChevronRight,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

interface StatusHistoryItem {
  id: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changerName: string;
  remarks: string;
  createdAt: string;
}

interface ApplicationItem {
  id: string;
  driveId: string;
  driveTitle: string;
  companyName: string;
  companyLogo: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  remarks: string;
  resumeUrl: string;
  statusHistory: StatusHistoryItem[];
}

const PIPELINE_STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: ApplicationStatus.APPLIED, label: "Applied" },
  { status: ApplicationStatus.SHORTLISTED, label: "Shortlisted" },
  { status: ApplicationStatus.ASSESSMENT, label: "Assessment" },
  { status: ApplicationStatus.INTERVIEW, label: "Interview" },
  { status: ApplicationStatus.OFFERED, label: "Offered" },
];

export function StudentApplicationTracker() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppForHistory, setSelectedAppForHistory] = useState<ApplicationItem | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/placements/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmWithdraw() {
    if (!withdrawingId) return;
    setActionError("");

    try {
      const res = await fetch(`/api/placements/applications/${withdrawingId}/withdraw`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to withdraw application");
      }

      setWithdrawModalOpen(false);
      setWithdrawingId(null);
      await fetchApplications();
    } catch (err: any) {
      setActionError(err.message || "Failed to withdraw");
    }
  }

  function getStageIndex(status: ApplicationStatus): number {
    switch (status) {
      case ApplicationStatus.APPLIED:
        return 0;
      case ApplicationStatus.SHORTLISTED:
        return 1;
      case ApplicationStatus.ASSESSMENT:
        return 2;
      case ApplicationStatus.INTERVIEW:
        return 3;
      case ApplicationStatus.SELECTED:
      case ApplicationStatus.OFFERED:
        return 4;
      default:
        return -1;
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 mb-3">
            <FileCheck className="h-3.5 w-3.5" />
            <span>Recruitment Pipeline Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Placement Applications
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            Track official interview shortlists, assessment invites, offers, and verified status updates from the placement cell.
          </p>
        </div>

        <Link
          href="/dashboard/student/placements"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Explore More Drives</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Active Applications Yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            You haven't applied to any campus placement drives yet. Check the opportunity hub to find roles matching your criteria.
          </p>
          <Link
            href="/dashboard/student/placements"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          >
            <span>Discover Drives</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const currentStageIdx = getStageIndex(app.status);
            const isTerminalNegative =
              app.status === ApplicationStatus.REJECTED ||
              app.status === ApplicationStatus.WITHDRAWN;
            const canWithdraw =
              app.status === ApplicationStatus.APPLIED ||
              app.status === ApplicationStatus.SHORTLISTED;

            return (
              <div
                key={app.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 hover:border-slate-300 transition-all"
              >
                {/* Header: Company, Role, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={app.companyLogo}
                      alt={app.companyName}
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                    />
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {app.driveTitle}
                      </h3>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {app.companyName}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applied: {new Date(app.appliedAt).toLocaleDateString()} &bull; Last updated: {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {app.status === ApplicationStatus.OFFERED || app.status === ApplicationStatus.SELECTED ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Offered / Selected</span>
                      </span>
                    ) : app.status === ApplicationStatus.REJECTED ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Not Shortlisted</span>
                      </span>
                    ) : app.status === ApplicationStatus.WITHDRAWN ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        <span>Withdrawn</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{app.status}</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedAppForHistory(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <History className="h-3.5 w-3.5 text-slate-400" />
                      <span>History</span>
                    </button>

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawingId(app.id);
                          setWithdrawModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Withdraw</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Recruitment Pipeline Stepper */}
                {!isTerminalNegative ? (
                  <div className="pt-2">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-100 dark:bg-slate-800 -z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 -z-0"
                        style={{
                          width: `${(currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                        }}
                      />

                      {/* Stage Nodes */}
                      {PIPELINE_STAGES.map((stage, idx) => {
                        const isPassed = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div
                            key={stage.status}
                            className="relative z-10 flex flex-col items-center"
                          >
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                                isPassed
                                  ? "bg-indigo-600 text-white shadow-indigo-600/30"
                                  : isCurrent
                                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50"
                                  : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {isPassed ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`mt-2 text-xs font-semibold ${
                                isCurrent
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : isPassed
                                  ? "text-slate-900 dark:text-slate-200"
                                  : "text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-950/40 dark:border-slate-800 flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Application marked as <strong>{app.status}</strong>. Please check your transition history for official notes and reasoning from the Placement Cell.
                    </p>
                  </div>
                )}

                {/* Latest Officer Remarks */}
                {app.remarks && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-950/50 dark:border-slate-800/80 text-xs flex items-start gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Cell Remarks:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 italic">
                      "{app.remarks}"
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status History Modal */}
      {selectedAppForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Application Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAppForHistory.companyName} &bull; {selectedAppForHistory.driveTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppForHistory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {selectedAppForHistory.statusHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative pl-6 pb-4 border-l-2 border-indigo-200 dark:border-indigo-900 last:pb-0">
                  <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-indigo-600" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Transition to {item.newStatus}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Updated by: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.changerName}</span>
                    </p>
                    {item.remarks && (
                      <p className="text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg mt-1 border border-slate-100 dark:border-slate-800">
                        "{item.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedAppForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center dark:bg-rose-950/60 dark:text-rose-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Withdraw Application?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to withdraw your candidacy? Your status will be marked as Withdrawn and the recruiter will be notified.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setWithdrawingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
