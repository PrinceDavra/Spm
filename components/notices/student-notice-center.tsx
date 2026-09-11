"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BellRing,
  AlertCircle,
  BookOpen,
  Sparkles,
  Search,
  Paperclip,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  GraduationCap,
} from "lucide-react";
import { NoticeCategory, NoticePriority } from "@prisma/client";

export interface NoticeCardData {
  id: string;
  title: string;
  summary: string;
  category: NoticeCategory;
  priority: NoticePriority;
  publishDate: string;
  expiryDate?: string | null;
  authorName: string;
  departmentName?: string | null;
  isRead: boolean;
  attachments?: {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }[];
}

interface Props {
  initialNotices: NoticeCardData[];
  unreadCount: number;
}

export function StudentNoticeCenter({ initialNotices, unreadCount }: Props) {
  const [notices, setNotices] = useState<NoticeCardData[]>(initialNotices);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedReadFilter, setSelectedReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("priority");

  // KPI Calculations
  const kpis = useMemo(() => {
    const unread = notices.filter((n) => !n.isRead).length;
    const urgentImportant = notices.filter(
      (n) => n.priority === NoticePriority.URGENT || n.priority === NoticePriority.IMPORTANT
    ).length;
    const academic = notices.filter(
      (n) => n.category === NoticeCategory.ACADEMIC || n.category === NoticeCategory.EXAMINATION
    ).length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const newThisWeek = notices.filter((n) => new Date(n.publishDate).getTime() >= sevenDaysAgo).length;

    return { unread, urgentImportant, academic, newThisWeek };
  }, [notices]);

  // Filtering & Sorting
  const filteredNotices = useMemo(() => {
    return notices
      .filter((n) => {
        if (selectedCategory !== "ALL" && n.category !== selectedCategory) return false;
        if (selectedReadFilter === "UNREAD" && n.isRead) return false;
        if (selectedReadFilter === "READ" && !n.isRead) return false;

        if (search.trim().length > 0) {
          const q = search.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.summary.toLowerCase().includes(q) ||
            n.authorName.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const priorityScore = (p: NoticePriority) => (p === "URGENT" ? 3 : p === "IMPORTANT" ? 2 : 1);
          const diff = priorityScore(b.priority) - priorityScore(a.priority);
          if (diff !== 0) return diff;
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        }
        if (sortBy === "newest") {
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        }
        return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      });
  }, [notices, search, selectedCategory, selectedReadFilter, sortBy]);

  const getCategoryBadge = (category: NoticeCategory) => {
    switch (category) {
      case NoticeCategory.ACADEMIC:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      case NoticeCategory.EXAMINATION:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800";
      case NoticeCategory.ATTENDANCE:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      case NoticeCategory.PLACEMENT:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case NoticeCategory.EVENT:
        return "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800";
      case NoticeCategory.CLUB:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
      case NoticeCategory.HOLIDAY:
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800";
      case NoticeCategory.URGENT:
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800";
    }
  };

  const categories = [
    { label: "All Categories", value: "ALL" },
    { label: "Academic", value: NoticeCategory.ACADEMIC },
    { label: "Examination", value: NoticeCategory.EXAMINATION },
    { label: "Attendance", value: NoticeCategory.ATTENDANCE },
    { label: "Placement", value: NoticeCategory.PLACEMENT },
    { label: "Events", value: NoticeCategory.EVENT },
    { label: "Clubs", value: NoticeCategory.CLUB },
    { label: "Holidays", value: NoticeCategory.HOLIDAY },
    { label: "General", value: NoticeCategory.GENERAL },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
              <BellRing className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Notice Center
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Stay informed about what&apos;s happening across your campus.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unread */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unread Notices
            </span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BellRing className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis.unread}
            </span>
            <span className="text-xs text-slate-500">requiring review</span>
          </div>
        </div>

        {/* Urgent / Important */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Important & Urgent
            </span>
            <span className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis.urgentImportant}
            </span>
            <span className="text-xs text-slate-500">high-priority circulars</span>
          </div>
        </div>

        {/* Academic */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Academic & Exams
            </span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis.academic}
            </span>
            <span className="text-xs text-slate-500">syllabus & schedule</span>
          </div>
        </div>

        {/* New this week */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              New This Week
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis.newThisWeek}
            </span>
            <span className="text-xs text-slate-500">past 7 days</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notices by title, summary, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Read State Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedReadFilter("ALL")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedReadFilter === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All Notices
            </button>
            <button
              onClick={() => setSelectedReadFilter("UNREAD")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedReadFilter === "UNREAD"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Unread ({kpis.unread})
            </button>
            <button
              onClick={() => setSelectedReadFilter("READ")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedReadFilter === "READ"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Read
            </button>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="priority">Priority First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Feed Cards */}
      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {selectedReadFilter === "UNREAD" ? "You're all caught up!" : "No notices match your filters"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedReadFilter === "UNREAD"
                ? "There are no unread notices waiting for your review. Check back later for new campus updates."
                : "Try adjusting your search keywords or switching category filters."}
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const hasAttachments = notice.attachments && notice.attachments.length > 0;
            const isUrgent = notice.priority === NoticePriority.URGENT;
            const isImportant = notice.priority === NoticePriority.IMPORTANT;

            return (
              <Link
                key={notice.id}
                href={`/dashboard/student/notices/${notice.id}`}
                className={`group block bg-white dark:bg-slate-900 border rounded-xl p-5 transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 relative overflow-hidden ${
                  !notice.isRead
                    ? "border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/20 to-transparent dark:from-indigo-950/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Priority accent stripe */}
                {isUrgent && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                )}
                {isImportant && !isUrgent && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unread indicator */}
                      {!notice.isRead && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          New
                        </span>
                      )}

                      {/* Category Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadge(
                          notice.category
                        )}`}
                      >
                        {notice.category}
                      </span>

                      {/* Priority Badges */}
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" />
                          Urgent
                        </span>
                      )}
                      {isImportant && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                          Important
                        </span>
                      )}

                      {/* Attachment Badge */}
                      {hasAttachments && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Paperclip className="w-3 h-3" />
                          {notice.attachments!.length}{" "}
                          {notice.attachments!.length === 1 ? "File" : "Files"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {notice.title}
                    </h2>

                    {/* Summary */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notice.summary}
                    </p>

                    {/* Meta info footer */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{notice.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(notice.publishDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {notice.departmentName && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{notice.departmentName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Read notice link arrow */}
                  <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform self-center">
                    <span>Read Notice</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
