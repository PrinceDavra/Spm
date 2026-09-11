import { DayOfWeek, RoomType, SubjectType } from "@prisma/client";

export interface AcademicSubject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  weeklyHours: number;
  credits: number;
  facultyId: string;
  facultyName: string;
  facultySubjectId: string;
}

export interface RoomInfo {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: RoomType;
  hasProjector: boolean;
  isAvailable: boolean;
}

export interface FacultyUnavailability {
  facultyId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  reason?: string;
}

export interface RoomUnavailability {
  roomId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  reason?: string;
}

export interface WorkingScheduleConfig {
  workingDays: DayOfWeek[];
  periodsPerDay: number; // e.g. 6
  periodTimings: Array<{
    periodNumber: number;
    startTime: string; // e.g. "09:00"
    endTime: string;   // e.g. "10:00"
  }>;
}

export interface CSPVariable {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  facultySubjectId: string;
  divisionId: string;
  isLabSession: boolean;
  durationPeriods: number; // 1 for theory, 2 for lab
}

export interface CSPSlotCandidate {
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  roomId: string;
}

export interface CSPSlotAssignment {
  variableId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  facultySubjectId: string;
  divisionId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  roomId: string;
  roomNumber: string;
  isLabSession: boolean;
  startTime: string;
  endTime: string;
}

export interface SoftConstraintMetric {
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface CSPSolution {
  success: boolean;
  assignments: CSPSlotAssignment[];
  hardConflicts: string[];
  softConstraintScore: number; // 0 to 100
  softConstraintMetrics: SoftConstraintMetric[];
  stats: {
    totalSessionsScheduled: number;
    stepsExplored: number;
    backtracksCount: number;
    executionTimeMs: number;
  };
  message: string;
}

/**
 * Deterministic Constraint Satisfaction Problem (CSP) Solver for College Timetable Generation.
 * Implements Backtracking Search + MRV (Minimum Remaining Values) + Degree Heuristic + Forward Checking.
 */
export class CSPSolver {
  private variables: CSPVariable[] = [];
  private rooms: RoomInfo[] = [];
  private scheduleConfig: WorkingScheduleConfig;
  private facultyUnavailability: FacultyUnavailability[] = [];
  private roomUnavailability: RoomUnavailability[] = [];
  private existingGlobalAssignments: CSPSlotAssignment[] = []; // Other divisions / cross-faculty sessions

  private stepsCount = 0;
  private backtracksCount = 0;
  private readonly MAX_STEPS = 6000;

  constructor(options: {
    subjects: AcademicSubject[];
    divisionId: string;
    rooms: RoomInfo[];
    scheduleConfig: WorkingScheduleConfig;
    facultyUnavailability?: FacultyUnavailability[];
    roomUnavailability?: RoomUnavailability[];
    existingGlobalAssignments?: CSPSlotAssignment[];
  }) {
    this.rooms = options.rooms;
    this.scheduleConfig = options.scheduleConfig;
    this.facultyUnavailability = options.facultyUnavailability || [];
    this.roomUnavailability = options.roomUnavailability || [];
    this.existingGlobalAssignments = options.existingGlobalAssignments || [];

    // Construct CSP variables from subject weekly requirements
    let varIndex = 1;
    for (const subj of options.subjects) {
      if (subj.type === SubjectType.LAB) {
        // Labs require 2 consecutive periods
        const labSessions = Math.max(1, Math.floor(subj.weeklyHours / 2));
        for (let i = 0; i < labSessions; i++) {
          this.variables.push({
            id: `var-${subj.code}-lab-${varIndex++}`,
            subjectId: subj.id,
            subjectCode: subj.code,
            subjectName: subj.name,
            facultyId: subj.facultyId,
            facultyName: subj.facultyName,
            facultySubjectId: subj.facultySubjectId,
            divisionId: options.divisionId,
            isLabSession: true,
            durationPeriods: 2,
          });
        }
      } else {
        // Theory subjects: 1 period per lecture
        for (let i = 0; i < subj.weeklyHours; i++) {
          this.variables.push({
            id: `var-${subj.code}-lec-${varIndex++}`,
            subjectId: subj.id,
            subjectCode: subj.code,
            subjectName: subj.name,
            facultyId: subj.facultyId,
            facultyName: subj.facultyName,
            facultySubjectId: subj.facultySubjectId,
            divisionId: options.divisionId,
            isLabSession: false,
            durationPeriods: 1,
          });
        }
      }
    }
  }

