"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Eye,
  MessageSquare,
  FileCheck,
  Lock,
} from "lucide-react";
import { ClaimStatus } from "@prisma/client";

interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  claimantName?: string;
  claimantEmail?: string;
  claimantRoll?: string;
  claimStatement: string;
  verificationAnswers: string;
  status: ClaimStatus;
  submittedAt: string;
  reviewerRemarks?: string | null;
}

export function AdminClaimsDesk() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewAction, setReviewAction] = useState<ClaimStatus | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? "/api/lost-found/claims"
          : `/api/lost-found/claims?status=${statusFilter}`;
      const res = await fetch(url);
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

  const handleReviewSubmit = async () => {
    if (!selectedClaim || !reviewAction) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lost-found/claims/${selectedClaim.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewAction, reviewerRemarks: remarks }),
      });
      if (res.ok) {
        setSelectedClaim(null);
        setReviewAction(null);
        setRemarks("");
        await fetchClaims();
      }
    } catch {
      // Graceful
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoverSubmit = async () => {
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lost-found/${selectedClaim.itemId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: selectedClaim.id, handoverNotes }),
      });
      if (res.ok) {
        setHandoverModalOpen(false);
        setSelectedClaim(null);
        setHandoverNotes("");
        await fetchClaims();
      }
    } catch {
      // Graceful
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin/lost-found"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Governance
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            Claims Verification Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit proof of ownership submitted by claimants, inspect non-public verification answers, and approve authentic recoveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="ALL">All Claim Statuses</option>
            <option value={ClaimStatus.PENDING}>Pending Review</option>
            <option value={ClaimStatus.UNDER_REVIEW}>Under Review</option>
            <option value={ClaimStatus.VERIFIED}>Verified / Awaiting Handover</option>
            <option value={ClaimStatus.COMPLETED}>Completed</option>
            <option value={ClaimStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-500" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No claims pending action
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            All submitted ownership claims have been audited and verified.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    Claim #{claim.id.slice(-6)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      claim.status === ClaimStatus.VERIFIED || claim.status === ClaimStatus.COMPLETED
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : claim.status === ClaimStatus.REJECTED
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {claim.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Claimant: <strong className="text-slate-800 dark:text-slate-200">{claim.claimantName || "Student"}</strong> ({claim.claimantRoll || "CS-2024"})
                </div>
              </div>

              {/* Statements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Claim Statement:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {claim.claimStatement}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Hidden Verification Answers:
                  </span>
                  <p className="text-xs text-slate-900 dark:text-white font-medium mt-0.5 whitespace-pre-line">
                    {claim.verificationAnswers}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <Link
                  href={`/dashboard/student/lost-found/${claim.itemId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect Reported Item
                </Link>

                <div className="flex items-center gap-2">
                  {claim.status !== ClaimStatus.COMPLETED && claim.status !== ClaimStatus.VERIFIED && (
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setReviewAction(ClaimStatus.VERIFIED);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verify Claim
                    </button>
                  )}

                  {claim.status === ClaimStatus.VERIFIED && (
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setHandoverModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      Confirm Handover
                    </button>
                  )}

                  {claim.status !== ClaimStatus.REJECTED && claim.status !== ClaimStatus.COMPLETED && (
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setReviewAction(ClaimStatus.REJECTED);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && reviewAction && !handoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {reviewAction === ClaimStatus.VERIFIED ? "Verify Ownership Claim" : "Reject Claim"}
            </h3>
            <p className="text-xs text-slate-500">
              {reviewAction === ClaimStatus.VERIFIED
                ? "This will verify the claimant's proof and prepare the item for handover."
                : "This will notify the claimant that their proof did not meet the required identification criteria."}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Staff Review Remarks
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Identifying green mark and serial snippet verified with physical item held at security desk."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClaim(null);
                  setReviewAction(null);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={submitting}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow ${
                  reviewAction === ClaimStatus.VERIFIED ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Processing..." : "Confirm Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {selectedClaim && handoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Confirm Item Handover
            </h3>
            <p className="text-xs text-slate-500">
              Confirm that the physical item has been collected by the verified claimant. This will permanently mark the case as RESOLVED.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Handover Notes / Verification Signature
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Handed over in person at Central Security Office. Student ID card checked."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClaim(null);
                  setHandoverModalOpen(false);
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHandoverSubmit}
                disabled={submitting}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-700"
              >
                {submitting ? "Completing Handover..." : "Complete Handover & Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
