"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  PlusCircle,
  ArrowLeft,
  MapPin,
  Trash2,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ClubActivityType } from "@prisma/client";

interface ActivityItem {
  id: string;
  clubId: string;
  title: string;
  description: string;
  activityDate: string;
  activityType: ClubActivityType;
  venue?: string | null;
}

interface ActivitiesManagerProps {
  clubId: string;
  clubName: string;
  initialActivities: ActivityItem[];
}

export function CoordinatorActivitiesManager({
  clubId,
  clubName,
  initialActivities,
}: ActivitiesManagerProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityType, setActivityType] = useState<ClubActivityType>(ClubActivityType.WORKSHOP);
  const [venue, setVenue] = useState("");

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          activityDate: new Date(activityDate).toISOString(),
          activityType,
          venue: venue.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule activity");

      setActivities((prev) => [data.activity, ...prev]);
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setActivityDate("");
      setVenue("");
      setFeedback({ message: `Activity "${data.activity.title}" scheduled successfully!` });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to remove this activity?")) return;

    setDeletingId(activityId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/activities/${activityId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setFeedback({ message: "Activity removed." });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ message: err instanceof Error ? err.message : "Error", isError: true });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <Link
          href="/dashboard/club"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Coordinator Station</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Club Activities &amp; Sessions &bull; {clubName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule workshops, team meetings, code sprints, and internal practice rounds.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Schedule New Activity</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* Activities List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Scheduled Sessions ({activities.length})
          </h2>
        </div>

        {activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {act.activityType}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{act.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{act.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {new Date(act.activityDate).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {act.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {act.venue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeleteActivity(act.id)}
                    disabled={deletingId === act.id}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-rose-600 hover:border-rose-200 transition"
                  >
                    {deletingId === act.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <div>No activities currently scheduled.</div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-bold hover:underline"
            >
              Click here to schedule your first session
            </button>
          </div>
        )}
      </div>

      {/* Schedule Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Schedule Club Activity</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Activity Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ROS Navigation Stack Hands-on Lab"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Activity Type *</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.values(ClubActivityType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Venue / Link</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Hardware Lab Block A or Google Meet"
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Description &amp; Agenda *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what members will work on..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Schedule Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
