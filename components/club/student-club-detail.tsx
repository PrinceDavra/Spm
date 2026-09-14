"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Award,
  Loader2,
  Mail,
  Phone,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { ClubCategory, ClubStatus, MembershipStatus, MembershipRole } from "@prisma/client";

interface ClubDetailProps {
  club: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    category: ClubCategory;
    status: ClubStatus;
    departmentName?: string | null;
    facultyAdvisorName?: string | null;
    coordinatorName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    logoUrl: string;
    bannerUrl: string;
    establishedYear: number;
    isRecruiting: boolean;
    memberCount: number;
    pendingCount: number;
    engagementScore: number;
    engagementTier: string;
    activeMembers: Array<{
      id: string;
      userName: string;
      rollNumber: string;
      departmentName: string;
      role: MembershipRole;
      status: MembershipStatus;
      joinedAt?: string | null;
    }>;
    activities: Array<{
      id: string;
      title: string;
      description: string;
      activityDate: string;
      activityType: string;
      venue?: string | null;
    }>;
    upcomingEvents: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      category: string;
      status: string;
      venue: string;
      startDateTime: string;
      endDateTime: string;
      capacity: number;
      seatsRemaining: number;
      posterUrl?: string | null;
    }>;
    isCoordinator: boolean;
    userMembership?: {
      id: string;
      role: string;
      status: MembershipStatus;
      appliedAt: string;
      joinedAt?: string | null;
    } | null;
  };
  currentUserId: string;
}

export function StudentClubDetail({ club, currentUserId }: ClubDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"about" | "activities" | "events" | "members">("about");
  const [userMembership, setUserMembership] = useState(club.userMembership);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const isMember =
    userMembership?.status === MembershipStatus.ACTIVE ||
    userMembership?.status === MembershipStatus.APPROVED;
  const isPending = userMembership?.status === MembershipStatus.PENDING;

  // Handle Join Request
  const handleJoinClub = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: statement }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit membership application");

      setUserMembership(data.membership);
      setIsJoinModalOpen(false);
      setFeedback({ message: "Membership application submitted! Coordinator will review soon." });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Submission failed", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Leave Club
  const handleLeaveClub = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${club.id}/leave`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to leave club");

      setUserMembership(null);
      setIsLeaveModalOpen(false);
      setFeedback({ message: "You have left the organization." });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Operation failed", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/student/clubs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Campus Clubs</span>
        </Link>
      </div>

      {/* Banner & Header Card */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="relative h-48 sm:h-64 w-full bg-muted">
          <img
            src={club.bannerUrl}
            alt={club.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
              Est. {club.establishedYear}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>{club.engagementScore}/100 {club.engagementTier}</span>
            </span>
          </div>

          {/* Floating Logo */}
          <div className="absolute -bottom-6 left-6 sm:left-8">
            <img
              src={club.logoUrl}
              alt={club.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-background shadow-xl bg-card"
            />
          </div>
        </div>

        {/* Header Details */}
        <div className="p-6 sm:p-8 pt-10 sm:pt-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {club.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {club.category}
              </span>
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl">
              {club.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              {club.departmentName && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {club.departmentName}
                </span>
              )}
              {club.coordinatorName && (
                <span>Coordinator: <strong className="text-foreground">{club.coordinatorName}</strong></span>
              )}
              {club.facultyAdvisorName && (
                <span>Advisor: <strong className="text-foreground">{club.facultyAdvisorName}</strong></span>
              )}
            </div>
          </div>

          {/* Action Button & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {club.isCoordinator && (
              <Link
                href="/dashboard/club"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm text-center"
              >
                Coordinator Station
              </Link>
            )}

            {isMember ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Active Member</span>
                </div>
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-rose-600 hover:border-rose-200 transition"
                >
                  Leave
                </button>
              </div>
            ) : isPending ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                  <Clock className="h-4 w-4" />
                  <span>Request Pending Approval</span>
                </div>
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-3 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-rose-600 hover:border-rose-200 transition"
                >
                  Cancel
                </button>
              </div>
            ) : club.status === ClubStatus.SUSPENDED ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                <ShieldAlert className="h-4 w-4" />
                <span>Recruitment Suspended</span>
              </div>
            ) : (
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition shadow-sm"
              >
                Join Club
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 sm:mx-8 mb-6 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              feedback.isError
                ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
              &times;
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-t border-border px-6 sm:px-8 gap-6 overflow-x-auto">
          {[
            { key: "about", label: "About Organization" },
            { key: "activities", label: `Activities (${club.activities.length})` },
            { key: "events", label: `Upcoming Events (${club.upcomingEvents.length})` },
            { key: "members", label: `Members (${club.memberCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "about" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">About the Organization</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
              {club.description}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Quick Facts
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-bold text-foreground">{club.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Active Roster</span>
                  <span className="font-bold text-foreground">{club.memberCount} members</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Recruitment Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {club.isRecruiting ? "Open for Applicants" : "Closed"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-mono text-primary truncate max-w-[150px]">
                    {club.contactEmail || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Leadership
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">Faculty Advisor</div>
                  <div className="font-bold text-foreground mt-0.5">{club.facultyAdvisorName || "Not Assigned"}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase">Student Coordinator</div>
                  <div className="font-bold text-foreground mt-0.5">{club.coordinatorName || "Not Assigned"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === "activities" && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Club Activities &amp; Sessions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Workshops, team practice, weekly sprints, and community meetings.
            </p>
          </div>

          {club.activities.length > 0 ? (
            <div className="space-y-3">
              {club.activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {act.activityType}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{act.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{act.description}</p>
                    {act.venue && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span>{act.venue}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-foreground">
                      {new Date(act.activityDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(act.activityDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No recent club activities recorded. Check back soon!
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events Tab (Integrated with Phase 8) */}
      {activeTab === "events" && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Linked Campus Events</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official campus hackathons, symposiums, and tournaments organized by {club.name}.
            </p>
          </div>

          {club.upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {club.upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-xl border border-border bg-muted/20 p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">{evt.category}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {evt.seatsRemaining} seats remaining
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{evt.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{evt.summary}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{evt.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <span className="text-xs text-muted-foreground">
                      {new Date(evt.startDateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    <Link
                      href={`/dashboard/student/events/${evt.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>View &amp; Register</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No upcoming public events scheduled by this club right now.
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground">Club Roster</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active student innovators and leaders belonging to this organization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {club.activeMembers.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {m.userName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-foreground truncate">{m.userName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.rollNumber} &bull; {m.departmentName}</div>
                  <div className="text-[10px] font-semibold text-primary mt-0.5">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Club Modal Dialog */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Apply to Join {club.name}</h3>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Joining this organization grants you access to internal workshops, hackathon training tracks,
              and project teams.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Statement of Interest / Skills (Optional)
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Share relevant programming languages, interests, or prior projects..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setIsJoinModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClub}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition inline-flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Club Modal Dialog */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-foreground">
                {isMember ? "Leave Organization" : "Cancel Application"}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to {isMember ? "leave" : "withdraw your application for"} {club.name}?
              You can re-apply in the future when recruitment is open.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition"
              >
                Keep Membership
              </button>
              <button
                onClick={handleLeaveClub}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
