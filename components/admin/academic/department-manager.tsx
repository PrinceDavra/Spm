"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  GraduationCap,
  BookOpen,
  FlaskConical,
  X,
  AlertCircle,
} from "lucide-react";

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headOfDepartment?: string | null;
  isActive: boolean;
  programsCount?: number;
  subjectsCount?: number;
  labsCount?: number;
  facultyCount?: number;
}

export function DepartmentManager({ initialDepartments }: { initialDepartments: DepartmentItem[] }) {
  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    headOfDepartment: "",
    description: "",
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
    setEditingDept(null);
    setFormData({
      name: "",
      code: "",
      headOfDepartment: "",
      description: "",
      isActive: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment || "",
      description: dept.description || "",
      isActive: dept.isActive,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      if (editingDept) {
        // PATCH
        const res = await fetch(`/api/admin/academic/departments/${editingDept.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update department");

        setDepartments((prev) =>
          prev.map((d) => (d.id === editingDept.id ? { ...d, ...data.department } : d))
        );
        showToast(`Department '${data.department.name}' updated successfully.`);
      } else {
        // POST
        const res = await fetch("/api/admin/academic/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create department");

        setDepartments((prev) => [data.department, ...prev]);
        showToast(`Department '${data.department.name}' created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept: DepartmentItem) => {
    const nextStatus = !dept.isActive;
    try {
      const res = await fetch(`/api/admin/academic/departments/${dept.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status toggle failed");

      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, isActive: nextStatus } : d))
      );
      showToast(
        `Department '${dept.name}' is now ${nextStatus ? "ACTIVE" : "INACTIVE"}.`
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  // Filtering
  const filtered = departments.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "ACTIVE") return matchSearch && d.isActive;
    if (statusFilter === "INACTIVE") return matchSearch && !d.isActive;
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department name, code, or HOD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => (
          <div
            key={dept.id}
            className={`rounded-2xl border p-5 bg-white dark:bg-slate-900 shadow-sm transition flex flex-col justify-between ${
              dept.isActive
                ? "border-slate-200 dark:border-slate-800"
                : "border-slate-200/60 dark:border-slate-800/60 opacity-75 bg-slate-50/50 dark:bg-slate-950/40"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400 font-bold text-xs">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {dept.name}
                    </h3>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Code: {dept.code}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    dept.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {dept.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              {dept.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
                  {dept.description}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">HOD:</span>{" "}
                  {dept.headOfDepartment || "Not Assigned"}
                </div>
              </div>

              {/* Stats pills */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                    <GraduationCap className="h-3 w-3" />
                    <span>Prog</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {dept.programsCount ?? 0}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                    <BookOpen className="h-3 w-3" />
                    <span>Subj</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {dept.subjectsCount ?? 0}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                    <FlaskConical className="h-3 w-3" />
                    <span>Labs</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {dept.labsCount ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => openEditModal(dept)}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleToggleStatus(dept)}
                className={`inline-flex items-center gap-1 font-semibold transition ${
                  dept.isActive
                    ? "text-slate-500 hover:text-rose-600"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{dept.isActive ? "Deactivate" : "Reactivate"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">No departments found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or status filter</p>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingDept ? "Edit Department" : "Create New Department"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Code (Uppercase) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MECH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. P. Deshmukh"
                  value={formData.headOfDepartment}
                  onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Academic objectives and branch scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active Department
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
