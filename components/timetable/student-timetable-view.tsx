"use client";

import { DayOfWeek } from "@prisma/client";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  BookOpen,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { CSPSlotAssignment } from "@/lib/timetable/csp-solver";
import { DemoTimetableRecord } from "@/lib/timetable/demo-timetable";
import { WeeklyTimetableGrid } from "./weekly-timetable-grid";

export interface StudentTimetableViewProps {
  divisionName: string;
  className: string;
  timetable: DemoTimetableRecord | null;
  todayDay: DayOfWeek;
  todaySlots: CSPSlotAssignment[];
}

export function StudentTimetableView({
  divisionName,
  className,
  timetable,
  todayDay,
  todaySlots,
}: StudentTimetableViewProps) {
  const nextClass = todaySlots[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-white/20 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official Institutional Schedule
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Class Timetable &bull; {divisionName}
            </h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
              {className} &bull; Semester 6. View your verified lecture schedule, practical labs, and daily classroom allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <CalendarDays className="h-8 w-8 text-blue-200" />
            <div>
              <div className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Schedule State
              </div>
              <div className="text-lg font-bold flex items-center gap-2">
                <span>{timetable ? timetable.status : "PENDING"}</span>
                {timetable && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100">
                    v{timetable.version}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Today&apos;s Lectures &amp; Labs ({todayDay})
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {todaySlots.length} Session{todaySlots.length === 1 ? "" : "s"} Scheduled
          </span>
        </div>

        {todaySlots.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No scheduled lectures for today. Enjoy your academic study break!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todaySlots.map((slot) => (
              <div
                key={slot.variableId}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  slot.isLabSession
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-muted/40 border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1">
                    <span>Period {slot.periodNumber}</span>
                    <span className="font-mono">{slot.startTime} – {slot.endTime}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-primary">
                    {slot.subjectCode}
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5 line-clamp-1">
                    {slot.subjectName}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2 mt-3">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {slot.facultyName.split(" ").slice(-1)[0]}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <MapPin className="h-3 w-3 text-primary" />
                    {slot.roomNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Weekly Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Complete Weekly Academic Matrix
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-indigo-100 border border-indigo-300 dark:bg-indigo-900" />
              Theory Lecture
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-emerald-100 border border-emerald-300 dark:bg-emerald-900" />
              Practical Lab (2 Periods)
            </span>
          </div>
        </div>

        {timetable ? (
          <WeeklyTimetableGrid slots={timetable.slots} readonly />
        ) : (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            No published timetable is currently active for your division.
          </div>
        )}
      </div>
    </div>
  );
}
