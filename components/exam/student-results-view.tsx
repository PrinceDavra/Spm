"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { DemoExamResult, DemoSubjectGrade } from "@/lib/exam/demo-exams";

export function StudentResultsView() {
  const [resultsData, setResultsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<number>(6);
  const [isRevalModalOpen, setIsRevalModalOpen] = useState(false);
  const [revalSubject, setRevalSubject] = useState<DemoSubjectGrade | null>(null);
  const [revalReason, setRevalReason] = useState("");
  const [revalRequestedMarks, setRevalRequestedMarks] = useState("");
  const [submittingReval, setSubmittingReval] = useState(false);
  const [revalFeedback, setRevalFeedback] = useState<{ success?: string; error?: string } | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/results/student");
      if (res.ok) {
        const data = await res.json();
        setResultsData(data);
      }
    } catch (err) {
      console.error("Failed to load student results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleOpenReval = (sub: DemoSubjectGrade) => {
    setRevalSubject(sub);
    setRevalReason("");
    setRevalRequestedMarks("");
    setRevalFeedback(null);
    setIsRevalModalOpen(true);
  };

  const handleSubmitRevaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revalSubject) return;

    try {
      setSubmittingReval(true);
      setRevalFeedback(null);

      const res = await fetch("/api/revaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: "exam-001", // Target current semester midterm evaluation
          subjectId: revalSubject.subjectId,
          reason: revalReason,
          requestedMarks: revalRequestedMarks ? parseFloat(revalRequestedMarks) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit revaluation request");
      }

      setRevalFeedback({ success: "Revaluation request submitted successfully. You will be notified once reviewed." });
      setTimeout(() => {
        setIsRevalModalOpen(false);
        fetchResults();
      }, 1800);
    } catch (err: any) {
      setRevalFeedback({ error: err.message });
    } finally {
      setSubmittingReval(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          <div className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const currentResult: DemoExamResult | undefined = resultsData?.publishedResults?.find(
    (r: DemoExamResult) => r.semesterNumber === selectedSemester
  );

  const historicalSem = resultsData?.historicalSemesters?.find(
    (s: any) => s.semesterNumber === selectedSemester
  );

  const activeSubjects: DemoSubjectGrade[] = currentResult
    ? currentResult.subjectGrades
    : historicalSem
    ? historicalSem.subjects
    : [];

  const semesterGpa = currentResult ? currentResult.gpa : historicalSem ? historicalSem.gpa : 0;
  const creditsEarned = currentResult ? currentResult.totalCreditsEarned : historicalSem ? historicalSem.creditsEarned : 0;
  const creditsAttempted = currentResult ? currentResult.totalCreditsAttempted : historicalSem ? historicalSem.creditsAttempted : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-indigo-400/20 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Official Academic Record</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Performance & Exam Results</h1>
            <p className="mt-1 text-indigo-200 text-sm max-w-xl">
              Verified evaluation grades, semester grade point averages (GPA), and cumulative institutional standing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/transcript"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-950 shadow-md transition hover:bg-indigo-50"
            >
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <span>Official Transcript</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Top Academic Standing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Cumulative CGPA</span>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {resultsData?.cumulativeCgpa ? resultsData.cumulativeCgpa.toFixed(2) : "8.91"}
            <span className="text-xs text-slate-400 font-normal ml-1.5">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{resultsData?.degreeClassification || "First Class with Distinction"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Semester {selectedSemester} GPA</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {semesterGpa ? semesterGpa.toFixed(2) : "—"}
            <span className="text-xs text-slate-400 font-normal ml-1.5">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Weighted on {creditsAttempted} credit hours
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Credits Earned</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {creditsEarned}
            <span className="text-xs text-slate-400 font-normal ml-1.5">/ {creditsAttempted}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            100% Semester Completion
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Candidate PRN</span>
            <FileText className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white font-mono">
            {resultsData?.student?.prnNumber || "PRN2022014589"}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Roll: {resultsData?.student?.rollNumber || "22COMPA101"}
          </div>
        </div>
      </div>

      {/* Semester Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                selectedSemester === sem
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Semester {sem} {sem === 6 ? "(Current)" : ""}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Select semester to inspect graded subjects & GPA
        </div>
      </div>

      {/* Subject Grades Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Semester {selectedSemester} Course Grades
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Authoritative evaluations recorded by the Controller of Examinations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Result Status: PUBLISHED</span>
          </div>
        </div>

        {activeSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold">No published results found for Semester {selectedSemester}.</p>
            <p className="text-xs mt-1">Examinations may still be ongoing or awaiting moderation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Course Code</th>
                  <th className="px-6 py-3.5">Course Title</th>
                  <th className="px-6 py-3.5 text-center">Credits</th>
                  <th className="px-6 py-3.5 text-center">Marks</th>
                  <th className="px-6 py-3.5 text-center">Percentage</th>
                  <th className="px-6 py-3.5 text-center">Grade</th>
                  <th className="px-6 py-3.5 text-center">Grade Point</th>
                  <th className="px-6 py-3.5 text-center">Outcome</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeSubjects.map((sub) => {
                  const gradeStyles: Record<string, string> = {
                    "A+": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
                    A: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
                    "B+": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300",
                    B: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300",
                    C: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
                    D: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300",
                    F: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
                  };

                  return (
                    <tr key={sub.subjectCode} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {sub.subjectCode}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {sub.subjectName}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-semibold">
                        {sub.credits}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">
                        {sub.marksObtained}
                        <span className="text-xs text-slate-400 font-normal"> / {sub.maxMarks}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-mono">
                        {sub.percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            gradeStyles[sub.gradeLetter] || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {sub.gradeLetter}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {sub.gradePoint.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            sub.isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {sub.isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                          <span>{sub.isAbsent ? "ABSENT" : sub.isPassed ? "PASS" : "FAIL"}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenReval(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                        >
                          <span>Revaluation</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revaluation Modal */}
      {isRevalModalOpen && revalSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Request Grade Revaluation
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Submit an official revaluation petition for <strong className="text-slate-700 dark:text-slate-200">{revalSubject.subjectName} ({revalSubject.subjectCode})</strong>.
            </p>

            <form onSubmit={handleSubmitRevaluation} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500">Recorded Marks:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-base">
                    {revalSubject.marksObtained} / {revalSubject.maxMarks}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Recorded Grade:</span>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                    {revalSubject.gradeLetter} ({revalSubject.gradePoint.toFixed(1)} Pts)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected / Claimed Marks (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max={revalSubject.maxMarks}
                  value={revalRequestedMarks}
                  onChange={(e) => setRevalRequestedMarks(e.target.value)}
                  placeholder={`e.g. ${Math.min(revalSubject.maxMarks, revalSubject.marksObtained + 4)}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Justification & Reasoning *
                </label>
                <textarea
                  required
                  rows={4}
                  value={revalReason}
                  onChange={(e) => setRevalReason(e.target.value)}
                  placeholder="Specify question numbers, calculation discrepancies, or unevaluated sheets (minimum 10 characters)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {revalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    revalFeedback.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {revalFeedback.success || revalFeedback.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReval}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 transition"
                >
                  {submittingReval ? "Submitting..." : "Submit Petition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
