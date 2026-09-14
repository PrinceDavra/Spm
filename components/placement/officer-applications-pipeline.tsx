"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  History,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { ApplicationStatus } from "@prisma/client";

export function OfficerApplicationsPipeline() {
  const [applications, setApplications] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [driveFilter, setDriveFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Status Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(ApplicationStatus.SHORTLISTED);
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [historyModalApp, setHistoryModalApp] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [appRes, drivesRes] = await Promise.all([
        fetch("/api/placements/applications"),
        fetch("/api/placements/drives"),
      ]);

      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.applications || []);
      }

      const drivesData = await drivesRes.json();
      if (drivesData.success) {
        setDrives(drivesData.drives || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications pipeline", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp) return;
    setUpdating(true);

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
      if (data.success) {
        setSelectedApp(null);
        setRemarks("");
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to commit status change", err);
    } finally {
      setUpdating(false);
    }
  }

  const filtered = applications.filter((a) => {
    if (driveFilter !== "ALL" && a.driveId !== driveFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.rollNumber.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.driveTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Master Candidate Recruitment Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cross-drive student applicant management, recruitment status transitions, and audit trails.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate by name, roll no, or drive..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
          />
        </div>

        <select
          value={driveFilter}
          onChange={(e) => setDriveFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-sm"
        >
          <option value="ALL">All Drives</option>
          {drives.map((d) => (
            <option key={d.id} value={d.id}>
              {d.companyName} - {d.role}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-sm"
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

      {/* Applications Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Candidate Records Found
          </h3>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="pb-3 font-semibold">Candidate</th>
                <th className="pb-3 font-semibold">Company &amp; Drive</th>
                <th className="pb-3 font-semibold">CGPA</th>
                <th className="pb-3 font-semibold">Branch</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Applied</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">{app.studentName}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{app.rollNumber}</p>
                  </td>
                  <td className="py-3.5">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{app.companyName}</p>
                    <p className="text-slate-500 text-[11px]">{app.driveTitle}</p>
                  </td>
                  <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {app.cgpa.toFixed(2)}
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400">
                    {app.departmentName}
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
                    <button
                      type="button"
                      onClick={() => setHistoryModalApp(app)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                    >
                      History
                    </button>
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

      {/* Update Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Update Candidate Status
            </h3>
            <p className="text-xs text-slate-500">
              {selectedApp.studentName} &bull; {selectedApp.companyName}
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="ASSESSMENT">ASSESSMENT</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="OFFERED">OFFERED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Recruiter Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Official status update notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {updating ? "Saving..." : "Commit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Audit History
                </h3>
                <p className="text-xs text-slate-500">
                  {historyModalApp.studentName} &bull; {historyModalApp.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {historyModalApp.statusHistory?.map((h: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Transition: {h.newStatus}</span>
                    <span className="text-[11px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Changed by: {h.changerName}</p>
                  {h.remarks && <p className="text-slate-600 dark:text-slate-300 italic">"{h.remarks}"</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
