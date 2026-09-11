"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building,
  User,
  AlertCircle,
  Paperclip,
  Download,
  CheckCircle2,
  Bookmark,
  Share2,
  Printer,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { NoticeCategory, NoticePriority, NoticeAudience } from "@prisma/client";

export interface NoticeDetailData {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  publishDate: string;
  expiryDate?: string | null;
  authorName: string;
  authorRole: string;
  departmentName?: string | null;
  divisionName?: string | null;
  semester?: number | null;
  isRead: boolean;
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
}

interface Props {
  notice: NoticeDetailData;
}

export function StudentNoticeDetail({ notice }: Props) {
  const [isRead, setIsRead] = useState(notice.isRead);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleReadStatus = async () => {
    setIsUpdating(true);
    try {
      const endpoint = isRead
        ? `/api/notices/${notice.id}/unread`
        : `/api/notices/${notice.id}/read`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setIsRead(!isRead);
      }
    } catch (err) {
      console.error("Failed to toggle read state:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isUrgent = notice.priority === NoticePriority.URGENT;
  const isImportant = notice.priority === NoticePriority.IMPORTANT;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/student/notices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Notice Center</span>
        </Link>

        {/* Read / Unread Toggle */}
        <button
          onClick={toggleReadStatus}
          disabled={isUpdating}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isRead
              ? "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100"
              : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100"
          }`}
        >
          {isRead ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Marked as Read</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mark as Read</span>
            </>
          )}
        </button>
      </div>

      {/* Urgent Warning Banner */}
      {isUrgent && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              URGENT INSTITUTIONAL DIRECTIVE
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              This notice requires immediate compliance or review by all targeted recipients.
            </p>
          </div>
        </div>
      )}

      {/* Notice Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Header Metadata */}
        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
              {notice.category}
            </span>
            {isUrgent && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                URGENT
              </span>
            )}
            {isImportant && !isUrgent && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                IMPORTANT
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target Audience: <strong className="text-slate-700 dark:text-slate-300">{notice.audience}</strong>
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {notice.title}
          </h1>

          {/* Publisher and Time info */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                {notice.authorName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {notice.authorName}
                </div>
                <div className="text-[11px] text-slate-500">{notice.authorRole}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Published:{" "}
                <strong>
                  {new Date(notice.publishDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>

            {notice.expiryDate && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
                <span>
                  Expires:{" "}
                  <strong>
                    {new Date(notice.expiryDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary highlight box */}
        {notice.summary && (
          <div className="px-6 md:px-8 py-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Summary Keynotes
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
              &ldquo;{notice.summary}&rdquo;
            </p>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
            {notice.content}
          </div>

          {/* Attachments Section */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                Official Attachments ({notice.attachments.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notice.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {att.fileName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(att.fileSize)}
                        </div>
                      </div>
                    </div>

                    <a
                      href={att.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 md:px-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically verified university circular.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Circular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
