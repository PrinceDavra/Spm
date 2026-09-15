"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Archive,
  Send,
  Calendar,
  MapPin,
  Tag,
} from "lucide-react";
import { LostFoundType, LostFoundStatus } from "@prisma/client";

interface Item {
  id: string;
  referenceNumber: string;
  type: LostFoundType;
  title: string;
  category: string;
  status: LostFoundStatus;
  location: string;
  dateLostFound: string;
  createdAt: string;
}

export function StudentMyReports() {
  const [reports, setReports] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lost-found/my-reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/lost-found/${id}/publish`, { method: "POST" });
      if (res.ok) {
        await fetchMyReports();
      }
    } catch {
      // Graceful
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this report?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/lost-found/${id}/archive`, { method: "POST" });
      if (res.ok) {
        await fetchMyReports();
      }
    } catch {
      // Graceful
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/lost-found/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: "Marked resolved by student author." }),
      });
      if (res.ok) {
        await fetchMyReports();
      }
    } catch {
      // Graceful
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/student/lost-found"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hub
          </Link>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            My Authored Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track and manage your submitted lost belongings and found item postings.
          </p>
        </div>

        <Link
          href="/dashboard/student/lost-found/report"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Report
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Clock className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No reports created yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Whenever you report a lost or found possession, you can manage its status here.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/student/lost-found/report"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Post a Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isDraft = report.status === LostFoundStatus.DRAFT;
            const isResolved = report.status === LostFoundStatus.RESOLVED;

            return (
              <div
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase text-white ${
                        report.type === LostFoundType.LOST ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    >
                      {report.type}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {report.referenceNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isResolved
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : isDraft
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {report.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {report.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      {report.category.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(report.dateLostFound).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isDraft && (
                    <button
                      onClick={() => handlePublish(report.id)}
                      disabled={actionLoading === report.id}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      Publish
                    </button>
                  )}

                  {!isResolved && !isDraft && (
                    <button
                      onClick={() => handleResolve(report.id)}
                      disabled={actionLoading === report.id}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Mark Resolved
                    </button>
                  )}

                  <button
                    onClick={() => handleArchive(report.id)}
                    disabled={actionLoading === report.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Archive className="h-3 w-3" />
                    Archive
                  </button>

                  <Link
                    href={`/dashboard/student/lost-found/${report.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700"
                  >
                    <Eye className="h-3 w-3" />
                    View
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
