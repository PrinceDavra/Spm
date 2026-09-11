"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ArrowUpDown,
  ChevronRight,
  BookOpen,
  Calendar,
  Award,
} from "lucide-react";
import { StudentAssignmentListItem } from "@/services/assignment.service";

interface Props {
  initialAssignments: StudentAssignmentListItem[];
  initialKpi: {
    dueSoon: number;
    pending: number;
    submitted: number;
    overdue: number;
  };
}

export function StudentAssignmentHub({ initialAssignments, initialKpi }: Props) {
  const [assignments] = useState<StudentAssignmentListItem[]>(initialAssignments);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<"deadline_asc" | "deadline_desc" | "title">("deadline_asc");

  // Extract distinct subjects
  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => map.set(a.subjectId, a.subjectName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignments]);

  // Filter and sort assignments
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        if (selectedSubject !== "ALL" && a.subjectId !== selectedSubject) return false;
        if (selectedStatus === "PENDING" && a.submissionStatus !== "NOT_SUBMITTED") return false;
        if (selectedStatus === "SUBMITTED" && a.submissionStatus !== "SUBMITTED" && a.submissionStatus !== "LATE") return false;
        if (selectedStatus === "GRADED" && a.submissionStatus !== "GRADED") return false;
        if (selectedStatus === "OVERDUE" && a.submissionStatus !== "OVERDUE") return false;

        if (search.trim().length > 0) {
          const q = search.toLowerCase();
          return (
            a.title.toLowerCase().includes(q) ||
            a.subjectName.toLowerCase().includes(q) ||
            a.subjectCode.toLowerCase().includes(q) ||
            a.facultyName.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline_asc") {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === "deadline_desc") {
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [assignments, search, selectedSubject, selectedStatus, sortBy]);

  const getStatusBadge = (status: StudentAssignmentListItem["submissionStatus"], marks?: number | null, maxMarks?: number) => {
    switch (status) {
      case "GRADED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Graded {marks !== undefined && marks !== null ? `${marks}/${maxMarks}` : ""}
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Submitted
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Submitted Late
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Assignments
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Stay ahead of deadlines and keep your coursework on track.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{initialKpi.dueSoon}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Due Soon (&lt; 48h)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{initialKpi.pending}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Action</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{initialKpi.submitted}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Submitted &amp; Graded</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{initialKpi.overdue}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignments or faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADED">Graded</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="deadline_asc">Deadline: Earliest First</option>
              <option value="deadline_desc">Deadline: Latest First</option>
              <option value="title">Alphabetical (Title)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-3.5">
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/80 mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">You&apos;re all caught up!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No assignments found matching your active filter criteria. Check back later for new coursework announcements.
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/dashboard/student/assignments/${assignment.id}`}
              className="block p-5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Metadata header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900">
                      {assignment.subjectCode}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {assignment.subjectName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {assignment.facultyName}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {assignment.description}
                    </p>
                  </div>

                  {/* Deadline & urgency pill */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                        assignment.isOverdue
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                          : assignment.isUrgent
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {assignment.urgencyText}
                    </span>

                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {assignment.maxMarks} Total Marks
                    </span>
                  </div>
                </div>

                {/* Right Action & Status */}
                <div className="flex items-center gap-3 self-start md:self-center">
                  {getStatusBadge(
                    assignment.submissionStatus,
                    assignment.submission?.marksObtained,
                    assignment.maxMarks
                  )}

                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
