"use client";

import { useState } from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  Building2,
  Building,
  Award,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  User,
  Briefcase,
} from "lucide-react";
import { UnifiedProfile } from "@/services/profile.service";

export function FacultyProfileView({
  initialProfile,
}: {
  initialProfile: UnifiedProfile;
}) {
  const [profile, setProfile] = useState<UnifiedProfile>(initialProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [editPhone, setEditPhone] = useState(profile.phone || "");
  const [editOfficeRoom, setEditOfficeRoom] = useState(profile.faculty?.officeRoom || "");
  const [editQualification, setEditQualification] = useState(profile.faculty?.qualification || "");
  const [editSpecialization, setEditSpecialization] = useState(profile.faculty?.specialization || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl || "");
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editPhone,
          officeRoom: editOfficeRoom,
          qualification: editQualification,
          specialization: editSpecialization,
          avatarUrl: editAvatarUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || "Failed to update profile.");
        showToast("error", data.message || "Failed to update profile.");
        setIsSaving(false);
        return;
      }

      setProfile(data.profile);
      setIsEditOpen(false);
      showToast("success", "Faculty profile updated successfully!");
    } catch {
      setFormError("Network error while updating profile.");
      showToast("error", "Network connection failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const faculty = profile.faculty;
  const initials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-100 border-emerald-800"
              : "bg-rose-950/90 text-rose-100 border-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="h-36 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute right-6 bottom-4 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Faculty Academic Roster</span>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 gap-4">
            <div className="flex items-end gap-5">
              <div className="h-28 w-28 rounded-2xl border-4 border-white bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-emerald-600/20 dark:border-slate-900 overflow-hidden flex-shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {faculty?.designation} &bull; Dept. of {faculty?.department}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditPhone(profile.phone || "");
                setEditOfficeRoom(faculty?.officeRoom || "");
                setEditQualification(faculty?.qualification || "");
                setEditSpecialization(faculty?.specialization || "");
                setEditAvatarUrl(profile.avatarUrl || "");
                setIsEditOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>Update Faculty Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Official Appointment vs Academic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Official Institutional Records */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950 dark:text-emerald-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Official Appointment Credentials
                  </h2>
                  <p className="text-xs text-slate-500">Institutional records governed by Administration</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                <Lock className="h-3 w-3 text-slate-500" />
                Immutable by Faculty
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Employee ID
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {faculty?.employeeId}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Assigned by HR / Registrar</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Department
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {faculty?.department}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3 w-3" />
                  Academic Designation
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {faculty?.designation}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Official Email
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 break-all">
                  {profile.email}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Specialization & Research */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              Academic Specialization &amp; Research Interests
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Specialization:</span>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                  {faculty?.specialization || "Not specified"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Highest Qualification:</span>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                  {faculty?.qualification || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Contact & Cabin Room */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Campus Location &amp; Contact
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mt-0.5">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-500 uppercase text-[10px]">
                    Cabin / Office Room
                  </div>
                  <div className="text-slate-900 dark:text-white font-medium">
                    {faculty?.officeRoom || "Not assigned"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mt-0.5">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-500 uppercase text-[10px]">
                    Direct Extension / Mobile
                  </div>
                  <div className="text-slate-900 dark:text-white font-medium">
                    {profile.phone || "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Permitted Faculty Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Cabin / Office Room
                </label>
                <input
                  type="text"
                  value={editOfficeRoom}
                  onChange={(e) => setEditOfficeRoom(e.target.value)}
                  placeholder="e.g. Room 408, Faculty Annex Building"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Academic Qualification
                </label>
                <input
                  type="text"
                  value={editQualification}
                  onChange={(e) => setEditQualification(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Research Specialization
                </label>
                <input
                  type="text"
                  value={editSpecialization}
                  onChange={(e) => setEditSpecialization(e.target.value)}
                  placeholder="e.g. Distributed Systems & Cloud Computing"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 94220 54321"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Avatar / Photo URL
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Faculty Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
