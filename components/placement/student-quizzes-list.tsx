"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Flame,
  Filter,
  Sparkles,
} from "lucide-react";
import { PrepCategory } from "@prisma/client";

interface QuizItem {
  id: string;
  slug: string;
  title: string;
  category: PrepCategory;
  durationSeconds: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
}

export function StudentQuizzesList() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    setLoading(true);
    try {
      const res = await fetch("/api/preparation/quizzes");
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedCategory !== "ALL" && q.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl dark:border-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-sm">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Timed Placement Assessments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Timed Evaluation Quizzes
          </h1>
          <p className="text-sm text-indigo-100/80 leading-relaxed">
            Simulate real recruitment screener rounds with server-enforced countdown timers, instant server grading, question palette review, and comprehensive explanations.
          </p>
        </div>

        <Link
          href="/dashboard/student/placements/preparation"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-800/60 text-white text-xs font-bold hover:bg-indigo-700/60 border border-indigo-400/30 transition-colors shrink-0"
        >
          <BookOpen className="h-4 w-4 text-indigo-300" />
          <span>Browse Prep Bank</span>
        </Link>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["ALL", "QUANTITATIVE_APTITUDE", "LOGICAL_REASONING", "VERBAL_ABILITY", "DSA", "DBMS", "PROGRAMMING"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
            }`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Award className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Quizzes Available in this Category
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Try switching to "ALL" to explore other available aptitude and coding diagnostics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const durationMins = Math.round(quiz.durationSeconds / 60);

            return (
              <div
                key={quiz.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {quiz.category.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{durationMins} mins</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {quiz.title}
                  </h3>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                    <div>
                      <p className="text-slate-400 text-[11px]">Questions</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{quiz.questionCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Total Marks</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{quiz.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px]">Passing</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{quiz.passingMarks}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-2">
                  <Link
                    href={`/dashboard/student/placements/quizzes/${quiz.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <span>Start Timed Attempt</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
