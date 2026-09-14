"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Settings,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface CoordinatorStationProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    designation?: string;
  };
  club: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    category: string;
    status: string;
    logoUrl: string;
    bannerUrl: string;
    memberCount: number;
    pendingCount: number;
    upcomingEventsCount: number;
    engagementScore: number;
    engagementTier: string;
    activities: any[];
    upcomingEvents: any[];
    pendingMembers: any[];
  } | null;
}

export function CoordinatorClubStation({ user, club }: CoordinatorStationProps) {
  if (!club) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="text-lg font-bold text-foreground">No Club Assigned</h2>
        <p className="text-xs text-muted-foreground">
          You are authenticated with coordinator privileges, but no student organization has been
          mapped to your coordinator identity yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Command Header */}
      <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-rose-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-200 border border-rose-400/30 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Executive Station &bull; {club.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Command Station &bull; {user.firstName} {user.lastName}
          </h1>

          <p className="text-sm text-rose-100/80 leading-relaxed">
            Manage membership admissions, schedule technical sessions &amp; workshops, and coordinate
            campus-wide competitive events.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Members */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Active Members</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{club.memberCount}</div>
          <div className="text-[11px] text-muted-foreground">Verified student roster</div>
        </div>

        {/* Pending Requests */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Requests
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {club.pendingCount}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {club.pendingCount > 0 ? "Requires review & approval" : "All applications reviewed"}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Events</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{club.upcomingEventsCount}</div>
          <div className="text-[11px] text-muted-foreground">Linked Phase 8 events</div>
        </div>

        {/* Activities */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Activities</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">{club.activities.length}</div>
          <div className="text-[11px] text-muted-foreground">Internal club sessions</div>
        </div>

        {/* Engagement Score */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Engagement</span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {club.engagementScore}%
          </div>
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {club.engagementTier} Tier Index
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/club/members"
          className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Member Management
              </div>
              <div className="text-xs text-muted-foreground">
                Approve requests &bull; Manage roles
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/club/activities"
          className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Club Activities
              </div>
              <div className="text-xs text-muted-foreground">
                Schedule workshops &amp; lab sessions
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/club/events"
          className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Organize Campus Event
              </div>
              <div className="text-xs text-muted-foreground">
                Host hackathons &amp; tournaments (Phase 8)
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Pending Applications Section */}
      {club.pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-5 w-5" />
              <h2 className="text-base font-bold">
                {club.pendingMembers.length} Applications Awaiting Review
              </h2>
            </div>
            <Link
              href="/dashboard/club/members"
              className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Go to Membership Review</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {club.pendingMembers.slice(0, 3).map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-amber-200/80 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{m.userName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.rollNumber} &bull; {m.departmentName}
                  </div>
                </div>
                <Link
                  href="/dashboard/club/members"
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Club Preview */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Public Student Showcase</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              How students see your organization in the campus discovery directory.
            </p>
          </div>
          <Link
            href={`/dashboard/student/clubs/${club.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Open Public View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={club.logoUrl}
              alt={club.name}
              className="w-12 h-12 rounded-xl object-cover border border-border"
            />
            <div>
              <div className="text-sm font-bold text-foreground">{club.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{club.shortDescription}</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            Category: <span className="font-bold text-foreground">{club.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
