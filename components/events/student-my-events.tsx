"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
  BookmarkCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { RegistrationStatus, EventAttendanceStatus } from "@prisma/client";

interface RegisteredEventItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  venue: string;
  startDateTime: string;
  endDateTime: string;
  posterUrl: string;
  registration: {
    id: string;
    confirmationCode: string;
    registeredAt: string;
    status: RegistrationStatus;
    attendanceStatus: EventAttendanceStatus;
    attendedAt?: string | null;
  };
}

interface StudentMyEventsProps {
  upcomingEvents: RegisteredEventItem[];
  pastEvents: RegisteredEventItem[];
}

export function StudentMyEvents({ upcomingEvents, pastEvents }: StudentMyEventsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [cancelTarget, setCancelTarget] = useState<RegisteredEventItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentList = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  const handleCancelRegistration = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/events/${cancelTarget.id}/cancel-registration`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel registration");
      }
      setCancelTarget(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error cancelling registration");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard/student/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Discovery Feed</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Registered Events
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Access your event passes, add them to your calendar, or manage your seat RSVPs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "upcoming"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Upcoming ({upcomingEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "past"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Past &amp; Attended ({pastEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      {currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((evt) => {
            const isAttended = evt.registration.attendanceStatus === EventAttendanceStatus.PRESENT;
            const isAbsent = evt.registration.attendanceStatus === EventAttendanceStatus.ABSENT;

            return (
              <div
                key={evt.id}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                {/* Image & Header */}
                <div className="relative h-44 w-full bg-slate-950">
                  <img
                    src={evt.posterUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Confirmation Code Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-slate-900 shadow-md">
                    <Ticket className="h-3.5 w-3.5 text-primary" />
                    <span>{evt.registration.confirmationCode}</span>
                  </div>

                  {/* Attendance badge */}
                  <div className="absolute top-3 right-3">
                    {isAttended ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Attended</span>
                      </span>
                    ) : isAbsent ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-md flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        <span>Absent</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600/90 text-white shadow-md">
                        Confirmed RSVP
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white text-xs flex justify-between items-center">
                    <span className="font-semibold">{evt.category}</span>
                    <span className="font-mono">
                      {new Date(evt.startDateTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {evt.summary}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        {new Date(evt.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(evt.endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/events/${evt.id}/calendar`}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition"
                      >
                        <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                        <span>Add to Calendar</span>
                      </a>
                      {activeTab === "upcoming" && (
                        <button
                          onClick={() => setCancelTarget(evt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          Cancel RSVP
                        </button>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/student/events/${evt.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Pass &amp; Info</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/20">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <BookmarkCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {activeTab === "upcoming" ? "No upcoming registered events" : "No past attended events yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "Browse through campus events and reserve your seats for hackathons, workshops, and placement drives."
              : "Completed events you participate in will appear here with your attendance confirmation records."}
          </p>
          <Link
            href="/dashboard/student/events"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            <span>Explore Campus Events</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Cancel RSVP Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Release Registration Seat?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm cancellation for &quot;{cancelTarget.title}&quot;. Your seat and confirmation code will be invalidated immediately.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleCancelRegistration}
                disabled={isCancelling}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Releasing Seat...</span>
                  </>
                ) : (
                  <span>Confirm Cancellation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
