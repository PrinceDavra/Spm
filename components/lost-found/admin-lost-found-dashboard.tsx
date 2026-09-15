"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  FileCheck,
  TrendingUp,
  Inbox,
  Sparkles,
} from "lucide-react";
import { LostFoundType, LostFoundStatus } from "@prisma/client";

interface Item {
  id: string;
  referenceNumber: string;
  type: LostFoundType;
  title: string;
  category: string;
  status: LostFoundStatus;
  location: string;
  dateLostFound: string;
  reporterName?: string;
  createdAt: string;
}

export function AdminLostFoundDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  useEffect(() => {
    fetchData();
  }, [selectedType, selectedStatus, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.set("type", selectedType);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);
      if (search.trim()) params.set("search", search.trim());

      const [itemsRes, analyticsRes] = await Promise.all([
        fetch(`/api/lost-found?${params.toString()}`),
        fetch("/api/lost-found/analytics"),
      ]);

      const itemsData = await itemsRes.json();
      const analyticsData = await analyticsRes.json();

      if (itemsData.success) setItems(itemsData.items || []);
      if (analyticsData.success) setAnalytics(analyticsData.analytics || null);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/lost-found/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: "Resolved by administrator." }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Graceful
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this case?")) return;
    try {
      const res = await fetch(`/api/lost-found/${id}/archive`, { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch {
      // Graceful
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Institutional Governance
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            Lost & Found Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor campus belongings, review proof-of-ownership claims, and manage dispute resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/lost-found/claims"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition"
          >
            <FileCheck className="h-4 w-4" />
            Claims Verification Desk ({analytics?.pendingClaims || 0})
          </Link>
        </div>
      </div>

      {/* KPI Overview Widgets */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Total Registered Cases</span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.totalReports || 0}
          </div>
          <span className="text-[11px] text-slate-400">
            {analytics?.lostCount || 0} Lost • {analytics?.foundCount || 0} Found
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Active Open Cases</span>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
            {analytics?.openCases || 0}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting owner recovery</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Pending Claims</span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {analytics?.pendingClaims || 0}
          </div>
          <span className="text-[11px] text-slate-400">Needs staff verification</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Campus Recovery Rate</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {analytics?.recoveryRate || 0}%
          </div>
          <span className="text-[11px] text-slate-400">Successfully resolved</span>
        </div>
      </div>

      {/* Reports Table & Filtering */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by title, case ref, reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-purple-500 dark:border-slate-800 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="ALL">All Types</option>
              <option value="LOST">Lost Only</option>
              <option value="FOUND">Found Only</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-950"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLAIM_PENDING">Claim Pending</option>
              <option value="VERIFICATION">Verification</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading cases...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No cases match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50">
                <tr>
                  <th className="p-3.5 pl-4 font-bold">Case Ref</th>
                  <th className="p-3.5 font-bold">Type</th>
                  <th className="p-3.5 font-bold">Item Title</th>
                  <th className="p-3.5 font-bold">Category</th>
                  <th className="p-3.5 font-bold">Location</th>
                  <th className="p-3.5 font-bold">Reporter</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 pr-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 pl-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.referenceNumber}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase text-white ${
                          item.type === LostFoundType.LOST ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {item.category.replace(/_/g, " ")}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">
                      {item.location}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {item.reporterName || "Campus User"}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === LostFoundStatus.RESOLVED
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.status === LostFoundStatus.CLAIM_PENDING
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/student/lost-found/${item.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Inspect
                      </Link>

                      {item.status !== LostFoundStatus.RESOLVED && (
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={() => handleArchive(item.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
