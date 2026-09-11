"use client";

import { useState } from "react";
import {
  BellRing,
  Plus,
  Search,
  Filter,
  Users,
  Eye,
  Send,
  Archive,
  Clock,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  X,
  Building,
  Calendar,
} from "lucide-react";
import { NoticeCategory, NoticePriority, NoticeAudience, NoticeStatus } from "@prisma/client";

export interface AdminNoticeItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  status: NoticeStatus;
  publishDate: string;
  expiryDate?: string | null;
  authorId: string;
  authorName: string;
  departmentName?: string | null;
  divisionName?: string | null;
  semester?: number | null;
  reachStats?: {
    totalRecipients: number;
    readCount: number;
    unreadCount: number;
    readPercentage: number;
  };
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }[];
}

export interface AdminAnalyticsData {
  metrics: {
    totalNotices: number;
    published: number;
    drafts: number;
    expired: number;
    archived: number;
    totalReach: number;
    totalReads: number;
    totalUnreads: number;
    averageReadRate: number;
  };
  categoryBreakdown: { category: string; count: number }[];
  recentPerformance: {
    id: string;
    title: string;
    category: NoticeCategory;
    priority: NoticePriority;
    publishDate: string;
    reachStats: {
      totalRecipients: number;
      readCount: number;
      unreadCount: number;
      readPercentage: number;
    };
  }[];
}

interface AdminNoticeFormState {
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  departmentId: string;
  semester: number;
  divisionId: string;
  attachmentFileName: string;
}

interface Props {
  initialNotices: AdminNoticeItem[];
  initialAnalytics: AdminAnalyticsData;
}

