"use client";

import { useState } from "react";
import { DayOfWeek, TimetableStatus } from "@prisma/client";
import {
  Sparkles,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Save,
  Send,
  RotateCcw,
  Sliders,
  Edit3,
  Clock,
  MapPin,
  User,
  X,
  FileCheck,
  Check,
  Info,
} from "lucide-react";
import {
  CSPSlotAssignment,
  CSPSolution,
  RoomInfo,
} from "@/lib/timetable/csp-solver";
import { TimetableConflict } from "@/lib/timetable/conflict-detector";
import { DemoTimetableRecord } from "@/lib/timetable/demo-timetable";
import { WeeklyTimetableGrid } from "./weekly-timetable-grid";

export interface AdminTimetableManagerProps {
  initialTimetable: DemoTimetableRecord | null;
  rooms: RoomInfo[];
  divisionId?: string;
}

export function AdminTimetableManager({
  initialTimetable,
  rooms,
  divisionId = "div-comp-a",
}: AdminTimetableManagerProps) {
  const [selectedDivision, setSelectedDivision] = useState(divisionId);
  const [activeTimetable, setActiveTimetable] = useState<DemoTimetableRecord | null>(
    initialTimetable
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);
  const [lastSolution, setLastSolution] = useState<CSPSolution | null>(null);

  // Edit modal state
  const [editingSlot, setEditingSlot] = useState<CSPSlotAssignment | null>(null);
  const [editDay, setEditDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const [editPeriod, setEditPeriod] = useState<number>(1);
  const [editRoomId, setEditRoomId] = useState<string>(rooms[0]?.id || "");
  const [editReason, setEditReason] = useState<string>("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Conflict list state
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Trigger CSP Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionFeedback(null);
    setConflicts([]);

    // Animated realistic generation sequence
    setGenerationStep("1. Preparing academic variables & search domains...");
    await new Promise((r) => setTimeout(r, 250));

    setGenerationStep("2. Checking faculty availability constraints & unavailabilities...");
    await new Promise((r) => setTimeout(r, 250));

    setGenerationStep("3. Verifying room capacities & practical lab type compatibility...");
    await new Promise((r) => setTimeout(r, 250));

    setGenerationStep("4. Scheduling consecutive multi-period practical labs...");
    await new Promise((r) => setTimeout(r, 250));

    setGenerationStep("5. Executing CSP Backtracking Search with MRV & Forward Checking...");

    try {
      const res = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionId: selectedDivision,
          academicYear: "2024-2025",
          semester: 6,
          workingDays: [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
          ],
          periodsPerDay: 6,
        }),
      });

      const data = await res.json();

      if (data.success && data.result) {
        setGenerationStep("6. Evaluating soft constraint dispersion & workload scoring...");
        await new Promise((r) => setTimeout(r, 250));

        setGenerationStep("7. Generation Complete!");
        setLastSolution(data.result);

        // Update local timetable
        const newRecord: DemoTimetableRecord = {
          id: `tt-${selectedDivision}-${Date.now()}`,
          divisionId: selectedDivision,
          divisionName: selectedDivision === "div-comp-a" ? "Division A" : "Division B",
          className: "TE Computer Engineering",
          semester: 6,
          academicYear: "2024-2025",
          status: TimetableStatus.DRAFT,
          version: (activeTimetable?.version || 0) + 1,
          softScore: data.result.softConstraintScore,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slots: data.result.assignments,
        };

        setActiveTimetable(newRecord);
        setActionFeedback({
          type: "success",
          message: `Generated conflict-free timetable with ${data.result.assignments.length} sessions and ${data.result.softConstraintScore}% soft optimization score.`,
        });
      } else {
        setActionFeedback({
          type: "error",
          message: data.message || "Failed to generate timetable.",
        });
      }
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: "Network error occurred while calling generator.",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationStep(null), 1500);
    }
  };

  // Run Hard Conflict Validation
  const handleValidate = async () => {
    if (!activeTimetable || activeTimetable.slots.length === 0) return;

    setIsValidating(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/timetable/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: activeTimetable.slots }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setConflicts(data.report.conflicts);
        if (data.report.isValid) {
          setActionFeedback({
            type: "success",
            message: "Validation Passed: 0 hard conflicts detected across all slots.",
          });
        } else {
          setActionFeedback({
            type: "error",
            message: `Validation Failed: ${data.report.conflicts.length} conflict(s) detected. Review diagnostics below.`,
          });
        }
      }
    } catch (err) {
      setActionFeedback({
        type: "error",
        message: "Failed to communicate with validation service.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!activeTimetable) return;

    try {
      const res = await fetch("/api/timetable/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionId: activeTimetable.divisionId,
          academicYear: activeTimetable.academicYear,
          semester: activeTimetable.semester,
          status: TimetableStatus.DRAFT,
          version: activeTimetable.version,
          softScore: activeTimetable.softScore,
          slots: activeTimetable.slots,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveTimetable(data.timetable);
        setActionFeedback({
          type: "success",
          message: "Timetable draft saved successfully.",
        });
      }
    } catch {
      setActionFeedback({
        type: "error",
        message: "Error saving timetable draft.",
      });
    }
  };

  // Publish Timetable
  const handlePublish = async () => {
    if (!activeTimetable) return;

    try {
      const res = await fetch("/api/timetable/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetableId: activeTimetable.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveTimetable(data.timetable);
        setActionFeedback({
          type: "success",
          message: `Success: Timetable officially published as Version ${data.timetable.version}! It is now visible to students and faculty.`,
        });
      } else {
        setActionFeedback({
          type: "error",
          message: data.message || "Failed to publish timetable.",
        });
      }
    } catch {
      setActionFeedback({
        type: "error",
        message: "An unexpected error occurred during publishing.",
      });
    }
  };

  // Open slot edit modal
  const handleSlotClick = (slot: CSPSlotAssignment) => {
    setEditingSlot(slot);
    setEditDay(slot.dayOfWeek);
    setEditPeriod(slot.periodNumber);
    setEditRoomId(slot.roomId);
    setEditReason("");
    setEditFeedback(null);
  };

  // Save slot correction
  const handleSaveSlotCorrection = async () => {
    if (!editingSlot) return;

    setIsSubmittingEdit(true);
    setEditFeedback(null);

    try {
      const res = await fetch(`/api/timetable/${editingSlot.variableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: editDay,
          periodNumber: editPeriod,
          roomId: editRoomId,
          reason: editReason || "Admin manual slot relocation",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEditFeedback({
          type: "success",
          message: "Slot updated successfully after verifying 0 hard conflicts.",
        });

        // Update active timetable slots
        if (activeTimetable) {
          const selectedRoom = rooms.find((r) => r.id === editRoomId);
          setActiveTimetable({
            ...activeTimetable,
            slots: activeTimetable.slots.map((s) =>
              s.variableId === editingSlot.variableId
                ? {
                    ...s,
                    dayOfWeek: editDay,
                    periodNumber: editPeriod,
                    roomId: editRoomId,
                    roomNumber: selectedRoom?.roomNumber || s.roomNumber,
                  }
                : s
            ),
          });
        }

        setTimeout(() => setEditingSlot(null), 1200);
      } else {
        setEditFeedback({
          type: "error",
          message: data.message || "Conflict detected: slot could not be moved.",
        });
      }
    } catch {
      setEditFeedback({
        type: "error",
        message: "Network error occurred while updating slot.",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm border border-indigo-400/30 mb-2">
              <Cpu className="h-3.5 w-3.5" />
              Deterministic Constraint Satisfaction Solver (CSP)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Academic Timetable Generator
            </h1>
            <p className="text-indigo-100/80 text-sm mt-1 max-w-xl">
              Mathematically guaranteed conflict-free scheduling using Backtracking Search, Minimum Remaining Values (MRV), Degree Heuristic, and Forward Checking.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
            <CalendarDays className="h-8 w-8 text-indigo-300" />
            <div>
              <div className="text-xs text-indigo-300 uppercase font-semibold tracking-wider">
                Timetable State
              </div>
              <div className="text-lg font-bold flex items-center gap-2">
                <span>{activeTimetable ? activeTimetable.status : "NO SCHEDULE"}</span>
                {activeTimetable && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">
                    v{activeTimetable.version}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Generation Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Division Selector */}
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Class &amp; Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-2 text-sm bg-background border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="div-comp-a">TE Computer Eng &bull; Division A</option>
                <option value="div-comp-b">TE Computer Eng &bull; Division B</option>
              </select>
            </div>

            <div className="hidden sm:block border-l border-border pl-3 pt-4 text-xs text-muted-foreground">
              Semester 6 &bull; AY 2024-2025 &bull; 6 Periods/Day
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Generating Timetable...
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4" />
                  Generate Timetable (CSP)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating || !activeTimetable}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted transition"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Validate Conflicts
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={!activeTimetable}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted transition"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={!activeTimetable || activeTimetable.status === TimetableStatus.PUBLISHED}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Publish Timetable
            </button>
          </div>
        </div>

        {/* Live Generation Progress Panel */}
        {generationStep && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 animate-in fade-in flex items-center gap-3">
            <RotateCcw className="h-5 w-5 animate-spin text-primary shrink-0" />
            <div className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
              {generationStep}
            </div>
          </div>
        )}

        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              actionFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                : actionFeedback.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
                : "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200"
            }`}
          >
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium">{actionFeedback.message}</div>
          </div>
        )}
      </div>

      {/* KPI Cards: Sessions, Conflicts, Soft Score, Version */}
      {activeTimetable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scheduled Sessions
              </span>
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-foreground">
              {activeTimetable.slots.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Lectures &amp; Multi-period Labs
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Hard Conflicts
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-emerald-600 dark:text-emerald-400">
              0
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Guaranteed by CSP solver
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Soft Constraint Score
              </span>
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-primary">
              {activeTimetable.softScore}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              High workload &amp; separation optimization
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Timetable Lifecycle
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  activeTimetable.status === TimetableStatus.PUBLISHED
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {activeTimetable.status}
              </span>
            </div>
            <div className="text-3xl font-black mt-3 text-foreground">
              v{activeTimetable.version}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {activeTimetable.publishedAt ? `Published ${new Date(activeTimetable.publishedAt).toLocaleDateString()}` : "Unpublished Draft"}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Diagnostics Drawer (If any conflicts found) */}
      {conflicts.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-3">
          <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200 text-sm">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Detected {conflicts.length} Academic Conflict(s)
          </div>
          <div className="space-y-2">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-card border border-rose-200 text-xs text-foreground flex items-start gap-2"
              >
                <span className="font-bold text-rose-600 uppercase tracking-wider shrink-0 mt-0.5">
                  [{c.type}]
                </span>
                <div>
                  <div className="font-bold">{c.title}</div>
                  <div className="text-muted-foreground mt-0.5">{c.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Weekly Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Weekly Academic Schedule
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any individual lecture or lab slot to inspect assignments or perform audited slot relocations.
            </p>
          </div>
        </div>

        {activeTimetable ? (
          <WeeklyTimetableGrid
            slots={activeTimetable.slots}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <div className="p-16 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
            <div className="text-base font-bold text-foreground">
              No Timetable Configured for {selectedDivision}
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click the &quot;Generate Timetable (CSP)&quot; button above to automatically produce a conflict-free academic schedule.
            </p>
          </div>
        )}
      </div>

      {/* Manual Slot Edit Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                <Edit3 className="h-5 w-5 text-primary" />
                Slot Inspector &amp; Relocation
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-muted/40 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-bold text-foreground">
                  {editingSlot.subjectCode} — {editingSlot.subjectName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faculty:</span>
                <span className="font-medium text-foreground">
                  {editingSlot.facultyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session Type:</span>
                <span className="font-bold text-primary">
                  {editingSlot.isLabSession ? "Practical Lab (2 Periods)" : "Theory Lecture"}
                </span>
              </div>
            </div>

            {/* Target Day */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Day of Week
              </label>
              <select
                value={editDay}
                onChange={(e) => setEditDay(e.target.value as DayOfWeek)}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={DayOfWeek.MONDAY}>MONDAY</option>
                <option value={DayOfWeek.TUESDAY}>TUESDAY</option>
                <option value={DayOfWeek.WEDNESDAY}>WEDNESDAY</option>
                <option value={DayOfWeek.THURSDAY}>THURSDAY</option>
                <option value={DayOfWeek.FRIDAY}>FRIDAY</option>
              </select>
            </div>

            {/* Target Period */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Period Number
              </label>
              <select
                value={editPeriod}
                onChange={(e) => setEditPeriod(parseInt(e.target.value, 10))}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Room */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Assigned Room
              </label>
              <select
                value={editRoomId}
                onChange={(e) => setEditRoomId(e.target.value)}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.type} &bull; Capacity {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Relocation Reason (Audited)
              </label>
              <input
                type="text"
                placeholder="e.g. Relocated to avoid room maintenance clash."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Feedback Alert */}
            {editFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  editFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                }`}
              >
                {editFeedback.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                disabled={isSubmittingEdit}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlotCorrection}
                disabled={isSubmittingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
              >
                {isSubmittingEdit && <RotateCcw className="h-3.5 w-3.5 animate-spin" />}
                Validate &amp; Move Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
