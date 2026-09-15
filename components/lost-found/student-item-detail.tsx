"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Tag,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { LostFoundType, LostFoundStatus, ClaimStatus } from "@prisma/client";

interface ItemDetailProps {
  item: {
    id: string;
    referenceNumber: string;
    type: LostFoundType;
    title: string;
    description: string;
    category: string;
    status: LostFoundStatus;
    location: string;
    dateLostFound: string;
    timeLostFound?: string | null;
    imageUrl?: string | null;
    contactPreference: string;
    reporterId: string;
    reporterName?: string;
    createdAt: string;
  };
  claimsCount: number;
  potentialMatches: {
    id: string;
    lostItemId: string;
    foundItemId: string;
    matchScore: number;
    matchingFactors: string[];
    foundItem?: { id: string; title: string; location: string };
    lostItem?: { id: string; title: string; location: string };
  }[];
  currentUserId?: string;
}

export function StudentItemDetail({
  item,
  claimsCount,
  potentialMatches,
  currentUserId,
}: ItemDetailProps) {
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimStatement, setClaimStatement] = useState("");
  const [verificationAnswers, setVerificationAnswers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isLost = item.type === LostFoundType.LOST;
  const isOwner = currentUserId === item.reporterId;
  const isResolved = item.status === LostFoundStatus.RESOLVED;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/lost-found/${item.id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimStatement, verificationAnswers }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit claim");
      }

      setClaimSuccess(true);
      setTimeout(() => {
        setClaimModalOpen(false);
      }, 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/dashboard/student/lost-found"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community Feed
        </Link>
      </div>

      {/* Main Item Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Media / Photo Showcase */}
          <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6 text-center text-slate-400 dark:from-slate-800 dark:to-slate-900">
                <Tag className="h-16 w-16 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <span className="text-xs text-slate-500">No photograph provided</span>
                <span className="text-[11px] text-slate-400">Described in text below</span>
              </div>
            )}

            {/* Type & Status pills */}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm text-white ${
                  isLost ? "bg-rose-500" : "bg-emerald-500"
                }`}
              >
                {item.type}
              </span>
              <span className="rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                {item.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="absolute right-3 top-3">
              <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono font-bold text-white backdrop-blur-sm">
                {item.referenceNumber}
              </span>
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Tag className="h-3 w-3" />
                {item.category.replace(/_/g, " ")}
              </div>

              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {item.title}
              </h1>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold">Location:</span>
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold">Date Reported:</span>
                  <span>{new Date(item.dateLostFound).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {item.timeLostFound && (
                    <span className="flex items-center gap-1 text-slate-400">
                      • <Clock className="h-3.5 w-3.5" /> {item.timeLostFound}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="font-semibold">Contact Preference:</span>
                  <span>{item.contactPreference.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {claimsCount} claim{claimsCount === 1 ? "" : "s"} submitted
              </span>

              {isResolved ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Case Resolved
                </div>
              ) : isOwner ? (
                <div className="text-xs font-semibold text-slate-500 italic">
                  This is your authored report
                </div>
              ) : (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  <FileCheck className="h-4 w-4" />
                  Claim This Item
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Potential Matches Section */}
      {potentialMatches && potentialMatches.length > 0 && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-sky-50/50 p-6 dark:border-indigo-950/50 dark:bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Automated Potential Matches Found ({potentialMatches.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  CampusSphere algorithm identified opposite reports matching category, location, and keywords.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              Institutional AI Filter
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {potentialMatches.map((match) => {
              const matchedId =
                item.type === LostFoundType.LOST ? match.foundItemId : match.lostItemId;

              return (
                <div
                  key={match.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Match Confidence
                      </span>
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {match.matchScore}% Match
                      </span>
                    </div>

                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {match.matchingFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Link
                      href={`/dashboard/student/lost-found/${matchedId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Inspect Match <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Submit Ownership Claim
              </div>
              <button
                onClick={() => setClaimModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {claimSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Claim Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Campus staff will review your verification details. You will receive a notification upon verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 leading-relaxed">
                  <strong>Verification Requirement:</strong> To protect campus belongings, provide non-public identifying details (e.g. brand serial snippets, unique scratches, exact contents) that only the genuine owner would know.
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Claim Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Briefly state when and where you lost this item and why it belongs to you..."
                    value={claimStatement}
                    onChange={(e) => setClaimStatement(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hidden Verification Proof / Secret Identifiers <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide specific proof: exact brand/model, scratches, stickers, internal pocket contents, passwords or serial hints..."
                    value={verificationAnswers}
                    onChange={(e) => setVerificationAnswers(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting Claim..." : "Submit Proof & Claim"}
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
