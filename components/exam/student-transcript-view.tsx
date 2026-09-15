"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Printer,
  Download,
  CheckCircle2,
  Award,
  Building,
  Calendar,
  FileText,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { StudentAcademicTranscript } from "@/lib/exam/demo-exams";

export function StudentTranscriptView() {
  const [transcript, setTranscript] = useState<StudentAcademicTranscript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/transcript");
        if (res.ok) {
          const data = await res.json();
          setTranscript(data.transcript);
        }
      } catch (err) {
        console.error("Failed to load academic transcript", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, []);

  const handlePrint = () => {
    window.open("/api/transcript/export?format=pdf", "_blank");
  };

  const handleCsvDownload = () => {
    window.location.href = "/api/transcript/export?format=csv";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="p-12 text-center text-slate-500">
        <GraduationCap className="h-12 w-12 mx-auto text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Transcript Unavailable</h2>
        <p className="text-sm mt-1">Unable to compile academic record at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/results"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Exam Results</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            <span>Official Academic Transcript</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive verified academic record certified by the Controller of Examinations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCsvDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF Document</span>
          </button>
        </div>
      </div>

      {/* Transcript Document Paper Layout */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 dark:border-slate-800 dark:bg-slate-900 shadow-lg relative overflow-hidden">
        {/* Institutional Header */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-700 pb-6 mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white font-bold text-xl shadow-md mb-2">
            CS
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            CampusSphere College of Engineering & Technology
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Affiliated to State Technological University | Accredited Grade &apos;A+&apos; by NAAC
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Office of the Controller of Examinations — Official Cumulative Academic Record
          </p>
          <div className="mt-3 inline-block bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-full text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            DOCUMENT REF: {transcript.summary.referenceNumber}
          </div>
        </div>

        {/* Student Metadata Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-8 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-medium">Candidate Name:</span>{" "}
              <strong className="text-slate-900 dark:text-white text-sm">{transcript.student.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Roll Number:</span>{" "}
              <strong className="text-slate-900 dark:text-white font-mono">{transcript.student.rollNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Permanent Registration No (PRN):</span>{" "}
              <strong className="text-slate-900 dark:text-white font-mono">{transcript.student.prnNumber}</strong>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-medium">Program of Study:</span>{" "}
              <strong className="text-slate-900 dark:text-white">{transcript.student.program}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Department:</span>{" "}
              <strong className="text-slate-900 dark:text-white">{transcript.student.department}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Batch / Cohort:</span>{" "}
              <strong className="text-slate-900 dark:text-white">{transcript.student.batch}</strong>
            </div>
          </div>
        </div>

        {/* Multi-Semester Tables */}
        <div className="space-y-8">
          {transcript.semesters.map((sem) => (
            <div key={sem.semesterNumber} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                <span>Semester {sem.semesterNumber} ({sem.academicYear} — Term {sem.term})</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  Semester GPA: {sem.gpa.toFixed(2)} | Credits: {sem.creditsEarned} / {sem.creditsAttempted}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Course Code</th>
                      <th className="px-4 py-2.5">Course Title</th>
                      <th className="px-4 py-2.5 text-center">Credits</th>
                      <th className="px-4 py-2.5 text-center">Max Marks</th>
                      <th className="px-4 py-2.5 text-center">Marks Obtained</th>
                      <th className="px-4 py-2.5 text-center">Grade</th>
                      <th className="px-4 py-2.5 text-center">Grade Point</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {sem.subjects.map((sub) => (
                      <tr key={sub.subjectCode} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{sub.subjectCode}</td>
                        <td className="px-4 py-2.5 font-sans text-slate-700 dark:text-slate-300">{sub.subjectName}</td>
                        <td className="px-4 py-2.5 text-center">{sub.credits}</td>
                        <td className="px-4 py-2.5 text-center text-slate-400">{sub.maxMarks}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-900 dark:text-white">{sub.marksObtained}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-indigo-600 dark:text-indigo-400">{sub.gradeLetter}</td>
                        <td className="px-4 py-2.5 text-center">{sub.gradePoint.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-center font-sans font-semibold">
                          <span className={sub.isPassed ? "text-emerald-600" : "text-rose-600"}>
                            {sub.isAbsent ? "ABSENT" : sub.isPassed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Official Summary & Verification Stamp */}
        <div className="mt-10 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1 text-xs">
            <div className="text-slate-500">Cumulative Academic Standing:</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>CGPA: {transcript.summary.cumulativeCgpa.toFixed(2)}</span>
              <span className="text-sm font-normal text-slate-400">/ 10.0</span>
            </div>
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Classification: {transcript.summary.degreeClassification}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs border-t md:border-t-0 md:border-l border-emerald-200 dark:border-emerald-800/50 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-slate-400">Total Credits Attempted:</span>
              <div className="font-bold text-slate-900 dark:text-white text-base">
                {transcript.summary.totalCreditsAttempted}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Total Credits Earned:</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                {transcript.summary.totalCreditsEarned}
              </div>
            </div>
          </div>
        </div>

        {/* Document Footnote */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <div>Issued on: {transcript.summary.issuedDate} | Electronic transcript record</div>
          <div className="flex items-center gap-1 text-emerald-600 font-semibold mt-2 sm:mt-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cryptographically Verified by CampusSphere Academic Office</span>
          </div>
        </div>
      </div>
    </div>
  );
}
