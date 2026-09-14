"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MapPin,
  Building2,
} from "lucide-react";
import { MembershipStatus } from "@prisma/client";

interface UserClubSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  logoUrl: string;
  bannerUrl: string;
  memberCount: number;
  upcomingEventsCount: number;
  role: string;
  status: MembershipStatus;
  joinedAt?: string | null;
  appliedAt: string;
  latestActivity?: {
    id: string;
    title: string;
    activityDate: string;
    activityType: string;
  } | null;
}

interface StudentMyClubsProps {
  activeClubs: UserClubSummary[];
  pendingClubs: UserClubSummary[];
  previousClubs: UserClubSummary[];
}

export function StudentMyClubs({
  activeClubs,
  pendingClubs,
  previousClubs,
}: StudentMyClubsProps) {
  const [tab, setTab] = useState<"active" | "pending" | "previous">("active");

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>My Extracurricular Affiliations</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            My Campus Clubs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View organizations you belong to, track application progress, and manage memberships.
          </p>
        </div>

        <Link
          href="/dashboard/student/clubs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-sm font-bold transition shadow-sm self-start sm:self-auto"
        >
          <span>Explore All Clubs</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === "active"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Memberships ({activeClubs.length})
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === "pending"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Applications ({pendingClubs.length})
        </button>
        {previousClubs.length > 0 && (
          <button
            onClick={() => setTab("previous")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === "previous"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Past Clubs ({previousClubs.length})
          </button>
        )}
      </div>

      {/* Active Clubs */}
      {tab === "active" && (
        <>
          {activeClubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeClubs.map((club) => (
                <div
                  key={club.id}
                  className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    <div className="relative h-28 w-full bg-muted">
                      <img
                        src={club.bannerUrl}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute -bottom-3 left-4">
                        <img
                          src={club.logoUrl}
                          alt={club.name}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-background shadow-md bg-card"
                        />
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{club.role}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 pt-5 space-y-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {club.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {club.shortDescription}
                      </p>

                      {club.latestActivity && (
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] mt-2 space-y-0.5">
                          <div className="font-semibold text-foreground truncate">
                            Next: {club.latestActivity.title}
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(club.latestActivity.activityDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mb-3">
                      <span>{club.memberCount} members</span>
                      <span>{club.upcomingEventsCount} events</span>
                    </div>

                    <Link
                      href={`/dashboard/student/clubs/${club.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
                    >
                      <span>Club Station</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">You haven&apos;t joined any clubs yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore student organizations across engineering, arts, robotics, and sports to get involved.
              </p>
              <Link
                href="/dashboard/student/clubs"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm"
              >
                <span>Discover Campus Clubs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </>
      )}

      {/* Pending Applications */}
      {tab === "pending" && (
        <>
          {pendingClubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingClubs.map((club) => (
                <div
                  key={club.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Awaiting Approval</span>
                      </span>
                      <h3 className="text-sm font-bold text-foreground mt-1 line-clamp-1">{club.name}</h3>
                      <div className="text-xs text-muted-foreground">
                        Applied on {new Date(club.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/student/clubs/${club.id}`}
                    className="inline-flex items-center justify-center gap-1 text-xs font-bold text-primary hover:underline pt-2 border-t border-border"
                  >
                    <span>View Application</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
              No pending applications. All your club applications have been processed!
            </div>
          )}
        </>
      )}

      {/* Previous Clubs */}
      {tab === "previous" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {previousClubs.map((club) => (
            <div
              key={club.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 opacity-75"
            >
              <h3 className="text-sm font-bold text-foreground">{club.name}</h3>
              <p className="text-xs text-muted-foreground">{club.shortDescription}</p>
              <div className="text-[11px] text-muted-foreground">Status: {club.status}</div>
              <Link
                href={`/dashboard/student/clubs/${club.id}`}
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                Re-apply
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
