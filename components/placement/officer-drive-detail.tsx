"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Layers,
  FileCheck,
} from "lucide-react";
import { ApplicationStatus, PlacementDriveStatus } from "@prisma/client";

export function OfficerDriveDetail({ driveId }: { driveId: string }) {
  const [drive, setDrive] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Update Status Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(ApplicationStatus.SHORTLISTED);
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDriveAndApplicants();
  }, [driveId]);

  async function fetchDriveAndApplicants() {
    setLoading(true);
    try {
      const [driveRes, appRes] = await Promise.all([
        fetch(`/api/placements/drives/${driveId}`),
        fetch(`/api/placements/applications?driveId=${driveId}`),
      ]);

      const driveData = await driveRes.json();
      if (driveData.success) {
        setDrive(driveData.drive);
      }

      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.applications || []);
      }
    } catch (err) {
      console.error("Failed to load drive & applicants", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp) return;
    setUpdating(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/placements/applications/${selectedApp.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }

      setSelectedApp(null);
      setRemarks("");
      await fetchDriveAndApplicants();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update application status");
    } finally {
      setUpdating(false);
    }
  }

  const filteredApplicants = applications.filter((app) => {
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.studentName.toLowerCase().includes(q) ||
        app.rollNumber.toLowerCase().includes(q) ||
        app.departmentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-44 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Drive Not Found
        </h2>
        <Link
          href="/dashboard/placement/drives"
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Drives</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/dashboard/placement/drives"
          className="inline-flex items-center gap-1 hover:text-indigo-600"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Placement Drives</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">
          {drive.title}
        </span>
      </div>

      {/* Drive Metadata Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <img
            src={drive.companyLogo}
            alt={drive.companyName}
            className="h-16 w-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {drive.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {drive.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              {drive.companyName} &bull; {drive.role} &bull; {drive.location}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white">
                Package: {drive.packageMin} - {drive.packageMax} LPA
              </span>
              <span>Min CGPA: {drive.minCgpa.toFixed(2)}</span>
              <span>Max Backlogs: {drive.maxBacklogs}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">
              Total Applicants
            </span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {applications.length}
            </p>
          </div>
        </div>
      </div>

      {/* Applicants Roster */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Candidate Applicants Roster
            </h2>
            <p className="text-xs text-slate-500">
              Screen candidate profiles, verify qualifications, and advance candidates through recruitment stages.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ASSESSMENT">Assessment</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {filteredApplicants.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No applicants matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                  <th className="pb-3 font-semibold">Candidate</th>
                  <th className="pb-3 font-semibold">Department &amp; Sem</th>
                  <th className="pb-3 font-semibold">CGPA</th>
                  <th className="pb-3 font-semibold">Backlogs</th>
                  <th className="pb-3 font-semibold">Current Status</th>
                  <th className="pb-3 font-semibold">Applied Date</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {app.studentName}
                        </p>
                        <p className="text-slate-400 font-mono text-[11px]">
                          {app.rollNumber}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-400">
                      {app.departmentName} &bull; Sem {app.semester}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {app.cgpa.toFixed(2)}
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-400">
                      {app.activeBacklogs || 0}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          app.status === ApplicationStatus.OFFERED || app.status === ApplicationStatus.SELECTED
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : app.status === ApplicationStatus.REJECTED
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            : app.status === ApplicationStatus.WITHDRAWN
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        Resume
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp(app);
                          setNewStatus(app.status);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Candidate Status Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Update Candidate Pipeline Stage
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedApp.studentName} ({selectedApp.rollNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
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

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Official Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                >
                  <option value="SHORTLISTED">SHORTLISTED - Passed Resume Screening</option>
                  <option value="ASSESSMENT">ASSESSMENT - Invited to Online Test</option>
                  <option value="INTERVIEW">INTERVIEW - Scheduled for Technical/HR Round</option>
                  <option value="OFFERED">OFFERED - Extended Final Offer</option>
                  <option value="REJECTED">REJECTED - Not Selected</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Officer Remarks &amp; Feedback
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared Technical Round 1 with distinction in System Design. Scheduled for HR Round."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Remarks will be visible to the student in their Application Tracker.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-md"
                >
                  {updating ? "Updating..." : "Commit Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
