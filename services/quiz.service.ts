import { prisma } from "@/lib/prisma";
import { isDatabaseOnline } from "@/lib/db-health";
import {
  Role,
  PrepCategory,
  QuestionDifficulty,
  QuizStatus,
  AttemptStatus,
} from "@prisma/client";
import {
  DEMO_PREP_QUESTIONS_STORE,
  DEMO_QUIZZES_STORE,
  DEMO_QUIZ_ATTEMPTS_STORE,
  DemoPrepQuestion,
  DemoQuiz,
  DemoQuizAttempt,
  DemoQuizAnswer,
} from "@/lib/placement/demo-placements";
import {
  CreateQuestionInput,
  UpdateQuestionInput,
  CreateQuizInput,
  UpdateQuizInput,
} from "@/validators/placement.schema";

export interface StudentProgressReport {
  readinessScore: number;
  readinessTier: "Placement Ready" | "High Potential" | "Developing Skills" | "Early Stage";
  componentScores: {
    quizPerformance: number;
    preparationConsistency: number;
    skillCoverage: number;
    academicEligibility: number;
    applicationActivity: number;
  };
  metrics: {
    quizzesAttempted: number;
    quizzesPassed: number;
    averageScorePercent: number;
    highestScorePercent: number;
    totalQuestionsAnswered: number;
    overallAccuracy: number;
  };
  strongTopics: string[];
  weakTopics: string[];
  recommendedCategories: PrepCategory[];
}

export class QuizService {
  // ==========================================
  // QUESTIONS BANK
  // ==========================================

  static async getCategories(): Promise<
    { category: PrepCategory; title: string; description: string; questionCount: number; quizCount: number }[]
  > {
    const categories: { category: PrepCategory; title: string; description: string }[] = [
      { category: PrepCategory.QUANTITATIVE_APTITUDE, title: "Quantitative Aptitude", description: "Arithmetic, algebra, geometry, probability, speed math" },
      { category: PrepCategory.LOGICAL_REASONING, title: "Logical Reasoning", description: "Puzzles, syllogisms, blood relations, series completion" },
      { category: PrepCategory.VERBAL_ABILITY, title: "Verbal Ability", description: "Grammar, reading comprehension, vocabulary, sentence correction" },
      { category: PrepCategory.DATA_INTERPRETATION, title: "Data Interpretation", description: "Charts, graphs, tables, caselets and data sufficiency" },
      { category: PrepCategory.TECHNICAL_MCQ, title: "Technical Core MCQs", description: "CS fundamentals, computer architecture, algorithms" },
      { category: PrepCategory.PROGRAMMING, title: "Programming Languages", description: "C++, Java, Python, JavaScript code execution logic" },
      { category: PrepCategory.DSA, title: "Data Structures & Algorithms", description: "Arrays, trees, graphs, sorting, searching, DP" },
      { category: PrepCategory.DBMS, title: "Database Management Systems", description: "SQL, indexing, normalization, transactions, ACID" },
      { category: PrepCategory.OPERATING_SYSTEMS, title: "Operating Systems", description: "Processes, threads, deadlock, virtual memory, scheduling" },
      { category: PrepCategory.NETWORKS, title: "Computer Networks", description: "OSI model, TCP/IP, routing, HTTP/HTTPS, DNS" },
      { category: PrepCategory.OOP, title: "Object Oriented Programming", description: "Inheritance, polymorphism, encapsulation, design patterns" },
      { category: PrepCategory.HR_INTERVIEW, title: "HR Interview Prep", description: "Behavioral questions, situational judgment, STAR method" },
      { category: PrepCategory.TECHNICAL_INTERVIEW, title: "Technical Interview", description: "System design, problem-solving, architectural scenarios" },
      { category: PrepCategory.COMPANY_SPECIFIC, title: "Company-Specific Papers", description: "Previous placement pattern questions from top tech firms" },
    ];

    return categories.map((c) => ({
      ...c,
      questionCount: DEMO_PREP_QUESTIONS_STORE.filter((q) => q.category === c.category).length,
      quizCount: DEMO_QUIZZES_STORE.filter((qz) => qz.category === c.category).length,
    }));
  }

