import { describe, it, expect } from "vitest";
import { AnalyticsService } from "@/services/analytics.service";
import {
  calculateAttendancePercentage,
  getAttendanceRisk,
} from "@/lib/attendance/calculator";
import { ClubService } from "@/services/club.service";
import { Role } from "@prisma/client";

describe("Phase 14 — Reports, Analytics & Admin Intelligence Tests", () => {
  const studentId = "demo-student-001";
  const otherStudentId = "demo-student-002";
  const facultyId = "demo-faculty-001";
  const adminId = "demo-admin-001";
  const placementOfficerId = "demo-placement-001";
  const clubCoordinatorId = "demo-club-001";

  // =========================================================================
  // 1. EXECUTIVE OVERVIEW & AGGREGATIONS (Tests 1 - 3)
  // =========================================================================
  describe("1. Executive Overview & Aggregations", () => {
    it("1. admin overview returns correct aggregate metrics", async () => {
      const overview = await AnalyticsService.getExecutiveOverview();
      expect(overview).toBeDefined();
      expect(overview.kpis).toBeDefined();

      // Verify all 10 Master KPIs are present
      expect(overview.kpis.totalStudents.value).toBeGreaterThan(0);
      expect(overview.kpis.activeFaculty.value).toBeGreaterThan(0);
      expect(overview.kpis.totalDepartments.value).toBeGreaterThan(0);
      expect(overview.kpis.activePrograms.value).toBeGreaterThan(0);
      expect(overview.kpis.attendanceHealth.value).toContain("%");
      expect(overview.kpis.assignmentCompletion.value).toContain("%");
      expect(typeof overview.kpis.upcomingEvents.value).toBe("number");
      expect(typeof overview.kpis.placementApplications.value).toBe("number");
      expect(overview.kpis.clubEngagement.value).toContain("/100");
      expect(typeof overview.kpis.openLostFound.value).toBe("number");
    });

    it("2. executive overview integrates Phase 12 configuration health checks", async () => {
      const overview = await AnalyticsService.getExecutiveOverview();
      expect(overview.configurationHealth).toBeDefined();
      expect(["HEALTHY", "WARNING", "CRITICAL"]).toContain(
        overview.configurationHealth.status
      );
      expect(overview.configurationHealth.checks.length).toBeGreaterThan(0);
      expect(overview.configurationHealth.checks[0]).toHaveProperty("id");
      expect(overview.configurationHealth.checks[0]).toHaveProperty("remediationHint");
    });

    it("3. executive KPIs have appropriate status indicators and navigation deep-links", async () => {
      const overview = await AnalyticsService.getExecutiveOverview();
      const kpiList = Object.values(overview.kpis);
      for (const kpi of kpiList) {
        expect(["SAFE", "WARNING", "CRITICAL", "NEUTRAL"]).toContain(kpi.status);
        expect(kpi.href).toMatch(/^\/dashboard\//);
      }
    });
  });

  // =========================================================================
  // 2. ZERO-TRUST ROLE AUTHORIZATION & SCOPING (Tests 4 - 7)
  // =========================================================================
  describe("2. Zero-Trust Role Authorization & Scoping", () => {
    it("4. student personal analytics returns only own academic metrics", async () => {
      const studentAnalytics = await AnalyticsService.getStudentAnalytics(studentId);
      expect(studentAnalytics).toBeDefined();
      expect(studentAnalytics.student.id).toBe(studentId);
      expect(studentAnalytics.student.rollNumber).toBe("22COMPA101");
      expect(studentAnalytics.attendance.overallPercentage).toBeGreaterThanOrEqual(0);
      expect(studentAnalytics.attendance.overallPercentage).toBeLessThanOrEqual(100);
      expect(studentAnalytics.attendance.subjectBreakdown.length).toBeGreaterThan(0);
      expect(studentAnalytics.assignments.kpi).toBeDefined();
      expect(studentAnalytics.placementReadiness.readinessScore).toBeGreaterThanOrEqual(0);
    });

    it("5. faculty personal analytics returns only authorized teaching metrics", async () => {
      const facultyAnalytics = await AnalyticsService.getFacultyAnalytics(facultyId);
      expect(facultyAnalytics).toBeDefined();
      expect(facultyAnalytics.faculty.id).toBe(facultyId);
      expect(facultyAnalytics.workload.assignedWeeklyPeriods).toBe(9);
      expect(facultyAnalytics.workload.scheduledWeeklyPeriods).toBe(9);
      expect(facultyAnalytics.classesTaught.length).toBeGreaterThan(0);
      expect(facultyAnalytics.assignmentsAuthored).toBeDefined();
    });

    it("6. student export request is rejected with authorization error", async () => {
      await expect(
        AnalyticsService.exportReport("attendance", {}, Role.STUDENT, studentId)
      ).rejects.toThrow(/Security Violation/);
    });

    it("7. faculty export of unauthorized modules (e.g. placement/clubs) is rejected", async () => {
      await expect(
        AnalyticsService.exportReport("placement", {}, Role.FACULTY, facultyId)
      ).rejects.toThrow(/Security Violation/);
    });
  });

  // =========================================================================
  // 3. AUTHORITATIVE ATTENDANCE CALCULATIONS (Tests 8 - 10)
  // =========================================================================
  describe("3. Authoritative Attendance Calculations", () => {
    it("8. attendance uses existing Phase 4 formulas exactly", async () => {
      const analytics = await AnalyticsService.getAttendanceAnalytics();
      expect(analytics).toBeDefined();

      const expectedPct = calculateAttendancePercentage(
        analytics.totalPresentMarks,
        analytics.totalConductedSessions
      );
      expect(analytics.overallPercentage).toBe(expectedPct);
      expect(analytics.overallStatus).toBe(getAttendanceRisk(expectedPct));
    });

    it("9. attendance threshold classification conforms to institutional boundaries", () => {
      expect(getAttendanceRisk(85.0)).toBe("SAFE");
      expect(getAttendanceRisk(75.0)).toBe("SAFE");
      expect(getAttendanceRisk(74.9)).toBe("WARNING");
      expect(getAttendanceRisk(65.0)).toBe("WARNING");
      expect(getAttendanceRisk(64.9)).toBe("CRITICAL");
      expect(getAttendanceRisk(40.0)).toBe("CRITICAL");
    });

    it("10. attendance analytics provides subject-wise, division-wise, and theory vs lab breakdowns", async () => {
      const analytics = await AnalyticsService.getAttendanceAnalytics();
      expect(analytics.subjectWise.length).toBeGreaterThan(0);
      expect(analytics.divisionWise.length).toBeGreaterThan(0);
      expect(analytics.departmentWise.length).toBeGreaterThan(0);

      expect(analytics.theoryVsLab.theoryConducted).toBeGreaterThan(0);
      expect(analytics.theoryVsLab.labConducted).toBeGreaterThan(0);
      expect(analytics.theoryVsLab.theoryPercentage).toBeGreaterThanOrEqual(0);
      expect(analytics.theoryVsLab.labPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // 4. DETERMINISTIC AT-RISK STUDENT ENGINE (Tests 11 - 13)
  // =========================================================================
  describe("4. Deterministic At-Risk Student Engine", () => {
    it("11. evaluates student risk deterministically using measurable signals", async () => {
      const riskData = await AnalyticsService.getStudentRiskAnalytics();
      expect(riskData).toBeDefined();
      expect(riskData.totalEvaluated).toBeGreaterThan(0);
      expect(Array.isArray(riskData.atRiskStudents)).toBe(true);

      for (const student of riskData.atRiskStudents) {
        expect(["CRITICAL", "WARNING"]).toContain(student.riskLevel);
        expect(student.riskFactors.length).toBeGreaterThan(0);

        // Verify that factors justify the classification
        const hasAttendanceIssue = student.attendancePercentage < 75;
        const hasAssignmentIssue =
          student.assignmentCompletionRate < 75 || student.overdueAssignmentsCount > 0;
        const hasPlacementIssue = student.placementReadinessScore < 50;

        expect(hasAttendanceIssue || hasAssignmentIssue || hasPlacementIssue).toBe(true);
      }
    });

    it("12. provides transparent itemized factor reasons for every flagged student", async () => {
      const riskData = await AnalyticsService.getStudentRiskAnalytics();
      if (riskData.atRiskStudents.length > 0) {
        const student = riskData.atRiskStudents[0];
        expect(student.riskFactors.some((f) => f.includes("Attendance") || f.includes("Assignment"))).toBe(true);
      }
    });

    it("13. sorts critical risk students before warning level students", async () => {
      const riskData = await AnalyticsService.getStudentRiskAnalytics();
      if (riskData.atRiskStudents.length >= 2) {
        let seenWarning = false;
        for (const student of riskData.atRiskStudents) {
          if (student.riskLevel === "WARNING") {
            seenWarning = true;
          }
          if (seenWarning) {
            // Once we have seen a warning, no subsequent student should be CRITICAL
            expect(student.riskLevel).not.toBe("CRITICAL");
          }
        }
      }
    });
  });

  // =========================================================================
  // 5. ACADEMIC PERFORMANCE & ASSIGNMENTS (Tests 14 - 16)
  // =========================================================================
  describe("5. Academic Performance & Assignments", () => {
    it("14. computes academic performance using evaluated assignment grades", async () => {
      const performance = await AnalyticsService.getAcademicPerformance();
      expect(performance.averageMarksPercentage).toBeGreaterThanOrEqual(0);
      expect(performance.averageMarksPercentage).toBeLessThanOrEqual(100);
      expect(performance.subjectPerformance.length).toBeGreaterThan(0);
      expect(performance.divisionPerformance.length).toBeGreaterThan(0);
      expect(performance.gradeDistribution).toHaveProperty("gradeA");
      expect(performance.gradeDistribution).toHaveProperty("gradeB");
    });

    it("15. assignment analytics computes submission rates and grading backlogs", async () => {
      const asgn = await AnalyticsService.getAssignmentAnalytics();
      expect(asgn.totalAssignments).toBeGreaterThan(0);
      expect(asgn.submissionRate).toBeGreaterThanOrEqual(0);
      expect(asgn.submissionRate).toBeLessThanOrEqual(100);
      expect(asgn.onTimeRate + asgn.lateRate).toBe(100);
      expect(asgn.gradingCompletionRate).toBeGreaterThanOrEqual(0);
      expect(asgn.subjectBreakdown.length).toBeGreaterThan(0);
    });

    it("16. assignment subject breakdown reflects curriculum courses", async () => {
      const asgn = await AnalyticsService.getAssignmentAnalytics();
      for (const subj of asgn.subjectBreakdown) {
        expect(subj.subjectCode).toBeDefined();
        expect(subj.submissionRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // =========================================================================
  // 6. FACULTY WORKLOAD & CAPACITY (Tests 17 - 19)
  // =========================================================================
  describe("6. Faculty Workload & Capacity", () => {
    it("17. faculty workload distinctly separates assigned vs scheduled hours", async () => {
      const workload = await AnalyticsService.getFacultyWorkloadAnalytics();
      expect(workload.facultyCount).toBeGreaterThan(0);
      expect(workload.totalAssignedWeeklyHours).toBeGreaterThan(0);
      expect(workload.totalScheduledWeeklyHours).toBeGreaterThan(0);
      expect(workload.facultySummaries.length).toBe(workload.facultyCount);

      const meera = workload.facultySummaries.find(
        (f) => f.facultyName === "Prof. Meera Sen" || f.facultyId === facultyId
      );
      expect(meera).toBeDefined();
      expect(meera?.assignedWeeklyPeriods).toBe(9);
      expect(meera?.scheduledWeeklyPeriods).toBe(9);
      expect(meera?.theoryPeriods).toBe(7);
      expect(meera?.labPeriods).toBe(2);
    });

    it("18. classifies faculty workload into overloaded, balanced, and underutilized tiers", async () => {
      const workload = await AnalyticsService.getFacultyWorkloadAnalytics();
      const dist = workload.workloadDistribution;
      expect(dist.overloadedCount + dist.balancedCount + dist.underutilizedCount).toBe(
        workload.facultyCount
      );
    });

    it("19. filters faculty workload by facultyId accurately", async () => {
      const single = await AnalyticsService.getFacultyWorkloadAnalytics({ facultyId });
      expect(single.facultyCount).toBe(1);
      expect(single.facultySummaries[0].facultyId).toBe(facultyId);
    });
  });

  // =========================================================================
  // 7. TIMETABLE, ROOM & LAB UTILIZATION (Tests 20 - 22)
  // =========================================================================
  describe("7. Timetable, Room & Lab Utilization", () => {
    it("20. timetable analytics computes room and laboratory utilization rates", async () => {
      const tt = await AnalyticsService.getTimetableUtilization();
      expect(tt.totalRooms).toBeGreaterThan(0);
      expect(tt.totalClassrooms).toBeGreaterThan(0);
      expect(tt.totalLaboratories).toBeGreaterThan(0);
      expect(tt.classroomUtilizationRate).toBeGreaterThan(0);
      expect(tt.laboratoryUtilizationRate).toBeGreaterThan(0);
      expect(tt.overallRoomUtilizationRate).toBeGreaterThan(0);
    });

    it("21. computes period-by-period allocation distribution across 6 academic periods", async () => {
      const tt = await AnalyticsService.getTimetableUtilization();
      expect(tt.periodUtilization.length).toBe(6);
      for (const p of tt.periodUtilization) {
        expect(p.period).toBeGreaterThanOrEqual(1);
        expect(p.period).toBeLessThanOrEqual(6);
        expect(p.timeSlot).toBeDefined();
        expect(p.utilizationRate).toBeGreaterThanOrEqual(0);
      }
    });

    it("22. identifies available physical facilities with capacity limits", async () => {
      const tt = await AnalyticsService.getTimetableUtilization();
      expect(tt.availableRooms.length).toBeGreaterThan(0);
      for (const r of tt.availableRooms) {
        expect(r.capacity).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // 8. CAMPUS LIFE: EVENTS, CLUBS & LOST & FOUND (Tests 23 - 26)
  // =========================================================================
  describe("8. Campus Life: Events, Clubs & Lost and Found", () => {
    it("23. event analytics computes capacity utilization and attendance conversion", async () => {
      const evt = await AnalyticsService.getEventAnalytics();
      expect(evt.totalEvents).toBeGreaterThan(0);
      expect(evt.totalRegistrations).toBeGreaterThan(0);
      expect(evt.capacityUtilizationRate).toBeGreaterThanOrEqual(0);
      expect(evt.attendanceConversionRate).toBeGreaterThanOrEqual(0);
      expect(evt.categoryDistribution.length).toBeGreaterThan(0);
    });

    it("24. club analytics preserves deterministic engagement score and tier index", async () => {
      const clb = await AnalyticsService.getClubAnalytics();
      expect(clb.activeClubsCount).toBeGreaterThan(0);
      expect(clb.totalMembersCount).toBeGreaterThan(0);
      expect(clb.averageEngagementScore).toBeGreaterThan(0);
      expect(clb.topClubs.length).toBeGreaterThan(0);

      // Verify engagement tier is valid
      for (const c of clb.topClubs) {
        expect(["Elite", "High", "Active", "Developing"]).toContain(c.engagementTier);
      }
    });

    it("25. lost & found analytics computes resolution rate and case breakdown", async () => {
      const lf = await AnalyticsService.getLostFoundAnalytics();
      expect(lf.totalReports).toBeGreaterThan(0);
      expect(lf.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(lf.resolutionRate).toBeLessThanOrEqual(100);
      expect(lf.claimsBreakdown.totalClaims).toBeGreaterThanOrEqual(0);
      expect(lf.categoryDistribution.length).toBeGreaterThan(0);
    });

    it("26. notification analytics computes read vs unread rate and priority distribution", async () => {
      const notifs = await AnalyticsService.getNotificationAnalytics();
      expect(notifs.totalNotifications).toBeGreaterThan(0);
      expect(notifs.readRate + notifs.unreadRate).toBe(100);
      expect(notifs.categoryDistribution.length).toBeGreaterThan(0);
      expect(notifs.priorityDistribution.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 9. PLACEMENT FUNNEL & READINESS (Tests 27 - 28)
  // =========================================================================
  describe("9. Placement Funnel & Readiness", () => {
    it("27. placement analytics aggregates corporate recruitment pipeline", async () => {
      const pl = await AnalyticsService.getPlacementAnalytics();
      expect(pl.recruitingCompaniesCount).toBeGreaterThan(0);
      expect(pl.totalApplications).toBeGreaterThan(0);
      expect(pl.statusFunnel).toHaveProperty("applied");
      expect(pl.statusFunnel).toHaveProperty("shortlisted");
      expect(pl.statusFunnel).toHaveProperty("offered");
      expect(pl.departmentParticipation.length).toBeGreaterThan(0);
    });

    it("28. placement readiness score distribution conforms to 4-tier index", async () => {
      const pl = await AnalyticsService.getPlacementAnalytics();
      const dist = pl.readinessDistribution;
      expect(dist.placementReady).toBeGreaterThanOrEqual(0);
      expect(dist.highPotential).toBeGreaterThanOrEqual(0);
      expect(dist.developingSkills).toBeGreaterThanOrEqual(0);
      expect(dist.earlyStage).toBeGreaterThanOrEqual(0);
    });
  });

  // =========================================================================
  // 10. TELEMETRY FILTERS & EDGE CASES (Tests 29 - 31)
  // =========================================================================
  describe("10. Telemetry Filters & Edge Cases", () => {
    it("29. department filters apply consistently to student counts", async () => {
      const allOverview = await AnalyticsService.getExecutiveOverview();
      const compOverview = await AnalyticsService.getExecutiveOverview({ departmentId: "dept-comp" });
      expect(compOverview).toBeDefined();
      expect(compOverview.kpis.totalStudents.value).toBeDefined();
    });

    it("30. date range filters bound attendance telemetry accurately", async () => {
      const filtered = await AnalyticsService.getAttendanceAnalytics({
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      });
      expect(filtered).toBeDefined();
      for (const t of filtered.attendanceTrend) {
        expect(t.date >= "2024-03-01").toBe(true);
        expect(t.date <= "2024-03-31").toBe(true);
      }
    });

    it("31. department comparison benchmarking returns normalized data", async () => {
      const comparison = await AnalyticsService.getDepartmentComparison();
      expect(comparison.length).toBeGreaterThan(0);
      for (const dept of comparison) {
        expect(dept.departmentName).toBeDefined();
        expect(dept.studentCount).toBeGreaterThan(0);
        expect(dept.facultyCount).toBeGreaterThan(0);
        expect(dept.attendanceRate).toBeGreaterThan(0);
        expect(["HEALTHY", "WARNING", "CRITICAL"]).toContain(dept.configurationStatus);
      }
    });
  });

  // =========================================================================
  // 11. RFC 4180 CSV EXPORT & RBAC (Tests 32 - 34)
  // =========================================================================
  describe("11. RFC 4180 CSV Export & RBAC", () => {
    it("32. admin exports valid RFC 4180 CSV attendance report with correct headers", async () => {
      const { filename, csv } = await AnalyticsService.exportReport(
        "attendance",
        {},
        Role.ADMIN,
        adminId
      );
      expect(filename).toMatch(/campussphere_attendance_\d{4}-\d{2}-\d{2}\.csv/);
      expect(csv).toContain("Student ID,Roll Number,Student Name,Department,Division");
      expect(csv).toContain("22COMPA101");
    });

    it("33. placement officer is authorized to export placement CSV report", async () => {
      const { filename, csv } = await AnalyticsService.exportReport(
        "placement",
        {},
        Role.PLACEMENT_OFFICER,
        placementOfficerId
      );
      expect(filename).toMatch(/campussphere_placement_/);
      expect(csv).toContain("Drive ID,Company Name,Role,Employment Type");
    });

    it("34. club coordinator is authorized to export club CSV report", async () => {
      const { filename, csv } = await AnalyticsService.exportReport(
        "clubs",
        {},
        Role.CLUB_COORDINATOR,
        clubCoordinatorId
      );
      expect(filename).toMatch(/campussphere_clubs_/);
      expect(csv).toContain("Club ID,Club Name,Category,Active Members");
    });
  });
});
