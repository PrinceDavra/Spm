export const AttendanceRisk = {
  SAFE: "SAFE",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
} as const;

export type AttendanceRisk = (typeof AttendanceRisk)[keyof typeof AttendanceRisk];

export interface AttendanceProjectionResult {
  currentPercentage: number;
  targetPercentage: number;
  conductedClasses: number;
  presentClasses: number;
  absentClasses: number;
  risk: AttendanceRisk;
  classesNeededToReachTarget: number;
  classesCanMissWhileSafe: number;
  projectionMessage: string;
  impactOfMissingNextClass: number | null;
  attendanceProgression: Array<{
    attendedCount: number;
    totalConducted: number;
    projectedPercentage: number;
  }>;
}

/**
 * Calculates raw attendance percentage with 1 decimal place.
 * Returns 100.0 if no classes have been conducted yet.
 */
export function calculateAttendancePercentage(
  presentClasses: number,
  totalClasses: number
): number {
  if (totalClasses <= 0) return 100.0;
  if (presentClasses < 0) presentClasses = 0;
  if (presentClasses > totalClasses) presentClasses = totalClasses;

  const pct = (presentClasses / totalClasses) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determines institutional attendance risk status.
 * SAFE: >= 75%
 * WARNING: 65% - 74.99%
 * CRITICAL: < 65%
 */
export function getAttendanceRisk(
  percentage: number,
  safeThreshold = 75,
  warningThreshold = 65
): AttendanceRisk {
  if (percentage >= safeThreshold) return "SAFE";
  if (percentage >= warningThreshold) return "WARNING";
  return "CRITICAL";
}

/**
 * Deterministic mathematical attendance projection calculation.
 * Transparent, formula-driven projection without fake ML badges.
 */
export function calculateAttendanceProjection(
  presentClasses: number,
  conductedClasses: number,
  targetPercentage = 75
): AttendanceProjectionResult {
  const currentPercentage = calculateAttendancePercentage(
    presentClasses,
    conductedClasses
  );
  const absentClasses = Math.max(0, conductedClasses - presentClasses);
  const risk = getAttendanceRisk(currentPercentage, targetPercentage);

  // 1. If 0 classes conducted
  if (conductedClasses === 0) {
    return {
      currentPercentage: 100.0,
      targetPercentage,
      conductedClasses: 0,
      presentClasses: 0,
      absentClasses: 0,
      risk: "SAFE",
      classesNeededToReachTarget: 0,
      classesCanMissWhileSafe: 0,
      projectionMessage: "Academic semester in progress. No classes recorded yet.",
      impactOfMissingNextClass: null,
      attendanceProgression: [],
    };
  }

  let classesNeededToReachTarget = 0;
  let classesCanMissWhileSafe = 0;
  let projectionMessage = "";

  // 2. Recovery Calculation (Current < Target)
  // Formula: (P + X) / (C + X) >= T / 100
  // => 100(P + X) >= T(C + X)
  // => X(100 - T) >= TC - 100P
  // => X = ceil((T*C - 100*P) / (100 - T))
  if (currentPercentage < targetPercentage) {
    const numerator = targetPercentage * conductedClasses - 100 * presentClasses;
    const denominator = 100 - targetPercentage;
    classesNeededToReachTarget = Math.max(0, Math.ceil(numerator / denominator));

    projectionMessage = `Attend the next ${classesNeededToReachTarget} consecutive classes to reach ${targetPercentage}%.`;
  } else {
    // 3. Bunk Margin Calculation (Current >= Target)
    // Formula: P / (C + Y) >= T / 100
    // => 100P >= T(C + Y)
    // => T*Y <= 100P - T*C
    // => Y = floor((100*P - T*C) / T)
    const numerator = 100 * presentClasses - targetPercentage * conductedClasses;
    classesCanMissWhileSafe = Math.max(0, Math.floor(numerator / targetPercentage));

    if (classesCanMissWhileSafe === 0) {
      projectionMessage = `You are on the boundary of ${targetPercentage}%. Do not miss your next class.`;
    } else {
      projectionMessage = `You can safely miss ${classesCanMissWhileSafe} classes while remaining at or above ${targetPercentage}%.`;
    }
  }

  // 4. Calculate impact of missing the very next class
  // New percentage = P / (C + 1) * 100
  const impactOfMissingNextClass = calculateAttendancePercentage(
    presentClasses,
    conductedClasses + 1
  );

  // 5. Progression curve: Next 5 classes if attended
  const attendanceProgression = [];
  for (let i = 1; i <= 5; i++) {
    const nextConducted = conductedClasses + i;
    const nextPresent = presentClasses + i;
    attendanceProgression.push({
      attendedCount: i,
      totalConducted: nextConducted,
      projectedPercentage: calculateAttendancePercentage(nextPresent, nextConducted),
    });
  }

  return {
    currentPercentage,
    targetPercentage,
    conductedClasses,
    presentClasses,
    absentClasses,
    risk,
    classesNeededToReachTarget,
    classesCanMissWhileSafe,
    projectionMessage,
    impactOfMissingNextClass,
    attendanceProgression,
  };
}
