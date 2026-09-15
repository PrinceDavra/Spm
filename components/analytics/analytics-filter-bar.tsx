"use client";

import { useState } from "react";
import { Filter, RefreshCw, X } from "lucide-react";
import { AnalyticsFilterInput, AnalyticsDateRange } from "@/validators/analytics.schema";

interface AnalyticsFilterBarProps {
  onFilterChange: (filters: AnalyticsFilterInput) => void;
  isLoading?: boolean;
}

export function AnalyticsFilterBar({
  onFilterChange,
  isLoading = false,
}: AnalyticsFilterBarProps) {
  const [departmentId, setDepartmentId] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [divisionId, setDivisionId] = useState<string>("");
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>("THIS_SEMESTER");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  function handleApply() {
    const filters: AnalyticsFilterInput = {
      departmentId: departmentId || undefined,
      semester: semester ? parseInt(semester, 10) : undefined,
      divisionId: divisionId || undefined,
      dateRange,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    onFilterChange(filters);
  }

  function handleReset() {
    setDepartmentId("");
    setSemester("");
    setDivisionId("");
    setDateRange("THIS_SEMESTER");
    setStartDate("");
    setEndDate("");
    onFilterChange({ dateRange: "THIS_SEMESTER" });
  }

  const hasActiveFilters =
    Boolean(departmentId) ||
    Boolean(semester) ||
    Boolean(divisionId) ||
    dateRange !== "THIS_SEMESTER" ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Analytics Telemetry Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            <X className="w-3.5 h-3.5" />
            Clear All Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
        {/* Department */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="dept-comp">Computer Engineering</option>
            <option value="dept-it">Information Technology</option>
            <option value="dept-extc">Electronics & Telecom</option>
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Semester
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>

        {/* Division */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Class Division
          </label>
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Divisions</option>
            <option value="div-comp-a">Division A (Computer)</option>
            <option value="div-comp-b">Division B (Computer)</option>
            <option value="div-it-a">Division A (IT)</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Date Window
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as AnalyticsDateRange)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_SEMESTER">This Semester</option>
            <option value="THIS_ACADEMIC_YEAR">This Academic Year</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="flex items-end">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium py-2 px-3 rounded-xl transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {dateRange === "CUSTOM" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
