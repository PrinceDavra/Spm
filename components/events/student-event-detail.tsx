"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  CalendarPlus,
  Ticket,
  ShieldCheck,
  Share2,
  Sparkles,
  Info,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { EventCategory, EventStatus, RegistrationStatus } from "@prisma/client";

interface EventDetailProps {
  event: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    description: string;
    category: EventCategory;
    status: EventStatus;
    organizerName: string;
    organizerRole: string;
    venue: string;
    eventDate: string;
    startDateTime: string;
    endDateTime: string;
    registrationOpenAt: string;
    registrationDeadline: string;
    capacity: number;
    seatsRemaining: number;
    posterUrl: string;
    isUserRegistered: boolean;
    userRegistration?: {
      id: string;
      confirmationCode: string;
      registeredAt: string;
      status: RegistrationStatus;
      attendanceStatus: string;
    };
  };
  currentUserId: string;
}

export function StudentEventDetail({ event, currentUserId }: EventDetailProps) {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(event.isUserRegistered);
  const [userReg, setUserReg] = useState(event.userRegistration);
  const [seatsLeft, setSeatsLeft] = useState(event.seatsRemaining);

  // Dialog states
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState<{
    confirmationCode: string;
  } | null>(userReg ? { confirmationCode: userReg.confirmationCode } : null);

  const now = new Date();
  const isPast = new Date(event.endDateTime) < now || event.status === EventStatus.COMPLETED;
  const isDeadlinePassed = new Date(event.registrationDeadline) < now;
  const isNotYetOpen = new Date(event.registrationOpenAt) > now;
  const isFull = seatsLeft === 0 && !isRegistered;

  // Handle registration
  const handleConfirmRegistration = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register for this event");
      }

      setIsRegistered(true);
      setUserReg(data.registration);
      setSeatsLeft((prev) => Math.max(0, prev - 1));
      setSuccessConfirmation({ confirmationCode: data.registration.confirmationCode });
      setShowRegisterDialog(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancellation
  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/events/${event.id}/cancel-registration`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel registration");
      }

      setIsRegistered(false);
      setUserReg(undefined);
      setSuccessConfirmation(null);
      setSeatsLeft((prev) => Math.min(event.capacity, prev + 1));
      setShowCancelDialog(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Cancellation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/student/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campus Events Discovery</span>
        </Link>
      </div>

      {/* Hero Banner & Header */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Banner Image */}
        <div className="relative h-72 sm:h-96 w-full bg-slate-950">
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Badges on image */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-slate-900 shadow-md backdrop-blur-md">
              {event.category}
            </span>
            {isRegistered && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>You&apos;re Registered</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              {event.title}
            </h1>
            <p className="text-sm sm:text-base text-white/90 max-w-3xl line-clamp-2 drop-shadow">
              {event.summary}
            </p>
          </div>
        </div>

        {/* Action Bar / Meta Bar */}
        <div className="p-6 bg-card border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Date</span>
              </div>
              <div className="mt-1 font-bold text-foreground">
                {new Date(event.startDateTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Time</span>
              </div>
              <div className="mt-1 font-bold text-foreground">
                {new Date(event.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(event.endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Venue</span>
              </div>
              <div className="mt-1 font-bold text-foreground truncate max-w-[160px]">
                {event.venue}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Capacity</span>
              </div>
              <div className="mt-1 font-bold text-foreground">
                <span className="text-primary">{seatsLeft}</span> / {event.capacity} left
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {isRegistered ? (
              <>
                <a
                  href={`/api/events/${event.id}/calendar`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>Add to Calendar (.ics)</span>
                </a>
                {!isPast && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40 transition"
                  >
                    <span>Cancel RSVP</span>
                  </button>
                )}
              </>
            ) : isPast ? (
              <div className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                Event Concluded
              </div>
            ) : isDeadlinePassed ? (
              <div className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                Registration Deadline Passed
              </div>
            ) : isNotYetOpen ? (
              <div className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                Registration Opens Soon
              </div>
            ) : isFull ? (
              <div className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                Event Full (0 Seats)
              </div>
            ) : (
              <button
                onClick={() => setShowRegisterDialog(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95 transition"
              >
                <Ticket className="h-4 w-4" />
                <span>Register Now — Free Access</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Pass Card (If Registered) */}
      {isRegistered && successConfirmation && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Confirmed Registration Pass
                </div>
                <div className="font-mono text-lg font-extrabold text-foreground mt-0.5">
                  {successConfirmation.confirmationCode}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`/api/events/${event.id}/calendar`}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Export iCalendar</span>
              </a>
              <Link
                href="/dashboard/student/events/registered"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-300 dark:border-emerald-800 transition"
              >
                <BookmarkCheck className="h-3.5 w-3.5" />
                <span>View My RSVPs</span>
              </Link>
            </div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Please present this confirmation ticket or your college ID card at the entry desk of {event.venue}.
          </p>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Event */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Info className="h-5 w-5 text-primary" />
              <span>About This Event</span>
            </h2>

            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground">
              {event.description}
            </div>
          </div>

          {/* Event Milestones Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Event Schedule &amp; Milestones</span>
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary border-4 border-card" />
                <div className="text-xs font-bold text-primary">Registration Opens</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.registrationOpenAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-card" />
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Registration Closes</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.registrationDeadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })},{" "}
                  {new Date(event.registrationDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-card" />
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Event Day &amp; Commencement</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.startDateTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {new Date(event.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Organizer & Rules */}
        <div className="space-y-6">
          {/* Organizer Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
              Hosted By
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {event.organizerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{event.organizerName}</div>
                <div className="text-xs text-muted-foreground">{event.organizerRole}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
              Official institutional coordinator for event logistics, mentor scheduling, and participant verification.
            </p>
          </div>

          {/* Seat Availability Telemetry */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
              Live Seat Allocation
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Venue Seats:</span>
                <span className="font-bold text-foreground">{event.capacity}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confirmed Participants:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {event.capacity - seatsLeft}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available Remaining:</span>
                <span className="font-bold text-primary">{seatsLeft}</span>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mt-3">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((event.capacity - seatsLeft) / event.capacity) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Guidelines */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5 text-xs text-muted-foreground space-y-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Campus Policy &amp; Code of Conduct</span>
            </div>
            <p>
              Registrations are strictly non-transferable. Please bring your student ID card. If you cannot attend, please cancel your reservation to free up capacity for peers.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Dialog */}
      {showRegisterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground">Confirm Event Registration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm your reservation for this campus event.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="font-bold text-foreground">{event.title}</div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>
                  {new Date(event.startDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })},{" "}
                  {new Date(event.startDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{event.venue}</span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>{seatsLeft} seats currently available</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRegisterDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRegistration}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying Capacity...</span>
                  </>
                ) : (
                  <span>Confirm Registration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Cancel Registration?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to cancel your seat? This will release your spot to the campus waitlist.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition"
              >
                Keep My Seat
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Yes, Cancel RSVP</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
