"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  topic: string;
  difficulty: string;
  marks: number;
}

interface QuizData {
  id: string;
  title: string;
  category: string;
  durationSeconds: number;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  questions?: Question[];
}

interface AttemptData {
  id: string;
  quizId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  answers: Record<string, number | null>;
}

export function StudentTimedQuiz({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz progression state
  const [phase, setPhase] = useState<"INSTRUCTIONS" | "ACTIVE" | "RESULTS">("INSTRUCTIONS");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  async function fetchQuiz() {
    setLoading(true);
    try {
      const res = await fetch(`/api/preparation/quizzes/${quizId}`);
      const data = await res.json();
      if (data.success) {
        setQuiz(data.quiz);
      }
    } catch (err) {
      console.error("Failed to load quiz", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartQuiz() {
    setSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/preparation/quizzes/${quizId}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate quiz session");
      }

      const att = data.attempt;
      setAttempt(att);
      setQuestions(att.questions || []);
      setAnswers(att.answers || {});

      // Calculate time remaining based on server-side expiresAt
      const now = new Date().getTime();
      const expires = new Date(att.expiresAt).getTime();
      const diffSeconds = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsRemaining(diffSeconds);

      setPhase("ACTIVE");
      startTimer(diffSeconds);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to start quiz attempt");
    } finally {
      setSubmitting(false);
    }
  }

  function startTimer(initialSeconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSelectOption(optionIndex: number) {
    if (!attempt || !questions[currentIndex]) return;
    const currentQ = questions[currentIndex];

    // Optimistic local state update
    const newAnswers = { ...answers, [currentQ.id]: optionIndex };
    setAnswers(newAnswers);

    // Save to server asynchronously
    try {
      await fetch(`/api/preparation/attempts/${attempt.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQ.id,
          selectedOptionIndex: optionIndex,
        }),
      });
    } catch (err) {
      console.error("Auto-save answer error", err);
    }
  }

  function toggleMarkForReview() {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  }

  async function handleSubmitAttempt() {
    if (!attempt) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetch(`/api/preparation/attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to finalize quiz attempt");
      }

      setResultsData(data.result);
      setPhase("RESULTS");
      setSubmitModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit attempt");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAutoSubmit() {
    if (!attempt) return;
    try {
      const res = await fetch(`/api/preparation/attempts/${attempt.id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setResultsData(data.result);
        setPhase("RESULTS");
      }
    } catch {
      // Fallback
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Quiz Not Available
        </h2>
        <Link
          href="/dashboard/student/placements/quizzes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: INSTRUCTIONS SCREEN
  // ==========================================
  if (phase === "INSTRUCTIONS") {
    const durationMins = Math.round(quiz.durationSeconds / 60);

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/student/placements/quizzes"
            className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>All Quizzes</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium truncate">
            {quiz.title}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {quiz.category.replace(/_/g, " ")}
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {quiz.title}
              </h1>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
              <Award className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-slate-100 dark:border-slate-800 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-400">Duration</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                {durationMins} mins
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-400">Questions</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                {quiz.questionCount}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-400">Total Marks</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-base mt-0.5">
                {quiz.totalMarks}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-400">Pass Marks</span>
              <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base mt-0.5">
                {quiz.passingMarks}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-900 dark:text-white">
              Assessment Instructions &amp; Rules:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>The timer begins the moment you click <strong>"Begin Timed Assessment"</strong>.</li>
              <li>Calculations are evaluated server-side. Refreshing the browser will resume your live attempt with the remaining time intact.</li>
              <li>When the countdown hits 00:00, your current answers will be automatically submitted.</li>
              <li>You can navigate back and forth between questions and mark questions for review.</li>
              <li>Full explanations and score breakdown will be revealed upon submission.</li>
            </ul>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/dashboard/student/placements/quizzes"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={submitting}
              onClick={handleStartQuiz}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <span>{submitting ? "Preparing Session..." : "Begin Timed Assessment"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE TIMED QUIZ MODE
  // ==========================================
  if (phase === "ACTIVE") {
    const currentQ = questions[currentIndex];
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    const isUrgent = secondsRemaining < 300; // < 5 mins
    const answeredCount = Object.keys(answers).filter((k) => answers[k] !== null).length;

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Top Sticky Bar: Timer & Progress */}
        <div className="sticky top-4 z-40 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md p-4 shadow-md dark:border-slate-800 dark:bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span>{answeredCount} Answered</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono text-sm font-extrabold transition-colors ${
              isUrgent
                ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>

          {/* Finish Button */}
          <button
            type="button"
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Finish &amp; Submit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            {currentQ && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                {/* Meta Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {currentQ.topic}
                    </span>
                    <span className="text-slate-400">Marks: {currentQ.marks}</span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleMarkForReview}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      markedForReview[currentQ.id]
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{markedForReview[currentQ.id] ? "Marked for Review" : "Mark for Review"}</span>
                  </button>
                </div>

                {/* Question Statement */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.question}
                </h2>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-4 rounded-2xl border text-sm font-medium text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-100 ring-2 ring-indigo-600/30"
                            : "border-slate-200 bg-slate-50/40 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Question Palette */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Question Palette
              </h3>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                  const isReview = markedForReview[q.id];
                  const isCurrent = idx === currentIndex;

                  let bgClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                  if (isAnswered) bgClass = "bg-emerald-600 text-white";
                  if (isReview) bgClass = "bg-amber-500 text-white";

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${bgClass} ${
                        isCurrent ? "ring-2 ring-indigo-600 ring-offset-2" : ""
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-md bg-emerald-600" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-md bg-amber-500" />
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {submitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-950/60 dark:text-indigo-400">
                <Send className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Submit Quiz Attempt?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions. Once submitted, answers are graded server-side and cannot be changed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Return to Quiz
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitAttempt}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? "Grading on Server..." : "Confirm & Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: COMPREHENSIVE RESULTS & REVIEW
  // ==========================================
  const review = resultsData?.review || resultsData;
  const passed = resultsData?.passed ?? false;
  const score = resultsData?.score ?? 0;
  const totalMarks = resultsData?.totalMarks ?? quiz.totalMarks;
  const percentage = resultsData?.percentage ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Score Card Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
          passed
            ? "bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 border border-emerald-500/30"
            : "bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950 border border-rose-500/30"
        }`}
      >
        <div className="space-y-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
              passed
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
            }`}
          >
            {passed ? "Assessment Passed" : "Needs Review"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quiz Result &bull; {quiz.title}
          </h1>
          <p className="text-xs text-slate-300">
            Authoritatively verified and graded by CampusSphere server evaluation engine.
          </p>
        </div>

        <div className="flex items-baseline gap-2 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 self-start sm:self-auto">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-lg text-slate-300 font-bold">/ {totalMarks}</span>
          <span className="ml-2 text-xs font-bold text-emerald-400">
            ({percentage}%)
          </span>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/student/placements/quizzes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Quizzes</span>
        </Link>
        <Link
          href="/dashboard/student/placements"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
        >
          <span>Return to Placement Hub</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Question by Question Detailed Review */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
          <span>Question-by-Question Detailed Review</span>
        </h2>

        {review?.questions?.map((item: any, idx: number) => {
          const isCorrect = item.isCorrect;
          const studentChoice = item.studentChoice;
          const correctIdx = item.correctOptionIndex;

          return (
            <div
              key={item.id || idx}
              className={`rounded-3xl border p-6 space-y-4 ${
                isCorrect
                  ? "border-emerald-200 bg-white dark:border-emerald-900/40 dark:bg-slate-900"
                  : "border-rose-200 bg-white dark:border-rose-900/40 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">Q{idx + 1}</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.topic}
                  </span>
                </div>
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Correct (+{item.marks} marks)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 text-xs">
                    <XCircle className="h-4 w-4" />
                    <span>Incorrect (0 marks)</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {item.question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {item.options?.map((opt: string, optIdx: number) => {
                  const wasChosen = studentChoice === optIdx;
                  const isTheCorrectOne = correctIdx === optIdx;

                  let optClass = "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";
                  if (isTheCorrectOne) {
                    optClass = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold dark:bg-emerald-950/60 dark:text-emerald-100";
                  } else if (wasChosen && !isTheCorrectOne) {
                    optClass = "border-rose-500 bg-rose-50 text-rose-950 font-bold dark:bg-rose-950/60 dark:text-rose-100";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${optClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isTheCorrectOne && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {wasChosen && !isTheCorrectOne && (
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Server Explanation */}
              {item.explanation && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 text-xs space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">
                    Explanation:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
