"use client";

import { DayOfWeek } from "@prisma/client";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  BookOpen,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { CSPSlotAssignment } from "@/lib/timetable/csp-solver";
import { WeeklyTimetableGrid } from "./weekly-timetable-grid";

export interface FacultyTimetableViewProps {
  facultyName: string;
  totalWeeklyPeriods: number;
  todayDay: DayOfWeek;
  todaySlots: CSPSlotAssignment[];
  allSlots: CSPSlotAssignment[];
}

export function FacultyTimetableView({
  facultyName,
  totalWeeklyPeriods,
  todayDay,
  todaySlots,
  allSlots,
}: FacultyTimetableViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-white/20 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Faculty Academic Station
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Teaching Schedule &bull; {facultyName}
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
              Consolidated lecture and practical lab timetable across all assigned academic divisions.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <CalendarDays className="h-8 w-8 text-emerald-200" />
            <div>
              <div className="text-xs text-emerald-200 uppercase font-semibold tracking-wider">
                Weekly Teaching Load
              </div>
              <div className="text-lg font-bold">
                {totalWeeklyPeriods} Period{totalWeeklyPeriods === 1 ? "" : "s"} / Week
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Teaching Schedule */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Today&apos;s Teaching Schedule ({todayDay})
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {todaySlots.length} Lecture{todaySlots.length === 1 ? "" : "s"} / Labs Today
          </span>
        </div>

        {todaySlots.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No teaching commitments scheduled for today.
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
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Users className="h-3 w-3 text-primary" />
                    {slot.divisionId === "div-comp-a" ? "Div A" : "Div B"}
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

      {/* Full Weekly Teaching Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Weekly Consolidated Teaching Matrix
          </h2>
        </div>

        <WeeklyTimetableGrid slots={allSlots} readonly />
      </div>
    </div>
  );
}