  /**
   * Generates a valid conflict-free timetable using CSP backtracking search with MRV and forward checking.
   */
  public solve(): CSPSolution {
    const startTime = Date.now();
    this.stepsCount = 0;
    this.backtracksCount = 0;

    // Check if total required periods exceed total available periods in the week
    const totalPeriodsNeeded = this.variables.reduce(
      (sum, v) => sum + v.durationPeriods,
      0
    );
    const totalPeriodsAvailable =
      this.scheduleConfig.workingDays.length * this.scheduleConfig.periodsPerDay;

    if (totalPeriodsNeeded > totalPeriodsAvailable) {
      return {
        success: false,
        assignments: [],
        hardConflicts: [
          `Capacity Overload: Configured weekly subjects require ${totalPeriodsNeeded} periods, but the weekly schedule only provides ${totalPeriodsAvailable} slots.`,
        ],
        softConstraintScore: 0,
        softConstraintMetrics: [],
        stats: {
          totalSessionsScheduled: 0,
          stepsExplored: 0,
          backtracksCount: 0,
          executionTimeMs: Date.now() - startTime,
        },
        message: "Academic workload exceeds total weekly available periods.",
      };
    }

    // Initialize domain for each variable
    const domains = new Map<string, CSPSlotCandidate[]>();
    for (const variable of this.variables) {
      domains.set(variable.id, this.computeInitialDomain(variable));
    }

    const currentAssignments: CSPSlotAssignment[] = [];
    const assignedVarIds = new Set<string>();

    const solved = this.backtrack(currentAssignments, assignedVarIds, domains);
    const executionTimeMs = Date.now() - startTime;

    if (solved) {
      // Evaluate soft constraints
      const softMetrics = this.evaluateSoftConstraints(currentAssignments);
      const totalSoftScore = softMetrics.reduce((sum, m) => sum + m.score, 0);

      return {
        success: true,
        assignments: currentAssignments,
        hardConflicts: [],
        softConstraintScore: Math.round(totalSoftScore),
        softConstraintMetrics: softMetrics,
        stats: {
          totalSessionsScheduled: currentAssignments.length,
          stepsExplored: this.stepsCount,
          backtracksCount: this.backtracksCount,
          executionTimeMs,
        },
        message: `Timetable successfully generated with 0 hard conflicts (${this.stepsCount} search steps in ${executionTimeMs}ms).`,
      };
    }

    return {
      success: false,
      assignments: [],
      hardConflicts: [
        "Unsatisfiable Constraints: No conflict-free slot combination could be found satisfying all faculty availability, room capacity, and consecutive lab requirements.",
      ],
      softConstraintScore: 0,
      softConstraintMetrics: [],
      stats: {
        totalSessionsScheduled: 0,
        stepsExplored: this.stepsCount,
        backtracksCount: this.backtracksCount,
        executionTimeMs,
      },
      message: "No valid timetable could be generated with the current constraints.",
    };
  }

