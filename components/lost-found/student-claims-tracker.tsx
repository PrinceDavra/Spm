"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  FileText,
  Eye,
  Trash2,
} from "lucide-react";
import { ClaimStatus } from "@prisma/client";

interface Claim {
  id: string;
  itemId: string;
  claimStatement: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewerRemarks?: string | null;
}

export function StudentClaimsTracker() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lost-found/claims");
      const data = await res.json();
      if (data.success) {
        setClaims(data.claims || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (claimId: string) => {
    if (!confirm("Are you sure you want to withdraw this ownership claim?")) return;
    setWithdrawingId(claimId);
    try {
      const res = await fetch(`/api/lost-found/claims/${claimId}/withdraw`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchClaims();
      }
    } catch {
      // Graceful
    } finally {
      setWithdrawingId(null);
    }
  };

  const stages = [
    { key: ClaimStatus.PENDING, label: "Submitted" },
    { key: ClaimStatus.UNDER_REVIEW, label: "Under Review" },
    { key: ClaimStatus.VERIFIED, label: "Verified" },
    { key: ClaimStatus.COMPLETED, label: "Handover Complete" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/student/lost-found"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            My Submitted Claims
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor the verification status and administrative review of your ownership claims.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No claims submitted yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            When you recognize an item on the community board and submit an ownership claim, it will appear here.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/student/lost-found"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Browse Items
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isRejected = claim.status === ClaimStatus.REJECTED;
            const isWithdrawn = claim.status === ClaimStatus.WITHDRAWN;
            const currentStageIndex = stages.findIndex((s) => s.key === claim.status);

            return (
              <div
                key={claim.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Claim #{claim.id.slice(-6)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Submitted on {new Date(claim.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {claim.status === ClaimStatus.PENDING && (
                      <button
                        onClick={() => handleWithdraw(claim.id)}
                        disabled={withdrawingId === claim.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800"
                      >
                        <Trash2 className="h-3 w-3" />
                        Withdraw
                      </button>
                    )}
                    <Link
                      href={`/dashboard/student/lost-found/${claim.itemId}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Eye className="h-3 w-3" />
                      View Item
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  &ldquo;{claim.claimStatement}&rdquo;
                </p>

                {/* Progress Stepper */}
                {isRejected ? (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>Claim Rejected. {claim.reviewerRemarks || "The submitted proof did not match records held by campus administration."}</span>
                  </div>
                ) : isWithdrawn ? (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>You withdrew this ownership claim.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {stages.map((stg, idx) => {
                      const isComplete = currentStageIndex >= idx;
                      const isCurrent = currentStageIndex === idx;

                      return (
                        <div key={stg.key} className="text-center space-y-1">
                          <div
                            className={`h-2 rounded-full transition-colors ${
                              isComplete
                                ? "bg-emerald-500"
                                : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-semibold block ${
                              isCurrent
                                ? "text-blue-600 font-bold dark:text-blue-400"
                                : isComplete
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-slate-400"
                            }`}
                          >
                            {stg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {claim.reviewerRemarks && !isRejected && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900 dark:border-blue-950 dark:bg-blue-950/20 dark:text-blue-300">
                    <span className="font-bold">Staff Review Remarks:</span> {claim.reviewerRemarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