export function AdminNoticeManager({ initialNotices, initialAnalytics }: Props) {
  const [notices, setNotices] = useState<AdminNoticeItem[]>(initialNotices);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData>(initialAnalytics);
  const [viewTab, setViewTab] = useState<"MANAGEMENT" | "ANALYTICS">("MANAGEMENT");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notice Creation Form
  const [form, setForm] = useState<AdminNoticeFormState>({
    title: "",
    summary: "",
    content: "",
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    departmentId: "",
    semester: 6,
    divisionId: "",
    attachmentFileName: "",
  });

  // KPI calculations
  const publishedCount = notices.filter((n) => n.status === NoticeStatus.PUBLISHED).length;
  const draftCount = notices.filter((n) => n.status === NoticeStatus.DRAFT).length;
  const expiringSoonCount = notices.filter((n) => {
    if (!n.expiryDate || n.status !== NoticeStatus.PUBLISHED) return false;
    const exp = new Date(n.expiryDate).getTime();
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    return exp > now && exp - now <= fourteenDays;
  }).length;

  const filteredNotices = notices.filter((n) => {
    if (statusFilter !== "ALL" && n.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && n.category !== categoryFilter) return false;
    if (priorityFilter !== "ALL" && n.priority !== priorityFilter) return false;

    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateNotice = async (status: NoticeStatus) => {
    if (!form.title.trim() || !form.content.trim()) {
      alert("Please provide Title and Content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = form.attachmentFileName
        ? [
            {
              fileName: form.attachmentFileName,
              fileUrl: "/downloads/official_circular.pdf",
              fileType: "application/pdf",
              fileSize: 1024000,
            },
          ]
        : [];

      const payload = {
        title: form.title,
        summary: form.summary,
        content: form.content,
        category: form.category,
        priority: form.priority,
        audience: form.audience,
        status,
        departmentId: form.audience === NoticeAudience.DEPARTMENT ? "dept-comp" : undefined,
        semester: form.audience === NoticeAudience.SEMESTER ? form.semester : undefined,
        divisionId: form.audience === NoticeAudience.DIVISION ? "div-comp-a" : undefined,
        attachments,
      };

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.notice) {
        setNotices([data.notice, ...notices]);
        setIsModalOpen(false);
        setForm({
          title: "",
          summary: "",
          content: "",
          category: NoticeCategory.ACADEMIC,
          priority: NoticePriority.NORMAL,
          audience: NoticeAudience.ALL,
          departmentId: "",
          semester: 6,
          divisionId: "",
          attachmentFileName: "",
        });
      } else {
        alert(data.message || "Failed to create notice.");
      }
    } catch (err) {
      console.error("Failed to submit notice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (noticeId: string) => {
    try {
      const res = await fetch(`/api/notices/${noticeId}/publish`, { method: "POST" });
      if (res.ok) {
        setNotices(
          notices.map((n) =>
            n.id === noticeId ? { ...n, status: NoticeStatus.PUBLISHED } : n
          )
        );
      }
    } catch (err) {
      console.error("Publish error:", err);
    }
  };

  const handleArchive = async (noticeId: string) => {
    if (!confirm("Are you sure you want to archive this notice?")) return;
    try {
      const res = await fetch(`/api/notices/${noticeId}/archive`, { method: "POST" });
      if (res.ok) {
        setNotices(
          notices.map((n) =>
            n.id === noticeId ? { ...n, status: NoticeStatus.ARCHIVED } : n
          )
        );
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
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
            Publish important updates to the right people at the right time.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Published Notices
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {publishedCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">active campus circulars</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Drafts
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {draftCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">pending publication</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Expiring Soon
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {expiringSoonCount}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">within 14 days</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Reach & Engagement
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {analytics.metrics.averageReadRate}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {analytics.metrics.totalReads} reads of {analytics.metrics.totalReach} recipients
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewTab("MANAGEMENT")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            viewTab === "MANAGEMENT"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Notice Management</span>
        </button>

        <button
          onClick={() => setViewTab("ANALYTICS")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            viewTab === "ANALYTICS"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Audience Analytics</span>
        </button>
      </div>

      {viewTab === "MANAGEMENT" ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notices by title, summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value={NoticeStatus.PUBLISHED}>Published</option>
                <option value={NoticeStatus.DRAFT}>Draft</option>
                <option value={NoticeStatus.EXPIRED}>Expired</option>
                <option value={NoticeStatus.ARCHIVED}>Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {Object.values(NoticeCategory).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value={NoticePriority.NORMAL}>NORMAL</option>
                <option value={NoticePriority.IMPORTANT}>IMPORTANT</option>
                <option value={NoticePriority.URGENT}>URGENT</option>
              </select>
            </div>
          </div>

          {/* Notices Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Notice Title & Category</th>
                    <th className="p-4">Audience</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reach & Read Rate</th>
                    <th className="p-4">Published</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNotices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No notices found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredNotices.map((n) => {
                      const isDraft = n.status === NoticeStatus.DRAFT;
                      const isArchived = n.status === NoticeStatus.ARCHIVED;

                      return (
                        <tr
                          key={n.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-4 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                {n.category}
                              </span>
                              <span>•</span>
                              <span>By: {n.authorName}</span>
                            </div>
                          </td>

                          <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                            {n.audience}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                n.priority === NoticePriority.URGENT
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : n.priority === NoticePriority.IMPORTANT
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {n.priority}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                isDraft
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : isArchived
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  : n.status === NoticeStatus.EXPIRED
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {n.status}
                            </span>
                          </td>

                          <td className="p-4">
                            {n.reachStats ? (
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {n.reachStats.readCount} / {n.reachStats.totalRecipients} read
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {n.reachStats.readPercentage}% completion
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>

                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {new Date(n.publishDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>

                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            {isDraft && (
                              <button
                                onClick={() => handlePublish(n.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md transition-colors"
                              >
                                Publish
                              </button>
                            )}

                            {!isDraft && !isArchived && (
                              <button
                                onClick={() => handleArchive(n.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-md transition-colors"
                              >
                                Archive
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ANALYTICS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Category Distribution
            </h3>
            <div className="space-y-3">
              {analytics.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                    <span className="text-slate-500">{cat.count} notices</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (cat.count / Math.max(1, analytics.metrics.totalNotices)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Engaged Notices */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Recent High-Reach Notices
            </h3>
            <div className="space-y-3">
              {analytics.recentPerformance.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.category} • {item.priority}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {item.reachStats.readPercentage}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.reachStats.readCount}/{item.reachStats.totalRecipients} read
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notice Creation Modal with Live Preview Tab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Campus Circular
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target students, faculty, or specific departments with instant push notifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setModalTab("EDIT")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      modalTab === "EDIT"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Edit Notice
                  </button>
                  <button
                    onClick={() => setModalTab("PREVIEW")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      modalTab === "PREVIEW"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Live Preview
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalTab === "EDIT" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule of Annual Convocation and Medal Declarations"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as NoticeCategory })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Object.values(NoticeCategory).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Priority
                      </label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as NoticePriority })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={NoticePriority.NORMAL}>NORMAL</option>
                        <option value={NoticePriority.IMPORTANT}>IMPORTANT</option>
                        <option value={NoticePriority.URGENT}>URGENT</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Audience Targeting
                      </label>
                      <select
                        value={form.audience}
                        onChange={(e) => setForm({ ...form, audience: e.target.value as NoticeAudience })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={NoticeAudience.ALL}>All (Entire Campus)</option>
                        <option value={NoticeAudience.STUDENTS}>Students Only</option>
                        <option value={NoticeAudience.FACULTY}>Faculty Only</option>
                        <option value={NoticeAudience.DEPARTMENT}>Department</option>
                        <option value={NoticeAudience.SEMESTER}>Semester</option>
                        <option value={NoticeAudience.DIVISION}>Division</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Short Summary
                    </label>
                    <input
                      type="text"
                      placeholder="Brief excerpt for notifications and preview cards"
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Circular Content <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Enter detailed circular content, directives, code of conduct..."
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachment (Optional PDF or Document)
                    </label>
                    <input
                      type="text"
                      placeholder="Attachment filename (e.g. Circular_Order_2025.pdf)"
                      value={form.attachmentFileName}
                      onChange={(e) => setForm({ ...form, attachmentFileName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW */
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>Live Notice Card preview exactly as rendered for targeted users.</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {form.category}
                      </span>
                      {form.priority === NoticePriority.URGENT && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          URGENT
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Audience: <strong>{form.audience}</strong>
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {form.title || "Notice Title Preview"}
                    </h2>

                    {form.summary && (
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic border-l-2 border-indigo-500 pl-3">
                        {form.summary}
                      </p>
                    )}

                    <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {form.content || "Notice content will appear here..."}
                    </div>

                    {form.attachmentFileName && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-indigo-500" />
                          <span>{form.attachmentFileName}</span>
                        </div>
                        <span className="font-semibold text-indigo-600">Download</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>Publisher: Institutional Administration</span>
                      <span>Published: Today</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateNotice(NoticeStatus.DRAFT)}
                className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateNotice(NoticeStatus.PUBLISHED)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
