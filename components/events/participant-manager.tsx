"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Users,
  ShieldCheck,
  TrendingUp,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RegistrationStatus, EventAttendanceStatus } from "@prisma/client";

interface ParticipantItem {
  id: string;
  eventId: string;
  userId: string;
  studentId: string;
  userName: string;
  userEmail: string;
  rollNumber: string;
  departmentName: string;
  semester: number;
  confirmationCode: string;
  registeredAt: string;
  status: RegistrationStatus;
  attendanceStatus: EventAttendanceStatus;
  attendedAt?: string | null;
  markedBy?: string | null;
}

interface ParticipantManagerProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  capacity: number;
  initialParticipants: ParticipantItem[];
  analytics: {
    capacity: number;
    totalRegistered: number;
    availableSeats: number;
    registrationRate: number;
    cancellationCount: number;
    cancellationRate: number;
    attendedCount: number;
    absentCount: number;
    attendanceRate: number;
    noShowCount: number;
  };
}

export function ParticipantManager({
  eventId,
  eventTitle,
  eventDate,
  venue,
  capacity,
  initialParticipants,
  analytics: initialAnalytics,
}: ParticipantManagerProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantItem[]>(initialParticipants);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleMarkAttendance = async (participant: ParticipantItem, status: EventAttendanceStatus) => {
    setUpdatingId(participant.id);
    setNotification(null);

    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: participant.id,
          attendanceStatus: status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark attendance");

      setParticipants((prev) =>
        prev.map((p) => (p.id === participant.id ? { ...p, ...data.participant } : p))
      );

      // Re-calculate local analytics
      const updatedList = participants.map((p) =>
        p.id === participant.id ? { ...p, ...data.participant } : p
      );
      const attendedCount = updatedList.filter(
        (p) => p.attendanceStatus === EventAttendanceStatus.PRESENT
      ).length;
      const absentCount = updatedList.filter(
        (p) => p.attendanceStatus === EventAttendanceStatus.ABSENT
      ).length;
      const totalMarked = attendedCount + absentCount;
      const attendanceRate =
        totalMarked > 0 ? Number(((attendedCount / totalMarked) * 100).toFixed(1)) : 0;

      setAnalytics((prev) => ({
        ...prev,
        attendedCount,
        absentCount,
        attendanceRate,
        noShowCount: absentCount,
      }));

      setNotification({
        message: `Attendance for ${participant.userName} marked as ${status}.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      setNotification({
        message: err instanceof Error ? err.message : "Error marking attendance",
        isError: true,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.userName.toLowerCase().includes(q) &&
        !p.rollNumber.toLowerCase().includes(q) &&
        !p.confirmationCode.toLowerCase().includes(q) &&
        !p.userEmail.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== "ALL" && p.status !== statusFilter) {
      return false;
    }
    if (attendanceFilter !== "ALL" && p.attendanceStatus !== attendanceFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard/faculty/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Events Hub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Participant Roster &amp; Attendance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {eventTitle} &bull; {venue} &bull;{" "}
            {new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Registered
          </div>
          <div className="text-2xl font-black text-foreground">
            {analytics.totalRegistered} / {capacity}
          </div>
          <div className="text-[10px] text-muted-foreground">{analytics.registrationRate}% booked</div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Seats Available
          </div>
          <div className="text-2xl font-black text-primary">{analytics.availableSeats}</div>
          <div className="text-[10px] text-muted-foreground">Unclaimed capacity</div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Attended (Present)
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {analytics.attendedCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Verified at entry desk</div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Absent / No-Show
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {analytics.absentCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Did not attend</div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Attendance Rate
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {analytics.attendanceRate}%
          </div>
          <div className="text-[10px] text-muted-foreground">Present vs total marked</div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.isError
              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          {notification.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by student name, roll no, or ticket code..."
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
            <option value="REGISTERED">Registered</option>
            <option value="ATTENDED">Attended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="text-xs font-semibold bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
          >
            <option value="ALL">All Attendance</option>
            <option value="PRESENT">Present Only</option>
            <option value="ABSENT">Absent Only</option>
            <option value="UNMARKED">Unmarked</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Student Attendee</th>
                <th className="px-4 py-3.5">Roll No &amp; Dept</th>
                <th className="px-4 py-3.5">Confirmation Code</th>
                <th className="px-4 py-3.5">Registered At</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Event Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParticipants.map((p) => {
                const isPresent = p.attendanceStatus === EventAttendanceStatus.PRESENT;
                const isAbsent = p.attendanceStatus === EventAttendanceStatus.ABSENT;
                const isUpdating = updatingId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-foreground text-sm">{p.userName}</div>
                      <div className="text-[11px] text-muted-foreground">{p.userEmail}</div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-foreground">{p.rollNumber}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.departmentName} &bull; Sem {p.semester}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border font-mono text-xs font-bold text-primary">
                        <Ticket className="h-3 w-3" />
                        <span>{p.confirmationCode}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(p.registeredAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === RegistrationStatus.ATTENDED
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : p.status === RegistrationStatus.CANCELLED
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {p.status === RegistrationStatus.CANCELLED ? (
                        <span className="text-muted-foreground text-[11px]">Registration Cancelled</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleMarkAttendance(p, EventAttendanceStatus.PRESENT)}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isPresent
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/60"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            onClick={() => handleMarkAttendance(p, EventAttendanceStatus.ABSENT)}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isAbsent
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60"
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
