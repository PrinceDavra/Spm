"use client";

import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Power,
  Calendar,
  Layers,
  X,
  AlertCircle,
  Building2,
} from "lucide-react";

interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface ProgramItem {
  id: string;
  name: string;
  code: string;
  degree: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
  activeBatchesCount?: number;
}

interface BatchItem {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  programId: string;
  programName?: string;
  programCode?: string;
  departmentName?: string;
  currentSemester: number;
  isActive: boolean;
}

export function ProgramManager({
  initialPrograms,
  initialBatches,
  departments,
}: {
  initialPrograms: ProgramItem[];
  initialBatches: BatchItem[];
  departments: DepartmentSummary[];
}) {
  const [activeTab, setActiveTab] = useState<"PROGRAMS" | "BATCHES">("PROGRAMS");
  const [programs, setPrograms] = useState<ProgramItem[]>(initialPrograms);
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [search, setSearch] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");

  // Program Modal State
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<ProgramItem | null>(null);
  const [progForm, setProgForm] = useState({
    name: "",
    code: "",
    degree: "B.Tech",
    departmentId: departments[0]?.id || "",
    durationYears: 4,
    totalSemesters: 8,
    isActive: true,
  });

  // Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [batchForm, setBatchForm] = useState({
    name: "",
    startYear: 2024,
    endYear: 2028,
    programId: programs[0]?.id || "",
    currentSemester: 1,
    isActive: true,
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Modals
  const openCreateProgModal = () => {
    setEditingProg(null);
    setProgForm({
      name: "",
      code: "",
      degree: "B.Tech",
      departmentId: departments.find((d) => d.isActive)?.id || "",
      durationYears: 4,
      totalSemesters: 8,
      isActive: true,
    });
    setFormError("");
    setIsProgModalOpen(true);
  };

  const openEditProgModal = (prog: ProgramItem) => {
    setEditingProg(prog);
    setProgForm({
      name: prog.name,
      code: prog.code,
      degree: prog.degree,
      departmentId: prog.departmentId,
      durationYears: prog.durationYears,
      totalSemesters: prog.totalSemesters,
      isActive: prog.isActive,
    });
    setFormError("");
    setIsProgModalOpen(true);
  };

  const openCreateBatchModal = () => {
    setEditingBatch(null);
    setBatchForm({
      name: `Batch ${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 4,
      programId: programs.find((p) => p.isActive)?.id || "",
      currentSemester: 1,
      isActive: true,
    });
    setFormError("");
    setIsBatchModalOpen(true);
  };

  const openEditBatchModal = (b: BatchItem) => {
    setEditingBatch(b);
    setBatchForm({
      name: b.name,
      startYear: b.startYear,
      endYear: b.endYear,
      programId: b.programId,
      currentSemester: b.currentSemester,
      isActive: b.isActive,
    });
    setFormError("");
    setIsBatchModalOpen(true);
  };

  // Handle Save Program
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      if (editingProg) {
        const res = await fetch(`/api/admin/academic/programs/${editingProg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update program");

        const dept = departments.find((d) => d.id === data.program.departmentId);
        const enriched = {
          ...data.program,
          departmentName: dept?.name,
          departmentCode: dept?.code,
        };
        setPrograms((prev) => prev.map((p) => (p.id === editingProg.id ? enriched : p)));
        showToast(`Program '${data.program.name}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create program");

        const dept = departments.find((d) => d.id === data.program.departmentId);
        const enriched = {
          ...data.program,
          departmentName: dept?.name,
          departmentCode: dept?.code,
          activeBatchesCount: 0,
        };
        setPrograms((prev) => [enriched, ...prev]);
        showToast(`Program '${data.program.name}' created.`);
      }
      setIsProgModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save program");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Batch
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (batchForm.endYear <= batchForm.startYear) {
      setFormError("Batch end year must be strictly greater than start year");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingBatch) {
        const res = await fetch(`/api/admin/academic/batches/${editingBatch.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update batch");

        const prog = programs.find((p) => p.id === data.batch.programId);
        const enriched = {
          ...data.batch,
          programName: prog?.name,
          programCode: prog?.code,
        };
        setBatches((prev) => prev.map((b) => (b.id === editingBatch.id ? enriched : b)));
        showToast(`Batch '${data.batch.name}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batchForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create batch");

        const prog = programs.find((p) => p.id === data.batch.programId);
        const enriched = {
          ...data.batch,
          programName: prog?.name,
          programCode: prog?.code,
        };
        setBatches((prev) => [enriched, ...prev]);
        showToast(`Batch '${data.batch.name}' created.`);
      }
      setIsBatchModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters
  const filteredPrograms = programs.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.degree.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDeptId === "ALL" || p.departmentId === selectedDeptId;
    return matchSearch && matchDept;
  });

  const filteredBatches = batches.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.programName && b.programName.toLowerCase().includes(search.toLowerCase())) ||
      (b.programCode && b.programCode.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs and Actions Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switch */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start">
          <button
            onClick={() => setActiveTab("PROGRAMS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "PROGRAMS"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Academic Programs ({programs.length})
          </button>
          <button
            onClick={() => setActiveTab("BATCHES")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "BATCHES"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Student Batches ({batches.length})
          </button>
        </div>

        {/* Search & Add button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "PROGRAMS" ? "Search programs..." : "Search batches..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {activeTab === "PROGRAMS" && (
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code}
                </option>
              ))}
            </select>
          )}

          {activeTab === "PROGRAMS" ? (
            <button
              onClick={openCreateProgModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Program</span>
            </button>
          ) : (
            <button
              onClick={openCreateBatchModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Academic Programs List */}
      {activeTab === "PROGRAMS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((prog) => (
            <div
              key={prog.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center dark:bg-purple-950/60 dark:text-purple-400 font-bold text-xs">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {prog.name}
                      </h3>
                      <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {prog.code} &bull; {prog.degree}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      prog.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {prog.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Department:</span>{" "}
                  {prog.departmentName || "Unassigned"}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Duration</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {prog.durationYears} Years
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Semesters</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                      {prog.totalSemesters} Sems
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Batches</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      {prog.activeBatchesCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditProgModal(prog)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  ID: {prog.id.substring(0, 12)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Batches List */}
      {activeTab === "BATCHES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400 font-bold text-xs">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {b.name}
                      </h3>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {b.programName}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      b.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {b.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Intake</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{b.startYear}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Graduation</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{b.endYear}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                    <span className="text-[10px] text-slate-500 block">Current Sem</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                      Sem {b.currentSemester}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => openEditBatchModal(b)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium">
                  Span: {b.endYear - b.startYear} Years
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Program Modal */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingProg ? "Edit Academic Program" : "Create Academic Program"}
              </h3>
              <button onClick={() => setIsProgModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Technology in Computer Engineering"
                  value={progForm.name}
                  onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BTECH-CSE"
                    value={progForm.code}
                    onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Degree Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="B.Tech"
                    value={progForm.degree}
                    onChange={(e) => setProgForm({ ...progForm, degree: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department *
                </label>
                <select
                  value={progForm.departmentId}
                  onChange={(e) => setProgForm({ ...progForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments
                    .filter((d) => d.isActive)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={progForm.durationYears}
                    onChange={(e) => setProgForm({ ...progForm, durationYears: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Semesters
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={progForm.totalSemesters}
                    onChange={(e) => setProgForm({ ...progForm, totalSemesters: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProgModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingProg ? "Save Changes" : "Create Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingBatch ? "Edit Student Batch" : "Create Student Batch"}
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batch 2024-2028"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Program *
                </label>
                <select
                  value={batchForm.programId}
                  onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {programs
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Year (Intake) *
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    required
                    value={batchForm.startYear}
                    onChange={(e) => setBatchForm({ ...batchForm, startYear: parseInt(e.target.value, 10) || 2024 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Year (Graduation) *
                  </label>
                  <input
                    type="number"
                    min={2001}
                    max={2110}
                    required
                    value={batchForm.endYear}
                    onChange={(e) => setBatchForm({ ...batchForm, endYear: parseInt(e.target.value, 10) || 2028 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Semester
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={batchForm.currentSemester}
                  onChange={(e) => setBatchForm({ ...batchForm, currentSemester: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingBatch ? "Save Changes" : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