  /**
   * Computes the initial legal domain of (day, period, room) candidates for a variable.
   */
  private computeInitialDomain(variable: CSPVariable): CSPSlotCandidate[] {
    const candidates: CSPSlotCandidate[] = [];

    // Filter rooms by type: Labs require LAB rooms, Theory prefers CLASSROOM
    const eligibleRooms = this.rooms.filter((r) => {
      if (!r.isAvailable) return false;
      if (variable.isLabSession) {
        return r.type === RoomType.LAB;
      }
      return r.type === RoomType.CLASSROOM;
    });

    for (const day of this.scheduleConfig.workingDays) {
      for (let p = 1; p <= this.scheduleConfig.periodsPerDay; p++) {
        // If lab session requires 2 periods, ensure it doesn't exceed day limit
        // and doesn't cross the standard lunch break (lunch is between Period 4 and Period 5)
        if (variable.isLabSession) {
          if (p + 1 > this.scheduleConfig.periodsPerDay) continue;
          if (p === 4) continue; // P4 to P5 crosses lunch break
          // Prefer standard lab slot starts: Period 1 (1-2), Period 3 (3-4), or Period 5 (5-6)
          if (p !== 1 && p !== 3 && p !== 5) continue;
        }

        // Check faculty unavailability
        const isFacultyUnavailable = this.facultyUnavailability.some(
          (u) =>
            u.facultyId === variable.facultyId &&
            u.dayOfWeek === day &&
            (u.periodNumber === p ||
              (variable.isLabSession && u.periodNumber === p + 1))
        );
        if (isFacultyUnavailable) continue;

        for (const room of eligibleRooms) {
          // Check room unavailability
          const isRoomUnavailable = this.roomUnavailability.some(
            (u) =>
              u.roomId === room.id &&
              u.dayOfWeek === day &&
              (u.periodNumber === p ||
                (variable.isLabSession && u.periodNumber === p + 1))
          );
          if (isRoomUnavailable) continue;

          // Check against existing global assignments (other divisions)
          const isGlobalConflict = this.existingGlobalAssignments.some(
            (a) =>
              a.dayOfWeek === day &&
              (a.periodNumber === p ||
                (variable.isLabSession && a.periodNumber === p + 1)) &&
              (a.facultyId === variable.facultyId || a.roomId === room.id)
          );
          if (isGlobalConflict) continue;

          candidates.push({
            dayOfWeek: day,
            periodNumber: p,
            roomId: room.id,
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Recursive Backtracking search with MRV and Forward Checking.
   */
  private backtrack(
    currentAssignments: CSPSlotAssignment[],
    assignedVarIds: Set<string>,
    domains: Map<string, CSPSlotCandidate[]>
  ): boolean {
    if (assignedVarIds.size === this.variables.length) {
      return true; // All variables assigned!
    }

    this.stepsCount++;
    if (this.stepsCount > this.MAX_STEPS) {
      return false; // Safety timeout to prevent locking CPU
    }

    // MRV (Minimum Remaining Values): Select unassigned variable with smallest domain
    const variable = this.selectMRVVariable(assignedVarIds, domains);
    if (!variable) return false;

    const rawCandidates = domains.get(variable.id) || [];
    const candidateSlots = this.orderDomainValues(
      variable,
      rawCandidates,
      currentAssignments
    );

    // Evaluate slots ordered by soft optimization heuristics
    for (const slot of candidateSlots) {
      // Check if slot conflicts with current assignments in this session
      if (!this.isHardConsistent(variable, slot, currentAssignments)) {
        continue;
      }

      // Make assignment
      const room = this.rooms.find((r) => r.id === slot.roomId)!;
      const timing = this.scheduleConfig.periodTimings.find(
        (t) => t.periodNumber === slot.periodNumber
      ) || {
        startTime: `${slot.periodNumber + 8}:00`,
        endTime: `${slot.periodNumber + 9}:00`,
      };

      const newAssignment: CSPSlotAssignment = {
        variableId: variable.id,
        subjectId: variable.subjectId,
        subjectCode: variable.subjectCode,
        subjectName: variable.subjectName,
        facultyId: variable.facultyId,
        facultyName: variable.facultyName,
        facultySubjectId: variable.facultySubjectId,
        divisionId: variable.divisionId,
        dayOfWeek: slot.dayOfWeek,
        periodNumber: slot.periodNumber,
        roomId: slot.roomId,
        roomNumber: room.roomNumber,
        isLabSession: variable.isLabSession,
        startTime: timing.startTime,
        endTime: variable.isLabSession
          ? this.getEndTimeForLab(slot.periodNumber)
          : timing.endTime,
      };

      currentAssignments.push(newAssignment);
      assignedVarIds.add(variable.id);

      // If it's a 2-period lab, also register the second slot assignment
      let secondaryLabAssignment: CSPSlotAssignment | null = null;
      if (variable.isLabSession) {
        const p2Timing = this.scheduleConfig.periodTimings.find(
          (t) => t.periodNumber === slot.periodNumber + 1
        ) || {
          startTime: `${slot.periodNumber + 9}:00`,
          endTime: `${slot.periodNumber + 10}:00`,
        };
        secondaryLabAssignment = {
          ...newAssignment,
          variableId: `${variable.id}-part2`,
          periodNumber: slot.periodNumber + 1,
          startTime: p2Timing.startTime,
          endTime: p2Timing.endTime,
        };
        currentAssignments.push(secondaryLabAssignment);
      }

      // Forward Checking: Prune incompatible domains for remaining variables
      const prunedDomains = this.forwardCheck(
        variable,
        slot,
        assignedVarIds,
        domains
      );

      if (prunedDomains !== null) {
        const success = this.backtrack(
          currentAssignments,
          assignedVarIds,
          prunedDomains
        );
        if (success) return true;
      }

      // Backtrack
      this.backtracksCount++;
      currentAssignments.pop();
      if (secondaryLabAssignment) {
        currentAssignments.pop();
      }
      assignedVarIds.delete(variable.id);
    }

    return false;
  }

  /**
   * Minimum Remaining Values (MRV) Variable Selection:
   * Chooses the unassigned variable with the fewest candidate slots.
   */
  private selectMRVVariable(
    assignedVarIds: Set<string>,
    domains: Map<string, CSPSlotCandidate[]>
  ): CSPVariable | null {
    let bestVar: CSPVariable | null = null;
    let minDomainSize = Infinity;

    for (const v of this.variables) {
      if (assignedVarIds.has(v.id)) continue;

      const size = (domains.get(v.id) || []).length;
      if (size < minDomainSize) {
        minDomainSize = size;
        bestVar = v;
      } else if (size === minDomainSize && bestVar) {
        // Tie-breaker: Labs with duration 2 have higher constraint degree
        if (v.durationPeriods > bestVar.durationPeriods) {
          bestVar = v;
        }
      }
    }

    return bestVar;
  }

  /**
   * Least-Constraining / Soft-Optimization Value Ordering:
   * Orders candidate slots to favor even subject dispersion across the week,
   * prevent consecutive repeats of the same theory lecture, and balance daily load.
   */
  private orderDomainValues(
    variable: CSPVariable,
    candidates: CSPSlotCandidate[],
    assignments: CSPSlotAssignment[]
  ): CSPSlotCandidate[] {
    return [...candidates].sort((a, b) => {
      let penaltyA = 0;
      let penaltyB = 0;

      // 1. Same subject already on that day penalty (encourages distinct days)
      const aSameSubj = assignments.filter(
        (s) => s.subjectId === variable.subjectId && s.dayOfWeek === a.dayOfWeek
      ).length;
      const bSameSubj = assignments.filter(
        (s) => s.subjectId === variable.subjectId && s.dayOfWeek === b.dayOfWeek
      ).length;
      penaltyA += aSameSubj * 150;
      penaltyB += bSameSubj * 150;

      // 2. Adjacent period of same subject penalty (prevents consecutive repeats)
      const aAdjacent = assignments.some(
        (s) =>
          s.subjectId === variable.subjectId &&
          s.dayOfWeek === a.dayOfWeek &&
          Math.abs(s.periodNumber - a.periodNumber) === 1
      );
      const bAdjacent = assignments.some(
        (s) =>
          s.subjectId === variable.subjectId &&
          s.dayOfWeek === b.dayOfWeek &&
          Math.abs(s.periodNumber - b.periodNumber) === 1
      );
      if (aAdjacent) penaltyA += 250;
      if (bAdjacent) penaltyB += 250;

      // 3. Day load balancing (favor days with fewer assignments so far)
      const aDayLoad = assignments.filter((s) => s.dayOfWeek === a.dayOfWeek).length;
      const bDayLoad = assignments.filter((s) => s.dayOfWeek === b.dayOfWeek).length;
      penaltyA += aDayLoad * 10;
      penaltyB += bDayLoad * 10;

      // 4. Lab clustering penalty (avoid scheduling 2 labs on the same day)
      if (variable.isLabSession) {
        const aHasLab = assignments.some(
          (s) => s.isLabSession && s.dayOfWeek === a.dayOfWeek
        );
        const bHasLab = assignments.some(
          (s) => s.isLabSession && s.dayOfWeek === b.dayOfWeek
        );
        if (aHasLab) penaltyA += 200;
        if (bHasLab) penaltyB += 200;
      }

      // 5. Morning preference for theory
      if (!variable.isLabSession) {
        if (a.periodNumber > 4) penaltyA += 15;
        if (b.periodNumber > 4) penaltyB += 15;
      }

      return penaltyA - penaltyB;
    });
  }

  /**
   * Verifies hard constraints against existing assignments in the current division schedule.
   */
  private isHardConsistent(
    variable: CSPVariable,
    slot: CSPSlotCandidate,
    assignments: CSPSlotAssignment[]
  ): boolean {
    const periodsToCheck = variable.isLabSession
      ? [slot.periodNumber, slot.periodNumber + 1]
      : [slot.periodNumber];

    for (const p of periodsToCheck) {
      for (const a of assignments) {
        if (a.dayOfWeek === slot.dayOfWeek && a.periodNumber === p) {
          // Division double booking
          if (a.divisionId === variable.divisionId) return false;
          // Faculty double booking
          if (a.facultyId === variable.facultyId) return false;
          // Room double booking
          if (a.roomId === slot.roomId) return false;
        }
      }
    }

    return true;
  }

  /**
   * Forward checking: returns new domains map with conflicting candidate slots pruned.
   * If any remaining variable has its domain reduced to 0, returns null (triggers early backtrack).
   */
  private forwardCheck(
    assignedVar: CSPVariable,
    slot: CSPSlotCandidate,
    assignedVarIds: Set<string>,
    domains: Map<string, CSPSlotCandidate[]>
  ): Map<string, CSPSlotCandidate[]> | null {
    const newDomains = new Map<string, CSPSlotCandidate[]>();
    const periods = assignedVar.isLabSession
      ? [slot.periodNumber, slot.periodNumber + 1]
      : [slot.periodNumber];

    for (const v of this.variables) {
      if (assignedVarIds.has(v.id)) {
        continue;
      }

      const existingCandidates = domains.get(v.id) || [];
      const filtered = existingCandidates.filter((cand) => {
        const candPeriods = v.isLabSession
          ? [cand.periodNumber, cand.periodNumber + 1]
          : [cand.periodNumber];

        if (cand.dayOfWeek !== slot.dayOfWeek) return true;

        const hasPeriodOverlap = candPeriods.some((cp) => periods.includes(cp));
        if (!hasPeriodOverlap) return true;

        // Same division collision
        if (v.divisionId === assignedVar.divisionId) return false;
        // Same faculty collision
        if (v.facultyId === assignedVar.facultyId) return false;
        // Same room collision
        if (cand.roomId === slot.roomId) return false;

        return true;
      });

      if (filtered.length === 0) {
        return null; // Empty domain detected -> early failure!
      }

      newDomains.set(v.id, filtered);
    }

    return newDomains;
  }

  private getEndTimeForLab(startPeriod: number): string {
    const endTiming = this.scheduleConfig.periodTimings.find(
      (t) => t.periodNumber === startPeriod + 1
    );
    return endTiming ? endTiming.endTime : `${startPeriod + 10}:00`;
  }

  /**
   * Evaluates soft constraints and calculates an optimization score (0–100%).
   */
  private evaluateSoftConstraints(
    assignments: CSPSlotAssignment[]
  ): SoftConstraintMetric[] {
    const metrics: SoftConstraintMetric[] = [];

    // 1. No Consecutive Repeat of Same Theory Subject (Max 20 pts)
    let consecutiveSameSubjectViolations = 0;
    for (const day of this.scheduleConfig.workingDays) {
      const daySlots = assignments
        .filter((a) => a.dayOfWeek === day)
        .sort((a, b) => a.periodNumber - b.periodNumber);

      for (let i = 0; i < daySlots.length - 1; i++) {
        const curr = daySlots[i];
        const next = daySlots[i + 1];
        if (
          !curr.isLabSession &&
          !next.isLabSession &&
          curr.subjectId === next.subjectId &&
          next.periodNumber === curr.periodNumber + 1
        ) {
          consecutiveSameSubjectViolations++;
        }
      }
    }
    const score1 = Math.max(0, 20 - consecutiveSameSubjectViolations * 10);
    metrics.push({
      label: "Subject Variety & Separation",
      score: score1,
      maxScore: 20,
      description:
        consecutiveSameSubjectViolations === 0
          ? "No consecutive repeat of identical theory courses."
          : `${consecutiveSameSubjectViolations} occurrences of back-to-back duplicate lectures.`,
    });

    // 2. Even Weekly Distribution of Multi-Lecture Subjects (Max 20 pts)
    // Subjects with 3-4 lectures should be spread across 3-4 different days
    const subjectDaysMap = new Map<string, Set<DayOfWeek>>();
    for (const a of assignments) {
      if (!subjectDaysMap.has(a.subjectId)) {
        subjectDaysMap.set(a.subjectId, new Set());
      }
      subjectDaysMap.get(a.subjectId)!.add(a.dayOfWeek);
    }
    let unevenDistributionPenalties = 0;
    subjectDaysMap.forEach((days, subjId) => {
      const totalLectures = assignments.filter(
        (a) => a.subjectId === subjId && !a.isLabSession
      ).length;
      if (totalLectures >= 3 && days.size < totalLectures - 1) {
        unevenDistributionPenalties++;
      }
    });
    const score2 = Math.max(0, 20 - unevenDistributionPenalties * 5);
    metrics.push({
      label: "Weekly Subject Dispersion",
      score: score2,
      maxScore: 20,
      description:
        unevenDistributionPenalties === 0
          ? "Lectures evenly spread across distinct days."
          : `${unevenDistributionPenalties} subjects clustered in fewer days than optimal.`,
    });

    // 3. Faculty Compactness & Idle Gap Minimization (Max 20 pts)
    let facultyGaps = 0;
    const facultyDayPeriods = new Map<string, number[]>();
    for (const a of assignments) {
      const key = `${a.facultyId}-${a.dayOfWeek}`;
      if (!facultyDayPeriods.has(key)) {
        facultyDayPeriods.set(key, []);
      }
      facultyDayPeriods.get(key)!.push(a.periodNumber);
    }
    facultyDayPeriods.forEach((periods) => {
      if (periods.length >= 2) {
        periods.sort((a, b) => a - b);
        for (let i = 0; i < periods.length - 1; i++) {
          const gap = periods[i + 1] - periods[i] - 1;
          if (gap > 1) facultyGaps += gap;
        }
      }
    });
    const score3 = Math.max(0, 20 - facultyGaps * 5);
    metrics.push({
      label: "Faculty Schedule Compactness",
      score: score3,
      maxScore: 20,
      description:
        facultyGaps === 0
          ? "Optimal faculty schedule with zero idle gaps."
          : `${facultyGaps} isolated free period gaps in faculty schedules.`,
    });

    // 4. Balanced Student Daily Workload (Max 20 pts)
    let unbalancedDays = 0;
    for (const day of this.scheduleConfig.workingDays) {
      const count = assignments.filter((a) => a.dayOfWeek === day).length;
      if (count > 5 || count < 3) {
        unbalancedDays++;
      }
    }
    const score4 = Math.max(0, 20 - unbalancedDays * 5);
    metrics.push({
      label: "Daily Academic Load Balancing",
      score: score4,
      maxScore: 20,
      description:
        unbalancedDays === 0
          ? "Even academic load distribution (3–5 periods/day)."
          : `${unbalancedDays} days have uneven lecture loads.`,
    });

    // 5. Morning Prime Placement for Core Subjects (Max 10 pts)
    let primeSlots = 0;
    let totalCore = 0;
    for (const a of assignments) {
      if (!a.isLabSession) {
        totalCore++;
        if (a.periodNumber <= 3) primeSlots++;
      }
    }
    const primeRatio = totalCore > 0 ? primeSlots / totalCore : 1;
    const score5 = Math.round(primeRatio * 10);
    metrics.push({
      label: "Core Subject Morning Placement",
      score: score5,
      maxScore: 10,
      description: `${Math.round(primeRatio * 100)}% of core lectures scheduled in morning slots.`,
    });

    // 6. Lab Distribution (At most 1 lab per day) (Max 10 pts)
    let duplicateLabDays = 0;
    for (const day of this.scheduleConfig.workingDays) {
      const labCount = new Set(
        assignments
          .filter((a) => a.dayOfWeek === day && a.isLabSession)
          .map((a) => a.subjectId)
      ).size;
      if (labCount > 1) duplicateLabDays++;
    }
    const score6 = duplicateLabDays === 0 ? 10 : 5;
    metrics.push({
      label: "Practical Lab Spacing",
      score: score6,
      maxScore: 10,
      description:
        duplicateLabDays === 0
          ? "Practical labs distributed across separate days."
          : `${duplicateLabDays} days contain multiple intensive labs.`,
    });

    return metrics;
  }
}
