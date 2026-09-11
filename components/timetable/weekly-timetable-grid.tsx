"use client";

import { DayOfWeek } from "@prisma/client";
import { CSPSlotAssignment } from "@/lib/timetable/csp-solver";
import { BookOpen, FlaskConical, MapPin, User, Clock } from "lucide-react";

export interface TimetableGridProps {
  slots: CSPSlotAssignment[];
  workingDays?: DayOfWeek[];
  periodsCount?: number;
  periodTimings?: Array<{ periodNumber: number; startTime: string; endTime: string }>;
  onSlotClick?: (slot: CSPSlotAssignment) => void;
  highlightFaculty?: string;
  highlightSubject?: string;
  readonly?: boolean;
}

const DEFAULT_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

const DEFAULT_TIMINGS = [
  { periodNumber: 1, startTime: "09:00", endTime: "10:00" },
  { periodNumber: 2, startTime: "10:00", endTime: "11:00" },
  { periodNumber: 3, startTime: "11:15", endTime: "12:15" },
  { periodNumber: 4, startTime: "12:15", endTime: "01:15" },
  { periodNumber: 5, startTime: "02:00", endTime: "03:00" },
  { periodNumber: 6, startTime: "03:00", endTime: "04:00" },
];

export function WeeklyTimetableGrid({
  slots,
  workingDays = DEFAULT_DAYS,
  periodsCount = 6,
  periodTimings = DEFAULT_TIMINGS,
  onSlotClick,
  highlightFaculty,
  highlightSubject,
  readonly = false,
}: TimetableGridProps) {
  // Map slots by "DAY-PERIOD" for quick O(1) cell lookup
  const slotMap = new Map<string, CSPSlotAssignment>();
  for (const s of slots) {
    slotMap.set(`${s.dayOfWeek}-${s.periodNumber}`, s);
  }

  const periods = Array.from({ length: periodsCount }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left min-w-[780px]">
        {/* Table Header: Working Days */}
        <thead>
          <tr className="bg-muted/50 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <th className="p-3.5 w-28 text-center border-r border-border">
              Period / Time
            </th>
            {workingDays.map((day) => (
              <th key={day} className="p-3.5 text-center border-r border-border last:border-r-0">
                {day}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body: Periods */}
        <tbody className="divide-y divide-border">
          {periods.map((periodNum) => {
            const timing = periodTimings.find((t) => t.periodNumber === periodNum) || {
              startTime: `${periodNum + 8}:00`,
              endTime: `${periodNum + 9}:00`,
            };

            return (
              <tr key={periodNum} className="hover:bg-muted/10 transition-colors">
                {/* Period Time Column */}
                <td className="p-3 text-center bg-muted/20 border-r border-border align-middle">
                  <div className="font-extrabold text-xs text-foreground">
                    Period {periodNum}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timing.startTime} – {timing.endTime}
                  </div>
                </td>

                {/* Day Columns */}
                {workingDays.map((day) => {
                  const slot = slotMap.get(`${day}-${periodNum}`);

                  if (!slot) {
                    return (
                      <td
                        key={`${day}-${periodNum}`}
                        className="p-2 border-r border-border last:border-r-0 align-top"
                      >
                        <div className="h-24 rounded-xl border border-dashed border-border/70 flex items-center justify-center text-xs text-muted-foreground/60 select-none bg-muted/5">
                          Free Slot
                        </div>
                      </td>
                    );
                  }

                  const isHighlighted =
                    (highlightFaculty && slot.facultyId === highlightFaculty) ||
                    (highlightSubject && slot.subjectId === highlightSubject);

                  return (
                    <td
                      key={`${day}-${periodNum}`}
                      className="p-1.5 border-r border-border last:border-r-0 align-top"
                    >
                      <div
                        onClick={() => !readonly && onSlotClick?.(slot)}
                        className={`h-24 p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          slot.isLabSession
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400"
                            : "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400"
                        } ${
                          isHighlighted ? "ring-2 ring-primary shadow-md scale-[1.02]" : ""
                        } ${!readonly ? "cursor-pointer active:scale-95" : ""}`}
                      >
                        {/* Top: Code & Badge */}
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-mono text-xs font-black text-foreground truncate">
                            {slot.subjectCode}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                              slot.isLabSession
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700"
                                : "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700"
                            }`}
                          >
                            {slot.isLabSession ? "Lab" : "Lecture"}
                          </span>
                        </div>

                        {/* Middle: Subject Name */}
                        <div className="text-xs font-semibold text-foreground line-clamp-1 mt-0.5">
                          {slot.subjectName}
                        </div>

                        {/* Bottom: Faculty & Room */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-1 mt-1">
                          <span className="flex items-center gap-1 truncate max-w-[110px]" title={slot.facultyName}>
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{slot.facultyName.split(" ").slice(-1)[0]}</span>
                          </span>
                          <span className="flex items-center gap-0.5 font-medium shrink-0 text-foreground/80">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            {slot.roomNumber.replace("Room ", "R-").replace("Computer Lab ", "Lab-")}
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
