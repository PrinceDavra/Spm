"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  Settings,
  Search as SearchIcon,
  Filter,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Calendar,
  Megaphone,
  Award,
  Briefcase,
  Users,
  Shield,
  Layers,
  Sliders,
  X,
  RefreshCw,
  Plus,
} from "lucide-react";
import { NotificationType, NotificationPriority, PreferenceChannel, Role } from "@prisma/client";
import { AnnouncementComposer } from "./announcement-composer";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  groupKey: string | null;
  createdAt: string;
}

interface PreferenceItem {
  category: NotificationType;
  channel: PreferenceChannel;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ASSIGNMENT: BookOpen,
  ATTENDANCE: TrendingUp,
  TIMETABLE: Calendar,
  NOTICE: Megaphone,
  EVENT: Award,
  PLACEMENT: Briefcase,
  CLUB: Users,
  LOST_FOUND: SearchIcon,
  SYSTEM: Shield,
  ACADEMIC: BookOpen,
  ADMIN: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  ASSIGNMENT: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900",
  ATTENDANCE: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900",
  TIMETABLE: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900",
  NOTICE: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900",
  EVENT: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900",
  PLACEMENT: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900",
  CLUB: "text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-400 dark:border-cyan-900",
  LOST_FOUND: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900",
  SYSTEM: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  ACADEMIC: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-950/60 dark:text-violet-400 dark:border-violet-900",
  ADMIN: "text-purple-700 bg-purple-100 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900",
};

