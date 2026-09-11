"use client";

import { useState } from "react";
import {
  BellRing,
  Plus,
  FileText,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle2,
  Archive,
  Search,
  Filter,
  Users,
  Paperclip,
  Send,
  X,
  ExternalLink,
} from "lucide-react";
import { NoticeCategory, NoticePriority, NoticeAudience, NoticeStatus } from "@prisma/client";

export interface FacultyNoticeItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  status: NoticeStatus;
  publishDate: string;
  authorId: string;
  authorName: string;
  departmentName?: string | null;
  divisionName?: string | null;
  semester?: number | null;
  isRead: boolean;
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

interface NoticeFormState {
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  semester: number;
  divisionId: string;
  attachmentFileName: string;
  attachmentUrl: string;
}

interface Props {
  initialNotices: FacultyNoticeItem[];
  facultyId: string;
  facultyName: string;
}

export function FacultyNoticeCenter({ initialNotices, facultyId, facultyName }: Props) {
  const [notices, setNotices] = useState<FacultyNoticeItem[]>(initialNotices);
  const [activeTab, setActiveTab] = useState<"ALL" | "AUTHORED" | "DRAFTS">("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Notice Creation
  const [form, setForm] = useState<NoticeFormState>({
    title: "",
    summary: "",
    content: "",
    category: NoticeCategory.ACADEMIC,
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.ALL,
    semester: 6,
    divisionId: "div-comp-a",
    attachmentFileName: "",
    attachmentUrl: "",
  });

  // KPI Metrics
  const myAuthored = notices.filter((n) => n.authorId === facultyId);
  const myDrafts = myAuthored.filter((n) => n.status === NoticeStatus.DRAFT);
  const publishedCount = notices.filter((n) => n.status === NoticeStatus.PUBLISHED).length;

  const filteredNotices = notices.filter((n) => {
    if (activeTab === "AUTHORED" && n.authorId !== facultyId) return false;
    if (activeTab === "DRAFTS" && (n.authorId !== facultyId || n.status !== NoticeStatus.DRAFT)) return false;

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
      alert("Please provide both Title and Content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = form.attachmentFileName
        ? [
            {
              fileName: form.attachmentFileName,
              fileUrl: form.attachmentUrl || "/downloads/notice_attachment.pdf",
              fileType: "application/pdf",
              fileSize: 480000,
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
        semester: form.audience === NoticeAudience.SEMESTER ? form.semester : undefined,
        divisionId: form.audience === NoticeAudience.DIVISION ? form.divisionId : undefined,
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
          semester: 6,
          divisionId: "div-comp-a",
          attachmentFileName: "",
          attachmentUrl: "",
        });
      } else {
        alert(data.message || "Failed to create notice.");
      }
    } catch (err) {
      console.error("Failed to create notice:", err);
      alert("Error occurred while saving notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDraft = async (noticeId: string) => {
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
      console.error("Failed to publish draft:", err);
    }
  };

  const handleArchiveNotice = async (noticeId: string) => {
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
      console.error("Failed to archive notice:", err);
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
              Faculty Notice Center
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Publish academic circulars, class guidelines, and track recipient engagement.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post Notice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            All Published Notices
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {publishedCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Authored by Me
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {myAuthored.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            My Drafts
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {myDrafts.length}
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => setActiveTab("AUTHORED")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "AUTHORED"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            My Notices ({myAuthored.length})
          </button>
          <button
            onClick={() => setActiveTab("DRAFTS")}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              activeTab === "DRAFTS"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Drafts ({myDrafts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notice titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No notices found in this view.
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isMine = notice.authorId === facultyId;
            const isDraft = notice.status === NoticeStatus.DRAFT;
            const isArchived = notice.status === NoticeStatus.ARCHIVED;

            return (
              <div
                key={notice.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-all hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                        {notice.category}
                      </span>

                      {notice.priority === NoticePriority.URGENT && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          URGENT
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isDraft
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : isArchived
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {notice.status}
                      </span>

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Target: <strong>{notice.audience}</strong>
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {notice.title}
                    </h2>

                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notice.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>Author: <strong>{notice.authorName}</strong></span>
                      <span>
                        Published:{" "}
                        {new Date(notice.publishDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {notice.reachStats && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Reach: {notice.reachStats.readCount} / {notice.reachStats.totalRecipients} read ({notice.reachStats.readPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {isMine && isDraft && (
                      <button
                        onClick={() => handlePublishDraft(notice.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    {isMine && !isDraft && !isArchived && (
                      <button
                        onClick={() => handleArchiveNotice(notice.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Notice Modal with Live Preview Tab */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Post Institutional Notice
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target students, classes, or faculty with rich circular notifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit vs Preview Tab Toggle */}
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

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalTab === "EDIT" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Notice Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule for Mid-Term Laboratory Viva Examinations"
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
                        <option value={NoticeAudience.ALL}>All Campus (Faculty & Students)</option>
                        <option value={NoticeAudience.STUDENTS}>All Students</option>
                        <option value={NoticeAudience.FACULTY}>All Faculty</option>
                        <option value={NoticeAudience.SEMESTER}>Specific Semester</option>
                        <option value={NoticeAudience.DIVISION}>Specific Division</option>
                      </select>
                    </div>
                  </div>

                  {form.audience === NoticeAudience.SEMESTER && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Semester
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={form.semester}
                        onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value, 10) || 6 })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  )}

                  {form.audience === NoticeAudience.DIVISION && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Target Division
                      </label>
                      <select
                        value={form.divisionId}
                        onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="div-comp-a">Division A (Computer Eng)</option>
                        <option value="div-comp-b">Division B (Computer Eng)</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Short Summary
                    </label>
                    <input
                      type="text"
                      placeholder="Brief excerpt for notifications and preview cards (max 300 chars)"
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
                      placeholder="Enter detailed notice content, directives, venue information..."
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachment (Optional PDF or Document)
                    </label>
                    <input
                      type="text"
                      placeholder="Attachment filename (e.g. Viva_Guidelines_2025.pdf)"
                      value={form.attachmentFileName}
                      onChange={(e) => setForm({ ...form, attachmentFileName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW TAB */
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>This is an exact preview of how the notice card will render for students and faculty.</span>
                  </div>

                  {/* Rendered Preview Card */}
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
                      {form.content || "Content will appear here..."}
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
                      <span>Publisher: {facultyName}</span>
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
                Save as Draft
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
