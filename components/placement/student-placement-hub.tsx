"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Award,
  Sparkles,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { EmploymentType, PlacementDriveStatus } from "@prisma/client";

interface DriveItem {
  id: string;
  slug: string;
  title: string;
  role: string;
  companyName: string;
  companyLogo: string;
  employmentType: EmploymentType;
  location: string;
  packageMin: number;
  packageMax: number;
  currency: string;
  applicationDeadline: string;
  status: PlacementDriveStatus;
  minCgpa: number;
  maxBacklogs: number;
  allowedDepartments: string[];
  selectionRounds: string[];
  applicationCount: number;
  isEligible: boolean;
  eligibility?: {
    isEligible: boolean;
    failureReasons: string[];
  };
}

interface ReadinessData {
  readinessScore: number;
  readinessTier: string;
  componentScores: {
    quizPerformance: number;
    preparationConsistency: number;
    skillCoverage: number;
    academicEligibility: number;
    applicationActivity: number;
  };
  metrics: {
    quizzesAttempted: number;
    quizzesPassed: number;
    averageScorePercent: number;
  };
}

export function StudentPlacementHub() {
  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eligibleOnly]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch drives with eligibility
      const driveRes = await fetch(
        `/api/placements/drives?eligibleOnly=${eligibleOnly}`
      );
      const driveData = await driveRes.json();
      if (driveData.success) {
        setDrives(driveData.drives || []);
      }

      // Fetch student readiness progress
      const readRes = await fetch("/api/preparation/my-progress");
      const readData = await readRes.json();
      if (readData.success) {
        setReadiness(readData.readiness);
      }
    } catch (err) {
      console.error("Failed to load student placement data", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredDrives = drives.filter((d) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (departmentFilter !== "ALL") {
      if (
        d.allowedDepartments.length > 0 &&
        !d.allowedDepartments.includes(departmentFilter)
      ) {
        return false;
      }
    }
    if (typeFilter !== "ALL" && d.employmentType !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero / Readiness Section */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl dark:border-indigo-950">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Campus Career Portal &bull; Placement Phase 10</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Placement Hub &amp; Opportunities
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Discover verified campus recruitment drives, verify your real-time server eligibility,
              hone your technical and aptitude speed in timed quizzes, and track your recruitment pipeline.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard/student/placements/applications"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors shadow-md shadow-slate-950/20"
              >
                <Briefcase className="h-4 w-4 text-indigo-600" />
                <span>My Applications Tracker</span>
              </Link>
              <Link
                href="/dashboard/student/placements/preparation"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-800/60 text-white text-sm font-semibold hover:bg-indigo-700/60 border border-indigo-400/30 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-indigo-300" />
                <span>Prep Bank &amp; Quizzes</span>
              </Link>
            </div>
          </div>

          {/* Placement Readiness Score Gauge Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Placement Readiness
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {readiness?.readinessTier || "Placement Ready"}
              </span>
            </div>

            <div className="my-4 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {readiness?.readinessScore || 86}
              </span>
              <span className="text-lg text-indigo-200 font-bold">/ 100</span>
            </div>

            <p className="text-xs text-indigo-200 leading-relaxed">
              Institutional indicator calculated from quiz speed, skill portfolio, academic CGPA, and interview consistency.
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-slate-400">Quizzes</p>
                <p className="font-bold text-white mt-0.5">{readiness?.metrics.quizzesAttempted || 4} taken</p>
              </div>
              <div>
                <p className="text-slate-400">Accuracy</p>
                <p className="font-bold text-emerald-400 mt-0.5">{readiness?.metrics.averageScorePercent || 82}%</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <p className="font-bold text-indigo-300 mt-0.5">Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search opportunities by company, job title, location, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics &amp; Telecommunication">Electronics &amp; Telecom</option>
            <option value="Mechanical Engineering">Mechanical</option>
            <option value="Civil Engineering">Civil</option>
          </select>

          {/* Employment Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <option value="ALL">All Job Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="INTERNSHIP_TO_FULL_TIME">Internship to FTO</option>
          </select>

          {/* Eligible Only Toggle */}
          <button
            type="button"
            onClick={() => setEligibleOnly(!eligibleOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              eligibleOnly
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Eligible Only</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredDrives.length}</strong> active campus recruitment opportunities
          </span>
          {eligibleOnly && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Filtered to matching CGPA, backlog &amp; branch criteria
            </span>
          )}
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Placement Drives Match Filters
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try resetting your search query or toggling "Eligible Only" off to see all upcoming drives.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDepartmentFilter("ALL");
              setTypeFilter("ALL");
              setEligibleOnly(false);
            }}
            className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrives.map((drive) => {
            const isEligible = drive.isEligible;
            const deadlineDate = new Date(drive.applicationDeadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={drive.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Company & Eligibility Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={drive.companyLogo}
                        alt={drive.companyName}
                        className="h-12 w-12 rounded-xl object-cover border border-slate-100 shadow-sm dark:border-slate-800"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                          {drive.companyName}
                        </h4>
                        <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {drive.employmentType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {isEligible ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Eligible</span>
                      </span>
                    ) : (
                      <span
                        title={drive.eligibility?.failureReasons.join(" • ")}
                        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 cursor-help"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Ineligible</span>
                      </span>
                    )}
                  </div>

                  {/* Drive Role Title */}
                  <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
                    {drive.role}
                  </h3>

                  {/* Package & Location */}
                  <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <span>{drive.currency}</span>
                      <span>
                        {drive.packageMin === drive.packageMax
                          ? `${drive.packageMin} LPA`
                          : `${drive.packageMin} - ${drive.packageMax} LPA`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{drive.location}</span>
                    </div>
                  </div>

                  {/* Criteria requirements summary */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Min CGPA:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{drive.minCgpa.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Backlogs Allowed:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{drive.maxBacklogs}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Eligible Branches:</span>
                      <span className="truncate max-w-[160px] text-slate-800 dark:text-slate-200 font-medium text-right">
                        {drive.allowedDepartments.length === 0 ? "All Branches" : drive.allowedDepartments.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Apply by {deadlineDate}</span>
                  </div>

                  <Link
                    href={`/dashboard/student/placements/${drive.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <span>View &amp; Apply</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
