"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  Eye,
  Award,
} from "lucide-react";
import { PrepCategory, QuestionDifficulty } from "@prisma/client";

interface QuestionItem {
  id: string;
  category: PrepCategory;
  question: string;
  options: string[];
  topic: string;
  difficulty: QuestionDifficulty;
  marks: number;
}

interface CategoryInfo {
  category: PrepCategory;
  title: string;
  description: string;
  questionCount: number;
  quizCount: number;
}

export function StudentPrepBank() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PrepCategory | "ALL">("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive self-test states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedCategory, difficultyFilter]);

  async function fetchInitialData() {
    try {
      const catRes = await fetch("/api/preparation/categories");
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }

  async function fetchQuestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (difficultyFilter !== "ALL") params.set("difficulty", difficultyFilter);

      const res = await fetch(`/api/preparation/questions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Failed to load questions", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuestions = questions.filter((q) => {
    if (search.trim()) {
      const query = search.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        q.topic.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-purple-100 bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl dark:border-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/30 backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Placement Knowledge Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Aptitude &amp; Technical Prep Bank
          </h1>
          <p className="text-sm text-purple-100/80 leading-relaxed">
            Master campus interview questions across Quantitative Math, Logical Reasoning, DSA, DBMS, Operating Systems, and HR situational frameworks.
          </p>
        </div>

        <Link
          href="/dashboard/student/placements/quizzes"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 text-sm font-extrabold hover:bg-slate-100 transition-colors shadow-lg shadow-black/20 self-start sm:self-auto shrink-0"
        >
          <Clock className="h-4 w-4 text-purple-600" />
          <span>Launch Timed Quizzes</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
            selectedCategory === "ALL"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          All Topics
        </button>
        {categories.map((c) => (
          <button
            key={c.category}
            type="button"
            onClick={() => setSelectedCategory(c.category)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === c.category
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
            }`}
          >
            {c.title} ({c.questionCount})
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or specific topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
          />
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-sm"
        >
          <option value="ALL">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {/* Questions Browser */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
          <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Questions Found
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your topic category or difficulty filter to view other interview questions.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredQuestions.map((q, idx) => {
            const userChoice = selectedAnswers[q.id];
            const isRevealed = revealedQuestions[q.id];

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 hover:border-purple-200 transition-all"
              >
                {/* Topic & Difficulty Badges */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      {q.topic}
                    </span>
                    <span className="text-slate-400">Q{idx + 1}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      q.difficulty === "EASY"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : q.difficulty === "MEDIUM"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                {/* Question Statement */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {q.question}
                </h3>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({
                            ...selectedAnswers,
                            [q.id]: optIdx,
                          });
                        }}
                        className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-white border border-slate-300 dark:border-slate-700 dark:bg-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300 shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Practice Interactive Self-Check */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {userChoice !== undefined
                      ? `Selected Option ${String.fromCharCode(65 + userChoice)}`
                      : "Select an option to test your knowledge"}
                  </span>

                  <Link
                    href="/dashboard/student/placements/quizzes"
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    <span>Test on Timed Quiz</span>
                    <ArrowRight className="h-3 w-3" />
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
