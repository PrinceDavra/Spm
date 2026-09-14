"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck,
  UserX,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { MembershipRole, MembershipStatus } from "@prisma/client";

interface MemberItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rollNumber: string;
  departmentName: string;
  semester: number;
  role: MembershipRole;
  status: MembershipStatus;
  appliedAt: string;
  joinedAt?: string | null;
}

interface MembersManagerProps {
  clubId: string;
  clubName: string;
  initialActiveMembers: MemberItem[];
  initialPendingMembers: MemberItem[];
}

export function CoordinatorMembersManager({
  clubId,
  clubName,
  initialActiveMembers,
  initialPendingMembers,
}: MembersManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [activeMembers, setActiveMembers] = useState<MemberItem[]>(initialActiveMembers);
  const [pendingMembers, setPendingMembers] = useState<MemberItem[]>(initialPendingMembers);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Approve action
  const handleApprove = async (member: MemberItem) => {
    setProcessingId(member.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${member.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");

      // Move from pending to active
      setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
      setActiveMembers((prev) => [data.membership, ...prev]);
      setFeedback({ message: `Approved ${member.userName}'s membership.` });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject action
  const handleReject = async (member: MemberItem) => {
    setProcessingId(member.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${member.id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");

      setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
      setFeedback({ message: `Rejected application from ${member.userName}.` });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  // Remove active member
  const handleRemove = async (member: MemberItem) => {
    if (!confirm(`Are you sure you want to remove ${member.userName} from ${clubName}?`)) return;

    setProcessingId(member.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/members/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Removal failed");

      setActiveMembers((prev) => prev.filter((m) => m.id !== member.id));
      setFeedback({ message: `Removed ${member.userName} from active roster.` });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPending = pendingMembers.filter(
    (m) =>
      m.userName.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredActive = activeMembers.filter(
    (m) =>
      m.userName.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <Link
          href="/dashboard/club"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Coordinator Station</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Member Management &bull; {clubName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review incoming membership applications and manage the active student roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            Pending Applications ({pendingMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "active"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            Active Roster ({activeMembers.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by student name, roll number, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Pending Applications Tab */}
      {activeTab === "pending" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-bold text-foreground">
              Incoming Applications ({filteredPending.length})
            </h2>
          </div>

          {filteredPending.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredPending.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{member.userName}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {member.rollNumber}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.departmentName} &bull; Semester {member.semester} &bull; {member.userEmail}
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      Applied on: {new Date(member.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(member)}
                      disabled={processingId === member.id}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(member)}
                      disabled={processingId === member.id}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      {processingId === member.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No pending applications found.
            </div>
          )}
        </div>
      )}

      {/* Active Roster Tab */}
      {activeTab === "active" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-bold text-foreground">
              Active Member Roster ({filteredActive.length})
            </h2>
          </div>

          {filteredActive.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredActive.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{member.userName}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.rollNumber} &bull; {member.departmentName} &bull; Semester {member.semester}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={processingId === member.id}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No active members match your filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
