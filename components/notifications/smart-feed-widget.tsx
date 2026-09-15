"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Megaphone,
  Award,
  Briefcase,
  Users,
  Shield,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { SmartFeedItem } from "@/services/notification.service";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ASSIGNMENT: BookOpen,
  ATTENDANCE: TrendingUp,
  TIMETABLE: Calendar,
  NOTICE: Megaphone,
  EVENT: Award,
  PLACEMENT: Briefcase,
  CLUB: Users,
  LOST_FOUND: AlertTriangle,
  SYSTEM: Shield,
};

export function SmartFeedWidget() {
  const [items, setItems] = useState<SmartFeedItem[]>([]);
  const [deadlinesCount, setDeadlinesCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const res = await fetch("/api/notifications/smart-feed");
        const data = await res.json();
        if (data.success) {
          setItems(data.items || []);
          setDeadlinesCount(data.deadlinesCount || 0);
          setUrgentCount(data.urgentCount || 0);
        }
      } catch {
        // Fail gracefully
      } finally {
        setIsLoading(false);
      }
    }
    loadFeed();
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Campus Intelligence Feed
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              {urgentCount > 0 && (
                <span className="text-rose-600 font-bold">{urgentCount} Urgent Alert{urgentCount > 1 ? "s" : ""}</span>
              )}
              {deadlinesCount > 0 && (
                <span>&bull; {deadlinesCount} Pending Deadline{deadlinesCount > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/notifications"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
        >
          <span>View Hub</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Item List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.slice(0, 5).map((item) => {
          const IconComp = TYPE_ICONS[item.category] || Shield;
          const isUrgent = item.priority === NotificationPriority.URGENT;
          const isHigh = item.priority === NotificationPriority.HIGH;

          return (
            <div
              key={item.id}
              className={`p-4 flex items-start gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                isUrgent ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
              }`}
            >
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isUrgent
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : isHigh
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                }`}
              >
                <IconComp className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.title}
                  </span>
                  {item.badgeText && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.badgeText}
                    </span>
                  )}
                  {item.relativeTiming && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isUrgent
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {item.relativeTiming}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                  {item.summary}
                </p>

                <div className="mt-2">
                  <Link
                    href={item.deepLink}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition-colors"
                  >
                    <span>{item.actionText || "Open Details"}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
