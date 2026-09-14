"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
} from "lucide-react";
import { EmploymentType, PlacementDriveStatus } from "@prisma/client";

export function OfficerDrivesManager() {
  const [drives, setDrives] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Create Drive Form state
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(EmploymentType.FULL_TIME);
  const [location, setLocation] = useState("Bangalore, India");
  const [packageMin, setPackageMin] = useState(12);
  const [packageMax, setPackageMax] = useState(18);
  const [description, setDescription] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [minCgpa, setMinCgpa] = useState(7.0);
  const [maxBacklogs, setMaxBacklogs] = useState(0);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(["Computer Science", "Information Technology"]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [drivesRes, compRes] = await Promise.all([
        fetch("/api/placements/drives"),
        fetch("/api/placements/companies"),
      ]);

      const drivesData = await drivesRes.json();
      if (drivesData.success) {
        setDrives(drivesData.drives || []);
      }

      const compData = await compRes.json();
      if (compData.success) {
        setCompanies(compData.companies || []);
        if (compData.companies?.length > 0) {
          setCompanyId(compData.companies[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load drives", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(driveId: string) {
    try {
      const res = await fetch(`/api/placements/drives/${driveId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to publish drive", err);
    }
  }

  async function handleClose(driveId: string) {
    try {
      const res = await fetch(`/api/placements/drives/${driveId}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to close drive", err);
    }
  }

  async function handleCreateDrive(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/placements/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title,
          role,
          employmentType,
          location,
          packageMin: Number(packageMin),
          packageMax: Number(packageMax),
          description,
          applicationDeadline: new Date(applicationDeadline).toISOString(),
          minCgpa: Number(minCgpa),
          maxBacklogs: Number(maxBacklogs),
          allowedDepartments: selectedDepts,
          selectionRounds: ["Online Assessment", "Technical Interview", "HR Interview"],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create placement drive");
      }

      setModalOpen(false);
      setTitle("");
      setRole("");
      setDescription("");
      await fetchInitialData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create drive");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = drives.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Placement Drives Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Publish campus drives, enforce branch-specific academic criteria, and transition drive lifecycles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 14);
            setApplicationDeadline(nextWeek.toISOString().slice(0, 10));
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Placement Drive</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search drives by title, role, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-sm"
        >
          <option value="ALL">All Drive States</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="APPLICATION_CLOSED">Application Closed</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Drives Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Placement Drives Found
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((drive) => (
            <div
              key={drive.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <img
                  src={drive.companyLogo}
                  alt={drive.companyName}
                  className="h-14 w-14 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {drive.title}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        drive.status === PlacementDriveStatus.PUBLISHED
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : drive.status === PlacementDriveStatus.DRAFT
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {drive.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    {drive.companyName} &bull; {drive.role} &bull; {drive.employmentType.replace(/_/g, " ")}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {drive.packageMin} - {drive.packageMax} LPA
                    </span>
                    <span>Min CGPA: {drive.minCgpa.toFixed(2)}</span>
                    <span>Max Backlogs: {drive.maxBacklogs}</span>
                    <span>Deadline: {new Date(drive.applicationDeadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                {drive.status === PlacementDriveStatus.DRAFT && (
                  <button
                    type="button"
                    onClick={() => handlePublish(drive.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                  >
                    Publish to Students
                  </button>
                )}

                {drive.status === PlacementDriveStatus.PUBLISHED && (
                  <button
                    type="button"
                    onClick={() => handleClose(drive.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Close Applications
                  </button>
                )}

                <Link
                  href={`/dashboard/placement/drives/${drive.id}`}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition-colors"
                >
                  <span>Review Candidates ({drive.applicationCount || 0})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Drive Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Placement Recruitment Drive
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Author drive parameters and server-side eligibility rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Partner *
                  </label>
                  <select
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Job Role / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (!title) setTitle(`${e.target.value} Campus Drive 2026`);
                    }}
                    placeholder="e.g. Software Engineer - Cloud"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Drive Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google India SWE Campus Hiring 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="INTERNSHIP_TO_FULL_TIME">Internship to FTO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Package Min (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={packageMin}
                    onChange={(e) => setPackageMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Package Max (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={packageMax}
                    onChange={(e) => setPackageMax(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 space-y-3">
                <h4 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  <span>Mandatory Academic Eligibility Criteria</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum CGPA Cutoff (0.00 - 10.00)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="10"
                      required
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Max Active Backlogs Allowed
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      required
                      value={maxBacklogs}
                      onChange={(e) => setMaxBacklogs(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Job Description &amp; Candidate Responsibilities *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities, algorithmic expectations, tech stack..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-md"
                >
                  {submitting ? "Creating..." : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
