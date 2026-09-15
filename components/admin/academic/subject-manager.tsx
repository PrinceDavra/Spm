"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Power,
  Users,
  FlaskConical,
  ExternalLink,
  X,
  AlertCircle,
} from "lucide-react";
import { SubjectType } from "@prisma/client";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  semester: number;
  credits: number;
  type: SubjectType;
  weeklyHours: number;
  description?: string | null;
  syllabusUrl?: string | null;
  programId?: string | null;
  laboratoryId?: string | null;
  laboratoryName?: string | null;
  requiresLab: boolean;
  isActive: boolean;
  mappedFacultyCount?: number;
}

interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface LaboratorySummary {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  isActive: boolean;
}

export function SubjectManager({
  initialSubjects,
  departments,
  laboratories,
}: {
  initialSubjects: SubjectItem[];
  departments: DepartmentSummary[];
  laboratories: LaboratorySummary[];
}) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState<SubjectItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    departmentId: string;
    semester: number;
    credits: number;
    type: SubjectType;
    weeklyHours: number;
    description: string;
    syllabusUrl: string;
    requiresLab: boolean;
    laboratoryId: string;
    isActive: boolean;
  }>({
    name: "",
    code: "",
    departmentId: departments[0]?.id || "",
    semester: 1,
    credits: 3,
    type: SubjectType.THEORY,
    weeklyHours: 3,
    description: "",
    syllabusUrl: "",
    requiresLab: false,
    laboratoryId: "",
    isActive: true,
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateModal = () => {
    setEditingSubj(null);
    setFormData({
      name: "",
      code: "",
      departmentId: departments.find((d) => d.isActive)?.id || "",
      semester: 6,
      credits: 3,
      type: SubjectType.THEORY,
      weeklyHours: 3,
      description: "",
      syllabusUrl: "",
      requiresLab: false,
      laboratoryId: "",
      isActive: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (subj: SubjectItem) => {
    setEditingSubj(subj);
    setFormData({
      name: subj.name,
      code: subj.code,
      departmentId: subj.departmentId,
      semester: subj.semester,
      credits: subj.credits,
      type: subj.type,
      weeklyHours: subj.weeklyHours,
      description: subj.description || "",
      syllabusUrl: subj.syllabusUrl || "",
      requiresLab: subj.requiresLab,
      laboratoryId: subj.laboratoryId || "",
      isActive: subj.isActive,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const payload = {
      ...formData,
      laboratoryId: formData.requiresLab || formData.type === SubjectType.LAB ? formData.laboratoryId || null : null,
      syllabusUrl: formData.syllabusUrl.trim() ? formData.syllabusUrl.trim() : null,
      description: formData.description.trim() ? formData.description.trim() : null,
    };

    try {
      if (editingSubj) {
        const res = await fetch(`/api/admin/academic/subjects/${editingSubj.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update subject");

        const dept = departments.find((d) => d.id === data.subject.departmentId);
        const lab = laboratories.find((l) => l.id === data.subject.laboratoryId);
        const enriched = {
          ...data.subject,
          departmentName: dept?.name,
          departmentCode: dept?.code,
          laboratoryName: lab?.name,
          mappedFacultyCount: editingSubj.mappedFacultyCount,
        };
        setSubjects((prev) => prev.map((s) => (s.id === editingSubj.id ? enriched : s)));
        showToast(`Subject '${data.subject.name}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create subject");

        const dept = departments.find((d) => d.id === data.subject.departmentId);
        const lab = laboratories.find((l) => l.id === data.subject.laboratoryId);
        const enriched = {
          ...data.subject,
          departmentName: dept?.name,
          departmentCode: dept?.code,
          laboratoryName: lab?.name,
          mappedFacultyCount: 0,
        };
        setSubjects((prev) => [enriched, ...prev]);
        showToast(`Subject '${data.subject.name}' created.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (subj: SubjectItem) => {
    const nextStatus = !subj.isActive;
    try {
      const res = await fetch(`/api/admin/academic/subjects/${subj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      setSubjects((prev) =>
        prev.map((s) => (s.id === subj.id ? { ...s, isActive: nextStatus } : s))
      );
      showToast(`Subject '${subj.name}' is now ${nextStatus ? "ACTIVE" : "INACTIVE"}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const filtered = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDeptId === "ALL" || s.departmentId === selectedDeptId;
    const matchType = selectedType === "ALL" || s.type === selectedType;
    return matchSearch && matchDept && matchType;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Types</option>
            <option value="THEORY">Theory</option>
            <option value="LAB">Practical Lab</option>
            <option value="ELECTIVE">Elective</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((subj) => (
          <div
            key={subj.id}
            className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
              subj.isActive ? "border-slate-200 dark:border-slate-800" : "border-slate-200/60 opacity-70"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {subj.code}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        subj.type === SubjectType.LAB
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                          : subj.type === SubjectType.ELECTIVE
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {subj.type}
                    </span>
                    {subj.requiresLab && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                        Lab Req
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1 leading-snug">
                    {subj.name}
                  </h3>
                </div>

                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                    subj.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 border border-slate-300"
                  }`}
                >
                  {subj.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span>{subj.departmentCode}</span>
                <span>&bull;</span>
                <span>Semester {subj.semester}</span>
              </div>

              {subj.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                  {subj.description}
                </p>
              )}

              {subj.laboratoryName && (
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mt-2">
                  <FlaskConical className="h-3.5 w-3.5" />
                  <span className="truncate">{subj.laboratoryName}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <span className="text-[10px] text-slate-500 block">Credits</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {subj.credits}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <span className="text-[10px] text-slate-500 block">Periods/Wk</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {subj.weeklyHours}h
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <span className="text-[10px] text-slate-500 block">Faculty</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {subj.mappedFacultyCount ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => openEditModal(subj)}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>

              <div className="flex items-center gap-3">
                {subj.syllabusUrl && (
                  <a
                    href={subj.syllabusUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span>Syllabus</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onClick={() => handleToggleStatus(subj)}
                  className="font-semibold text-slate-500 hover:text-rose-600"
                >
                  {subj.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSubj ? "Edit Academic Subject" : "Create Academic Subject"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Systems"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="COMP-307"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value as SubjectType;
                      setFormData({
                        ...formData,
                        type,
                        requiresLab: type === SubjectType.LAB || formData.requiresLab,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={SubjectType.THEORY}>THEORY</option>
                    <option value={SubjectType.LAB}>LAB (Practical)</option>
                    <option value={SubjectType.ELECTIVE}>ELECTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Periods
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {(formData.type === SubjectType.LAB || formData.requiresLab) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked Laboratory Facility
                  </label>
                  <select
                    value={formData.laboratoryId}
                    onChange={(e) => setFormData({ ...formData, laboratoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- No specific lab bound (Any compatible LAB room) --</option>
                    {laboratories
                      .filter((l) => l.isActive)
                      .map((lab) => (
                        <option key={lab.id} value={lab.id}>
                          {lab.name} ({lab.code})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus PDF URL
                </label>
                <input
                  type="url"
                  placeholder="https://campussphere.edu/syllabus/comp-301.pdf"
                  value={formData.syllabusUrl}
                  onChange={(e) => setFormData({ ...formData, syllabusUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Course modules and learning outcomes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  {isSubmitting ? "Saving..." : editingSubj ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
