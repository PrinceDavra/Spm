"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Award,
} from "lucide-react";
import { ClubCategory, ClubStatus, MembershipStatus } from "@prisma/client";

interface ClubItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: ClubCategory;
  status: ClubStatus;
  departmentName?: string | null;
  coordinatorName?: string | null;
  logoUrl: string;
  bannerUrl: string;
  memberCount: number;
  pendingCount: number;
  upcomingEventsCount: number;
  engagementScore: number;
  engagementTier: string;
  userMembership?: {
    id: string;
    role: string;
    status: MembershipStatus;
  } | null;
}

interface StudentClubDiscoveryProps {
  initialClubs: ClubItem[];
  currentUserId: string;
}

const CATEGORY_LABELS: Record<ClubCategory, string> = {
  TECHNICAL: "Technical & Engineering",
  CULTURAL: "Cultural & Fine Arts",
  LITERARY: "Literary & Debate",
  SPORTS: "Sports & Athletics",
  SOCIAL: "Social Impact & Outreach",
  ENTREPRENEURSHIP: "Entrepreneurship & Startups",
  DESIGN: "UI/UX & Product Design",
  ROBOTICS: "Robotics & Hardware",
  CODING: "Coding & Open Source",
  OTHER: "Special Interest",
};

const CATEGORY_COLORS: Record<ClubCategory, string> = {
  TECHNICAL: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  CULTURAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  LITERARY: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  SPORTS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  SOCIAL: "bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  ENTREPRENEURSHIP: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  DESIGN: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800",
  ROBOTICS: "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  CODING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  OTHER: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export function StudentClubDiscovery({ initialClubs, currentUserId }: StudentClubDiscoveryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [membershipFilter, setMembershipFilter] = useState<"ALL" | "MEMBER" | "PENDING" | "NON_MEMBER">("ALL");
  const [sortBy, setSortBy] = useState<"most_members" | "most_active" | "upcoming_events" | "recent">("most_members");

  // Hero / Featured Club
  const featuredClub = useMemo(() => {
    return (
      initialClubs.find((c) => c.slug === "coding-robotics-club") ||
      initialClubs.find((c) => c.engagementScore >= 80) ||
      initialClubs[0]
    );
  }, [initialClubs]);

  // Filtered list
  const filteredClubs = useMemo(() => {
    return initialClubs
      .filter((club) => {
        if (selectedCategory !== "ALL" && club.category !== selectedCategory) return false;

        if (membershipFilter !== "ALL") {
          const isMember =
            club.userMembership?.status === MembershipStatus.ACTIVE ||
            club.userMembership?.status === MembershipStatus.APPROVED;
          const isPending = club.userMembership?.status === MembershipStatus.PENDING;

          if (membershipFilter === "MEMBER" && !isMember) return false;
          if (membershipFilter === "PENDING" && !isPending) return false;
          if (membershipFilter === "NON_MEMBER" && (isMember || isPending)) return false;
        }

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchName = club.name.toLowerCase().includes(q);
          const matchDesc = club.shortDescription.toLowerCase().includes(q);
          const matchCat = CATEGORY_LABELS[club.category]?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "most_members") return b.memberCount - a.memberCount;
        if (sortBy === "most_active") return b.engagementScore - a.engagementScore;
        if (sortBy === "upcoming_events") return b.upcomingEventsCount - a.upcomingEventsCount;
        return 0;
      });
  }, [initialClubs, selectedCategory, membershipFilter, search, sortBy]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CampusSphere Student Community Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Campus Clubs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find your community, build new skills, and get involved beyond the classroom.
          </p>
        </div>

        <Link
          href="/dashboard/student/clubs/my-clubs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
        >
          <Users className="h-4 w-4" />
          <span>My Campus Clubs</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Featured Club Hero Card */}
      {featuredClub && (
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-lg bg-card group">
          <div className="absolute inset-0 z-0">
            <img
              src={featuredClub.bannerUrl}
              alt={featuredClub.name}
              className="w-full h-full object-cover object-center filter brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-between min-h-[320px] text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Featured Organization
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                  {CATEGORY_LABELS[featuredClub.category]}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{featuredClub.engagementScore}/100 Engagement ({featuredClub.engagementTier})</span>
              </div>
            </div>

            <div className="space-y-3 max-w-3xl my-6">
              <div className="flex items-center gap-4">
                <img
                  src={featuredClub.logoUrl}
                  alt={featuredClub.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md"
                />
                <div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {featuredClub.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-2">
                    <span>Led by {featuredClub.coordinatorName || "Student Council"}</span>
                    {featuredClub.departmentName && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {featuredClub.departmentName}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-100 line-clamp-2 leading-relaxed">
                {featuredClub.shortDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
              <div className="flex items-center gap-6 text-xs sm:text-sm text-slate-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-rose-400" />
                  <strong className="text-white">{featuredClub.memberCount}</strong> active members
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <strong className="text-white">{featuredClub.upcomingEventsCount}</strong> upcoming events
                </span>
              </div>

              <Link
                href={`/dashboard/student/clubs/${featuredClub.id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-rose-50 transition shadow-md"
              >
                <span>Explore Club</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clubs by name, mission, or field of interest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
              >
                <option value="most_members">Most Members</option>
                <option value="most_active">Most Active (Engagement)</option>
                <option value="upcoming_events">Upcoming Events</option>
              </select>
            </div>

            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground shadow-sm">
              <span>Status:</span>
              <select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value as any)}
                className="bg-transparent text-foreground font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Clubs</option>
                <option value="MEMBER">Joined (Member)</option>
                <option value="PENDING">Pending Request</option>
                <option value="NON_MEMBER">Not a Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Chips Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap border shadow-sm ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            All Categories ({initialClubs.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
            const count = initialClubs.filter((c) => c.category === catKey).length;
            if (count === 0) return null;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap border shadow-sm ${
                  selectedCategory === catKey
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            const isMember =
              club.userMembership?.status === MembershipStatus.ACTIVE ||
              club.userMembership?.status === MembershipStatus.APPROVED;
            const isPending = club.userMembership?.status === MembershipStatus.PENDING;

            return (
              <div
                key={club.id}
                className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Banner */}
                  <div className="relative h-36 w-full overflow-hidden bg-muted">
                    <img
                      src={club.bannerUrl}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${
                          CATEGORY_COLORS[club.category] || "bg-card text-foreground"
                        }`}
                      >
                        {club.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {isMember ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Member</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-sm">
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-md">
                          {club.engagementScore}/100 Score
                        </span>
                      )}
                    </div>

                    {/* Logo Overlay */}
                    <div className="absolute -bottom-4 left-4">
                      <img
                        src={club.logoUrl}
                        alt={club.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-background shadow-md bg-card"
                      />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 pt-6 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {club.name}
                      </h3>
                      {club.departmentName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          <span>{club.departmentName}</span>
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {club.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Footer KPIs & CTA */}
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mb-4">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {club.memberCount} members
                    </span>
                    <span className="flex items-center gap-1 text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      {club.upcomingEventsCount} events
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/student/clubs/${club.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted/60 hover:bg-primary hover:text-primary-foreground font-bold text-xs text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground shadow-sm"
                  >
                    <span>View Club</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No clubs match your filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keyword, category selection, or membership filter.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
              setMembershipFilter("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
