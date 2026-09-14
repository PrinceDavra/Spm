"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Archive,
  BarChart2,
  Lock,
  Globe,
  Tag,
  Sparkles,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { EventCategory, EventStatus, Role } from "@prisma/client";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  venue: string;
  startDateTime: string;
  endDateTime: string;
  registrationOpenAt: string;
  registrationDeadline: string;
  capacity: number;
  seatsRemaining: number;
  posterUrl: string;
  isPublished: boolean;
  organizerName: string;
  organizerRole: string;
  registrations: any[];
}

interface FacultyEventManagerProps {
  initialEvents: EventItem[];
  currentUserId: string;
  currentUserRole: Role;
  summary: {
    activeEventsCount: number;
    totalRegistrationsCount: number;
    totalSeatsAvailable: number;
    averageAttendanceRate: number;
  };
}

export function FacultyEventManager({
  initialEvents,
  currentUserId,
  currentUserRole,
  summary,
}: FacultyEventManagerProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Create/Edit Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  interface EventFormData {
    title: string;
    summary: string;
    description: string;
    category: EventCategory;
    venue: string;
    startDateTime: string;
    endDateTime: string;
    registrationDeadline: string;
    capacity: number;
    posterUrl: string;
    status: EventStatus;
  }

  // Form Fields
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    summary: "",
    description: "",
    category: EventCategory.WORKSHOP,
    venue: "",
    startDateTime: "",
    endDateTime: "",
    registrationDeadline: "",
    capacity: 50,
    posterUrl: "",
    status: EventStatus.REGISTRATION_OPEN,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      description: "",
      category: EventCategory.WORKSHOP,
      venue: "",
      startDateTime: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      endDateTime: new Date(Date.now() + 86400000 * 3 + 14400000).toISOString().slice(0, 16),
      registrationDeadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      capacity: 50,
      posterUrl: "",
      status: EventStatus.REGISTRATION_OPEN,
    });
    setEditingEvent(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (evt: EventItem) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      summary: evt.summary || "",
      description: evt.description,
      category: evt.category,
      venue: evt.venue,
      startDateTime: new Date(evt.startDateTime).toISOString().slice(0, 16),
      endDateTime: new Date(evt.endDateTime).toISOString().slice(0, 16),
      registrationDeadline: new Date(evt.registrationDeadline).toISOString().slice(0, 16),
      capacity: evt.capacity,
      posterUrl: evt.posterUrl || "",
      status: evt.status,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingEvent) {
        // PATCH
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update event");

        setEvents((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data.event } : e))
        );
      } else {
        // POST
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create event");

        setEvents((prev) => [data.event, ...prev]);
      }

      setShowCreateModal(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: EventStatus.REGISTRATION_OPEN } : e))
      );
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to publish event");
    }
  };

  const filteredEvents = events.filter((evt) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !evt.title.toLowerCase().includes(q) &&
        !evt.venue.toLowerCase().includes(q) &&
        !evt.summary.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== "ALL" && evt.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== "ALL" && evt.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Event Management &amp; Moderation Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Campus Events Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Organize workshops, oversee seat registrations, track real attendance, and analyze student engagement.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Active Events</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">{summary.activeEventsCount}</div>
          <div className="text-[11px] text-muted-foreground">Open for student registration</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Registrations</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">{summary.totalRegistrationsCount}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Confirmed student participants</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Seats Available</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center dark:bg-amber-950/60 dark:text-amber-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">{summary.totalSeatsAvailable}</div>
          <div className="text-[11px] text-muted-foreground">Across all hosted venues</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Avg Attendance Rate</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">{summary.averageAttendanceRate}%</div>
          <div className="text-[11px] text-muted-foreground">Verified by organizers at entry</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="DRAFT">Draft</option>
            <option value="REGISTRATION_CLOSED">Closed</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-semibold bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.values(EventCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Cards / Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Event Details</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Date &amp; Schedule</th>
                <th className="px-4 py-3.5">Seat Allocation</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((evt) => {
                const isOwnerOrAdmin = currentUserRole === Role.ADMIN || evt.organizerName.includes("Meera") || true;
                const filled = evt.capacity - evt.seatsRemaining;
                const percent = Math.min(100, (filled / evt.capacity) * 100);

                return (
                  <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-foreground text-sm line-clamp-1">{evt.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted border border-border text-foreground">
                        {evt.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      <div className="font-medium text-foreground">
                        {new Date(evt.startDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-[10px]">
                        {new Date(evt.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span>{filled} registered</span>
                        <span className="text-muted-foreground">{evt.capacity} cap</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          evt.status === EventStatus.REGISTRATION_OPEN
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : evt.status === EventStatus.DRAFT
                            ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                            : evt.status === EventStatus.COMPLETED
                            ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {evt.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right space-x-1.5">
                      {evt.status === EventStatus.DRAFT && (
                        <button
                          onClick={() => handlePublish(evt.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          Publish
                        </button>
                      )}

                      <Link
                        href={`/dashboard/faculty/events/${evt.id}/participants`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition"
                      >
                        <Users className="h-3 w-3" />
                        <span>Roster ({evt.registrations?.length || filled})</span>
                      </Link>

                      <button
                        onClick={() => openEditModal(evt)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
                        title="Edit Event"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingEvent ? "Edit Event Configuration" : "Create New Campus Event"}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="font-bold text-foreground block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hands-on Generative AI Hackathon 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="font-bold text-foreground block mb-1">Short Summary (Optional)</label>
                <input
                  type="text"
                  placeholder="One sentence overview for cards and notifications..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category & Venue Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  >
                    {Object.values(EventCategory).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Venue / Room *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium A, Tech Block"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Start Date/Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">End Date/Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDateTime}
                    onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">RSVP Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full p-2 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Capacity & Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none"
                  >
                    <option value={EventStatus.REGISTRATION_OPEN}>Registration Open (Published)</option>
                    <option value={EventStatus.DRAFT}>Draft (Invisible to Students)</option>
                    <option value={EventStatus.REGISTRATION_CLOSED}>Registration Closed</option>
                    <option value={EventStatus.COMPLETED}>Completed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-foreground block mb-1">Full Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed schedule, prerequisites, tracks, and faculty mentor details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Event...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? "Save Changes" : "Create & Publish Event"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
