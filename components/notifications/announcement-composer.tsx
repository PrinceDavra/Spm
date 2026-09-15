"use client";

import { useState } from "react";
import {
  Megaphone,
  X,
  Send,
  Loader2,
  Users,
  Building2,
  Layers,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Role, NoticeAudience, NoticePriority, NoticeCategory } from "@prisma/client";

interface AnnouncementComposerProps {
  userRole: Role;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AnnouncementComposer({
  userRole,
  isOpen,
  onClose,
  onSuccess,
}: AnnouncementComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<NoticeCategory>(NoticeCategory.GENERAL);
  const [priority, setPriority] = useState<NoticePriority>(NoticePriority.NORMAL);
  const [audience, setAudience] = useState<NoticeAudience>(NoticeAudience.ALL);
  const [departmentId, setDepartmentId] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [divisionId, setDivisionId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || undefined,
        category,
        priority,
        audience,
        departmentId: departmentId || undefined,
        semester: semester ? Number(semester) : undefined,
        divisionId: divisionId || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to broadcast announcement");
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Compose Targeted Announcement
              </h2>
              <p className="text-xs text-slate-500">
                Author and broadcast instant notifications to campus groups
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for Mid-Term Coursework Evaluation"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={NoticeCategory.GENERAL}>General Circular</option>
                <option value={NoticeCategory.ACADEMIC}>Academic Notice</option>
                <option value={NoticeCategory.EXAMINATION}>Examination</option>
                <option value={NoticeCategory.ATTENDANCE}>Attendance Advisory</option>
                <option value={NoticeCategory.PLACEMENT}>Placement Drive</option>
                <option value={NoticeCategory.EVENT}>Campus Event</option>
                <option value={NoticeCategory.CLUB}>Club Announcement</option>
                <option value={NoticeCategory.URGENT}>Urgent Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NoticePriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={NoticePriority.NORMAL}>Normal (Routine update)</option>
                <option value={NoticePriority.IMPORTANT}>Important (High priority)</option>
                <option value={NoticePriority.URGENT}>Urgent (Critical notification)</option>
              </select>
            </div>
          </div>

          {/* Audience Targeting */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Target Audience & Scope</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Everyone", value: NoticeAudience.ALL },
                { label: "Students", value: NoticeAudience.STUDENTS },
                { label: "Faculty", value: NoticeAudience.FACULTY },
                { label: "Department", value: NoticeAudience.DEPARTMENT },
                { label: "Semester", value: NoticeAudience.SEMESTER },
                { label: "Division", value: NoticeAudience.DIVISION },
              ].map((aud) => (
                <button
                  key={aud.value}
                  type="button"
                  onClick={() => setAudience(aud.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    audience === aud.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>

            {/* Department/Semester/Division conditional selectors */}
            {(audience === NoticeAudience.DEPARTMENT ||
              audience === NoticeAudience.SEMESTER ||
              audience === NoticeAudience.DIVISION) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">All Departments</option>
                    <option value="dept-comp">Computer Engineering (COMP)</option>
                    <option value="dept-it">Information Technology (IT)</option>
                    <option value="dept-extc">Electronics & Telecom (EXTC)</option>
                    <option value="dept-mech">Mechanical Engineering (MECH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Any Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    placeholder="e.g. div-comp-a"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief preview line shown on notification bells"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Content & Body *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete details, instructions, links, or guidelines..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Publish & Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
