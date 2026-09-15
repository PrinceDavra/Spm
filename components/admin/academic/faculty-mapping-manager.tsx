"use client";

import { useState } from "react";
import {
  Sliders,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Users,
  BookOpen,
  Calendar,
  Layers,
  AlertCircle,
  X,
  TrendingUp,
} from "lucide-react";
import { SubjectType } from "@prisma/client";

interface FacultyMappingItem {
  id: string;
  facultyId: string;
  facultyName?: string;
  facultyEmployeeId?: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  subjectType?: SubjectType;
  divisionId: string;
  divisionName?: string;
  className?: string;
  semester?: number;
  academicYear: string;
  weeklyHours: number;
  isActive: boolean;
}

interface FacultySummary {
  id: string;
  facultyId?: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  departmentName?: string;
  designation?: string;
}

interface SubjectSummary {
  id: string;
  name: string;
  code: string;
  type: SubjectType;
  weeklyHours: number;
  semester: number;
  departmentId: string;
  isActive: boolean;
}

interface DivisionSummary {
  id: string;
  name: string;
  classId: string;
  className?: string;
  semester?: number;
  isActive: boolean;
}

interface WorkloadSummary {
  facultyId: string;
  facultyName: string;
  employeeId: string;
  departmentName: string;
  totalSubjects: number;
  totalDivisions: number;
  assignedWeeklyPeriods: number;
  theoryPeriods: number;
  labPeriods: number;
  scheduledWeeklyPeriods: number;
  maxWeeklyCapacity: number;
}

export function FacultyMappingManager({
  initialMappings,
  facultyList,
  subjects,
  divisions,
  workload,
}: {
  initialMappings: FacultyMappingItem[];
  facultyList: FacultySummary[];
  subjects: SubjectSummary[];
  divisions: DivisionSummary[];
  workload: WorkloadSummary[];
}) {
  const [mappings, setMappings] = useState<FacultyMappingItem[]>(initialMappings);
  const [facultyWorkload, setFacultyWorkload] = useState<WorkloadSummary[]>(workload);
  const [search, setSearch] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    facultyId: facultyList[0]?.id || "",
    subjectId: subjects[0]?.id || "",
    divisionId: divisions[0]?.id || "",
    academicYear: "2024-2025",
    weeklyHours: 3,
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAllocateModal = () => {
    const defaultSubj = subjects.find((s) => s.isActive);
    setForm({
      facultyId: facultyList[0]?.id || "",
      subjectId: defaultSubj?.id || "",
      divisionId: divisions.find((d) => d.isActive)?.id || "",
      academicYear: "2024-2025",
      weeklyHours: defaultSubj?.weeklyHours || 3,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubjectChange = (subjectId: string) => {
    const subj = subjects.find((s) => s.id === subjectId);
    setForm({
      ...form,
      subjectId,
      weeklyHours: subj?.weeklyHours || form.weeklyHours,
    });
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/academic/faculty-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to allocate faculty");

      const fac = facultyList.find((f) => f.id === data.mapping.facultyId);
      const subj = subjects.find((s) => s.id === data.mapping.subjectId);
      const div = divisions.find((d) => d.id === data.mapping.divisionId);

      const enriched: FacultyMappingItem = {
        ...data.mapping,
        facultyName: fac ? `${fac.firstName} ${fac.lastName}` : "Faculty",
        facultyEmployeeId: fac?.employeeId || "N/A",
        subjectName: subj?.name || "Subject",
        subjectCode: subj?.code || "N/A",
        subjectType: subj?.type || SubjectType.THEORY,
        divisionName: div?.name || "Division",
        className: div?.className || "Class",
        semester: subj?.semester,
      };

      setMappings((prev) => [enriched, ...prev]);

      // Re-fetch workload
      const wlRes = await fetch("/api/admin/academic/faculty-mappings/workload");
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setFacultyWorkload(wlData.workload);
      }

      showToast(`Faculty allocated to ${subj?.name} for ${div?.name}.`);
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to allocate faculty");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmap = async (mappingId: string, facultyName: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to unmap ${facultyName} from ${subjectName}?`)) return;

    try {
      const res = await fetch(`/api/admin/academic/faculty-mappings/${mappingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unmap faculty");

      setMappings((prev) => prev.filter((m) => m.id !== mappingId));

      // Re-fetch workload
      const wlRes = await fetch("/api/admin/academic/faculty-mappings/workload");
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setFacultyWorkload(wlData.workload);
      }

      showToast(`Faculty unmapped successfully.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to unmap faculty");
    }
  };

  const filtered = mappings.filter((m) => {
    const matchSearch =
      (m.facultyName && m.facultyName.toLowerCase().includes(search.toLowerCase())) ||
      (m.subjectName && m.subjectName.toLowerCase().includes(search.toLowerCase())) ||
      (m.subjectCode && m.subjectCode.toLowerCase().includes(search.toLowerCase())) ||
      (m.divisionName && m.divisionName.toLowerCase().includes(search.toLowerCase()));

    const matchFaculty = selectedFacultyId === "ALL" || m.facultyId === selectedFacultyId;
    return matchSearch && matchFaculty;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Faculty Workload Overview Bar */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          <span>Deterministic Faculty Teaching Workloads</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyWorkload.map((w) => {
            const percent = Math.min(100, Math.round((w.assignedWeeklyPeriods / w.maxWeeklyCapacity) * 100));
            return (
              <div
                key={w.facultyId}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">{w.facultyName}</h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {w.departmentName} &bull; {w.employeeId}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      percent > 90
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : percent > 60
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {w.assignedWeeklyPeriods} / {w.maxWeeklyCapacity}h ({percent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent > 90 ? "bg-rose-500" : percent > 60 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Subjects</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{w.totalSubjects}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Theory</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{w.theoryPeriods}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lab</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{w.labPeriods}h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, subject, or division..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Faculty</option>
            {facultyList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.firstName} {f.lastName}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAllocateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Allocate Faculty</span>
        </button>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Allocation Roster</h3>
            <p className="text-xs text-slate-500">Current faculty-to-course teaching bindings</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filtered.length} Bindings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Faculty Member</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Division / Class</th>
                <th className="p-3.5 text-center">Periods/Week</th>
                <th className="p-3.5 text-center">Year</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {m.facultyName}
                    <span className="block text-[11px] text-slate-400 font-normal">
                      {m.facultyEmployeeId}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-900 dark:text-white">{m.subjectName}</span>
                    <span className="block font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                      {m.subjectCode}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        m.subjectType === SubjectType.LAB
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {m.subjectType || "THEORY"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-slate-900 dark:text-white">{m.divisionName}</span>
                    <span className="block text-[11px] text-slate-500">{m.className}</span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white">
                    {m.weeklyHours}h
                  </td>
                  <td className="p-3.5 text-center text-slate-500 font-mono">{m.academicYear}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleUnmap(m.id, m.facultyName || "Faculty", m.subjectName || "Subject")}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 transition font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Unmap</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Allocate Faculty Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Member *
                </label>
                <select
                  value={form.facultyId}
                  onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firstName} {f.lastName} ({f.departmentName || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={form.subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Student Division *
                </label>
                <select
                  value={form.divisionId}
                  onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {divisions
                    .filter((d) => d.isActive)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.className || "Class"})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Teaching Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.weeklyHours}
                    onChange={(e) => setForm({ ...form, weeklyHours: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Allocating..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
