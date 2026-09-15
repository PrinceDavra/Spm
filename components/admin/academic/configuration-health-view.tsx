"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  BookOpen,
  Users,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface ConfigurationHealthIssue {
  id: string;
  title: string;
  severity: "PASS" | "WARNING" | "ERROR";
  count: number;
  description: string;
  remediationHint: string;
  items: Array<{ id: string; name: string; details?: string }>;
}

interface HealthReport {
  timestamp: string;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  metrics: {
    departmentsCount: number;
    programsCount: number;
    batchesCount: number;
    divisionsCount: number;
    subjectsCount: number;
    facultyCount: number;
    mappingsCount: number;
    roomsCount: number;
    laboratoriesCount: number;
  };
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  checks: ConfigurationHealthIssue[];
}

export function ConfigurationHealthView({ initialReport }: { initialReport: HealthReport }) {
  const [report, setReport] = useState<HealthReport>(initialReport);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCheckId((prev) => (prev === id ? null : id));
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/admin/academic/health");
      if (!res.ok) throw new Error("Health check request failed");
      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to run health check");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Health Status Bar */}
      <div
        className={`rounded-2xl border p-6 shadow-md transition ${
          report.status === "HEALTHY"
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
            : report.status === "WARNING"
            ? "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            : "border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl ${
                report.status === "HEALTHY"
                  ? "bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                  : report.status === "WARNING"
                  ? "bg-amber-200/80 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
              }`}
            >
              {report.status === "HEALTHY" ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : report.status === "WARNING" ? (
                <AlertTriangle className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black tracking-tight">System Status: {report.status}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border bg-white/70 dark:bg-slate-900/70">
                  {report.totalIssues === 0 ? "100% Operational" : `${report.totalIssues} Potential Conflicts`}
                </span>
              </div>
              <p className="text-xs opacity-80 mt-1">
                Last verified audit run: {new Date(report.timestamp).toLocaleTimeString()} &bull;
                Prerequisites evaluated across all collegiate entities
              </p>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-60 dark:bg-slate-900 dark:text-white dark:border-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning Database..." : "Re-Scan Configuration"}</span>
          </button>
        </div>

        {/* Breakdown counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-black/10 dark:border-white/10 text-xs">
          <div>
            <span className="opacity-70 block text-[11px]">Total Integrity Checks</span>
            <span className="font-extrabold text-base block mt-0.5">{report.checks.length} Automated Audits</span>
          </div>
          <div>
            <span className="opacity-70 block text-[11px]">Critical Errors</span>
            <span className="font-extrabold text-base text-rose-600 dark:text-rose-400 block mt-0.5">
              {report.errorCount}
            </span>
          </div>
          <div>
            <span className="opacity-70 block text-[11px]">Warnings & Recommendations</span>
            <span className="font-extrabold text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {report.warningCount}
            </span>
          </div>
          <div>
            <span className="opacity-70 block text-[11px]">Timetable CSP Engine</span>
            <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {report.errorCount === 0 ? "READY" : "BLOCKED"}
            </span>
          </div>
        </div>
      </div>

      {/* Systematic Integrity Checks List */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Detailed Configuration Health Audits
        </h2>

        <div className="space-y-3">
          {report.checks.map((check) => {
            const isExpanded = expandedCheckId === check.id;

            return (
              <div
                key={check.id}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(check.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition select-none"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        check.severity === "PASS"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : check.severity === "WARNING"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}
                    >
                      {check.severity === "PASS" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : check.severity === "WARNING" ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{check.title}</h3>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            check.severity === "PASS"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : check.severity === "WARNING"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {check.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {check.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {check.count > 0 && (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {check.count} Flags
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-xs">
                    <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-3 mb-3 text-indigo-900 dark:text-indigo-200 font-medium">
                      <strong>Actionable Remediation:</strong> {check.remediationHint}
                    </div>

                    {check.items.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Affected Entities ({check.items.length})
                        </span>
                        <div className="divide-y divide-slate-200/60 dark:divide-slate-800 border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                          {check.items.map((item, idx) => (
                            <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {item.name}
                              </span>
                              {item.details && (
                                <span className="text-slate-500 font-mono text-[11px]">{item.details}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No offending records detected. Integrity verified.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