export function NotificationCenterView({
  userRole,
  userId,
}: {
  userRole: Role;
  userId: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [isGrouped, setIsGrouped] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      let url = "/api/notifications?limit=50";
      if (activeTab === "UNREAD") url += "&isRead=false";
      else if (activeTab === "HIGH_PRIORITY") url += "&priority=HIGH";
      else if (activeTab !== "ALL") url += `&type=${activeTab}`;

      if (priorityFilter !== "ALL" && activeTab !== "HIGH_PRIORITY") {
        url += `&priority=${priorityFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      showToast("Error loading notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences || []);
      }
    } catch {
      // Fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotifications();
  };

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !currentRead }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: !currentRead } : n))
      );
      setUnreadCount((prev) => (!currentRead ? Math.max(0, prev - 1) : prev + 1));
      showToast(!currentRead ? "Marked as read" : "Marked as unread");
    } catch {
      showToast("Could not update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      showToast("Notification dismissed");
    } catch {
      showToast("Could not dismiss notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        showToast("All notifications marked as read");
      }
    } catch {
      showToast("Failed to mark all as read");
    }
  };

  const handleSavePreferences = async (updated: PreferenceItem[]) => {
    setIsSavingPrefs(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
        setShowPreferences(false);
        showToast("Notification preferences updated");
      } else {
        throw new Error(data.error || "Failed to update preferences");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error saving preferences");
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Filter tabs
  const TABS = [
    { label: "All Alerts", value: "ALL" },
    { label: `Unread (${unreadCount})`, value: "UNREAD" },
    { label: "High Priority", value: "HIGH_PRIORITY" },
    { label: "Academic", value: NotificationType.ACADEMIC },
    { label: "Assignments", value: NotificationType.ASSIGNMENT },
    { label: "Attendance", value: NotificationType.ATTENDANCE },
    { label: "Events", value: NotificationType.EVENT },
    { label: "Placement", value: NotificationType.PLACEMENT },
    { label: "Clubs", value: NotificationType.CLUB },
    { label: "System", value: NotificationType.SYSTEM },
  ];

  // Grouping logic
  const groupedNotifications: Record<string, NotificationItem[]> = {};
  if (isGrouped) {
    notifications.forEach((n) => {
      const key = n.type;
      if (!groupedNotifications[key]) groupedNotifications[key] = [];
      groupedNotifications[key].push(n);
    });
  }

  const canCompose =
    userRole === Role.ADMIN ||
    userRole === Role.FACULTY ||
    userRole === Role.CLUB_COORDINATOR ||
    userRole === Role.PLACEMENT_OFFICER;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3 backdrop-blur-sm">
              <Bell className="h-3.5 w-3.5" />
              <span>Campus Communication & Information Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Notification Center
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-indigo-100/80 max-w-xl">
              Consolidated real-time intelligence: assignment deadlines, attendance risk flags, campus notices, placement drives, club activities, and system alerts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {canCompose && (
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4 text-indigo-600" />
                <span>Post Announcement</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                fetchPreferences();
                setShowPreferences(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Preferences</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-500/40 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grouping Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsGrouped(!isGrouped)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isGrouped
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Group by Category</span>
            </button>
          </div>
        </div>

        {/* Search & Priority Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by keywords..."
              className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchNotifications();
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value={NotificationPriority.URGENT}>Urgent Only</option>
              <option value={NotificationPriority.HIGH}>High Priority</option>
              <option value={NotificationPriority.NORMAL}>Normal</option>
              <option value={NotificationPriority.LOW}>Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Listing */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading campus alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            No Notifications Found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab !== "ALL" || searchQuery
              ? "No alerts match the active filter or search query. Try clearing your filters."
              : "You have zero pending notifications. Everything is up to date."}
          </p>
          {(activeTab !== "ALL" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("ALL");
                setSearchQuery("");
                setPriorityFilter("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : isGrouped ? (
        /* Grouped Presentation */
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([groupType, items]) => {
            const IconComponent = TYPE_ICONS[groupType] || Shield;
            const badgeColor = TYPE_COLORS[groupType] || TYPE_COLORS.SYSTEM;

            return (
              <div
                key={groupType}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center ${badgeColor}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                      {groupType.replace("_", " ")} Updates
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((n) => renderNotificationCard(n))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Feed Presentation */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
          {notifications.map((n) => renderNotificationCard(n))}
        </div>
      )}

      {/* Preferences Drawer / Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <Sliders className="h-5 w-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure alert categories for your account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Email Delivery Notice:</strong> CampusSphere email gateway is currently simulated/unconfigured. All enabled notifications are delivered directly to the In-App Notification Center and Navigation Bell.
                </div>
              </div>

              <div className="space-y-3">
                {preferences.map((p) => {
                  const isCritical =
                    p.category === NotificationType.SYSTEM ||
                    p.category === NotificationType.ACADEMIC;

                  return (
                    <div
                      key={p.category}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {p.category.replace("_", " ")}
                          </span>
                          {isCritical && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isCritical
                            ? "Core institutional alerts cannot be disabled"
                            : `Receive updates regarding campus ${p.category.toLowerCase()}`}
                        </p>
                      </div>

                      <select
                        disabled={isCritical}
                        value={p.channel}
                        onChange={(e) => {
                          const val = e.target.value as PreferenceChannel;
                          setPreferences((prev) =>
                            prev.map((item) =>
                              item.category === p.category ? { ...item, channel: val } : item
                            )
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                      >
                        <option value={PreferenceChannel.IN_APP}>In-App (Active)</option>
                        <option value={PreferenceChannel.DISABLED}>Disabled</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPrefs}
                onClick={() => handleSavePreferences(preferences)}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingPrefs ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Composer Modal */}
      {showComposer && (
        <AnnouncementComposer
          userRole={userRole}
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false);
            showToast("Announcement published and notifications broadcast!");
            fetchNotifications();
          }}
        />
      )}
    </div>
  );

  function renderNotificationCard(n: NotificationItem) {
    const IconComponent = TYPE_ICONS[n.type] || Shield;
    const badgeColor = TYPE_COLORS[n.type] || TYPE_COLORS.SYSTEM;
    const isUrgent = n.priority === NotificationPriority.URGENT;
    const isHigh = n.priority === NotificationPriority.HIGH;

    return (
      <div
        key={n.id}
        className={`p-4 sm:p-5 flex items-start gap-4 transition-colors relative group ${
          !n.isRead
            ? "bg-indigo-50/30 dark:bg-indigo-950/20"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
        }`}
      >
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border shadow-xs ${badgeColor}`}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isUrgent
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  : isHigh
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {n.priority}
            </span>

            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {n.type.toLowerCase().replace("_", " ")}
            </span>

            <span className="text-slate-300 dark:text-slate-600">&bull;</span>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(n.createdAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {n.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {n.message}
          </p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {n.link && (
              <Link
                href={n.link}
                onClick={() => {
                  if (!n.isRead) handleToggleRead(n.id, false);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                <span>Open Module</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => handleToggleRead(n.id, n.isRead)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              {n.isRead ? "Mark Unread" : "Mark Read"}
            </button>

            <button
              type="button"
              onClick={() => handleDelete(n.id)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

        {!n.isRead && (
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1" />
        )}
      </div>
    );
  }
}