  static async getQuestions(options?: {
    category?: PrepCategory;
    difficulty?: QuestionDifficulty;
    topic?: string;
    search?: string;
    userRole?: Role | string;
  }): Promise<any[]> {
    let list = [...DEMO_PREP_QUESTIONS_STORE];

    if (options?.category) {
      list = list.filter((q) => q.category === options.category);
    }
    if (options?.difficulty) {
      list = list.filter((q) => q.difficulty === options.difficulty);
    }
    if (options?.topic && options.topic.trim()) {
      const t = options.topic.toLowerCase().trim();
      list = list.filter((q) => q.topic.toLowerCase().includes(t));
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
      );
    }

    // Security check: Students must NEVER see correctOptionIndex or explanation in general question browsing
    if (options?.userRole === Role.STUDENT) {
      return list.map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        isActive: q.isActive,
      }));
    }

    return list;
  }

  static async getQuestionById(id: string, userRole?: Role | string): Promise<any | null> {
    const question = DEMO_PREP_QUESTIONS_STORE.find((q) => q.id === id);
    if (!question) return null;

    if (userRole === Role.STUDENT) {
      return {
        id: question.id,
        category: question.category,
        question: question.question,
        options: question.options,
        topic: question.topic,
        difficulty: question.difficulty,
        marks: question.marks,
        isActive: question.isActive,
      };
    }

    return question;
  }

  static async createQuestion(
    input: CreateQuestionInput,
    userId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPrepQuestion> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can author questions");
    }

    const now = new Date().toISOString();
    const newQuestion: DemoPrepQuestion = {
      id: `pq-${Date.now().toString(36)}`,
      category: input.category,
      question: input.question,
      options: input.options,
      correctOptionIndex: input.correctOptionIndex,
      explanation: input.explanation || "",
      difficulty: input.difficulty || QuestionDifficulty.MEDIUM,
      topic: input.topic,
      marks: input.marks || 1,
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    DEMO_PREP_QUESTIONS_STORE.unshift(newQuestion);
    return newQuestion;
  }

  static async updateQuestion(
    id: string,
    input: UpdateQuestionInput,
    userId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoPrepQuestion> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can update questions");
    }

    const q = DEMO_PREP_QUESTIONS_STORE.find((item) => item.id === id);
    if (!q) throw new Error("Question not found");

    if (input.category !== undefined) q.category = input.category;
    if (input.question !== undefined) q.question = input.question;
    if (input.options !== undefined) q.options = input.options;
    if (input.correctOptionIndex !== undefined) q.correctOptionIndex = input.correctOptionIndex;
    if (input.explanation !== undefined) q.explanation = input.explanation || "";
    if (input.difficulty !== undefined) q.difficulty = input.difficulty;
    if (input.topic !== undefined) q.topic = input.topic;
    if (input.marks !== undefined) q.marks = input.marks;
    if (input.isActive !== undefined) q.isActive = input.isActive;
    q.updatedAt = new Date().toISOString();

    return q;
  }

  // ==========================================
  // QUIZZES
  // ==========================================

  static async getQuizzes(
    optionsOrRole?:
      | {
          category?: PrepCategory;
          status?: QuizStatus;
          search?: string;
          userRole?: Role | string;
          userId?: string;
        }
      | Role
      | string
  ): Promise<DemoQuiz[]> {
    let list = [...DEMO_QUIZZES_STORE];
    let role: Role | string | undefined;

    if (typeof optionsOrRole === "string") {
      role = optionsOrRole;
    } else if (typeof optionsOrRole === "object") {
      role = optionsOrRole.userRole;
      if (optionsOrRole.category) {
        list = list.filter((q) => q.category === optionsOrRole.category);
      }
      if (optionsOrRole.status) {
        list = list.filter((q) => q.status === optionsOrRole.status);
      }
      if (optionsOrRole.search && optionsOrRole.search.trim()) {
        const q = optionsOrRole.search.toLowerCase().trim();
        list = list.filter(
          (quiz) =>
            quiz.title.toLowerCase().includes(q) ||
            quiz.category.toLowerCase().includes(q)
        );
      }
    }

    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      list = list.filter((q) => q.status === QuizStatus.PUBLISHED);
    }

    return list;
  }

  static async getQuizById(
    idOrSlug: string,
    role?: Role | string
  ): Promise<any | null> {
    const quiz = DEMO_QUIZZES_STORE.find(
      (q) => q.id === idOrSlug || q.slug === idOrSlug
    );
    if (!quiz) return null;

    if (quiz.status === QuizStatus.DRAFT && role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      return null;
    }

    // Questions projection
    const questions = quiz.questionIds
      .map((qid) => DEMO_PREP_QUESTIONS_STORE.find((q) => q.id === qid))
      .filter((q): q is DemoPrepQuestion => q !== undefined);

    // If student, sanitize questions (NO correctOptionIndex or explanation)
    const isPrivileged = role === Role.PLACEMENT_OFFICER || role === Role.ADMIN;
    const sanitizedQuestions = questions.map((q) => ({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      ...(isPrivileged ? { correctOptionIndex: q.correctOptionIndex, explanation: q.explanation } : {}),
    }));

    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  static async createQuiz(
    input: CreateQuizInput,
    userId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoQuiz> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can configure quizzes");
    }

    const slug = input.slug || this.slugify(input.title);
    const existing = DEMO_QUIZZES_STORE.find((q) => q.slug === slug);
    if (existing) throw new Error(`Quiz with slug "${slug}" already exists`);

    // Pick questions if not provided
    let questionIds = input.questionIds || [];
    if (questionIds.length === 0) {
      const candidates = DEMO_PREP_QUESTIONS_STORE.filter(
        (q) => q.category === input.category
      );
      questionIds = candidates.slice(0, input.questionCount).map((q) => q.id);
    }

    const now = new Date().toISOString();
    const newQuiz: DemoQuiz = {
      id: `qz-${Date.now().toString(36)}`,
      title: input.title,
      slug,
      category: input.category,
      durationSeconds: input.durationSeconds || 1800,
      questionCount: questionIds.length || input.questionCount || 10,
      totalMarks: input.totalMarks || 20,
      passingMarks: input.passingMarks || 10,
      status: input.status || QuizStatus.DRAFT,
      questionIds,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    DEMO_QUIZZES_STORE.unshift(newQuiz);
    return newQuiz;
  }

  static async updateQuiz(
    id: string,
    input: UpdateQuizInput,
    userId: string,
    role: Role | string = Role.PLACEMENT_OFFICER
  ): Promise<DemoQuiz> {
    if (role !== Role.PLACEMENT_OFFICER && role !== Role.ADMIN) {
      throw new Error("Forbidden: Only placement officers and administrators can update quizzes");
    }

    const quiz = DEMO_QUIZZES_STORE.find((q) => q.id === id);
    if (!quiz) throw new Error("Quiz not found");

    if (input.title !== undefined) quiz.title = input.title;
    if (input.category !== undefined) quiz.category = input.category;
    if (input.durationSeconds !== undefined) quiz.durationSeconds = input.durationSeconds;
    if (input.totalMarks !== undefined) quiz.totalMarks = input.totalMarks;
    if (input.passingMarks !== undefined) quiz.passingMarks = input.passingMarks;
    if (input.status !== undefined) quiz.status = input.status;
    if (input.questionIds !== undefined) {
      quiz.questionIds = input.questionIds;
      quiz.questionCount = input.questionIds.length;
    }
    quiz.updatedAt = new Date().toISOString();

    return quiz;
  }

  // ==========================================
  // TIMED QUIZ ENGINE
  // ==========================================

  static async startAttempt(
    quizId: string,
    studentOrUserId: string | { id: string; userId: string; firstName: string; lastName: string }
  ): Promise<any> {
    let student: { id: string; userId: string; firstName: string; lastName: string };

    if (typeof studentOrUserId === "string") {
      student = {
        id: `std-${studentOrUserId}`,
        userId: studentOrUserId,
        firstName: "Tirth",
        lastName: "Patel",
      };
    } else {
      student = studentOrUserId;
    }

    const quiz = DEMO_QUIZZES_STORE.find((q) => q.id === quizId);
    if (!quiz) throw new Error("Quiz not found");

    if (quiz.status !== QuizStatus.PUBLISHED) {
      throw new Error("Quiz is not currently available for attempts");
    }

    const now = new Date();

    // Check for an existing in-progress attempt
    const activeAttempt = DEMO_QUIZ_ATTEMPTS_STORE.find(
      (a) =>
        a.quizId === quizId &&
        a.studentUserId === student.userId &&
        a.status === AttemptStatus.IN_PROGRESS
    );

    if (activeAttempt) {
      // Check if expired
      if (new Date(activeAttempt.expiresAt) < now) {
        // Auto-submit expired attempt
        await this.submitAttempt(activeAttempt.id, student.userId);
      } else {
        // Resume active attempt
        const sanitizedQuestions = this.getSanitizedAttemptQuestions(quiz);
        return {
          ...activeAttempt,
          attempt: activeAttempt,
          questions: sanitizedQuestions,
        };
      }
    }

    // Create new attempt
    const expiresAt = new Date(now.getTime() + quiz.durationSeconds * 1000);
    const newAttempt: DemoQuizAttempt = {
      id: `att-${Date.now().toString(36)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizCategory: quiz.category,
      studentId: student.id,
      studentUserId: student.userId,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      submittedAt: null,
      score: 0,
      percentage: 0,
      passed: false,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalUnanswered: quiz.questionIds.length,
      timeTakenSeconds: 0,
      answers: {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    DEMO_QUIZ_ATTEMPTS_STORE.unshift(newAttempt);
    const sanitizedQuestions = this.getSanitizedAttemptQuestions(quiz);

    return {
      ...newAttempt,
      attempt: newAttempt,
      questions: sanitizedQuestions,
    };
  }

  static async recordAnswer(
    attemptId: string,
    arg2: string,
    arg3: any,
    arg4?: any
  ): Promise<DemoQuizAttempt> {
    let studentUserId: string;
    let questionId: string;
    let selectedOptionIndex: number | null;

    if (typeof arg4 === "string") {
      // (attemptId, questionId, selectedOptionIndex, studentUserId)
      questionId = arg2;
      selectedOptionIndex = arg3;
      studentUserId = arg4;
    } else {
      // (attemptId, studentUserId, questionId, selectedOptionIndex)
      studentUserId = arg2;
      questionId = arg3;
      selectedOptionIndex = arg4 !== undefined ? arg4 : null;
    }

    const attempt = DEMO_QUIZ_ATTEMPTS_STORE.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    if (attempt.studentUserId !== studentUserId) {
      throw new Error("Forbidden: You cannot modify another student's quiz attempt");
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error("This quiz attempt has already been submitted or expired");
    }

    // Server-side timing check (with 10-second network latency grace)
    const now = new Date();
    const expiryWithGrace = new Date(new Date(attempt.expiresAt).getTime() + 10000);
    if (now > expiryWithGrace) {
      await this.submitAttempt(attemptId, studentUserId);
      throw new Error("Time limit expired. Your quiz has been automatically submitted.");
    }

    attempt.answers[questionId] = selectedOptionIndex;
    attempt.updatedAt = now.toISOString();

    return attempt;
  }

  static async submitAttempt(
    attemptId: string,
    studentUserId: string
  ): Promise<any> {
    const attempt = DEMO_QUIZ_ATTEMPTS_STORE.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    if (attempt.studentUserId !== studentUserId) {
      throw new Error("Forbidden: You cannot submit another student's quiz attempt");
    }

    const quiz = DEMO_QUIZZES_STORE.find((q) => q.id === attempt.quizId);
    if (!quiz) throw new Error("Associated quiz not found");

    if (attempt.status === AttemptStatus.SUBMITTED) {
      const review = this.buildAttemptReview(attempt);
      return {
        ...attempt,
        score: attempt.score,
        totalMarks: quiz.totalMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        attempt,
        review,
      };
    }

    const now = new Date();
    const started = new Date(attempt.startedAt);
    const timeTaken = Math.min(
      quiz.durationSeconds,
      Math.max(1, Math.round((now.getTime() - started.getTime()) / 1000))
    );

    // Server-side grading
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const detailedAnswers: DemoQuizAnswer[] = [];

    for (const qid of quiz.questionIds) {
      const question = DEMO_PREP_QUESTIONS_STORE.find((q) => q.id === qid);
      if (!question) continue;

      const selected = attempt.answers[qid];
      if (selected === undefined || selected === null) {
        unansweredCount++;
        detailedAnswers.push({
          questionId: qid,
          selectedOptionIndex: null,
          isCorrect: false,
          marksAwarded: 0,
        });
      } else if (selected === question.correctOptionIndex) {
        correctCount++;
        totalScore += question.marks;
        detailedAnswers.push({
          questionId: qid,
          selectedOptionIndex: selected,
          isCorrect: true,
          marksAwarded: question.marks,
        });
      } else {
        incorrectCount++;
        detailedAnswers.push({
          questionId: qid,
          selectedOptionIndex: selected,
          isCorrect: false,
          marksAwarded: 0,
        });
      }
    }

    const percentage = quiz.totalMarks > 0 ? (totalScore / quiz.totalMarks) * 100 : 0;
    const passed = totalScore >= quiz.passingMarks;

    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = now.toISOString();
    attempt.score = totalScore;
    attempt.percentage = Number(percentage.toFixed(1));
    attempt.passed = passed;
    attempt.totalCorrect = correctCount;
    attempt.totalIncorrect = incorrectCount;
    attempt.totalUnanswered = unansweredCount;
    attempt.timeTakenSeconds = timeTaken;
    attempt.detailedAnswers = detailedAnswers;
    attempt.updatedAt = now.toISOString();

    const review = this.buildAttemptReview(attempt);

    return {
      ...attempt,
      score: totalScore,
      totalMarks: quiz.totalMarks,
      percentage: attempt.percentage,
      passed,
      attempt,
      review,
    };
  }

  static async getAttemptResult(
    attemptId: string,
    userId?: string,
    role: Role | string = Role.ADMIN
  ): Promise<any | null> {
    const attempt = DEMO_QUIZ_ATTEMPTS_STORE.find((a) => a.id === attemptId);
    if (!attempt) return null;

    if (userId && role === Role.STUDENT && attempt.studentUserId !== userId) {
      throw new Error("Forbidden: You cannot access quiz attempts belonging to other students");
    }

    // If still in progress but time has passed, auto-submit
    if (attempt.status === AttemptStatus.IN_PROGRESS && new Date() > new Date(attempt.expiresAt)) {
      await this.submitAttempt(attemptId, attempt.studentUserId);
    }

    const review = this.buildAttemptReview(attempt);
    return {
      ...attempt,
      student: {
        id: attempt.studentId,
        userId: attempt.studentUserId,
        name: attempt.studentName,
      },
      attempt,
      review,
    };
  }

  // ==========================================
  // DETERMINISTIC READINESS SCORE ENGINE
  // ==========================================

  static async getStudentReadinessScore(studentUserId: string): Promise<StudentProgressReport> {
    return this.getStudentProgress(
      studentUserId,
      8.74,
      ["React", "TypeScript", "Node.js", "Python", "SQL", "Docker"],
      3
    );
  }

  static async getStudentProgress(
    studentUserId: string,
    studentCgpa: number,
    studentSkills: string[],
    activeApplicationsCount: number
  ): Promise<StudentProgressReport> {
    const attempts = DEMO_QUIZ_ATTEMPTS_STORE.filter(
      (a) => a.studentUserId === studentUserId && a.status === AttemptStatus.SUBMITTED
    );

    const quizzesAttempted = attempts.length;
    const quizzesPassed = attempts.filter((a) => a.passed).length;
    const averageScorePercent =
      quizzesAttempted > 0
        ? attempts.reduce((acc, a) => acc + a.percentage, 0) / quizzesAttempted
        : 0;
    const highestScorePercent =
      quizzesAttempted > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0;

    const totalQuestionsAnswered = attempts.reduce(
      (acc, a) => acc + (a.totalCorrect + a.totalIncorrect),
      0
    );
    const totalCorrect = attempts.reduce((acc, a) => acc + a.totalCorrect, 0);
    const overallAccuracy =
      totalQuestionsAnswered > 0 ? (totalCorrect / totalQuestionsAnswered) * 100 : 0;

    // Component calculations (Normalized to 0 - 100)
    // 1. Quiz Performance (30%): Based on average score percentage
    const compQuiz = Math.min(100, Math.max(0, averageScorePercent));

    // 2. Preparation Consistency (20%): Quizzes attempted and frequency
    const compConsistency = Math.min(100, quizzesAttempted * 20); // 5 quizzes = 100%

    // 3. Skill Coverage (20%): Profile skills portfolio
    const compSkills = Math.min(100, studentSkills.length * 16.6); // 6 skills = 100%

    // 4. Academic Eligibility (15%): CGPA
    const compAcademic = Math.min(100, Math.max(0, (studentCgpa / 10) * 100));

    // 5. Application Activity (15%): Active applications
    const compApps = Math.min(100, activeApplicationsCount * 33.3); // 3 applications = 100%

    // Formula:
    // Readiness Score = 30% Quiz + 20% Consistency + 20% Skills + 15% Academic + 15% Apps
    const readinessScore = Math.min(
      100,
      Math.floor(
        0.30 * compQuiz +
        0.20 * compConsistency +
        0.20 * compSkills +
        0.15 * compAcademic +
        0.15 * compApps
      )
    );

    let readinessTier: "Placement Ready" | "High Potential" | "Developing Skills" | "Early Stage";
    if (readinessScore >= 80) readinessTier = "Placement Ready";
    else if (readinessScore >= 60) readinessTier = "High Potential";
    else if (readinessScore >= 40) readinessTier = "Developing Skills";
    else readinessTier = "Early Stage";

    // Analyze strong and weak topics from attempts
    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const att of attempts) {
      const quiz = DEMO_QUIZZES_STORE.find((q) => q.id === att.quizId);
      if (!quiz) continue;

      for (const qid of quiz.questionIds) {
        const question = DEMO_PREP_QUESTIONS_STORE.find((q) => q.id === qid);
        if (!question) continue;

        if (!topicStats[question.topic]) {
          topicStats[question.topic] = { correct: 0, total: 0 };
        }
        topicStats[question.topic].total++;
        if (att.answers[qid] === question.correctOptionIndex) {
          topicStats[question.topic].correct++;
        }
      }
    }

    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    for (const [topic, stat] of Object.entries(topicStats)) {
      const acc = (stat.correct / stat.total) * 100;
      if (acc >= 75) strongTopics.push(topic);
      else if (acc < 50) weakTopics.push(topic);
    }

    if (strongTopics.length === 0) strongTopics.push("Verbal Grammar", "OOP Concepts");
    if (weakTopics.length === 0) weakTopics.push("Dynamic Programming", "Probability");

    return {
      readinessScore,
      readinessTier,
      componentScores: {
        quizPerformance: Number(compQuiz.toFixed(1)),
        preparationConsistency: Number(compConsistency.toFixed(1)),
        skillCoverage: Number(compSkills.toFixed(1)),
        academicEligibility: Number(compAcademic.toFixed(1)),
        applicationActivity: Number(compApps.toFixed(1)),
      },
      metrics: {
        quizzesAttempted,
        quizzesPassed,
        averageScorePercent: Number(averageScorePercent.toFixed(1)),
        highestScorePercent: Number(highestScorePercent.toFixed(1)),
        totalQuestionsAnswered,
        overallAccuracy: Number(overallAccuracy.toFixed(1)),
      },
      strongTopics,
      weakTopics,
      recommendedCategories: [
        PrepCategory.QUANTITATIVE_APTITUDE,
        PrepCategory.DSA,
        PrepCategory.DBMS,
      ],
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private static getSanitizedAttemptQuestions(quiz: DemoQuiz): any[] {
    return quiz.questionIds
      .map((qid) => DEMO_PREP_QUESTIONS_STORE.find((q) => q.id === qid))
      .filter((q): q is DemoPrepQuestion => q !== undefined)
      .map((q) => ({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        // strictly omit correctOptionIndex and explanation
      }));
  }

  private static buildAttemptReview(attempt: DemoQuizAttempt): any {
    const quiz = DEMO_QUIZZES_STORE.find((q) => q.id === attempt.quizId);
    if (!quiz) return { questions: [] };

    const reviewQuestions = quiz.questionIds
      .map((qid) => {
        const q = DEMO_PREP_QUESTIONS_STORE.find((item) => item.id === qid);
        if (!q) return null;

        const studentChoice = attempt.answers[qid] !== undefined ? attempt.answers[qid] : null;
        const isCorrect = studentChoice === q.correctOptionIndex;

        return {
          id: q.id,
          question: q.question,
          options: q.options,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks,
          studentChoice,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
        };
      })
      .filter(Boolean);

    return {
      attemptId: attempt.id,
      quizTitle: quiz.title,
      score: attempt.score,
      totalMarks: quiz.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeTakenSeconds: attempt.timeTakenSeconds,
      questions: reviewQuestions,
    };
  }

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
