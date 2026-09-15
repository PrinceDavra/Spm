"use client";

import { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Users,
  X,
  AlertCircle,
  Building2,
} from "lucide-react";

interface DivisionItem {
  id: string;
  classId: string;
  name: string;
  code?: string | null;
  capacity: number;
  isActive: boolean;
  className?: string;
  departmentName?: string;
  departmentCode?: string;
}

interface ClassItem {
  id: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  semester: number;
  name: string;
  academicYear: string;
  isActive: boolean;
  divisions: DivisionItem[];
}

interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export function ClassManager({
  initialClasses,
  departments,
}: {
  initialClasses: ClassItem[];
  departments: DepartmentSummary[];
}) {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [search, setSearch] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isDivModalOpen, setIsDivModalOpen] = useState(false);
  const [editingDiv, setEditingDiv] = useState<DivisionItem | null>(null);

  const [classForm, setClassForm] = useState({
    name: "",
    departmentId: departments[0]?.id || "",
    semester: 1,
    academicYear: "2024-2025",
    isActive: true,
  });

  const [divForm, setDivForm] = useState({
    classId: classes[0]?.id || "",
    name: "",
    code: "",
    capacity: 60,
    isActive: true,
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openCreateClassModal = () => {
    setClassForm({
      name: "",
      departmentId: departments.find((d) => d.isActive)?.id || "",
      semester: 1,
      academicYear: "2024-2025",
      isActive: true,
    });
    setFormError("");
    setIsClassModalOpen(true);
  };

  const openCreateDivModal = (targetClassId?: string) => {
    setEditingDiv(null);
    setDivForm({
      classId: targetClassId || classes[0]?.id || "",
      name: "Division A",
      code: "DIV-A",
      capacity: 60,
      isActive: true,
    });
    setFormError("");
    setIsDivModalOpen(true);
  };

  const openEditDivModal = (div: DivisionItem) => {
    setEditingDiv(div);
    setDivForm({
      classId: div.classId,
      name: div.name,
      code: div.code || "",
      capacity: div.capacity,
      isActive: div.isActive,
    });
    setFormError("");
    setIsDivModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/academic/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create class");

      const dept = departments.find((d) => d.id === data.class.departmentId);
      const newCls: ClassItem = {
        ...data.class,
        departmentName: dept?.name,
        departmentCode: dept?.code,
        divisions: [],
      };
      setClasses((prev) => [newCls, ...prev]);
      showToast(`Class '${data.class.name}' created.`);
      setIsClassModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (divForm.capacity <= 0) {
      setFormError("Student capacity must be strictly greater than 0");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingDiv) {
        const res = await fetch(`/api/admin/academic/divisions/${editingDiv.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(divForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update division");

        setClasses((prev) =>
          prev.map((c) => ({
            ...c,
            divisions: c.divisions.map((d) => (d.id === editingDiv.id ? { ...d, ...data.division } : d)),
          }))
        );
        showToast(`Division '${data.division.name}' updated.`);
      } else {
        const res = await fetch("/api/admin/academic/divisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(divForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create division");

        setClasses((prev) =>
          prev.map((c) =>
            c.id === divForm.classId ? { ...c, divisions: [...c.divisions, data.division] } : c
          )
        );
        showToast(`Division '${data.division.name}' created.`);
      }
      setIsDivModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save division");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.divisions.some((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    const matchDept = selectedDeptId === "ALL" || c.departmentId === selectedDeptId;
    return matchSearch && matchDept;
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
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes or divisions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateClassModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </button>
          <button
            onClick={() => openCreateDivModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Division</span>
          </button>
        </div>
      </div>

      {/* Class & Division Tree */}
      <div className="space-y-4">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/60 dark:text-blue-400 font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {cls.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {cls.departmentName} ({cls.departmentCode})
                    </span>
                    <span>&bull;</span>
                    <span>Semester {cls.semester}</span>
                    <span>&bull;</span>
                    <span>{cls.academicYear}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openCreateDivModal(cls.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Division</span>
              </button>
            </div>

            {/* Divisions List */}
            <div className="pt-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Student Divisions ({cls.divisions.length})
              </h4>
              {cls.divisions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
                  No divisions created for this class yet. Click "+ Add Division" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cls.divisions.map((div) => (
                    <div
                      key={div.id}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {div.name}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                              div.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            }`}
                          >
                            {div.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        {div.code && (
                          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold block">
                            Code: {div.code}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>Max Capacity: <strong className="text-slate-800 dark:text-slate-200">{div.capacity}</strong></span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-end">
                        <button
                          onClick={() => openEditDivModal(div)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create Academic Class</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TE Computer Engineering"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department *
                </label>
                <select
                  value={classForm.departmentId}
                  onChange={(e) => setClassForm({ ...classForm, departmentId: e.target.value })}
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
                    Semester Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={classForm.semester}
                    onChange={(e) => setClassForm({ ...classForm, semester: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2024-2025"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Division Modal */}
      {isDivModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingDiv ? "Edit Student Division" : "Create Student Division"}
              </h3>
              <button onClick={() => setIsDivModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDivision} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {!editingDiv && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Class *
                  </label>
                  <select
                    value={divForm.classId}
                    onChange={(e) => setDivForm({ ...divForm, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.departmentCode} - Sem {c.semester})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Division Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Division A"
                    value={divForm.name}
                    onChange={(e) => setDivForm({ ...divForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CE-A"
                    value={divForm.code}
                    onChange={(e) => setDivForm({ ...divForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Capacity *
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={divForm.capacity}
                  onChange={(e) => setDivForm({ ...divForm, capacity: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="divActive"
                  checked={divForm.isActive}
                  onChange={(e) => setDivForm({ ...divForm, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="divActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active Division
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDivModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingDiv ? "Save Changes" : "Create Division"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
