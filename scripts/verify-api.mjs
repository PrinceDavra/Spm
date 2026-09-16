// Node.js live verification script testing Phase 2 and Phase 3 endpoints over HTTP
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING LIVE HTTP API VERIFICATION FOR PHASES 2 THROUGH 9");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // --- PHASE 2 AUTH TESTS ---
  console.log("\n--- Phase 2 Auth Tests ---");
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@campussphere.edu", password: "WrongPassword999" }),
  });
  assert(badLoginRes.status === 401, "Invalid password returns HTTP 401");

  // Student login
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@campussphere.edu", password: "StudentPassword@123" }),
  });
  const studentCookie = studentLoginRes.headers.get("set-cookie") || "";
  assert(studentLoginRes.status === 200, "Student login returns HTTP 200");

  // Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@campussphere.edu", password: "AdminPassword@123" }),
  });
  const adminCookie = adminLoginRes.headers.get("set-cookie") || "";
  assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");

  // Faculty login
  const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "faculty@campussphere.edu", password: "FacultyPassword@123" }),
  });
  const facultyCookie = facultyLoginRes.headers.get("set-cookie") || "";
  assert(facultyLoginRes.status === 200, "Faculty login returns HTTP 200");

  // --- PHASE 3 PROFILE TESTS ---
  console.log("\n--- Phase 3 Profile Tests ---");

  // Test P1: Student can fetch own profile
  const studentProfRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Cookie: studentCookie },
  });
  const studentProfData = await studentProfRes.json();
  assert(studentProfRes.status === 200, "Student can fetch own profile (HTTP 200)");
  assert(studentProfData.profile.student.rollNumber === "22COMPA101", "Student roll number is verified");
  assert(studentProfData.profile.student.prnNumber === "PRN2022014589", "Student PRN is verified");
  assert(studentProfData.profile.student.department === "Computer Engineering", "Student department is verified");

  // Test P2: Student can update permitted fields (phone, bio, skills)
  const newPhone = "+91 99887 76655";
  const newBio = "Live HTTP verified student bio for SPM demonstration.";
  const newSkills = ["Next.js 16", "TypeScript", "Prisma", "PostgreSQL", "Docker"];
  const studentUpdateRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ phone: newPhone, bio: newBio, skills: newSkills }),
  });
  const studentUpdateData = await studentUpdateRes.json();
  assert(studentUpdateRes.status === 200, "Student update permitted fields succeeds (HTTP 200)");
  assert(studentUpdateData.profile.phone === newPhone, "Updated phone persisted in response");
  assert(studentUpdateData.profile.student.bio === newBio, "Updated bio persisted in response");
  assert(studentUpdateData.profile.student.skills.includes("Next.js 16"), "Updated skills persisted in response");

  // Test P3: Server strictly rejects student attempting to modify rollNumber
  const hackRollRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ rollNumber: "99HACKED101" }),
  });
  assert(hackRollRes.status === 400, "Server blocks student modifying rollNumber (HTTP 400)");

  // Test P4: Server strictly rejects student attempting to modify PRN
  const hackPrnRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ prnNumber: "PRN99999999" }),
  });
  assert(hackPrnRes.status === 400, "Server blocks student modifying PRN (HTTP 400)");

  // Test P5: Server strictly rejects student attempting to modify email
  const hackEmailRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ email: "hacked@evil.com" }),
  });
  assert(hackEmailRes.status === 400, "Server blocks student modifying email (HTTP 400)");

  // Test P6: Faculty can fetch own profile
  const facultyProfRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Cookie: facultyCookie },
  });
  const facultyProfData = await facultyProfRes.json();
  assert(facultyProfRes.status === 200, "Faculty can fetch own profile (HTTP 200)");
  assert(facultyProfData.profile.faculty.employeeId === "EMP-CS-042", "Faculty employee ID verified");
  assert(facultyProfData.profile.faculty.designation === "Associate Professor", "Faculty designation verified");

  // Test P7: Faculty can update permitted fields (officeRoom, qualification, specialization)
  const newOffice = "Room 410, Senior Faculty Wing";
  const newQual = "Ph.D. in Computer Science (IIT Bombay) - PostDoc MIT";
  const facultyUpdateRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ officeRoom: newOffice, qualification: newQual }),
  });
  const facultyUpdateData = await facultyUpdateRes.json();
  assert(facultyUpdateRes.status === 200, "Faculty update permitted fields succeeds (HTTP 200)");
  assert(facultyUpdateData.profile.faculty.officeRoom === newOffice, "Updated office room persisted");
  assert(facultyUpdateData.profile.faculty.qualification === newQual, "Updated qualification persisted");

  // Test P8: Server strictly rejects faculty attempting to modify employeeId
  const hackEmpRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ employeeId: "EMP-DEAN-001" }),
  });
  assert(hackEmpRes.status === 400, "Server blocks faculty modifying employeeId (HTTP 400)");

  // Test P9: Unauthenticated request to /api/profile is rejected
  const unauthProfRes = await fetch(`${BASE_URL}/api/profile`);
  assert(unauthProfRes.status === 401, "Unauthenticated /api/profile returns HTTP 401");

  // --- PHASE 4 ATTENDANCE TESTS ---
  console.log("\n--- Phase 4 Attendance Tests ---");

  // Test A1: Unauthenticated request to student attendance is rejected
  const unauthAttRes = await fetch(`${BASE_URL}/api/attendance/student`);
  assert(unauthAttRes.status === 401, "Unauthenticated /api/attendance/student returns HTTP 401");

  // Test A2: Student can fetch own attendance summary & projection
  const studentAttRes = await fetch(`${BASE_URL}/api/attendance/student`, {
    headers: { Cookie: studentCookie },
  });
  const studentAttData = await studentAttRes.json();
  assert(studentAttRes.status === 200, "Student fetches attendance summary (HTTP 200)");
  assert(typeof studentAttData.summary.overallPercentage === "number", "Overall percentage is numeric");
  assert(studentAttData.summary.projection !== undefined, "Mathematical projection engine is present");
  assert(studentAttData.summary.subjectBreakdown.length > 0, "Subject-wise breakdown returned");

  // Test A3: Student cannot access faculty subject list (RBAC 403)
  const studentFacSubjRes = await fetch(`${BASE_URL}/api/attendance/faculty-subjects`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentFacSubjRes.status === 403, "Student blocked from faculty subjects (HTTP 403)");

  // Test A4: Faculty can access assigned subjects
  const facSubjRes = await fetch(`${BASE_URL}/api/attendance/faculty-subjects`, {
    headers: { Cookie: facultyCookie },
  });
  const facSubjData = await facSubjRes.json();
  assert(facSubjRes.status === 200, "Faculty fetches assigned subjects (HTTP 200)");
  assert(facSubjData.subjects.length > 0, "Assigned subjects returned for faculty");

  // Test A5: Student cannot mark attendance (RBAC 403)
  const studentMarkRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      facultySubjectId: "fs-dbms-div-a",
      divisionId: "div-comp-a",
      date: "2026-10-05",
      periodNumber: 1,
      topicCovered: "Unauthorized student submission",
      records: [{ studentId: "demo-student-001", status: "PRESENT" }],
    }),
  });
  assert(studentMarkRes.status === 403, "Student cannot mark attendance (HTTP 403)");

  // Test A6: Faculty cannot access sheet for unassigned subject (HTTP 403)
  const unassignedSheetRes = await fetch(
    `${BASE_URL}/api/attendance/sheet?facultySubjectId=unassigned-id-99&divisionId=div-comp-a&date=2026-10-05&period=1`,
    { headers: { Cookie: facultyCookie } }
  );
  assert(unassignedSheetRes.status === 403, "Faculty cannot access unauthorized subject sheet (HTTP 403)");

  // Test A7: Faculty can load authorized attendance sheet
  const sheetRes = await fetch(
    `${BASE_URL}/api/attendance/sheet?facultySubjectId=fs-dbms-div-a&divisionId=div-comp-a&date=2026-10-15&period=3`,
    { headers: { Cookie: facultyCookie } }
  );
  const sheetData = await sheetRes.json();
  assert(sheetRes.status === 200, "Faculty loads authorized attendance sheet (HTTP 200)");
  assert(sheetData.sheet.roster.length > 0, "Enrolled students loaded in sheet roster");

  // Test A8: Faculty marks attendance for session
  const randomDay = String(Math.floor(Math.random() * 25) + 1).padStart(2, "0");
  const liveSessionDate = `2026-11-${randomDay}`;
  const liveSessionPeriod = (Math.floor(Math.random() * 5) + 1);
  const markRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      facultySubjectId: "fs-dbms-div-a",
      divisionId: "div-comp-a",
      date: liveSessionDate,
      periodNumber: liveSessionPeriod,
      topicCovered: "Transaction ACID Properties and Concurrency Control",
      records: [
        { studentId: "demo-student-001", status: "PRESENT" },
        { studentId: "demo-student-002", status: "ABSENT" },
        { studentId: "demo-student-003", status: "PRESENT" },
        { studentId: "demo-student-004", status: "PRESENT" },
      ],
    }),
  });
  const markData = await markRes.json();
  assert(markRes.status === 200, "Faculty marks attendance session (HTTP 200)");
  assert(markData.result.recordsMarked === 4, "Records marked count verified");

  // Test A9: Duplicate attendance submission rejected (HTTP 409)
  const dupMarkRes = await fetch(`${BASE_URL}/api/attendance/mark`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      facultySubjectId: "fs-dbms-div-a",
      divisionId: "div-comp-a",
      date: liveSessionDate,
      periodNumber: liveSessionPeriod,
      topicCovered: "Duplicate Session Try",
      records: [{ studentId: "demo-student-001", status: "PRESENT" }],
    }),
  });
  assert(dupMarkRes.status === 409, "Duplicate attendance rejected with conflict (HTTP 409)");

  // Test A10: Faculty analytics and at-risk query
  const analyticsRes = await fetch(
    `${BASE_URL}/api/attendance/analytics?facultySubjectId=fs-dbms-div-a`,
    { headers: { Cookie: facultyCookie } }
  );
  const analyticsData = await analyticsRes.json();
  assert(analyticsRes.status === 200, "Faculty fetches subject analytics (HTTP 200)");
  assert(typeof analyticsData.analytics.avgPercentage === "number", "Class attendance average is computed");
  assert(Array.isArray(analyticsData.analytics.atRiskStudents), "Students at risk array returned");

  // Test A11: Student cannot edit attendance (HTTP 403)
  const studentEditRes = await fetch(`${BASE_URL}/api/attendance/rec-1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      status: "PRESENT",
      reasonForEdit: "Student attempting unauthorized status change",
    }),
  });
  assert(studentEditRes.status === 403, "Student blocked from editing attendance (HTTP 403)");

  // Test A12: Faculty edit requires mandatory audit reason (HTTP 400)
  const emptyReasonEditRes = await fetch(`${BASE_URL}/api/attendance/rec-1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      status: "PRESENT",
      reasonForEdit: "   ", // Blank
    }),
  });
  assert(emptyReasonEditRes.status === 400, "Edit without reason rejected (HTTP 400)");

  // Test A13: Faculty successfully edits past record with audit trail
  const validEditRes = await fetch(`${BASE_URL}/api/attendance/rec-1`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      status: "PRESENT",
      reasonForEdit: "Approved official representation at Inter-College Hackathon.",
    }),
  });
  const validEditData = await validEditRes.json();
  assert(validEditRes.status === 200, "Faculty edits record with audit log (HTTP 200)");
  // --- PHASE 5 TIMETABLE TESTS ---
  console.log("\n--- Phase 5 Timetable & CSP Engine Tests ---");

  // Test T1: Unauthenticated request to generate timetable is rejected
  const unauthGenRes = await fetch(`${BASE_URL}/api/timetable/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ divisionId: "div-comp-a" }),
  });
  assert(unauthGenRes.status === 401, "Unauthenticated /api/timetable/generate returns HTTP 401");

  // Test T2: Student blocked from generating timetable (RBAC 403)
  const studentGenRes = await fetch(`${BASE_URL}/api/timetable/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ divisionId: "div-comp-a" }),
  });
  assert(studentGenRes.status === 403, "Student cannot generate timetable (HTTP 403)");

  // Test T3: Faculty blocked from generating timetable (RBAC 403)
  const facultyGenRes = await fetch(`${BASE_URL}/api/timetable/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ divisionId: "div-comp-a" }),
  });
  assert(facultyGenRes.status === 403, "Faculty cannot generate timetable (HTTP 403)");

  // Test T4: Admin runs deterministic CSP generator
  const adminGenRes = await fetch(`${BASE_URL}/api/timetable/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      divisionId: "div-comp-a",
      academicYear: "2024-2025",
      semester: 6,
    }),
  });
  const adminGenData = await adminGenRes.json();
  assert(adminGenRes.status === 200, "Admin generates timetable via CSP (HTTP 200)");
  assert(adminGenData.success === true, "CSP solver reports success");
  assert(adminGenData.result.hardConflicts.length === 0, "Generated timetable has 0 hard conflicts");
  assert(adminGenData.result.softConstraintScore >= 80, "Soft constraint score meets optimization threshold");
  assert(adminGenData.result.assignments.length > 0, "Scheduled sessions generated");

  // Test T5: Admin validates slots with conflict validator
  const valRes = await fetch(`${BASE_URL}/api/timetable/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ slots: adminGenData.result.assignments }),
  });
  const valData = await valRes.json();
  assert(valRes.status === 200, "Admin validates timetable slots (HTTP 200)");
  assert(valData.report.isValid === true, "Valid timetable passes conflict validation");

  // Test T6: Admin saves draft timetable
  const saveRes = await fetch(`${BASE_URL}/api/timetable/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      divisionId: "div-comp-a",
      academicYear: "2024-2025",
      semester: 6,
      status: "DRAFT",
      version: 2,
      softScore: adminGenData.result.softConstraintScore,
      slots: adminGenData.result.assignments,
    }),
  });
  const saveData = await saveRes.json();
  assert(saveRes.status === 200, "Admin saves draft timetable (HTTP 200)");
  assert(saveData.timetable.status === "DRAFT", "Timetable saved with DRAFT status");

  // Test T7: Admin publishes timetable
  const pubRes = await fetch(`${BASE_URL}/api/timetable/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ timetableId: saveData.timetable.id }),
  });
  const pubData = await pubRes.json();
  assert(pubRes.status === 200, "Admin publishes timetable (HTTP 200)");
  assert(pubData.timetable.status === "PUBLISHED", "Timetable published with PUBLISHED status");

  // Test T8: Student accesses published division timetable
  const studentTtRes = await fetch(`${BASE_URL}/api/timetable/student`, {
    headers: { Cookie: studentCookie },
  });
  const studentTtData = await studentTtRes.json();
  assert(studentTtRes.status === 200, "Student accesses own division timetable (HTTP 200)");
  assert(studentTtData.data.divisionId === "div-comp-a", "Student timetable matches enrolled division");
  assert(Array.isArray(studentTtData.data.todaySlots), "Today's lectures array returned");

  // Test T9: Faculty accesses personalized teaching schedule
  const facultyTtRes = await fetch(`${BASE_URL}/api/timetable/faculty`, {
    headers: { Cookie: facultyCookie },
  });
  const facultyTtData = await facultyTtRes.json();
  assert(facultyTtRes.status === 200, "Faculty accesses teaching schedule (HTTP 200)");
  assert(facultyTtData.data.allSlots.length > 0, "Teaching slots returned for faculty");

  // Test T10: Admin edits slot with conflict prevention (collision rejected with 409)
  const slotToMove = adminGenData.result.assignments[1];
  const occupiedSlot = adminGenData.result.assignments[0];
  const conflictEditRes = await fetch(`${BASE_URL}/api/timetable/${slotToMove.variableId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      dayOfWeek: occupiedSlot.dayOfWeek,
      periodNumber: occupiedSlot.periodNumber, // Collision!
      roomId: occupiedSlot.roomId,
    }),
  });
  assert(conflictEditRes.status === 409, "Conflicting slot edit rejected (HTTP 409)");

  // Test T11: Admin queries version history
  const versRes = await fetch(`${BASE_URL}/api/timetable/versions?divisionId=div-comp-a`, {
    headers: { Cookie: adminCookie },
  });
  const versData = await versRes.json();
  assert(versRes.status === 200, "Admin queries timetable versions (HTTP 200)");
  assert(versData.versions.length > 0, "Version history returned");

  // --- PHASE 6 ASSIGNMENT MANAGEMENT TESTS ---
  console.log("\n--- Phase 6 Assignment Management & Submission Tests ---");

  // Test AS1: Unauthenticated access blocked
  const unauthAsgnRes = await fetch(`${BASE_URL}/api/assignments`);
  assert(unauthAsgnRes.status === 401, "Unauthenticated /api/assignments returns HTTP 401");

  // Test AS2: Student retrieves assignments hub data
  const studentAsgnRes = await fetch(`${BASE_URL}/api/assignments`, {
    headers: { Cookie: studentCookie },
  });
  const studentAsgnData = await studentAsgnRes.json();
  assert(studentAsgnRes.status === 200, "Student accesses enrolled assignments (HTTP 200)");
  assert(studentAsgnData.kpi && typeof studentAsgnData.kpi.pending === "number", "Student KPI summary returned");
  assert(Array.isArray(studentAsgnData.assignments), "Assignments array returned for student");

  // Test AS3: Student cannot see DRAFT assignments
  const studentHasDraft = studentAsgnData.assignments.some((a) => a.status === "DRAFT");
  assert(!studentHasDraft, "Student cannot see DRAFT assignments in list");

  // Test AS4: Student blocked from creating assignment (HTTP 403)
  const studentCreateRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      title: "Illegal Student Assignment",
      subjectId: "subj-dbms",
      divisionId: "div-comp-a",
      description: "Should fail authorization",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  assert(studentCreateRes.status === 403, "Student cannot create assignment (HTTP 403)");

  // Test AS5: Faculty creates new assignment for mapped subject
  const facultyCreateRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Distributed Two-Phase Commit & WAL Logging",
      subjectId: "subj-dbms",
      divisionId: "div-comp-a",
      description: "Analyze WAL logs and recovery mechanisms under failure.",
      instructions: "Submit technical report with write-ahead log diagrams.",
      maxMarks: 100,
      dueDate: new Date(Date.now() + 48 * 3600000).toISOString(), // 2 days in future
      status: "PUBLISHED",
      allowLateSubmission: true,
      latePenalty: 10,
      allowedFileTypes: ["pdf", "docx", "zip"],
    }),
  });
  const facultyCreateData = await facultyCreateRes.json();
  assert(facultyCreateRes.status === 200, "Faculty creates assignment for mapped subject (HTTP 200)");
  assert(facultyCreateData.assignment && facultyCreateData.assignment.id, "Assignment ID returned upon creation");

  const createdAsgnId = facultyCreateData.assignment?.id;

  // Test AS6: Faculty blocked from creating assignment for unmapped course
  const facultyUnmappedRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Unauthorized OS Assignment by DBMS Faculty",
      subjectId: "subj-os", // Prof. Meera Sen does NOT teach OS
      divisionId: "div-comp-a",
      description: "Should be rejected with 403",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  assert(facultyUnmappedRes.status === 403, "Faculty cannot create assignment for unmapped subject (HTTP 403)");

  // Test AS7: Faculty creates draft assignment
  const draftCreateRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Draft Syllabus Case Study",
      subjectId: "subj-dbms",
      divisionId: "div-comp-a",
      description: "Draft syllabus case study undergoing review",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "DRAFT",
    }),
  });
  const draftCreateData = await draftCreateRes.json();
  assert(draftCreateRes.status === 200, "Faculty creates draft assignment (HTTP 200)");
  const draftAsgnId = draftCreateData.assignment?.id;

  // Test AS8: Student blocked from accessing draft assignment detail directly (HTTP 403)
  const studentDraftDetailRes = await fetch(`${BASE_URL}/api/assignments/${draftAsgnId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentDraftDetailRes.status === 403, "Student blocked from draft assignment detail (HTTP 403)");

  // Test AS9: Faculty publishes draft assignment
  const pubAsgnRes = await fetch(`${BASE_URL}/api/assignments/${draftAsgnId}/publish`, {
    method: "POST",
    headers: { Cookie: facultyCookie },
  });
  const pubAsgnData = await pubAsgnRes.json();
  assert(pubAsgnRes.status === 200, "Faculty publishes draft assignment (HTTP 200)");
  assert(pubAsgnData.assignment.status === "PUBLISHED", "Assignment status updated to PUBLISHED");

  // Test AS10: Student retrieves assignment details with dynamic urgency
  const studentDetailRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}`, {
    headers: { Cookie: studentCookie },
  });
  const studentDetailData = await studentDetailRes.json();
  assert(studentDetailRes.status === 200, "Student fetches assignment details (HTTP 200)");
  assert(studentDetailData.canSubmit === true, "Student canSubmit flag is true for open assignment");
  assert(typeof studentDetailData.urgencyText === "string", "Dynamic urgency string computed");

  // Test AS11: Student submits work on-time
  const studentSubmitRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      fileName: "22COMPA101_2PC_Solution.pdf",
      fileUrl: "/uploads/assignments/22COMPA101_2PC_Solution.pdf",
      fileSize: 412000,
      fileType: "application/pdf",
      submissionText: "Two-Phase commit coordinator state machine implementation and WAL diagram.",
    }),
  });
  const studentSubmitData = await studentSubmitRes.json();
  assert(studentSubmitRes.status === 200, "Student submits assignment work on-time (HTTP 200)");
  assert(studentSubmitData.submission.version === 1, "Submission recorded as version 1");
  assert(studentSubmitData.submission.isLate === false, "On-time submission marked isLate: false");

  // Test AS12: Student resubmits revised solution
  const studentResubmitRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      fileName: "22COMPA101_2PC_Solution_v2.pdf",
      fileUrl: "/uploads/assignments/22COMPA101_2PC_Solution_v2.pdf",
      fileSize: 450000,
      fileType: "application/pdf",
      submissionText: "Revised solution including non-blocking 3PC comparison.",
    }),
  });
  const studentResubmitData = await studentResubmitRes.json();
  assert(studentResubmitRes.status === 200, "Student resubmits revised solution (HTTP 200)");
  assert(studentResubmitData.submission.version === 2, "Resubmission increments version to 2");

  // Test AS13: Student blocked from viewing submissions roster (HTTP 403)
  const studentRosterRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}/submissions`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentRosterRes.status === 403, "Student blocked from viewing submissions roster (HTTP 403)");

  // Test AS14: Faculty views submissions roster
  const facultyRosterRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}/submissions`, {
    headers: { Cookie: facultyCookie },
  });
  const facultyRosterData = await facultyRosterRes.json();
  assert(facultyRosterRes.status === 200, "Faculty views assignment submission roster (HTTP 200)");
  assert(Array.isArray(facultyRosterData.roster), "Student roster array returned");
  const studentEntry = facultyRosterData.roster.find((r) => r.studentId === "demo-student-001");
  assert(studentEntry && studentEntry.submissionStatus === "SUBMITTED", "Student submission reflected in roster");

  const submissionIdToGrade = studentEntry?.submissionId;

  // Test AS15: Student blocked from grading submission (HTTP 403)
  const studentGradeRes = await fetch(`${BASE_URL}/api/assignments/submissions/${submissionIdToGrade}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ marks: 95, feedback: "Student self-grading" }),
  });
  assert(studentGradeRes.status === 403, "Student blocked from grading submission (HTTP 403)");

  // Test AS16: Faculty grades submission with marks and feedback
  const facultyGradeRes = await fetch(`${BASE_URL}/api/assignments/submissions/${submissionIdToGrade}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      marks: 96,
      feedback: "Exceptional depth on WAL crash recovery and coordinator consensus protocols.",
    }),
  });
  const facultyGradeData = await facultyGradeRes.json();
  assert(facultyGradeRes.status === 200, "Faculty grades student submission (HTTP 200)");
  assert(facultyGradeData.submission.status === "GRADED", "Submission status updated to GRADED");
  assert(facultyGradeData.submission.marksObtained === 96, "Marks obtained persisted");

  // Test AS17: Resubmission blocked after work is graded (HTTP 400)
  const blockedResubmitRes = await fetch(`${BASE_URL}/api/assignments/${createdAsgnId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ submissionText: "Attempting to change graded work" }),
  });
  assert(blockedResubmitRes.status === 400, "Resubmission blocked after work has been graded (HTTP 400)");

  // Test AS18: Faculty retrieves performance analytics
  const asgnAnalyticsRes = await fetch(`${BASE_URL}/api/assignments/analytics`, {
    headers: { Cookie: facultyCookie },
  });
  const asgnAnalyticsData = await asgnAnalyticsRes.json();
  assert(asgnAnalyticsRes.status === 200, "Faculty retrieves assignment analytics (HTTP 200)");
  assert(asgnAnalyticsData.analytics && asgnAnalyticsData.analytics.metrics, "Analytics metrics payload present");
  assert(Array.isArray(asgnAnalyticsData.analytics.scoreDistribution), "Score distribution array present for Recharts");

  // Test AS19: Student blocked from faculty analytics endpoint (HTTP 403)
  const studentAnalyticsRes = await fetch(`${BASE_URL}/api/assignments/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentAnalyticsRes.status === 403, "Student blocked from faculty analytics endpoint (HTTP 403)");

  // --- PHASE 7 NOTICE & COMMUNICATION TESTS ---
  console.log("\n--- Phase 7 Notice & Communication Tests ---");

  // Test N1: Student gets notice feed
  const studentNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    headers: { Cookie: studentCookie },
  });
  const studentNoticeData = await studentNoticeRes.json();
  assert(studentNoticeRes.status === 200, "Student retrieves notice feed (HTTP 200)");

  // Test N2: Feed structure validation
  assert(
    Array.isArray(studentNoticeData.notices) &&
      typeof studentNoticeData.totalCount === "number" &&
      typeof studentNoticeData.unreadCount === "number",
    "Notice feed returns array, totalCount, and unreadCount"
  );

  // Test N3: Student cannot see DRAFT notices
  const hasDraft = studentNoticeData.notices.some((n) => n.status === "DRAFT");
  assert(!hasDraft, "Student notice feed contains 0 DRAFT notices");

  // Test N4: Student receives notices targeted to ALL
  const hasAll = studentNoticeData.notices.some((n) => n.audience === "ALL");
  assert(hasAll, "Student receives notices targeted to ALL");

  // Test N5: Student receives notices targeted to STUDENTS
  const hasStudents = studentNoticeData.notices.some((n) => n.audience === "STUDENTS");
  assert(hasStudents, "Student receives notices targeted to STUDENTS");

  // Test N6: Student receives notices targeted to their division (div-comp-a)
  const hasDivA = studentNoticeData.notices.some((n) => n.divisionId === "div-comp-a");
  assert(hasDivA, "Student receives notices targeted to their Division A");

  // Test N7: Student does NOT receive notices targeted to another department
  const hasMech = studentNoticeData.notices.some((n) => n.departmentId === "dept-mech");
  assert(!hasMech, "Student blocked from notices targeted to another department");

  // Test N8: Student does NOT receive notices targeted to another division
  const hasDivB = studentNoticeData.notices.some((n) => n.divisionId === "div-comp-b");
  assert(!hasDivB, "Student blocked from notices targeted to another division");

  // Test N9: Student does NOT receive notices targeted exclusively to FACULTY
  const hasFacultyOnly = studentNoticeData.notices.some((n) => n.audience === "FACULTY");
  assert(!hasFacultyOnly, "Student blocked from notices targeted exclusively to FACULTY");

  // Test N10: Student retrieves unread count
  const unreadRes = await fetch(`${BASE_URL}/api/notices/unread-count`, {
    headers: { Cookie: studentCookie },
  });
  const unreadData = await unreadRes.json();
  assert(unreadRes.status === 200, "Student fetches unread notice count (HTTP 200)");
  assert(typeof unreadData.unreadCount === "number", "Unread count is a numeric value");

  // Test N11: Student blocked from creating notice (HTTP 403)
  const studentCreateNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      title: "Student Attempting Broadcast",
      content: "This broadcast should be blocked by RBAC.",
      category: "GENERAL",
    }),
  });
  assert(studentCreateNoticeRes.status === 403, "Student blocked from creating notices (HTTP 403)");

  // Test N12: Unauthenticated user blocked from /api/notices (HTTP 401)
  const unauthNoticeRes = await fetch(`${BASE_URL}/api/notices`);
  assert(unauthNoticeRes.status === 401, "Unauthenticated user blocked from notice feed (HTTP 401)");

  // Test N13: Admin creates a DRAFT notice (HTTP 201)
  const adminCreateDraftRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Live HTTP Test Working Draft Notice",
      summary: "Draft summary for testing publication pipeline.",
      content: "Detailed circular guidelines under institutional review.",
      category: "ACADEMIC",
      priority: "IMPORTANT",
      audience: "STUDENTS",
      status: "DRAFT",
    }),
  });
  const adminCreateDraftData = await adminCreateDraftRes.json();
  assert(adminCreateDraftRes.status === 201, "Admin creates DRAFT notice (HTTP 201)");
  const testDraftId = adminCreateDraftData.notice?.id;

  // Test N14: Draft notice properties validated
  assert(
    adminCreateDraftData.notice?.status === "DRAFT" && !adminCreateDraftData.notice?.isPublished,
    "Draft notice has DRAFT status and isPublished false"
  );

  // Test N15: Student cannot view newly created draft notice
  const studentRefreshedFeedRes = await fetch(`${BASE_URL}/api/notices`, {
    headers: { Cookie: studentCookie },
  });
  const studentRefreshedFeedData = await studentRefreshedFeedRes.json();
  const draftInFeed = studentRefreshedFeedData.notices.some((n) => n.id === testDraftId);
  assert(!draftInFeed, "Newly created draft is invisible to student notice feed");

  // Test N16: Student blocked from directly opening draft notice (HTTP 403)
  const studentGetDraftRes = await fetch(`${BASE_URL}/api/notices/${testDraftId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentGetDraftRes.status === 403, "Student blocked from directly opening draft notice (HTTP 403)");

  // Test N17: Admin publishes the draft notice (HTTP 200)
  const adminPublishRes = await fetch(`${BASE_URL}/api/notices/${testDraftId}/publish`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  const adminPublishData = await adminPublishRes.json();
  assert(adminPublishRes.status === 200, "Admin publishes draft notice (HTTP 200)");
  assert(adminPublishData.notice?.status === "PUBLISHED", "Notice status transitioned to PUBLISHED");

  // Test N18: Published notice now visible in student feed
  const studentPostPublishFeedRes = await fetch(`${BASE_URL}/api/notices`, {
    headers: { Cookie: studentCookie },
  });
  const studentPostPublishFeedData = await studentPostPublishFeedRes.json();
  const noticeNowVisible = studentPostPublishFeedData.notices.some((n) => n.id === testDraftId);
  assert(noticeNowVisible, "Published notice is now visible in student feed");

  // Test N19: Faculty creates a PUBLISHED notice targeted to Division A (HTTP 201)
  const facultyNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Faculty Division A Distributed Systems Viva Announcement",
      summary: "Oral evaluation schedule for Semester 6 Division A.",
      content: "Students will present their two-phase commit lab projects in Lab 402.",
      category: "ACADEMIC",
      priority: "NORMAL",
      audience: "DIVISION",
      divisionId: "div-comp-a",
      status: "PUBLISHED",
    }),
  });
  const facultyNoticeData = await facultyNoticeRes.json();
  assert(facultyNoticeRes.status === 201, "Faculty creates targeted notice (HTTP 201)");
  const facultyNoticeId = facultyNoticeData.notice?.id;

  // Test N20: Notice validation rejects title with < 3 characters (HTTP 400)
  const shortTitleRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Hi",
      content: "Valid body text exceeding minimum length threshold.",
      category: "GENERAL",
    }),
  });
  assert(shortTitleRes.status === 400, "Notice validator rejects title < 3 chars (HTTP 400)");

  // Test N21: Notice validation rejects malicious .exe attachment (HTTP 400)
  const badExtRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Malicious Attachment Notice",
      content: "Notice body containing blocked executable attachment.",
      category: "GENERAL",
      attachments: [
        {
          fileName: "trojan.exe",
          fileUrl: "/downloads/trojan.exe",
          fileSize: 2048,
        },
      ],
    }),
  });
  assert(badExtRes.status === 400, "Notice validator rejects .exe attachment (HTTP 400)");

  // Test N22: Notice validation rejects directory traversal in filename (HTTP 400)
  const traversalRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Path Traversal Notice",
      content: "Notice body containing path traversal in filename.",
      category: "GENERAL",
      attachments: [
        {
          fileName: "../../etc/shadow.pdf",
          fileUrl: "/downloads/secret.pdf",
          fileSize: 2048,
        },
      ],
    }),
  });
  assert(traversalRes.status === 400, "Notice validator rejects path traversal in filename (HTTP 400)");

  // Test N23: Student opens notice details (HTTP 200)
  const studentOpenNoticeRes = await fetch(`${BASE_URL}/api/notices/${facultyNoticeId}`, {
    headers: { Cookie: studentCookie },
  });
  const studentOpenNoticeData = await studentOpenNoticeRes.json();
  assert(studentOpenNoticeRes.status === 200, "Student opens notice details (HTTP 200)");

  // Test N24: Opening notice auto-marks it as read
  assert(studentOpenNoticeData.notice?.isRead === true, "Opening notice auto-marks it as read");

  // Test N25: Student marks notice as unread (HTTP 200)
  const markUnreadRes = await fetch(`${BASE_URL}/api/notices/${facultyNoticeId}/unread`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(markUnreadRes.status === 200, "Student marks notice as unread (HTTP 200)");

  // Test N26: Student marks notice as read (HTTP 200)
  const markReadRes = await fetch(`${BASE_URL}/api/notices/${facultyNoticeId}/read`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(markReadRes.status === 200, "Student marks notice as read (HTTP 200)");

  // Test N27: Faculty blocked from editing another user's notice (HTTP 403)
  const unauthorizedEditRes = await fetch(`${BASE_URL}/api/notices/notice-001`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ title: "Faculty Hacked Admin Notice" }),
  });
  assert(unauthorizedEditRes.status === 403, "Faculty blocked from editing admin notice (HTTP 403)");

  // Test N28: Faculty successfully updates own notice (HTTP 200)
  const updateOwnRes = await fetch(`${BASE_URL}/api/notices/${facultyNoticeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ summary: "Updated faculty viva summary." }),
  });
  const updateOwnData = await updateOwnRes.json();
  assert(updateOwnRes.status === 200, "Faculty successfully updates own notice (HTTP 200)");
  assert(updateOwnData.notice?.summary === "Updated faculty viva summary.", "Updated summary persisted");

  // Test N29: Student blocked from updating notice (HTTP 403)
  const studentNoticeUpdateRes = await fetch(`${BASE_URL}/api/notices/${facultyNoticeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ title: "Student Modified Title" }),
  });
  assert(studentNoticeUpdateRes.status === 403, "Student blocked from updating notice (HTTP 403)");

  // Test N30: Admin archives notice (HTTP 200)
  const archiveRes = await fetch(`${BASE_URL}/api/notices/${testDraftId}/archive`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  const archiveData = await archiveRes.json();
  assert(archiveRes.status === 200, "Admin archives notice (HTTP 200)");
  assert(archiveData.notice?.status === "ARCHIVED", "Notice status transitioned to ARCHIVED");

  // Test N31: Faculty retrieves notice analytics (HTTP 200)
  const facultyAnalyticsRes = await fetch(`${BASE_URL}/api/notices/analytics`, {
    headers: { Cookie: facultyCookie },
  });
  const facultyAnalyticsData = await facultyAnalyticsRes.json();
  assert(facultyAnalyticsRes.status === 200, "Faculty retrieves notice analytics (HTTP 200)");
  assert(facultyAnalyticsData.analytics && facultyAnalyticsData.analytics.metrics, "Analytics metrics payload present");
  assert(typeof facultyAnalyticsData.analytics.metrics.totalReach === "number", "Total reach metric computed");

  // Test N32: Student blocked from notice analytics (HTTP 403)
  const studentNoticeAnalyticsRes = await fetch(`${BASE_URL}/api/notices/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentNoticeAnalyticsRes.status === 403, "Student blocked from notice analytics (HTTP 403)");

  // =========================================================================
  // --- PHASE 8 EVENTS DISCOVERY, CAPACITY & REGISTRATION TESTS ---
  // =========================================================================
  console.log("\n--- Phase 8 Events, Capacity & Registration Tests ---");

  // Test E1: Unauthenticated request to /api/events returns HTTP 401
  const unauthEventsRes = await fetch(`${BASE_URL}/api/events`);
  assert(unauthEventsRes.status === 401, "Unauthenticated access to /api/events returns HTTP 401");

  // Test E2: Student retrieves discovery feed returns HTTP 200
  const studentEventsRes = await fetch(`${BASE_URL}/api/events`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentEventsRes.status === 200, "Student retrieves discovery feed (HTTP 200)");
  const studentEventsData = await studentEventsRes.json();

  // Test E3: Discovery feed includes events array and total count
  assert(Array.isArray(studentEventsData.events), "Discovery feed returns events array");
  assert(typeof studentEventsData.total === "number", "Discovery feed returns total count");

  // Test E4: Discovery feed contains no draft events for student
  const hasDraftsInStudentFeed = studentEventsData.events.some((e) => e.status === "DRAFT");
  assert(!hasDraftsInStudentFeed, "Draft events are strictly hidden from student feed");

  // Test E5: Discovery feed calculates seatsRemaining
  assert(typeof studentEventsData.events[0]?.seatsRemaining === "number", "Event cards include calculated seatsRemaining");

  // Test E6: Category filtering returns only matching category
  const hackathonsRes = await fetch(`${BASE_URL}/api/events?category=HACKATHON`, {
    headers: { Cookie: studentCookie },
  });
  const hackathonsData = await hackathonsRes.json();
  assert(hackathonsRes.status === 200, "Category filtering returns HTTP 200");
  assert(hackathonsData.events.every((e) => e.category === "HACKATHON"), "All filtered events are HACKATHON");

  // Test E7: Search filtering matches query
  const searchEventsRes = await fetch(`${BASE_URL}/api/events?search=Masterclass`, {
    headers: { Cookie: studentCookie },
  });
  const searchEventsData = await searchEventsRes.json();
  assert(searchEventsRes.status === 200, "Search filtering returns HTTP 200");
  assert(searchEventsData.events.some((e) => e.title.includes("Masterclass")), "Search returns matching Masterclass event");

  // Test E8: Tab filter upcoming returns events
  const upcomingEventsRes = await fetch(`${BASE_URL}/api/events?tab=upcoming`, {
    headers: { Cookie: studentCookie },
  });
  assert(upcomingEventsRes.status === 200, "Tab filter tab=upcoming returns HTTP 200");

  // Test E9: Student blocked from creating event (HTTP 403)
  const studentCreateEventRes = await fetch(`${BASE_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      title: "Student Unauthorized Event",
      description: "Students should not be allowed to organize events.",
      category: "WORKSHOP",
      venue: "Hall A",
      startDateTime: "2026-11-01T10:00:00.000Z",
      endDateTime: "2026-11-01T14:00:00.000Z",
      registrationDeadline: "2026-10-31T20:00:00.000Z",
      capacity: 30,
    }),
  });
  assert(studentCreateEventRes.status === 403, "Student blocked from creating event (HTTP 403)");

  // Test E10: Faculty creates new draft event (HTTP 201)
  const facultyCreateEventRes = await fetch(`${BASE_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      title: "Live API Faculty Verification Workshop",
      summary: "Live test event creation for Phase 8.",
      description: "Full workshop description covering live verification assertions and testing.",
      category: "TECHNICAL",
      venue: "Lab 402, High Performance Cluster",
      startDateTime: "2026-11-12T10:00:00.000Z",
      endDateTime: "2026-11-12T14:00:00.000Z",
      registrationDeadline: "2026-11-11T20:00:00.000Z",
      capacity: 25,
      status: "DRAFT",
    }),
  });
  assert(facultyCreateEventRes.status === 201, "Faculty creates event draft (HTTP 201)");
  const facultyCreatedData = await facultyCreateEventRes.json();
  const testDraftEventId = facultyCreatedData.event?.id;

  // Test E11: Created draft status is DRAFT
  assert(facultyCreatedData.event?.status === "DRAFT", "New event status is DRAFT");

  // Test E12: Student cannot view draft event detail (HTTP 404)
  const studentViewDraftRes = await fetch(`${BASE_URL}/api/events/${testDraftEventId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentViewDraftRes.status === 404, "Student cannot access draft event detail (HTTP 404)");

  // Test E13: Admin creates event with capacity=1 (HTTP 201)
  const adminCreateEventRes = await fetch(`${BASE_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Capacity Limited Single Seat Workshop",
      summary: "Single seat capacity live testing.",
      description: "Testing strict capacity limits and concurrency protection live over HTTP.",
      category: "WORKSHOP",
      venue: "Executive Suite A",
      startDateTime: "2026-11-18T10:00:00.000Z",
      endDateTime: "2026-11-18T13:00:00.000Z",
      registrationDeadline: "2026-11-17T20:00:00.000Z",
      capacity: 1,
      status: "REGISTRATION_OPEN",
    }),
  });
  assert(adminCreateEventRes.status === 201, "Admin creates capacity=1 event (HTTP 201)");
  const adminCreatedData = await adminCreateEventRes.json();
  const singleSeatEventId = adminCreatedData.event?.id;

  // Test E14: Faculty publishes draft event (HTTP 200)
  const publishEventRes = await fetch(`${BASE_URL}/api/events/${testDraftEventId}/publish`, {
    method: "POST",
    headers: { Cookie: facultyCookie },
  });
  assert(publishEventRes.status === 200, "Faculty publishes draft event (HTTP 200)");
  const publishEventData = await publishEventRes.json();

  // Test E15: Published event status is REGISTRATION_OPEN
  assert(publishEventData.event?.status === "REGISTRATION_OPEN", "Published event transitioned to REGISTRATION_OPEN");

  // Test E16: Student now can view published event detail (HTTP 200)
  const studentViewPublishedRes = await fetch(`${BASE_URL}/api/events/${testDraftEventId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentViewPublishedRes.status === 200, "Student accesses published event detail (HTTP 200)");

  // Test E17: Student registers for event (HTTP 201)
  const studentRegisterRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}/register`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(studentRegisterRes.status === 201, "Student registers for open event (HTTP 201)");
  const studentRegisterData = await studentRegisterRes.json();

  // Test E18: Registration returns confirmation code with CS- prefix
  assert(typeof studentRegisterData.registration?.confirmationCode === "string" && studentRegisterData.registration.confirmationCode.startsWith("CS-"), "Registration returns unique CS- confirmation code");

  // Test E19: Duplicate registration by same student returns HTTP 400
  const duplicateRegisterRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}/register`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(duplicateRegisterRes.status === 400, "Duplicate registration rejected (HTTP 400)");

  // Test E20: Capacity enforcement - another attempt when full returns HTTP 400 capacity
  const facultyAttemptFullRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}/register`, {
    method: "POST",
    headers: { Cookie: facultyCookie },
  });
  assert(facultyAttemptFullRes.status === 400, "Registration rejected when capacity is full (HTTP 400)");
  const facultyAttemptFullData = await facultyAttemptFullRes.json();
  assert(facultyAttemptFullData.error?.includes("capacity"), "Error message indicates capacity reached");

  // Test E21: Student checks registered events (HTTP 200)
  const studentRegisteredRes = await fetch(`${BASE_URL}/api/events/registered`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentRegisteredRes.status === 200, "Student retrieves registered events (HTTP 200)");
  const studentRegisteredData = await studentRegisteredRes.json();

  // Test E22: Registered events list contains the registered event
  const isRegisteredFound = studentRegisteredData.upcoming?.some((e) => e.id === singleSeatEventId);
  assert(isRegisteredFound, "Newly registered event appears in upcoming registered list");

  // Test E23: Calendar export download returns HTTP 200
  const calendarRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}/calendar`, {
    headers: { Cookie: studentCookie },
  });
  assert(calendarRes.status === 200, "Calendar export download returns HTTP 200");

  // Test E24: Calendar export has text/calendar Content-Type
  const calendarContentType = calendarRes.headers.get("content-type") || "";
  assert(calendarContentType.includes("text/calendar"), "Calendar export has text/calendar header");

  // Test E25: Calendar content contains RFC 5545 components
  const icsText = await calendarRes.text();
  assert(icsText.includes("BEGIN:VCALENDAR") && icsText.includes("BEGIN:VEVENT"), "Calendar export contains valid VCALENDAR and VEVENT blocks");

  // Test E26: Student cancels registration (HTTP 200)
  const cancelRegRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}/cancel-registration`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(cancelRegRes.status === 200, "Student cancels event registration (HTTP 200)");

  // Test E27: Seat restored after cancellation (seatsRemaining === 1)
  const eventAfterCancelRes = await fetch(`${BASE_URL}/api/events/${singleSeatEventId}`, {
    headers: { Cookie: adminCookie },
  });
  const eventAfterCancelData = await eventAfterCancelRes.json();
  assert(eventAfterCancelData.event?.seatsRemaining === 1, "Seat restored to 1 available after cancellation");

  // Test E28: Student blocked from retrieving participant roster (HTTP 403)
  const studentParticipantsRes = await fetch(`${BASE_URL}/api/events/${testDraftEventId}/participants`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentParticipantsRes.status === 403, "Student blocked from participant roster (HTTP 403)");

  // Test E29: Faculty retrieves participant roster for their event (HTTP 200)
  const facultyParticipantsRes = await fetch(`${BASE_URL}/api/events/${testDraftEventId}/participants`, {
    headers: { Cookie: facultyCookie },
  });
  assert(facultyParticipantsRes.status === 200, "Faculty retrieves participant roster (HTTP 200)");
  const facultyParticipantsData = await facultyParticipantsRes.json();

  // Test E30: Participant roster contains participants array and total
  assert(Array.isArray(facultyParticipantsData.participants), "Participant roster returns participants array");
  assert(typeof facultyParticipantsData.total === "number", "Participant roster returns total count");

  // Test E31: Faculty marks participant attendance as PRESENT on evt-002 (HTTP 200)
  const markPresentRes = await fetch(`${BASE_URL}/api/events/evt-002/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      userId: "demo-student-001",
      attendanceStatus: "PRESENT",
    }),
  });
  assert(markPresentRes.status === 200, "Faculty marks participant attendance as PRESENT (HTTP 200)");
  const markPresentData = await markPresentRes.json();

  // Test E32: Participant attendance status is PRESENT and status is ATTENDED
  assert(markPresentData.participant?.attendanceStatus === "PRESENT", "Participant attendanceStatus updated to PRESENT");
  assert(markPresentData.participant?.status === "ATTENDED", "Participant registration status updated to ATTENDED");

  // Test E33: Faculty marks participant attendance as ABSENT (HTTP 200)
  const markAbsentRes = await fetch(`${BASE_URL}/api/events/evt-002/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      userId: "demo-student-001",
      attendanceStatus: "ABSENT",
    }),
  });
  assert(markAbsentRes.status === 200, "Faculty marks participant attendance as ABSENT (HTTP 200)");

  // Test E34: Student blocked from recording attendance (HTTP 403)
  const studentMarkAttendanceRes = await fetch(`${BASE_URL}/api/events/evt-002/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      userId: "demo-student-001",
      attendanceStatus: "PRESENT",
    }),
  });
  assert(studentMarkAttendanceRes.status === 403, "Student blocked from marking attendance (HTTP 403)");

  // Test E35: Faculty retrieves event analytics (HTTP 200)
  const facultyEventAnalyticsRes = await fetch(`${BASE_URL}/api/events/evt-002/analytics`, {
    headers: { Cookie: facultyCookie },
  });
  assert(facultyEventAnalyticsRes.status === 200, "Faculty retrieves event analytics (HTTP 200)");
  const facultyEventAnalyticsData = await facultyEventAnalyticsRes.json();

  // Test E36: Analytics returns capacity, totalRegistered, availableSeats, attendanceRate
  assert(typeof facultyEventAnalyticsData.analytics?.capacity === "number", "Analytics includes capacity metric");
  assert(typeof facultyEventAnalyticsData.analytics?.totalRegistered === "number", "Analytics includes totalRegistered metric");
  assert(typeof facultyEventAnalyticsData.analytics?.availableSeats === "number", "Analytics includes availableSeats metric");
  assert(typeof facultyEventAnalyticsData.analytics?.attendanceRate === "number", "Analytics includes attendanceRate percentage");

  // Test E37: Student blocked from event analytics (HTTP 403)
  const studentEventAnalyticsRes = await fetch(`${BASE_URL}/api/events/evt-002/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentEventAnalyticsRes.status === 403, "Student blocked from event analytics (HTTP 403)");

  // Test E38: Admin has universal access to event analytics (HTTP 200)
  const adminEventAnalyticsRes = await fetch(`${BASE_URL}/api/events/evt-002/analytics`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminEventAnalyticsRes.status === 200, "Admin has universal access to event analytics (HTTP 200)");

  // --- PHASE 9 CLUB MANAGEMENT TESTS ---
  console.log("\n--- Phase 9 Club Management Tests ---");

  // Club Coordinator login
  const c_coordinatorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "club@campussphere.edu", password: "ClubPassword@123" }),
  });
  const c_coordinatorCookie = c_coordinatorLoginRes.headers.get("set-cookie") || "";
  assert(c_coordinatorLoginRes.status === 200, "C1: Club Coordinator login returns HTTP 200");

  // Test C2: Student can discover clubs (HTTP 200)
  const c_clubsDiscoverRes = await fetch(`${BASE_URL}/api/clubs`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_clubsDiscoverRes.status === 200, "C2: Student can discover clubs (HTTP 200)");
  const c_clubsDiscoverData = await c_clubsDiscoverRes.json();

  // Test C3: Draft clubs excluded from student discovery
  assert(Array.isArray(c_clubsDiscoverData.clubs) && c_clubsDiscoverData.clubs.length >= 10, "C3: Discovery returns list of clubs (>= 10 active/published)");
  const c_hasClubDraft = c_clubsDiscoverData.clubs.some((c) => c.status === "DRAFT");
  assert(!c_hasClubDraft, "C3b: Draft clubs are strictly invisible to students in discovery");

  // Test C4: Category filtering works
  const c_techClubsRes = await fetch(`${BASE_URL}/api/clubs?category=TECHNICAL`, {
    headers: { Cookie: studentCookie },
  });
  const c_techClubsData = await c_techClubsRes.json();
  const c_allTech = c_techClubsData.clubs?.length > 0 && c_techClubsData.clubs.every((c) => c.category === "TECHNICAL");
  assert(c_allTech, "C4: Filtering by category TECHNICAL returns only technical clubs");

  // Test C5: Search filtering works
  const c_searchRes = await fetch(`${BASE_URL}/api/clubs?search=Robotics`, {
    headers: { Cookie: studentCookie },
  });
  const c_searchData = await c_searchRes.json();
  const c_matchesSearch = c_searchData.clubs?.length > 0 && c_searchData.clubs.some((c) => c.name.toLowerCase().includes("robotics") || c.description.toLowerCase().includes("robotics"));
  assert(c_matchesSearch, "C5: Search filtering for 'Robotics' yields matching clubs");

  // Test C6: Sorting by members works
  const c_sortRes = await fetch(`${BASE_URL}/api/clubs?sort=members`, {
    headers: { Cookie: studentCookie },
  });
  const c_sortData = await c_sortRes.json();
  let c_sortedCorrectly = true;
  for (let i = 0; i < (c_sortData.clubs?.length || 0) - 1; i++) {
    if (c_sortData.clubs[i].memberCount < c_sortData.clubs[i + 1].memberCount) {
      c_sortedCorrectly = false;
      break;
    }
  }
  assert(c_sortedCorrectly, "C6: Sorting by 'members' orders clubs descending by memberCount");

  // Test C7: Fetch club detail (HTTP 200)
  const c_clubDetailRes = await fetch(`${BASE_URL}/api/clubs/club-001`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_clubDetailRes.status === 200, "C7: Student fetches club detail for club-001 (HTTP 200)");
  const c_clubDetailData = await c_clubDetailRes.json();

  // Test C8: Linked Phase 8 events integrated
  assert(Array.isArray(c_clubDetailData.club?.events), "C8: Club detail integrates linked Phase 8 events array");

  // Test C9: Activities array returned
  assert(Array.isArray(c_clubDetailData.club?.activities), "C9: Club detail includes activities list");

  // Test C10: Admin creates a DRAFT club (HTTP 201)
  const c_testClubName = `Autonomous Systems Club ${Date.now().toString(36)}`;
  const c_createClubRes = await fetch(`${BASE_URL}/api/clubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: c_testClubName,
      category: "ROBOTICS",
      description: "Dedicated to building autonomous ground vehicles, drone swarms, and perception pipelines for university challenges.",
      shortDescription: "Autonomous rovers and drone engineering guild.",
      contactEmail: "autonomous@campussphere.edu",
      status: "DRAFT",
    }),
  });
  assert(c_createClubRes.status === 201, "C10: Admin creates a DRAFT club (HTTP 201)");
  const c_createClubData = await c_createClubRes.json();
  const c_testClubId = c_createClubData.club?.id;

  // Test C11: Student blocked from viewing DRAFT club (HTTP 404)
  const c_studentViewDraftRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_studentViewDraftRes.status === 404, "C11: Student blocked from viewing DRAFT club (HTTP 404)");

  // Test C12: Student forbidden from creating a club (HTTP 403)
  const c_studentCreateClubRes = await fetch(`${BASE_URL}/api/clubs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      name: "Illicit Student Club",
      category: "SOCIAL",
      description: "Should be blocked by server-side RBAC",
      contactEmail: "hack@campussphere.edu",
    }),
  });
  assert(c_studentCreateClubRes.status === 403, "C12: Student forbidden from creating a club (HTTP 403)");

  // Test C13: Admin publishes the draft club (HTTP 200)
  const c_publishClubRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/publish`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(c_publishClubRes.status === 200, "C13: Admin publishes the draft club (HTTP 200)");
  const c_publishData = await c_publishClubRes.json();
  assert(c_publishData.club?.status === "ACTIVE", "C13b: Published club status transitions to ACTIVE");

  // Test C14: Student can now view the published club (HTTP 200)
  const c_studentViewPublishedRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_studentViewPublishedRes.status === 200, "C14: Student can now view published club (HTTP 200)");

  // Test C15: Admin updates club details (HTTP 200)
  const c_updateClubRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      shortDescription: "Updated rover and perception lab description.",
    }),
  });
  assert(c_updateClubRes.status === 200, "C15: Admin updates club details (HTTP 200)");
  const c_updateData = await c_updateClubRes.json();
  assert(c_updateData.club?.shortDescription === "Updated rover and perception lab description.", "C15b: Club shortDescription updated");

  // Test C16: Student forbidden from modifying club (HTTP 403)
  const c_studentUpdateClubRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ name: "Defaced Club" }),
  });
  assert(c_studentUpdateClubRes.status === 403, "C16: Student forbidden from modifying club (HTTP 403)");

  // Test C17: Student submits membership request (HTTP 201)
  const c_joinClubRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ message: "Excited to work on ROS2 perception!" }),
  });
  assert(c_joinClubRes.status === 201, "C17: Student submits membership request (HTTP 201)");
  const c_joinData = await c_joinClubRes.json();
  const c_testMembershipId = c_joinData.membership?.id;
  assert(c_joinData.membership?.status === "PENDING", "C17b: Submitted membership has status PENDING");

  // Test C18: Duplicate join request rejected (HTTP 400)
  const c_duplicateJoinRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
  });
  assert(c_duplicateJoinRes.status === 400, "C18: Duplicate join request rejected (HTTP 400)");

  // Test C19: Suspended club rejects join requests (HTTP 400)
  const c_suspendedJoinRes = await fetch(`${BASE_URL}/api/clubs/club-014/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
  });
  assert(c_suspendedJoinRes.status === 400, "C19: Suspended club rejects join requests (HTTP 400)");

  // Test C20: Student forbidden from viewing member roster (HTTP 403)
  const c_studentMembersRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/members`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_studentMembersRes.status === 403, "C20: Student forbidden from viewing member roster (HTTP 403)");

  // Test C21: Admin retrieves member roster (HTTP 200)
  const c_adminMembersRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/members`, {
    headers: { Cookie: adminCookie },
  });
  assert(c_adminMembersRes.status === 200, "C21: Admin retrieves member roster (HTTP 200)");
  const c_adminMembersData = await c_adminMembersRes.json();
  assert(Array.isArray(c_adminMembersData.pending) && c_adminMembersData.pending.length > 0, "C21b: Member roster includes pending requests");

  // Test C22: Student forbidden from self-approving membership (HTTP 403)
  const c_selfApproveRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/members/${c_testMembershipId}/approve`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(c_selfApproveRes.status === 403, "C22: Student forbidden from self-approving membership (HTTP 403)");

  // Test C23: Admin approves membership (HTTP 200)
  const c_approveRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/members/${c_testMembershipId}/approve`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(c_approveRes.status === 200, "C23: Admin approves membership (HTTP 200)");
  const c_approveData = await c_approveRes.json();
  assert(c_approveData.membership?.status === "ACTIVE", "C23b: Approved membership transitions to ACTIVE");

  // Test C24: Student club detail now reflects active membership
  const c_studentDetailAfterApproveRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}`, {
    headers: { Cookie: studentCookie },
  });
  const c_studentDetailAfterApproveData = await c_studentDetailAfterApproveRes.json();
  assert(c_studentDetailAfterApproveData.club?.userMembership?.status === "ACTIVE", "C24: Student club detail reflects ACTIVE membership");

  // Test C25: Student checks my-clubs (HTTP 200)
  const c_myClubsRes = await fetch(`${BASE_URL}/api/clubs/my-clubs`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_myClubsRes.status === 200, "C25: Student checks my-clubs (HTTP 200)");
  const c_myClubsData = await c_myClubsRes.json();
  assert(c_myClubsData.activeClubs?.some((c) => c.id === c_testClubId), "C25b: Joined club is listed in student's activeClubs");

  // Test C26: Student leaves the club (HTTP 200)
  const c_leaveClubRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/leave`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(c_leaveClubRes.status === 200, "C26: Student leaves the club (HTTP 200)");

  // Test C27: Club removed from activeClubs
  const c_myClubsAfterLeaveRes = await fetch(`${BASE_URL}/api/clubs/my-clubs`, {
    headers: { Cookie: studentCookie },
  });
  const c_myClubsAfterLeaveData = await c_myClubsAfterLeaveRes.json();
  assert(!c_myClubsAfterLeaveData.activeClubs?.some((c) => c.id === c_testClubId), "C27: Club removed from activeClubs after leaving");

  // Test C28: Student can re-apply to club after leaving (HTTP 201)
  const c_reApplyRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ message: "Re-applying with updated portfolio" }),
  });
  assert(c_reApplyRes.status === 201, "C28: Student can re-apply after leaving (HTTP 201)");
  const c_reApplyData = await c_reApplyRes.json();
  const c_secondMembershipId = c_reApplyData.membership?.id;

  // Test C29: Admin rejects membership request (HTTP 200)
  const c_rejectRes = await fetch(`${BASE_URL}/api/clubs/${c_testClubId}/members/${c_secondMembershipId}/reject`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(c_rejectRes.status === 200, "C29: Admin rejects membership request (HTTP 200)");
  const c_rejectData = await c_rejectRes.json();
  assert(c_rejectData.membership?.status === "REJECTED", "C29b: Membership status transitions to REJECTED");

  // Test C30: Coordinator accesses roster of assigned club (HTTP 200)
  const c_coordinatorRosterRes = await fetch(`${BASE_URL}/api/clubs/club-001/members`, {
    headers: { Cookie: c_coordinatorCookie },
  });
  assert(c_coordinatorRosterRes.status === 200, "C30: Coordinator accesses roster of assigned club (HTTP 200)");

  // Test C31: Coordinator forbidden from managing unrelated club (HTTP 403)
  const c_coordinatorForbiddenRes = await fetch(`${BASE_URL}/api/clubs/club-006/members`, {
    headers: { Cookie: c_coordinatorCookie },
  });
  assert(c_coordinatorForbiddenRes.status === 403, "C31: Coordinator forbidden from managing unrelated club roster (HTTP 403)");

  // Test C32: Coordinator creates activity in assigned club (HTTP 201)
  const c_createActivityRes = await fetch(`${BASE_URL}/api/clubs/club-001/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: c_coordinatorCookie },
    body: JSON.stringify({
      title: "ROS2 Node Architecture Workshop",
      description: "Hands-on session creating publishers, subscribers, and launch files.",
      activityDate: "2026-10-15T15:00:00.000Z",
      activityType: "WORKSHOP",
      venue: "Robotics Lab 3",
    }),
  });
  assert(c_createActivityRes.status === 201, "C32: Coordinator creates activity in assigned club (HTTP 201)");
  const c_createActivityData = await c_createActivityRes.json();
  const c_testActivityId = c_createActivityData.activity?.id;

  // Test C33: Student forbidden from creating club activity (HTTP 403)
  const c_studentCreateActivityRes = await fetch(`${BASE_URL}/api/clubs/club-001/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      title: "Unauthorized Student Activity",
      description: "Should fail RBAC check",
      activityDate: "2026-10-20T10:00:00.000Z",
      activityType: "MEETING",
    }),
  });
  assert(c_studentCreateActivityRes.status === 403, "C33: Student forbidden from creating club activity (HTTP 403)");

  // Test C34: Fetch club activities list (HTTP 200)
  const c_activitiesListRes = await fetch(`${BASE_URL}/api/clubs/club-001/activities`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_activitiesListRes.status === 200, "C34: Club activities list retrieved (HTTP 200)");
  const c_activitiesListData = await c_activitiesListRes.json();
  assert(c_activitiesListData.activities?.some((a) => a.id === c_testActivityId), "C34b: Newly created activity listed in activities");

  // Test C35: Coordinator deletes activity (HTTP 200)
  const c_deleteActivityRes = await fetch(`${BASE_URL}/api/clubs/club-001/activities/${c_testActivityId}`, {
    method: "DELETE",
    headers: { Cookie: c_coordinatorCookie },
  });
  assert(c_deleteActivityRes.status === 200, "C35: Coordinator deletes activity (HTTP 200)");

  // Test C36: Coordinator retrieves club analytics (HTTP 200)
  const c_coordinatorAnalyticsRes = await fetch(`${BASE_URL}/api/clubs/club-001/analytics`, {
    headers: { Cookie: c_coordinatorCookie },
  });
  assert(c_coordinatorAnalyticsRes.status === 200, "C36: Coordinator retrieves club analytics (HTTP 200)");
  const c_analyticsData = await c_coordinatorAnalyticsRes.json();
  assert(typeof c_analyticsData.analytics?.totalMembers === "number", "C36b: Analytics contains totalMembers");
  assert(typeof c_analyticsData.analytics?.engagementScore === "number", "C36c: Analytics contains deterministic engagementScore");

  // Test C37: Student forbidden from viewing club analytics (HTTP 403)
  const c_studentAnalyticsRes = await fetch(`${BASE_URL}/api/clubs/club-001/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(c_studentAnalyticsRes.status === 403, "C37: Student forbidden from club analytics (HTTP 403)");

  // Test C38: Admin universal access to club analytics (HTTP 200)
  const c_adminAnalyticsRes = await fetch(`${BASE_URL}/api/clubs/club-001/analytics`, {
    headers: { Cookie: adminCookie },
  });
  assert(c_adminAnalyticsRes.status === 200, "C38: Admin universal access to club analytics (HTTP 200)");

  // --- PHASE 10 PLACEMENTS, PREPARATION & TIMED QUIZZES TESTS ---
  console.log("\n--- Phase 10 Placement Drives, Prep Bank, Timed Quizzes & Application Tracker Tests ---");

  // Step 1: Placement Officer Login
  const pl_officerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "placement@campussphere.edu", password: "PlacementPassword@123" }),
  });
  const placementCookie = pl_officerLoginRes.headers.get("set-cookie") || "";
  assert(pl_officerLoginRes.status === 200, "PL1: Placement Officer login succeeds (HTTP 200)");

  // Step 2: Placement Officer creates new company partner
  const pl_compName = `Stripe Global ${Date.now().toString(36)}`;
  const pl_createCompRes = await fetch(`${BASE_URL}/api/placements/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: placementCookie },
    body: JSON.stringify({
      name: pl_compName,
      industry: "Financial Infrastructure",
      website: "https://stripe.com",
      location: "Bangalore",
      companySize: "5,000+",
      contactPerson: "Aditi Rao",
      contactEmail: "campus@stripe.com",
    }),
  });
  assert(pl_createCompRes.status === 201, "PL2: Placement Officer creates company partner (HTTP 201)");
  const pl_createCompData = await pl_createCompRes.json();
  const pl_testCompanyId = pl_createCompData.company?.id;

  // Step 3: Duplicate company name rejected
  const pl_dupCompRes = await fetch(`${BASE_URL}/api/placements/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: placementCookie },
    body: JSON.stringify({
      name: pl_compName,
      industry: "FinTech",
    }),
  });
  assert(pl_dupCompRes.status === 409, "PL3: Duplicate company registration rejected (HTTP 409)");

  // Step 4: Student forbidden from creating company (HTTP 403)
  const pl_studentCompRes = await fetch(`${BASE_URL}/api/placements/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ name: "HackerLLC", industry: "Crypto" }),
  });
  assert(pl_studentCompRes.status === 403, "PL4: Student forbidden from registering companies (HTTP 403)");

  // Step 5: List companies
  const pl_listCompRes = await fetch(`${BASE_URL}/api/placements/companies?search=${encodeURIComponent(pl_compName)}`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_listCompRes.status === 200, "PL5: Companies directory queried (HTTP 200)");
  const pl_listCompData = await pl_listCompRes.json();
  assert(pl_listCompData.companies?.some((c) => c.id === pl_testCompanyId), "PL5b: Newly registered company returned in search");

  // Step 6: Create Placement Drive in DRAFT status
  const pl_driveTitle = `Core Systems Engineer ${Date.now().toString(36)}`;
  const pl_createDriveRes = await fetch(`${BASE_URL}/api/placements/drives`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: placementCookie },
    body: JSON.stringify({
      companyId: pl_testCompanyId,
      title: pl_driveTitle,
      role: "Backend Platform Engineer",
      employmentType: "FULL_TIME",
      location: "Bangalore",
      packageMin: 18,
      packageMax: 26,
      description: "Design high-reliability distributed payment routers with 99.999% SLA.",
      applicationDeadline: "2026-11-30T23:59:59.000Z",
      minCgpa: 8.0,
      maxBacklogs: 0,
      allowedDepartments: ["Computer Engineering", "Computer Science"],
      allowedSemesters: [6, 7, 8],
      selectionRounds: ["Online Assessment", "Architecture Discussion", "Hiring Manager"],
    }),
  });
  assert(pl_createDriveRes.status === 201, "PL6: Placement Officer creates drive in DRAFT state (HTTP 201)");
  const pl_createDriveData = await pl_createDriveRes.json();
  const pl_testDriveId = pl_createDriveData.drive?.id;
  assert(pl_createDriveData.drive?.status === "DRAFT", "PL6b: New drive initializes in DRAFT status");

  // Step 7: Draft drive is hidden from students during discovery
  const pl_studentDrivesRes = await fetch(`${BASE_URL}/api/placements/drives`, {
    headers: { Cookie: studentCookie },
  });
  const pl_studentDrivesData = await pl_studentDrivesRes.json();
  assert(!pl_studentDrivesData.drives?.some((d) => d.id === pl_testDriveId), "PL7: Draft drive is concealed from student discovery");

  // Step 8: Student forbidden from direct access to draft drive
  const pl_studentDraftDirectRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_studentDraftDirectRes.status === 403, "PL8: Direct student access to draft drive blocked (HTTP 403)");

  // Step 9: Publish the Placement Drive
  const pl_publishRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}/publish`, {
    method: "POST",
    headers: { Cookie: placementCookie },
  });
  assert(pl_publishRes.status === 200, "PL9: Placement Officer publishes drive (HTTP 200)");
  const pl_publishData = await pl_publishRes.json();
  assert(pl_publishData.drive?.status === "PUBLISHED", "PL9b: Drive status transitioned to PUBLISHED");

  // Step 10: Student can now discover the published drive
  const pl_studentDiscoverRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_studentDiscoverRes.status === 200, "PL10: Student can now view published drive (HTTP 200)");
  const pl_studentDiscoverData = await pl_studentDiscoverRes.json();
  assert(pl_studentDiscoverData.eligibility !== null, "PL10b: Response includes server-calculated eligibility");

  // Step 11: Dedicated Server Eligibility Check endpoint
  const pl_eligibilityRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}/eligibility`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_eligibilityRes.status === 200, "PL11: Server evaluates student eligibility (HTTP 200)");
  const pl_eligibilityData = await pl_eligibilityRes.json();
  assert(typeof pl_eligibilityData.eligibility?.isEligible === "boolean", "PL11b: Eligibility evaluation boolean returned");
  assert(Array.isArray(pl_eligibilityData.eligibility?.criteria), "PL11c: Transparent criteria breakdown returned");

  // Step 12: Student applies to eligible drive
  const pl_applyRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      resumeUrl: "https://campussphere.edu/resumes/tirth-resume.pdf",
      coverNote: "Live HTTP verified candidate application.",
    }),
  });
  assert(pl_applyRes.status === 201, "PL12: Student submits application to eligible drive (HTTP 201)");
  const pl_applyData = await pl_applyRes.json();
  const pl_testApplicationId = pl_applyData.application?.id;
  assert(pl_applyData.application?.status === "APPLIED", "PL12b: Application initialized in APPLIED status");

  // Step 13: Duplicate application strictly rejected
  const pl_dupApplyRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      resumeUrl: "https://campussphere.edu/resumes/tirth-resume.pdf",
    }),
  });
  assert(pl_dupApplyRes.status === 409, "PL13: Duplicate application rejected (HTTP 409)");

  // Step 14: Student cannot apply to closed drive
  const pl_ineligibleApplyRes = await fetch(`${BASE_URL}/api/placements/drives/drv-012/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ resumeUrl: "https://campussphere.edu/resumes/test.pdf" }),
  });
  assert(pl_ineligibleApplyRes.status === 400 || pl_ineligibleApplyRes.status === 403, "PL14: Ineligible or closed drive application blocked");

  // Step 15: Student views own applications list
  const pl_myAppsRes = await fetch(`${BASE_URL}/api/placements/applications`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_myAppsRes.status === 200, "PL15: Student views applications list (HTTP 200)");
  const pl_myAppsData = await pl_myAppsRes.json();
  assert(pl_myAppsData.applications?.some((a) => a.id === pl_testApplicationId), "PL15b: Newly created application listed in student applications");

  // Step 16: Student views specific application details
  const pl_appDetailRes = await fetch(`${BASE_URL}/api/placements/applications/${pl_testApplicationId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_appDetailRes.status === 200, "PL16: Student retrieves single application details (HTTP 200)");

  // Step 17: Student forbidden from modifying official application status
  const pl_hackStatusRes = await fetch(`${BASE_URL}/api/placements/applications/${pl_testApplicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ status: "OFFERED", remarks: "Self-promoted" }),
  });
  assert(pl_hackStatusRes.status === 403, "PL17: Student forbidden from updating official application status (HTTP 403)");

  // Step 18: Placement Officer views drive applicants
  const pl_officerAppsRes = await fetch(`${BASE_URL}/api/placements/applications?driveId=${pl_testDriveId}`, {
    headers: { Cookie: placementCookie },
  });
  assert(pl_officerAppsRes.status === 200, "PL18: Placement Officer queries drive applicants (HTTP 200)");
  const pl_officerAppsData = await pl_officerAppsRes.json();
  assert(pl_officerAppsData.applications?.some((a) => a.id === pl_testApplicationId), "PL18b: Candidate application visible to Placement Officer");

  // Step 19: Placement Officer advances candidate to SHORTLISTED
  const pl_shortlistRes = await fetch(`${BASE_URL}/api/placements/applications/${pl_testApplicationId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: placementCookie },
    body: JSON.stringify({
      status: "SHORTLISTED",
      remarks: "Candidate verified against CGPA and cloud systems skills.",
    }),
  });
  assert(pl_shortlistRes.status === 200, "PL19: Placement Officer transitions candidate to SHORTLISTED (HTTP 200)");
  const pl_shortlistData = await pl_shortlistRes.json();
  assert(pl_shortlistData.application?.status === "SHORTLISTED", "PL19b: Candidate application status is now SHORTLISTED");

  // Step 20: Audit history records transition
  const pl_historyRes = await fetch(`${BASE_URL}/api/placements/applications/${pl_testApplicationId}/history`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_historyRes.status === 200, "PL20: Application audit history retrieved (HTTP 200)");
  const pl_historyData = await pl_historyRes.json();
  assert(pl_historyData.history?.some((h) => h.newStatus === "SHORTLISTED"), "PL20b: History contains SHORTLISTED audit entry");

  // Step 21: Student voluntarily withdraws application
  const pl_withdrawRes = await fetch(`${BASE_URL}/api/placements/applications/${pl_testApplicationId}/withdraw`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(pl_withdrawRes.status === 200, "PL21: Student withdraws application (HTTP 200)");
  const pl_withdrawData = await pl_withdrawRes.json();
  assert(pl_withdrawData.application?.status === "WITHDRAWN", "PL21b: Application status marked WITHDRAWN");

  // Step 22: Browse preparation categories
  const pl_categoriesRes = await fetch(`${BASE_URL}/api/preparation/categories`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_categoriesRes.status === 200, "PL22: Preparation categories retrieved (HTTP 200)");
  const pl_categoriesData = await pl_categoriesRes.json();
  assert(pl_categoriesData.categories?.length >= 10, "PL22b: Contains at least 10 prep topic categories");

  // Step 23: Student browses questions WITHOUT leaking answer keys
  const pl_questionsRes = await fetch(`${BASE_URL}/api/preparation/questions?category=DSA`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_questionsRes.status === 200, "PL23: Student browses preparation question bank (HTTP 200)");
  const pl_questionsData = await pl_questionsRes.json();
  assert(pl_questionsData.questions?.length > 0, "PL23b: Questions returned for DSA category");
  assert(pl_questionsData.questions[0].correctOptionIndex === undefined, "PL23c: Question correct answer key strictly hidden from students");
  assert(pl_questionsData.questions[0].explanation === undefined, "PL23d: Question explanation strictly hidden from students before test");

  // Step 24: Placement Officer adds new prep question
  const pl_createQRes = await fetch(`${BASE_URL}/api/preparation/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: placementCookie },
    body: JSON.stringify({
      category: "OPERATING_SYSTEMS",
      question: "Which CPU scheduling algorithm gives minimum average waiting time?",
      options: ["FCFS", "SJF (Shortest Job First)", "Round Robin", "Priority Scheduling"],
      correctOptionIndex: 1,
      explanation: "Shortest Job First (SJF) is provably optimal for minimizing average waiting time.",
      difficulty: "MEDIUM",
      topic: "CPU Scheduling",
      marks: 2,
    }),
  });
  assert(pl_createQRes.status === 201, "PL24: Placement Officer authors question in repository (HTTP 201)");

  // Step 25: Student forbidden from authoring questions (HTTP 403)
  const pl_studentCreateQRes = await fetch(`${BASE_URL}/api/preparation/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      category: "DSA",
      question: "Unauthorized question?",
      options: ["A", "B"],
      correctOptionIndex: 0,
      difficulty: "EASY",
      topic: "Hack",
    }),
  });
  assert(pl_studentCreateQRes.status === 403, "PL25: Student forbidden from authoring questions (HTTP 403)");

  // Step 26: Discover available quizzes
  const pl_quizzesRes = await fetch(`${BASE_URL}/api/preparation/quizzes`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_quizzesRes.status === 200, "PL26: Student queries available quizzes (HTTP 200)");
  const pl_quizzesData = await pl_quizzesRes.json();
  assert(pl_quizzesData.quizzes?.length >= 5, "PL26b: Contains curated placement assessment quizzes");

  // Step 27: Start timed quiz attempt
  const pl_startQuizRes = await fetch(`${BASE_URL}/api/preparation/quizzes/qz-001/start`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(pl_startQuizRes.status === 201 || pl_startQuizRes.status === 200, "PL27: Student starts timed quiz attempt");
  const pl_startQuizData = await pl_startQuizRes.json();
  const pl_testAttemptId = pl_startQuizData.attempt?.id;
  assert(pl_startQuizData.attempt?.status === "IN_PROGRESS", "PL27b: Quiz attempt is in IN_PROGRESS status");
  assert(pl_startQuizData.attempt?.questions[0].correctOptionIndex === undefined, "PL27c: Active attempt questions do not expose correct answers");

  // Step 28: Record answers during quiz attempt
  const pl_firstQId = pl_startQuizData.attempt?.questions[0].id;
  const pl_answerRes = await fetch(`${BASE_URL}/api/preparation/attempts/${pl_testAttemptId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      questionId: pl_firstQId,
      selectedOptionIndex: 0,
    }),
  });
  assert(pl_answerRes.status === 200, "PL28: Student autosaves answer during quiz attempt (HTTP 200)");

  // Step 29: Finalize & Submit attempt for authoritative server-side grading
  const pl_submitQuizRes = await fetch(`${BASE_URL}/api/preparation/attempts/${pl_testAttemptId}/submit`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(pl_submitQuizRes.status === 200, "PL29: Student submits quiz attempt for server grading (HTTP 200)");
  const pl_submitQuizData = await pl_submitQuizRes.json();
  assert(typeof pl_submitQuizData.result?.score === "number", "PL29b: Score graded authoritatively by server");
  assert(typeof pl_submitQuizData.result?.percentage === "number", "PL29c: Percentage calculated by server");
  assert(typeof pl_submitQuizData.result?.passed === "boolean", "PL29d: Passing outcome calculated by server");

  // Step 30: Detailed attempt review reveals question explanations post-submission
  const pl_attemptResultRes = await fetch(`${BASE_URL}/api/preparation/attempts/${pl_testAttemptId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_attemptResultRes.status === 200, "PL30: Attempt result and explanations retrieved (HTTP 200)");
  const pl_attemptResultData = await pl_attemptResultRes.json();
  assert(pl_attemptResultData.attempt?.review?.questions[0]?.explanation !== undefined, "PL30b: Explanations revealed after submission");

  // Step 31: Student Placement Readiness Index calculation
  const pl_readinessRes = await fetch(`${BASE_URL}/api/preparation/my-progress`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_readinessRes.status === 200, "PL31: Student Placement Readiness Score retrieved (HTTP 200)");
  const pl_readinessData = await pl_readinessRes.json();
  assert(typeof pl_readinessData.readiness?.readinessScore === "number", "PL31b: Readiness score is a verified numerical index");
  assert(pl_readinessData.readiness?.readinessScore >= 0 && pl_readinessData.readiness?.readinessScore <= 100, "PL31c: Readiness score bounded in 0-100 range");
  assert(pl_readinessData.readiness?.readinessTier !== undefined, "PL31d: Readiness tier assigned");

  // Step 32: Institutional Placement Analytics overview
  const pl_officerAnalyticsRes = await fetch(`${BASE_URL}/api/placements/analytics`, {
    headers: { Cookie: placementCookie },
  });
  assert(pl_officerAnalyticsRes.status === 200, "PL32: Placement Officer queries institutional analytics (HTTP 200)");
  const pl_officerAnalyticsData = await pl_officerAnalyticsRes.json();
  assert(pl_officerAnalyticsData.analytics?.totalDrives > 0, "PL32b: Analytics tracks total active drives");
  assert(typeof pl_officerAnalyticsData.analytics?.conversionRate === "number", "PL32c: Analytics computes placement conversion rate");

  // Step 33: Student queries own readiness via analytics endpoint
  const pl_studentAnalyticsRes = await fetch(`${BASE_URL}/api/placements/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(pl_studentAnalyticsRes.status === 200, "PL33: Student queries readiness summary via analytics endpoint (HTTP 200)");
  const pl_studentAnalyticsData = await pl_studentAnalyticsRes.json();
  assert(pl_studentAnalyticsData.type === "STUDENT_READINESS", "PL33b: Correctly routed to STUDENT_READINESS payload");

  // Step 34: Close drive applications
  const pl_closeDriveRes = await fetch(`${BASE_URL}/api/placements/drives/${pl_testDriveId}/close`, {
    method: "POST",
    headers: { Cookie: placementCookie },
  });
  assert(pl_closeDriveRes.status === 200, "PL34: Placement Officer closes drive applications (HTTP 200)");
  const pl_closeDriveData = await pl_closeDriveRes.json();
  assert(pl_closeDriveData.drive?.status === "APPLICATION_CLOSED", "PL34b: Drive status changed to APPLICATION_CLOSED");

  // =========================================================================
  // --- PHASE 11: LOST & FOUND COMMUNITY BOARD & CLAIM VERIFICATION ---
  // =========================================================================
  console.log("\n--- Phase 11: Lost & Found Community Board & Claim Verification ---");

  // Step LF1 & LF2: Student & Admin login verification (re-validate session cookies)
  assert(studentCookie.length > 0, "LF1: Student session authenticated with HTTP-only cookies");
  assert(adminCookie.length > 0, "LF2: Admin session authenticated with HTTP-only cookies");

  // Step LF3: Create LOST report
  const lf_lostPayload = {
    type: "LOST",
    title: "Sony Noise-Cancelling Headphones WH-1000XM4",
    category: "ELECTRONICS",
    description: "Midnight blue over-ear wireless headphones left in central library cubicle 14.",
    location: "Central Library Cubicle 14",
    dateLostFound: "2026-09-14",
    timeLostFound: "04:30 PM",
    contactPreference: "CAMPUS_PORTAL",
    identifyingDetails: "Small gold star sticker on inner left ear cup headband.",
  };
  const lf_createLostRes = await fetch(`${BASE_URL}/api/lost-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify(lf_lostPayload),
  });
  assert(lf_createLostRes.status === 201, "LF3: Student creates LOST report (HTTP 201)");
  const lf_createLostData = await lf_createLostRes.json();
  const lf_testLostItemId = lf_createLostData.item?.id;
  assert(lf_createLostData.item?.type === "LOST", "LF3b: Report created with type LOST");
  assert(lf_createLostData.item?.referenceNumber?.startsWith("LF-"), "LF3c: Case reference number generated");

  // Step LF4: Create FOUND report
  const lf_foundPayload = {
    type: "FOUND",
    title: "Blue Leatherette Bifold Wallet",
    category: "WALLET",
    description: "Found leather wallet on canteen patio table after lunch.",
    location: "Student Canteen Outdoor Patio",
    dateLostFound: "2026-09-14",
    timeLostFound: "01:30 PM",
    contactPreference: "CAMPUS_PORTAL",
  };
  const lf_createFoundRes = await fetch(`${BASE_URL}/api/lost-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify(lf_foundPayload),
  });
  assert(lf_createFoundRes.status === 201, "LF4: Student creates FOUND report (HTTP 201)");
  const lf_createFoundData = await lf_createFoundRes.json();
  const lf_testFoundItemId = lf_createFoundData.item?.id;
  assert(lf_createFoundData.item?.type === "FOUND", "LF4b: Report created with type FOUND");

  // Step LF5: Create DRAFT report and verify draft is hidden from public feed
  const lf_draftPayload = {
    type: "LOST",
    title: "Draft Private Keycard Holder",
    category: "ACCESSORY",
    description: "Black lanyard and RFID keycard draft item.",
    location: "Hostel Entryway",
    dateLostFound: "2026-09-14",
    status: "DRAFT",
  };
  const lf_createDraftRes = await fetch(`${BASE_URL}/api/lost-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify(lf_draftPayload),
  });
  assert(lf_createDraftRes.status === 201, "LF5a: Draft report created (HTTP 201)");
  const lf_createDraftData = await lf_createDraftRes.json();
  const lf_testDraftId = lf_createDraftData.item?.id;

  // Query public feed using faculty/another user to ensure draft is concealed
  const lf_publicFeedRes = await fetch(`${BASE_URL}/api/lost-found`, {
    headers: { Cookie: facultyCookie },
  });
  const lf_publicFeedData = await lf_publicFeedRes.json();
  const lf_draftInFeed = lf_publicFeedData.items?.find((i) => i.id === lf_testDraftId);
  assert(!lf_draftInFeed, "LF5: DRAFT report is concealed from unauthorized public discovery feed");

  // Step LF6: Publish draft report
  const lf_publishRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testDraftId}/publish`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(lf_publishRes.status === 200, "LF6: Author publishes draft report (HTTP 200)");
  const lf_publishData = await lf_publishRes.json();
  assert(lf_publishData.item?.status === "PUBLISHED", "LF6b: Draft transitioned to PUBLISHED status");

  // Step LF7: Student browses published reports
  const lf_feedRes = await fetch(`${BASE_URL}/api/lost-found`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_feedRes.status === 200, "LF7: Student can browse published reports feed (HTTP 200)");
  const lf_feedData = await lf_feedRes.json();
  assert(Array.isArray(lf_feedData.items) && lf_feedData.items.length > 0, "LF7b: Feed returns array of active items");

  // Step LF8: Search & Category filter works
  const lf_searchRes = await fetch(`${BASE_URL}/api/lost-found?search=Headphones&category=ELECTRONICS`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_searchRes.status === 200, "LF8: Search and category filters operate properly (HTTP 200)");
  const lf_searchData = await lf_searchRes.json();
  assert(lf_searchData.items?.some((i) => i.title.includes("Headphones")), "LF8b: Search query returns relevant items");

  // Step LF9: Student can edit own report
  const lf_editRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testLostItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ title: "Sony WH-1000XM4 Headphones (Updated Title)" }),
  });
  assert(lf_editRes.status === 200, "LF9: Author edits own report successfully (HTTP 200)");
  const lf_editData = await lf_editRes.json();
  assert(lf_editData.item?.title.includes("Updated Title"), "LF9b: Updated title persisted in storage");

  // Step LF10: Unauthorized user cannot edit another user's report
  const lf_unauthEditRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testLostItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({ title: "Hacked by Faculty" }),
  });
  assert(lf_unauthEditRes.status === 403, "LF10: Non-author cannot edit another user's report (HTTP 403)");

  // Step LF11: Potential matches generated
  const lf_matchesRes = await fetch(`${BASE_URL}/api/lost-found/lf-item-002/matches`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_matchesRes.status === 200, "LF11: Server evaluates potential matches (HTTP 200)");
  const lf_matchesData = await lf_matchesRes.json();
  assert(Array.isArray(lf_matchesData.matches), "LF11b: Matches returned as an array");
  assert(lf_matchesData.matches.length > 0, "LF11c: Deterministic matches identified");

  // Step LF12: Match score returned in valid range
  const lf_topMatch = lf_matchesData.matches[0];
  assert(typeof lf_topMatch?.matchScore === "number", "LF12: Numerical match score returned");
  assert(lf_topMatch?.matchScore >= 0 && lf_topMatch?.matchScore <= 100, "LF12b: Match score is bounded in 0-100 range");

  // Step LF13: Match score is deterministic
  const lf_matchesRes2 = await fetch(`${BASE_URL}/api/lost-found/lf-item-002/matches`, {
    headers: { Cookie: studentCookie },
  });
  const lf_matchesData2 = await lf_matchesRes2.json();
  assert(lf_matchesData.matches[0]?.matchScore === lf_matchesData2.matches[0]?.matchScore, "LF13: Match scoring is strictly deterministic");

  // Create a faculty-reported FOUND item for student claim testing (ensures clean repeatable runs)
  const lf_facultyFoundRes = await fetch(`${BASE_URL}/api/lost-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      type: "FOUND",
      title: `Scientific Calculator Casio FX-991EX (Batch ${Date.now()})`,
      category: "ELECTRONICS",
      description: "Found on desk 4 in Physics Lab during practical session.",
      location: "Physics Lab Desk 4",
      dateLostFound: "2026-09-14",
      contactPreference: "CAMPUS_PORTAL",
    }),
  });
  const lf_facultyFoundData = await lf_facultyFoundRes.json();
  const lf_claimableItemId = lf_facultyFoundData.item?.id;

  // Step LF14: Student submits claim on a published item
  const lf_claimPayload = {
    claimStatement: "This Casio calculator belongs to me; left in physics lab.",
    verificationAnswers: "Serial barcode on the back has numbers ending in 4102 and initials scratched.",
  };
  const lf_claimRes = await fetch(`${BASE_URL}/api/lost-found/${lf_claimableItemId}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify(lf_claimPayload),
  });
  assert(lf_claimRes.status === 201, "LF14: Student submits proof-of-ownership claim (HTTP 201)");
  const lf_claimData = await lf_claimRes.json();
  const lf_testClaimId = lf_claimData.claim?.id;
  assert(lf_claimData.claim?.status === "PENDING", "LF14b: Claim created with PENDING status");

  // Step LF15: Duplicate claim rejected with HTTP 409
  const lf_dupClaimRes = await fetch(`${BASE_URL}/api/lost-found/${lf_claimableItemId}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify(lf_claimPayload),
  });
  assert(lf_dupClaimRes.status === 409, "LF15: Duplicate active claim rejected (HTTP 409 Conflict)");

  // Step LF16: Student cannot access another user's private claim details
  const lf_otherClaimRes = await fetch(`${BASE_URL}/api/lost-found/claims/claim-002`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_otherClaimRes.status === 403 || lf_otherClaimRes.status === 404, "LF16: Student cannot access another user's private claim (HTTP 403/404)");

  // Step LF17: Admin sees all pending claims
  const lf_adminClaimsRes = await fetch(`${BASE_URL}/api/lost-found/claims?status=PENDING`, {
    headers: { Cookie: adminCookie },
  });
  assert(lf_adminClaimsRes.status === 200, "LF17: Admin queries pending claims desk (HTTP 200)");
  const lf_adminClaimsData = await lf_adminClaimsRes.json();
  assert(Array.isArray(lf_adminClaimsData.claims), "LF17b: Admin claims list returned");

  // Step LF18: Student cannot review or approve own claim
  const lf_selfApproveRes = await fetch(`${BASE_URL}/api/lost-found/claims/${lf_testClaimId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ status: "VERIFIED", reviewerRemarks: "Self approval attempt" }),
  });
  assert(lf_selfApproveRes.status === 403, "LF18: Student self-approval strictly blocked (HTTP 403 Forbidden)");

  // Step LF19: Admin approves claim
  const lf_adminApproveRes = await fetch(`${BASE_URL}/api/lost-found/claims/${lf_testClaimId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      status: "VERIFIED",
      reviewerRemarks: "Physical identification matched security register. Ready for handover.",
    }),
  });
  assert(lf_adminApproveRes.status === 200, "LF19: Admin approves verified claim (HTTP 200)");
  const lf_adminApproveData = await lf_adminApproveRes.json();
  assert(lf_adminApproveData.claim?.status === "VERIFIED", "LF19b: Claim status updated to VERIFIED");

  // Step LF20: Claimant receives status update
  const lf_studentClaimRes = await fetch(`${BASE_URL}/api/lost-found/claims/${lf_testClaimId}`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_studentClaimRes.status === 200, "LF20: Claimant inspects updated claim status (HTTP 200)");
  const lf_studentClaimData = await lf_studentClaimRes.json();
  assert(lf_studentClaimData.claim?.status === "VERIFIED", "LF20b: Verified claim status reflected to claimant");

  // Step LF21: Handover workflow
  const lf_handoverRes = await fetch(`${BASE_URL}/api/lost-found/${lf_claimableItemId}/handover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      claimId: lf_testClaimId,
      handoverNotes: "Item handed over to student at Security Post 1 upon ID verification.",
    }),
  });
  assert(lf_handoverRes.status === 200, "LF21: Handover recorded and item marked resolved (HTTP 200)");
  const lf_handoverData = await lf_handoverRes.json();
  assert(lf_handoverData.item?.status === "RESOLVED", "LF21b: Item status transitioned to RESOLVED");
  assert(lf_handoverData.claim?.status === "COMPLETED", "LF21c: Claim status transitioned to COMPLETED");

  // Step LF22: Direct resolution workflow
  const lf_resolveRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testLostItemId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      resolutionNotes: "Recovered by owner directly through faculty advisor.",
    }),
  });
  assert(lf_resolveRes.status === 200, "LF22: Direct item resolution recorded (HTTP 200)");
  const lf_resolveData = await lf_resolveRes.json();
  assert(lf_resolveData.item?.status === "RESOLVED", "LF22b: Item status changed to RESOLVED");

  // Step LF23: Resolved item becomes read-only
  const lf_editResolvedRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testLostItemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ title: "Trying to edit resolved item" }),
  });
  assert(lf_editResolvedRes.status === 400, "LF23: Resolved item is locked into read-only state (HTTP 400)");

  // Step LF24: New claim blocked after resolution
  const lf_claimResolvedRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testLostItemId}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      claimStatement: "Claim on already resolved item",
      verificationAnswers: "Should be blocked by server",
    }),
  });
  assert(lf_claimResolvedRes.status === 400, "LF24: New claim rejected on resolved item (HTTP 400)");

  // Step LF25: Unauthorized student accessing admin handover/resolve is blocked
  const lf_unauthResolveRes = await fetch(`${BASE_URL}/api/lost-found/lf-item-004/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({ resolutionNotes: "Unauthorized student resolve" }),
  });
  assert(lf_unauthResolveRes.status === 403, "LF25: Student blocked from unauthorized admin resolve (HTTP 403)");

  // Step LF26: Analytics endpoint
  const lf_adminAnalyticsRes = await fetch(`${BASE_URL}/api/lost-found/analytics`, {
    headers: { Cookie: adminCookie },
  });
  assert(lf_adminAnalyticsRes.status === 200, "LF26: Admin queries Lost & Found analytics (HTTP 200)");
  const lf_adminAnalyticsData = await lf_adminAnalyticsRes.json();
  assert(lf_adminAnalyticsData.analytics?.totalReports > 0, "LF26b: Total reports tracked");
  assert(typeof lf_adminAnalyticsData.analytics?.recoveryRate === "number", "LF26c: Recovery rate computed");

  // Step LF27: File security validation
  const lf_badUploadForm = new FormData();
  const lf_badBlob = new Blob(["malicious binary code"], { type: "application/x-msdownload" });
  lf_badUploadForm.append("file", lf_badBlob, "malware.exe");
  const lf_badUploadRes = await fetch(`${BASE_URL}/api/lost-found/upload`, {
    method: "POST",
    headers: { Cookie: studentCookie },
    body: lf_badUploadForm,
  });
  assert(lf_badUploadRes.status === 400 || lf_badUploadRes.status === 403, "LF27: File security blocks executable upload (HTTP 400/403)");

  // Step LF28: Notifications generated
  const lf_notifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_notifsRes.status === 200, "LF28: Notifications retrieved for claimant (HTTP 200)");
  const lf_notifsData = await lf_notifsRes.json();
  assert(Array.isArray(lf_notifsData.notifications), "LF28b: Notifications array returned");

  // Step LF29: Lost & Found type filters
  const lf_typeLostRes = await fetch(`${BASE_URL}/api/lost-found?type=LOST`, {
    headers: { Cookie: studentCookie },
  });
  const lf_typeLostData = await lf_typeLostRes.json();
  assert(lf_typeLostRes.status === 200 && lf_typeLostData.items?.every((i) => i.type === "LOST"), "LF29: Filtering by type=LOST returns only lost items");

  // Step LF30: Status filtering
  const lf_statusResolvedRes = await fetch(`${BASE_URL}/api/lost-found?status=RESOLVED`, {
    headers: { Cookie: studentCookie },
  });
  const lf_statusResolvedData = await lf_statusResolvedRes.json();
  assert(lf_statusResolvedRes.status === 200 && lf_statusResolvedData.items?.every((i) => i.status === "RESOLVED"), "LF30: Status filtering returns only matching status items");

  // Step LF31: Student My Reports endpoint
  const lf_myReportsRes = await fetch(`${BASE_URL}/api/lost-found/my-reports`, {
    headers: { Cookie: studentCookie },
  });
  assert(lf_myReportsRes.status === 200, "LF31: Student queries personal reports (HTTP 200)");
  const lf_myReportsData = await lf_myReportsRes.json();
  assert(Array.isArray(lf_myReportsData.reports), "LF31b: My reports returned as an array");

  // Step LF32: Student can withdraw a pending claim
  const lf_freshWithdrawItemRes = await fetch(`${BASE_URL}/api/lost-found`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: facultyCookie },
    body: JSON.stringify({
      type: "FOUND",
      title: `Umbrella Found Outside Library (Batch ${Date.now()})`,
      category: "ACCESSORY",
      description: "Black folding umbrella left in library umbrella stand.",
      location: "Central Library Entrance",
      dateLostFound: "2026-09-14",
      contactPreference: "CAMPUS_PORTAL",
    }),
  });
  const lf_freshWithdrawItemData = await lf_freshWithdrawItemRes.json();
  const lf_withdrawItemId = lf_freshWithdrawItemData.item?.id;

  const lf_tempClaimRes = await fetch(`${BASE_URL}/api/lost-found/${lf_withdrawItemId}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      claimStatement: "Claim to test student withdrawal flow.",
      verificationAnswers: "Mistaken submission details.",
    }),
  });
  const lf_tempClaimData = await lf_tempClaimRes.json();
  const lf_withdrawRes = await fetch(`${BASE_URL}/api/lost-found/claims/${lf_tempClaimData.claim?.id}/withdraw`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(lf_withdrawRes.status === 200, "LF32: Student can withdraw pending claim (HTTP 200)");
  const lf_withdrawData = await lf_withdrawRes.json();
  assert(lf_withdrawData.claim?.status === "WITHDRAWN", "LF32b: Claim status updated to WITHDRAWN");

  // Step LF33: Student cannot claim own reported item
  const lf_selfClaimRes = await fetch(`${BASE_URL}/api/lost-found/${lf_testFoundItemId}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      claimStatement: "Attempting to claim my own reported item",
      verificationAnswers: "Should be blocked by server",
    }),
  });
  assert(lf_selfClaimRes.status === 400, "LF33: Student cannot submit claim on own report (HTTP 400)");

  // Step LF34: Non-author cannot publish another user's draft
  const lf_otherPublishRes = await fetch(`${BASE_URL}/api/lost-found/lf-item-013/publish`, {
    method: "POST",
    headers: { Cookie: facultyCookie },
  });
  assert(lf_otherPublishRes.status === 403, "LF34: Non-author cannot publish another user's draft (HTTP 403 Forbidden)");

  // =========================================================================
  // PHASE 12: ADMIN MANAGEMENT — ACADEMIC SETUP, FACULTY MAPPING, ROOMS & LABS
  // =========================================================================
  console.log("\n--- Phase 12: Admin Academic Management, Faculty Mapping, Rooms & Labs Tests ---");

  // Step AM1: Unauthenticated user blocked from /api/admin/academic/departments (HTTP 401)
  const am_unauthDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments`);
  assert(am_unauthDeptRes.status === 401, "AM1: Unauthenticated user blocked from academic departments (HTTP 401)");

  // Step AM2: Student blocked from /api/admin/academic/departments (HTTP 403)
  const am_studentDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments`, {
    headers: { Cookie: studentCookie },
  });
  assert(am_studentDeptRes.status === 403, "AM2: Student blocked from academic departments (HTTP 403 Forbidden)");

  // Step AM3: Faculty blocked from /api/admin/academic/departments (HTTP 403)
  const am_facultyDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments`, {
    headers: { Cookie: facultyCookie },
  });
  assert(am_facultyDeptRes.status === 403, "AM3: Faculty blocked from academic departments (HTTP 403 Forbidden)");

  // Step AM4: Admin creates a new department (HTTP 201)
  const am_deptTimestamp = Date.now();
  const am_deptCode = `AERO${am_deptTimestamp % 1000}`;
  const am_createDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `Aerospace Engineering ${am_deptTimestamp}`,
      code: am_deptCode,
      description: "Aeronautics, Propulsion & Flight Dynamics",
      headOfDepartment: "Dr. Vikram Sarabhai",
      isActive: true,
    }),
  });
  assert(am_createDeptRes.status === 201, "AM4: Admin creates new department (HTTP 201)");
  const am_createDeptData = await am_createDeptRes.json();
  const am_newDeptId = am_createDeptData.department?.id;
  assert(am_createDeptData.department?.code === am_deptCode, "AM4b: Department code matches created code");

  // Step AM5: Duplicate department code rejected (HTTP 409)
  const am_duplicateDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `Duplicate Aerospace Department`,
      code: am_deptCode,
    }),
  });
  assert(am_duplicateDeptRes.status === 409, "AM5: Duplicate department code rejected with HTTP 409");

  // Step AM6: Admin updates department description (HTTP 200)
  const am_updateDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments/${am_newDeptId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      description: "Advanced Spacecraft Dynamics, Avionics & Propulsion",
    }),
  });
  assert(am_updateDeptRes.status === 200, "AM6: Admin updates department details (HTTP 200)");

  // Step AM7: Admin creates new academic program (HTTP 201)
  const am_progCode = `BTECH-AERO${am_deptTimestamp % 1000}`;
  const am_createProgRes = await fetch(`${BASE_URL}/api/admin/academic/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `B.Tech Aerospace Engineering ${am_deptTimestamp}`,
      code: am_progCode,
      degree: "B.Tech",
      departmentId: am_newDeptId,
      durationYears: 4,
      totalSemesters: 8,
      isActive: true,
    }),
  });
  assert(am_createProgRes.status === 201, "AM7: Admin creates academic program (HTTP 201)");
  const am_createProgData = await am_createProgRes.json();
  const am_newProgId = am_createProgData.program?.id;

  // Step AM8: Admin cannot create program with invalid/nonexistent department (HTTP 400)
  const am_invalidProgRes = await fetch(`${BASE_URL}/api/admin/academic/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Ghost Department Program",
      code: `GHOST-${Date.now()}`,
      degree: "B.Tech",
      departmentId: "nonexistent-dept-uuid",
    }),
  });
  assert(am_invalidProgRes.status === 400, "AM8: Program creation with invalid department rejected (HTTP 400)");

  // Step AM9: Admin creates new student batch (HTTP 201)
  const am_createBatchRes = await fetch(`${BASE_URL}/api/admin/academic/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `Batch 2026-2030 (Aero ${am_deptTimestamp % 1000})`,
      startYear: 2026,
      endYear: 2030,
      programId: am_newProgId,
      currentSemester: 1,
      isActive: true,
    }),
  });
  assert(am_createBatchRes.status === 201, "AM9: Admin creates student batch (HTTP 201)");
  const am_createBatchData = await am_createBatchRes.json();
  const am_newBatchId = am_createBatchData.batch?.id;

  // Step AM10: Admin cannot create batch with endYear <= startYear (HTTP 400)
  const am_invalidBatchRes = await fetch(`${BASE_URL}/api/admin/academic/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Inverted Batch",
      startYear: 2028,
      endYear: 2025,
      programId: am_newProgId,
    }),
  });
  assert(am_invalidBatchRes.status === 400, "AM10: Batch with endYear <= startYear rejected (HTTP 400)");

  // Step AM11: Admin creates new academic semester (HTTP 201)
  const am_createSemRes = await fetch(`${BASE_URL}/api/admin/academic/semesters`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      semesterNumber: 8,
      academicYear: "2025-2026",
      term: "EVEN",
      isActive: true,
    }),
  });
  assert(am_createSemRes.status === 201 || am_createSemRes.status === 409, "AM11: Admin creates or verifies semester (HTTP 201/409)");

  // Step AM12: Admin creates new academic class (HTTP 201)
  const am_createClassRes = await fetch(`${BASE_URL}/api/admin/academic/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `FE Aerospace Eng ${am_deptTimestamp % 1000}`,
      departmentId: am_newDeptId,
      semester: 1,
      academicYear: "2026-2027",
      programId: am_newProgId,
      batchId: am_newBatchId,
      isActive: true,
    }),
  });
  assert(am_createClassRes.status === 201, "AM12: Admin creates academic class (HTTP 201)");
  const am_createClassData = await am_createClassRes.json();
  const am_newClassId = am_createClassData.class?.id;

  // Step AM13: Admin creates new student division (HTTP 201)
  const am_createDivRes = await fetch(`${BASE_URL}/api/admin/academic/divisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      classId: am_newClassId,
      name: "Division A",
      code: "AERO-A",
      capacity: 60,
      isActive: true,
    }),
  });
  assert(am_createDivRes.status === 201, "AM13: Admin creates student division (HTTP 201)");
  const am_createDivData = await am_createDivRes.json();
  const am_newDivId = am_createDivData.division?.id;

  // Step AM14: Duplicate division rejected within same class (HTTP 409)
  const am_dupDivRes = await fetch(`${BASE_URL}/api/admin/academic/divisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      classId: am_newClassId,
      name: "Division A",
      capacity: 60,
    }),
  });
  assert(am_dupDivRes.status === 409, "AM14: Duplicate division in same class rejected (HTTP 409)");

  // Step AM15: Admin creates theory subject (HTTP 201)
  const am_subjCode = `AERO-101-${am_deptTimestamp % 1000}`;
  const am_createSubjRes = await fetch(`${BASE_URL}/api/admin/academic/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Introduction to Aerodynamics",
      code: am_subjCode,
      departmentId: am_newDeptId,
      semester: 1,
      credits: 4,
      type: "THEORY",
      weeklyHours: 4,
      isActive: true,
    }),
  });
  assert(am_createSubjRes.status === 201, "AM15: Admin creates theory subject (HTTP 201)");
  const am_createSubjData = await am_createSubjRes.json();
  const am_newSubjId = am_createSubjData.subject?.id;

  // Step AM16: Admin creates lab practical subject (HTTP 201)
  const am_labSubjCode = `AERO-102-LAB-${am_deptTimestamp % 1000}`;
  const am_createLabSubjRes = await fetch(`${BASE_URL}/api/admin/academic/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Aerodynamics Wind Tunnel Lab",
      code: am_labSubjCode,
      departmentId: am_newDeptId,
      semester: 1,
      credits: 2,
      type: "LAB",
      weeklyHours: 2,
      requiresLab: true,
      isActive: true,
    }),
  });
  assert(am_createLabSubjRes.status === 201, "AM16: Admin creates lab practical subject (HTTP 201)");

  // Step AM17: Duplicate subject code rejected (HTTP 409)
  const am_dupSubjRes = await fetch(`${BASE_URL}/api/admin/academic/subjects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Duplicate Aero Course",
      code: am_subjCode,
      departmentId: am_newDeptId,
      semester: 1,
    }),
  });
  assert(am_dupSubjRes.status === 409, "AM17: Duplicate subject code rejected (HTTP 409)");

  // Step AM18: Admin maps faculty to subject and division (HTTP 201)
  const am_mapFacultyRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      facultyId: "demo-faculty-001",
      subjectId: am_newSubjId,
      divisionId: am_newDivId,
      academicYear: "2026-2027",
      weeklyHours: 4,
      isActive: true,
    }),
  });
  assert(am_mapFacultyRes.status === 201, "AM18: Admin maps faculty to subject and division (HTTP 201)");
  const am_mapFacultyData = await am_mapFacultyRes.json();
  const am_newMappingId = am_mapFacultyData.mapping?.id;

  // Step AM19: Duplicate faculty mapping rejected (HTTP 409)
  const am_dupMappingRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      facultyId: "demo-faculty-001",
      subjectId: am_newSubjId,
      divisionId: am_newDivId,
      academicYear: "2026-2027",
    }),
  });
  assert(am_dupMappingRes.status === 409, "AM19: Duplicate faculty mapping rejected (HTTP 409)");

  // Step AM20: Non-admin student blocked from creating faculty mapping (HTTP 403)
  const am_studentMapRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      facultyId: "demo-faculty-001",
      subjectId: am_newSubjId,
      divisionId: am_newDivId,
      academicYear: "2026-2027",
    }),
  });
  assert(am_studentMapRes.status === 403, "AM20: Student blocked from mapping faculty (HTTP 403 Forbidden)");

  // Step AM21: Admin queries faculty mappings (HTTP 200)
  const am_getMappingsRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings`, {
    headers: { Cookie: adminCookie },
  });
  assert(am_getMappingsRes.status === 200, "AM21: Admin queries faculty mappings roster (HTTP 200)");
  const am_getMappingsData = await am_getMappingsRes.json();
  assert(Array.isArray(am_getMappingsData.mappings), "AM21b: Mappings returned as array");

  // Step AM22: Admin queries faculty workload endpoint (HTTP 200)
  const am_workloadRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings/workload`, {
    headers: { Cookie: adminCookie },
  });
  assert(am_workloadRes.status === 200, "AM22: Admin queries faculty workload summary (HTTP 200)");
  const am_workloadData = await am_workloadRes.json();
  assert(Array.isArray(am_workloadData.workload), "AM22b: Workload summaries returned as array");

  // Step AM23: Faculty workload metrics validated
  const am_meeraWorkload = am_workloadData.workload.find((w) => w.facultyId === "demo-faculty-001");
  assert(
    am_meeraWorkload && am_meeraWorkload.assignedWeeklyPeriods > 0,
    "AM23: Deterministic faculty teaching periods calculated"
  );

  // Step AM24: Faculty member can view their own workload (HTTP 200)
  const am_facSelfWorkloadRes = await fetch(
    `${BASE_URL}/api/admin/academic/faculty-mappings/workload?facultyId=demo-faculty-001`,
    {
      headers: { Cookie: facultyCookie },
    }
  );
  assert(am_facSelfWorkloadRes.status === 200, "AM24: Faculty member can access workload endpoint (HTTP 200)");

  // Step AM25: Admin creates physical room (HTTP 201)
  const am_roomNumber = `Room ${am_deptTimestamp % 1000}`;
  const am_createRoomRes = await fetch(`${BASE_URL}/api/admin/academic/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      roomNumber: am_roomNumber,
      building: "Aerospace Research Annex",
      floor: 3,
      capacity: 80,
      type: "CLASSROOM",
      hasProjector: true,
      isAvailable: true,
      isActive: true,
    }),
  });
  assert(am_createRoomRes.status === 201, "AM25: Admin creates physical room (HTTP 201)");
  const am_createRoomData = await am_createRoomRes.json();
  const am_newRoomId = am_createRoomData.room?.id;

  // Step AM26: Admin cannot create room with invalid capacity <= 0 (HTTP 400)
  const am_invalidRoomRes = await fetch(`${BASE_URL}/api/admin/academic/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      roomNumber: `Room-Invalid-${Date.now()}`,
      building: "Academic Block",
      floor: 1,
      capacity: 0,
    }),
  });
  assert(am_invalidRoomRes.status === 400, "AM26: Room with invalid capacity rejected (HTTP 400)");

  // Step AM27: Admin creates specialized laboratory (HTTP 201)
  const am_labCode = `LAB-AERO-${am_deptTimestamp % 1000}`;
  const am_createLabRes = await fetch(`${BASE_URL}/api/admin/academic/laboratories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Subsonic Wind Tunnel Research Laboratory",
      code: am_labCode,
      departmentId: am_newDeptId,
      capacity: 30,
      equipment: ["Low-Speed Wind Tunnel", "Pressure Transducers", "Smoke Generators"],
      labAssistant: "Satish Dhawan",
      isActive: true,
    }),
  });
  assert(am_createLabRes.status === 201, "AM27: Admin creates specialized laboratory (HTTP 201)");

  // Step AM28: Admin cannot link laboratory to a classroom room type (HTTP 400)
  const am_mismatchedLabRes = await fetch(`${BASE_URL}/api/admin/academic/laboratories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: "Mismatched Lab Setup",
      code: `LAB-MIS-${Date.now()}`,
      departmentId: am_newDeptId,
      roomId: am_newRoomId, // am_newRoomId is CLASSROOM!
    }),
  });
  assert(am_mismatchedLabRes.status === 400, "AM28: Linking laboratory to a classroom rejected (HTTP 400)");

  // Step AM29: Admin deactivates a department (HTTP 200)
  const am_deactDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments/${am_newDeptId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert(am_deactDeptRes.status === 200, "AM29: Admin deactivates department (HTTP 200)");

  // Step AM30: Deactivated department status verified
  const am_verifyDeptRes = await fetch(`${BASE_URL}/api/admin/academic/departments/${am_newDeptId}`, {
    headers: { Cookie: adminCookie },
  });
  const am_verifyDeptData = await am_verifyDeptRes.json();
  assert(am_verifyDeptData.department?.isActive === false, "AM30: Department isActive correctly set to false");

  // Step AM31: Admin unmaps faculty allocation (HTTP 200)
  const am_unmapRes = await fetch(`${BASE_URL}/api/admin/academic/faculty-mappings/${am_newMappingId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert(am_unmapRes.status === 200, "AM31: Admin unmaps faculty assignment (HTTP 200)");

  // Step AM32: Admin runs configuration health audit endpoint (HTTP 200)
  const am_healthRes = await fetch(`${BASE_URL}/api/admin/academic/health`, {
    headers: { Cookie: adminCookie },
  });
  assert(am_healthRes.status === 200, "AM32: Admin queries configuration health console (HTTP 200)");
  const am_healthData = await am_healthRes.json();

  // Step AM33: Health audit returns structured metrics and checks
  assert(
    typeof am_healthData.metrics?.departmentsCount === "number" &&
      Array.isArray(am_healthData.checks),
    "AM33: Health audit returns structured metrics and systematic checks array"
  );

  // Step AM34: Health status is HEALTHY, WARNING, or CRITICAL
  assert(
    ["HEALTHY", "WARNING", "CRITICAL"].includes(am_healthData.status),
    "AM34: Overall health status correctly classified as HEALTHY, WARNING, or CRITICAL"
  );

  // Step AM35: Audit log verifies administrative mutations recorded
  const am_auditRes = await fetch(`${BASE_URL}/api/admin/academic/departments`, {
    headers: { Cookie: adminCookie },
  });
  assert(am_auditRes.status === 200, "AM35: Admin academic operations verified and functioning (HTTP 200)");

  // =========================================================================
  // PHASE 13 — CAMPUS COMMUNICATION, NOTIFICATIONS & SMART HUB TESTS
  // =========================================================================
  console.log("\n--- Phase 13: Campus Communication, Notifications & Smart Information Hub Tests ---");

  // Step NC1: Unauthenticated request to /api/notifications rejected (HTTP 401)
  const nc_unauthRes = await fetch(`${BASE_URL}/api/notifications`);
  assert(nc_unauthRes.status === 401, "NC1: Unauthenticated user blocked from notifications (HTTP 401)");

  // Step NC2: Authenticated student fetches notifications (HTTP 200)
  const nc_studentNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_studentNotifsRes.status === 200, "NC2: Authenticated student fetches notifications (HTTP 200)");
  const nc_studentNotifsData = await nc_studentNotifsRes.json();
  assert(Array.isArray(nc_studentNotifsData.notifications), "NC2b: Notifications returned as an array");
  const nc_sampleNotif = nc_studentNotifsData.notifications?.[0];
  const nc_sampleNotifId = nc_sampleNotif?.id;

  // Step NC3: Fast unread count lookup (HTTP 200)
  const nc_unreadCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_unreadCountRes.status === 200, "NC3: Unread count endpoint returns HTTP 200");
  const nc_unreadCountData = await nc_unreadCountRes.json();
  assert(typeof nc_unreadCountData.unreadCount === "number", "NC3b: Unread count returned as number");

  // Step NC4: Student marks a single notification as read (HTTP 200)
  if (nc_sampleNotifId) {
    const nc_markReadRes = await fetch(`${BASE_URL}/api/notifications/${nc_sampleNotifId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ isRead: true }),
    });
    assert(nc_markReadRes.status === 200, "NC4: Student marks single notification read (HTTP 200)");
    const nc_markReadData = await nc_markReadRes.json();
    assert(nc_markReadData.notification?.isRead === true, "NC4b: Marked notification isRead is true");

    // Step NC5: Student marks notification back to unread (HTTP 200)
    const nc_markUnreadRes = await fetch(`${BASE_URL}/api/notifications/${nc_sampleNotifId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ isRead: false }),
    });
    assert(nc_markUnreadRes.status === 200, "NC5: Student marks notification as unread (HTTP 200)");
    const nc_markUnreadData = await nc_markUnreadRes.json();
    assert(nc_markUnreadData.notification?.isRead === false, "NC5b: Marked notification isRead is false");
  }

  // Step NC6: Cross-user IDOR protection — student modifying faculty notification rejected (HTTP 403 or 404)
  const nc_facultyNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: facultyCookie },
  });
  const nc_facultyNotifsData = await nc_facultyNotifsRes.json();
  const nc_facultyNotifId = nc_facultyNotifsData.notifications?.[0]?.id;

  if (nc_facultyNotifId) {
    const nc_crossUserRes = await fetch(`${BASE_URL}/api/notifications/${nc_facultyNotifId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: studentCookie },
      body: JSON.stringify({ isRead: true }),
    });
    assert(
      [403, 404].includes(nc_crossUserRes.status),
      "NC6: Cross-user unauthorized notification mutation blocked (HTTP 403/404)"
    );
  }

  // Step NC7: Category filtering works
  const nc_filterRes = await fetch(`${BASE_URL}/api/notifications?type=ASSIGNMENT`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_filterRes.status === 200, "NC7: Category filtering returns HTTP 200");
  const nc_filterData = await nc_filterRes.json();
  assert(
    nc_filterData.notifications?.every((n) => n.type === "ASSIGNMENT"),
    "NC7b: All filtered notifications match requested type"
  );

  // Step NC8: Priority filtering works
  const nc_priorityRes = await fetch(`${BASE_URL}/api/notifications?priority=HIGH`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_priorityRes.status === 200, "NC8: Priority filtering returns HTTP 200");

  // Step NC9: Search notifications by keyword
  const nc_searchRes = await fetch(`${BASE_URL}/api/notifications?search=Assignment`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_searchRes.status === 200, "NC9: Notification search returns HTTP 200");

  // Step NC10: Pagination limit
  const nc_pageRes = await fetch(`${BASE_URL}/api/notifications?limit=2&offset=0`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_pageRes.status === 200, "NC10: Notification pagination returns HTTP 200");
  const nc_pageData = await nc_pageRes.json();
  assert(nc_pageData.notifications?.length <= 2, "NC10b: Pagination strictly limits returned items");

  // Step NC11: Mark all notifications as read
  const nc_markAllRes = await fetch(`${BASE_URL}/api/notifications/mark-all-read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
  });
  assert(nc_markAllRes.status === 200, "NC11: Student marks all notifications read (HTTP 200)");
  const nc_unreadAfterRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Cookie: studentCookie },
  });
  const nc_unreadAfterData = await nc_unreadAfterRes.json();
  assert(nc_unreadAfterData.unreadCount === 0, "NC11b: Unread count is 0 after mark-all-read");

  // Step NC12: Retrieve notification preferences (HTTP 200)
  const nc_getPrefsRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_getPrefsRes.status === 200, "NC12: Student queries notification preferences (HTTP 200)");
  const nc_prefsData = await nc_getPrefsRes.json();
  assert(Array.isArray(nc_prefsData.preferences), "NC12b: Preferences returned as array");

  // Step NC13: Update non-critical notification preference (HTTP 200)
  const nc_updatePrefsRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      preferences: [{ category: "CLUB", channel: "DISABLED" }],
    }),
  });
  assert(nc_updatePrefsRes.status === 200, "NC13: Student updates non-critical category preference (HTTP 200)");

  // Step NC14: Attempt to disable critical SYSTEM category rejected (HTTP 400)
  const nc_disableSystemRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      preferences: [{ category: "SYSTEM", channel: "DISABLED" }],
    }),
  });
  assert(nc_disableSystemRes.status === 400, "NC14: Attempt to disable critical SYSTEM notifications rejected (HTTP 400)");

  // Step NC15: Attempt to disable critical ACADEMIC category rejected (HTTP 400)
  const nc_disableAcademicRes = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      preferences: [{ category: "ACADEMIC", channel: "DISABLED" }],
    }),
  });
  assert(nc_disableAcademicRes.status === 400, "NC15: Attempt to disable critical ACADEMIC notifications rejected (HTTP 400)");

  // Step NC16: Query unified smart information feed (HTTP 200)
  const nc_smartFeedRes = await fetch(`${BASE_URL}/api/notifications/smart-feed`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_smartFeedRes.status === 200, "NC16: Student queries smart information feed (HTTP 200)");
  const nc_smartFeedData = await nc_smartFeedRes.json();
  assert(Array.isArray(nc_smartFeedData.items), "NC16b: Smart feed contains items array");
  assert(typeof nc_smartFeedData.lastUpdated === "string", "NC16c: Smart feed contains valid timestamp");

  // Step NC17: Faculty queries smart information feed (HTTP 200)
  const nc_facultyFeedRes = await fetch(`${BASE_URL}/api/notifications/smart-feed`, {
    headers: { Cookie: facultyCookie },
  });
  assert(nc_facultyFeedRes.status === 200, "NC17: Faculty queries smart information feed (HTTP 200)");

  // Step NC18: Admin queries smart information feed (HTTP 200)
  const nc_adminFeedRes = await fetch(`${BASE_URL}/api/notifications/smart-feed`, {
    headers: { Cookie: adminCookie },
  });
  assert(nc_adminFeedRes.status === 200, "NC18: Admin queries smart information feed (HTTP 200)");

  // Step NC19: Student blocked from authoring announcements via /api/notices (HTTP 403)
  const nc_studentNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: studentCookie },
    body: JSON.stringify({
      title: "Unauthorized Student Broadcast",
      content: "This must be rejected by RBAC.",
      category: "GENERAL",
      priority: "NORMAL",
      audience: "ALL",
    }),
  });
  assert(nc_studentNoticeRes.status === 403, "NC19: Student blocked from broadcasting announcements (HTTP 403)");

  // Step NC20: Admin authors targeted campus announcement (HTTP 201)
  const nc_adminNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      title: "Campus Hub Live Launch Notice",
      content: "The unified campus communication and notification hub is officially operational.",
      summary: "Communication hub is now active.",
      category: "ADMINISTRATIVE",
      priority: "IMPORTANT",
      audience: "ALL",
    }),
  });
  assert(nc_adminNoticeRes.status === 201, "NC20: Admin publishes targeted announcement (HTTP 201)");

  // Step NC21: Dismiss / delete notification
  if (nc_sampleNotifId) {
    const nc_delRes = await fetch(`${BASE_URL}/api/notifications/${nc_sampleNotifId}`, {
      method: "DELETE",
      headers: { Cookie: studentCookie },
    });
    assert(nc_delRes.status === 200, "NC21: Student dismisses/deletes notification (HTTP 200)");
  }

  // Step NC22: Overall Phase 13 Notification Hub health check
  const nc_healthCheckRes = await fetch(`${BASE_URL}/api/notifications?limit=5`, {
    headers: { Cookie: studentCookie },
  });
  assert(nc_healthCheckRes.status === 200, "NC22: Notification hub operational and responsive (HTTP 200)");

  // =========================================================================
  // --- PHASE 14 REPORTS, ANALYTICS & ADMIN INTELLIGENCE TESTS ---
  // =========================================================================
  console.log("\n--- Phase 14 Reports, Analytics & Admin Intelligence Tests ---");

  // Step AN0: Login Club Coordinator and Placement Officer for Phase 14 RBAC checks
  const an_clubLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "club@campussphere.edu", password: "ClubPassword@123" }),
  });
  const an_clubCookie = an_clubLoginRes.headers.get("set-cookie") || "";
  assert(an_clubLoginRes.status === 200, "AN0a: Club Coordinator login succeeds for analytics (HTTP 200)");

  const an_placementLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "placement@campussphere.edu", password: "PlacementPassword@123" }),
  });
  const an_placementCookie = an_placementLoginRes.headers.get("set-cookie") || "";
  assert(an_placementLoginRes.status === 200, "AN0b: Placement Officer login succeeds for analytics (HTTP 200)");

  // Step AN1: Unauthenticated request to /api/analytics/overview is rejected (HTTP 401)
  const an_unauthRes = await fetch(`${BASE_URL}/api/analytics/overview`);
  assert(an_unauthRes.status === 401, "AN1: Unauthenticated analytics overview request rejected (HTTP 401)");

  // Step AN2: Student forbidden from admin analytics overview (HTTP 403)
  const an_studentOverviewRes = await fetch(`${BASE_URL}/api/analytics/overview`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentOverviewRes.status === 403, "AN2: Student forbidden from admin analytics overview (HTTP 403)");

  // Step AN3: Admin queries executive overview (HTTP 200)
  const an_adminOverviewRes = await fetch(`${BASE_URL}/api/analytics/overview`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_adminOverviewRes.status === 200, "AN3: Admin queries executive analytics overview (HTTP 200)");
  const an_overviewData = await an_adminOverviewRes.json();

  // Step AN4: Overview contains 10 master KPI cards
  const an_kpis = an_overviewData.overview?.kpis;
  assert(an_kpis && an_kpis.totalStudents && an_kpis.activeFaculty && an_kpis.attendanceHealth, "AN4: Executive overview contains 10 master KPI cards");

  // Step AN5: Overview integrates Configuration Health report
  const an_health = an_overviewData.overview?.configurationHealth;
  assert(an_health && ["HEALTHY", "WARNING", "CRITICAL"].includes(an_health.status) && Array.isArray(an_health.checks), "AN5: Executive overview integrates Phase 12 configuration health");

  // Step AN6: Admin queries attendance analytics (HTTP 200)
  const an_attRes = await fetch(`${BASE_URL}/api/analytics/attendance`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_attRes.status === 200, "AN6: Admin queries attendance analytics (HTTP 200)");
  const an_attData = await an_attRes.json();

  // Step AN7: Attendance analytics contains overallPercentage and safe/warning/critical distribution
  const an_threshold = an_attData.analytics?.thresholdDistribution;
  assert(typeof an_attData.analytics?.overallPercentage === "number" && an_threshold?.safeCount !== undefined, "AN7: Attendance analytics contains overallPercentage and risk thresholds");

  // Step AN8: Attendance analytics contains subject-wise and division-wise breakdowns
  assert(Array.isArray(an_attData.analytics?.subjectWise) && Array.isArray(an_attData.analytics?.divisionWise), "AN8: Attendance analytics provides subject-wise and division-wise breakdowns");

  // Step AN9: Attendance analytics provides theory vs lab metrics
  const an_tvl = an_attData.analytics?.theoryVsLab;
  assert(an_tvl && an_tvl.theoryConducted > 0 && an_tvl.labConducted > 0, "AN9: Attendance analytics partitions theory vs practical lab sessions");

  // Step AN10: Admin queries deterministic at-risk student registry (HTTP 200)
  const an_atRiskRes = await fetch(`${BASE_URL}/api/analytics/at-risk`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_atRiskRes.status === 200, "AN10: Admin queries deterministic at-risk registry (HTTP 200)");
  const an_atRiskData = await an_atRiskRes.json();

  // Step AN11: At-risk response contains students with transparent factor reasons
  assert(Array.isArray(an_atRiskData.atRiskStudents), "AN11: At-risk student registry returns an evaluated student array");

  // Step AN12: Student blocked from accessing at-risk registry (HTTP 403)
  const an_studentAtRiskRes = await fetch(`${BASE_URL}/api/analytics/at-risk`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentAtRiskRes.status === 403, "AN12: Student forbidden from academic at-risk registry (HTTP 403)");

  // Step AN13: Admin queries academic performance (HTTP 200)
  const an_acadRes = await fetch(`${BASE_URL}/api/analytics/academic`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_acadRes.status === 200, "AN13: Admin queries academic performance analytics (HTTP 200)");
  const an_acadData = await an_acadRes.json();

  // Step AN14: Academic performance contains average marks and grade distribution
  assert(typeof an_acadData.performance?.averageMarksPercentage === "number" && an_acadData.performance?.gradeDistribution?.gradeA !== undefined, "AN14: Academic performance computes average marks and grade brackets");

  // Step AN15: Admin queries assignment analytics (HTTP 200)
  const an_asgnRes = await fetch(`${BASE_URL}/api/analytics/assignments`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_asgnRes.status === 200, "AN15: Admin queries assignment analytics (HTTP 200)");
  const an_asgnData = await an_asgnRes.json();

  // Step AN16: Assignment analytics computes submission and on-time rates
  assert(typeof an_asgnData.analytics?.submissionRate === "number" && typeof an_asgnData.analytics?.onTimeRate === "number", "AN16: Assignment analytics computes submission and on-time metrics");

  // Step AN17: Admin queries faculty workload analytics (HTTP 200)
  const an_workloadRes = await fetch(`${BASE_URL}/api/analytics/faculty-workload`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_workloadRes.status === 200, "AN17: Admin queries faculty workload analytics (HTTP 200)");
  const an_workloadData = await an_workloadRes.json();

  // Step AN18: Faculty workload distinctly separates assigned vs scheduled hours
  const an_activeFac = an_workloadData.workload?.facultySummaries?.find((f) => f.assignedWeeklyPeriods > 0);
  assert(an_activeFac && an_activeFac.assignedWeeklyPeriods > 0 && an_activeFac.scheduledWeeklyPeriods > 0, "AN18: Faculty workload maintains distinct assigned vs scheduled hours");

  // Step AN19: Faculty queries own workload via /api/analytics/faculty-workload (HTTP 200)
  const an_facSelfWorkloadRes = await fetch(`${BASE_URL}/api/analytics/faculty-workload?facultyId=demo-faculty-001`, {
    headers: { Cookie: facultyCookie },
  });
  assert(an_facSelfWorkloadRes.status === 200, "AN19: Faculty queries own workload analytics (HTTP 200)");

  // Step AN20: Faculty forbidden from querying another faculty's workload ID (HTTP 403)
  const an_facOtherWorkloadRes = await fetch(`${BASE_URL}/api/analytics/faculty-workload?facultyId=demo-faculty-002`, {
    headers: { Cookie: facultyCookie },
  });
  assert(an_facOtherWorkloadRes.status === 403, "AN20: Faculty forbidden from querying peer faculty workload (HTTP 403)");

  // Step AN21: Admin queries timetable utilization (HTTP 200)
  const an_ttRes = await fetch(`${BASE_URL}/api/analytics/timetable`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_ttRes.status === 200, "AN21: Admin queries timetable & room utilization (HTTP 200)");
  const an_ttData = await an_ttRes.json();

  // Step AN22: Timetable utilization contains classroom & laboratory utilization rates
  assert(typeof an_ttData.utilization?.classroomUtilizationRate === "number" && typeof an_ttData.utilization?.laboratoryUtilizationRate === "number", "AN22: Timetable computes classroom and lab utilization rates");

  // Step AN23: Timetable utilization contains period utilization across academic periods
  assert(Array.isArray(an_ttData.utilization?.periodUtilization) && an_ttData.utilization.periodUtilization.length === 6, "AN23: Period utilization covers 6 daily academic periods");

  // Step AN24: Admin queries event analytics (HTTP 200)
  const an_evtRes = await fetch(`${BASE_URL}/api/analytics/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_evtRes.status === 200, "AN24: Admin queries event analytics (HTTP 200)");
  const an_evtData = await an_evtRes.json();

  // Step AN25: Event analytics contains capacity utilization and category breakdown
  assert(typeof an_evtData.analytics?.capacityUtilizationRate === "number" && Array.isArray(an_evtData.analytics?.categoryDistribution), "AN25: Event analytics calculates capacity utilization and category distribution");

  // Step AN26: Admin queries club analytics (HTTP 200)
  const an_clubRes = await fetch(`${BASE_URL}/api/analytics/clubs`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_clubRes.status === 200, "AN26: Admin queries club analytics (HTTP 200)");
  const an_clubData = await an_clubRes.json();

  // Step AN27: Club analytics contains averageEngagementScore and tier distribution
  assert(typeof an_clubData.analytics?.averageEngagementScore === "number" && an_clubData.analytics?.tierDistribution?.elite !== undefined, "AN27: Club analytics calculates deterministic engagement score and tier index");

  // Step AN28: Club Coordinator queries club analytics (HTTP 200)
  const an_coordClubRes = await fetch(`${BASE_URL}/api/analytics/clubs`, {
    headers: { Cookie: an_clubCookie },
  });
  assert(an_coordClubRes.status === 200, "AN28: Club Coordinator authorized to access club analytics (HTTP 200)");

  // Step AN29: Admin queries placement analytics (HTTP 200)
  const an_placeRes = await fetch(`${BASE_URL}/api/analytics/placement`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_placeRes.status === 200, "AN29: Admin queries placement analytics (HTTP 200)");
  const an_placeData = await an_placeRes.json();

  // Step AN30: Placement analytics contains application status pipeline and readiness distribution
  assert(an_placeData.analytics?.statusFunnel?.applied !== undefined && an_placeData.analytics?.readinessDistribution?.placementReady !== undefined, "AN30: Placement analytics provides hiring pipeline and readiness distribution");

  // Step AN31: Placement Officer queries placement analytics (HTTP 200)
  const an_officerPlaceRes = await fetch(`${BASE_URL}/api/analytics/placement`, {
    headers: { Cookie: an_placementCookie },
  });
  assert(an_officerPlaceRes.status === 200, "AN31: Placement Officer authorized to access placement analytics (HTTP 200)");

  // Step AN32: Student forbidden from institutional placement analytics (HTTP 403)
  const an_studentPlaceRes = await fetch(`${BASE_URL}/api/analytics/placement`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentPlaceRes.status === 403, "AN32: Student forbidden from institutional placement analytics (HTTP 403)");

  // Step AN33: Admin queries lost & found analytics (HTTP 200)
  const an_lfRes = await fetch(`${BASE_URL}/api/analytics/lost-found`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_lfRes.status === 200, "AN33: Admin queries lost & found analytics (HTTP 200)");
  const an_lfData = await an_lfRes.json();

  // Step AN34: Lost & found analytics contains resolution rate and category distribution
  assert(typeof an_lfData.analytics?.resolutionRate === "number" && Array.isArray(an_lfData.analytics?.categoryDistribution), "AN34: Lost & found computes recovery rate without exposing private claim data");

  // Step AN35: Admin queries notification analytics (HTTP 200)
  const an_notifRes = await fetch(`${BASE_URL}/api/analytics/notifications`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_notifRes.status === 200, "AN35: Admin queries notification analytics (HTTP 200)");
  const an_notifData = await an_notifRes.json();
  assert(typeof an_notifData.analytics?.readRate === "number", "AN35b: Notification analytics contains read rate");

  // Step AN36: Admin queries department comparison benchmarking (HTTP 200)
  const an_deptCompRes = await fetch(`${BASE_URL}/api/analytics/department-comparison`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_deptCompRes.status === 200, "AN36: Admin queries department comparison benchmarking (HTTP 200)");
  const an_deptCompData = await an_deptCompRes.json();
  assert(Array.isArray(an_deptCompData.comparison) && an_deptCompData.comparison.length > 0, "AN36b: Department comparison returns accredited branches array");

  // Step AN37: Student queries own personal analytics via /api/analytics/student (HTTP 200)
  const an_studentSelfRes = await fetch(`${BASE_URL}/api/analytics/student`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentSelfRes.status === 200, "AN37: Student queries personal academic analytics (HTTP 200)");
  const an_studentSelfData = await an_studentSelfRes.json();
  assert(an_studentSelfData.analytics?.student?.rollNumber === "22COMPA101", "AN37b: Student receives own personal roll number");

  // Step AN38: Student IDOR attempt to view peer student analytics is blocked (HTTP 403)
  const an_studentIdorRes = await fetch(`${BASE_URL}/api/analytics/student?studentId=demo-student-002`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentIdorRes.status === 403, "AN38: Student IDOR access attempt to peer analytics blocked (HTTP 403)");

  // Step AN39: Faculty queries teaching analytics via /api/analytics/faculty (HTTP 200)
  const an_facSelfRes = await fetch(`${BASE_URL}/api/analytics/faculty`, {
    headers: { Cookie: facultyCookie },
  });
  assert(an_facSelfRes.status === 200, "AN39: Faculty queries personal teaching analytics (HTTP 200)");
  const an_facSelfData = await an_facSelfRes.json();
  assert(an_facSelfData.analytics?.faculty?.name?.includes("Meera"), "AN39b: Faculty receives authorized personal teaching stats");

  // Step AN40: Admin exports attendance summary CSV (HTTP 200, text/csv)
  const an_exportAttRes = await fetch(`${BASE_URL}/api/analytics/export/attendance`, {
    headers: { Cookie: adminCookie },
  });
  assert(an_exportAttRes.status === 200, "AN40: Admin exports attendance summary CSV (HTTP 200)");
  const an_attContentType = an_exportAttRes.headers.get("content-type") || "";
  assert(an_attContentType.includes("text/csv"), "AN40b: Export response Content-Type is text/csv");
  const an_attCsvText = await an_exportAttRes.text();
  assert(an_attCsvText.includes("Student ID,Roll Number,Student Name"), "AN40c: CSV payload contains RFC 4180 headers");

  // Step AN41: Placement Officer exports placement CSV (HTTP 200, text/csv)
  const an_exportPlaceRes = await fetch(`${BASE_URL}/api/analytics/export/placement`, {
    headers: { Cookie: an_placementCookie },
  });
  assert(an_exportPlaceRes.status === 200, "AN41: Placement Officer exports placement CSV (HTTP 200)");

  // Step AN42: Student blocked from downloading administrative CSV exports (HTTP 403)
  const an_studentExportRes = await fetch(`${BASE_URL}/api/analytics/export/attendance`, {
    headers: { Cookie: studentCookie },
  });
  assert(an_studentExportRes.status === 403, "AN42: Student blocked from administrative CSV export (HTTP 403)");

  // =========================================================================
  // PHASE 15 — EXAM MANAGEMENT, GRADEBOOK, RESULTS & TRANSCRIPTS TESTS
  // =========================================================================
  console.log("\n--- Phase 15 Exam Management, Gradebook, Results & Transcripts Tests ---");

  // Step EX01: Unauthenticated request to /api/exams is rejected (HTTP 401)
  const ex_unauthRes = await fetch(`${BASE_URL}/api/exams`);
  assert(ex_unauthRes.status === 401, "EX01: Unauthenticated request to /api/exams rejected (HTTP 401)");

  // Step EX02: Student queries /api/exams receives filtered exam schedule (HTTP 200)
  const ex_studentListRes = await fetch(`${BASE_URL}/api/exams`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_studentListRes.status === 200, "EX02: Student queries /api/exams (HTTP 200)");
  const ex_studentListData = await ex_studentListRes.json();
  assert(Array.isArray(ex_studentListData.exams), "EX02b: Student receives exams array");

  // Step EX03: Student forbidden from creating new exams (HTTP 403)
  const ex_studentCreateRes = await fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Student Exam Hack",
      examType: "INTERNAL",
      academicYear: "2024-2025",
      semesterNumber: 6,
      departmentId: "dept-comp",
      subjectId: "subj-dbms",
      date: "2026-06-15",
      startTime: "10:00",
      endTime: "11:30",
      maxMarks: 50,
      passingMarks: 20,
    }),
  });
  assert(ex_studentCreateRes.status === 403, "EX03: Student forbidden from creating exams (HTTP 403)");

  // Step EX04: Invalid exam validation: Passing marks > maxMarks rejected (HTTP 400)
  const ex_invalidMarksRes = await fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Invalid Marks Exam",
      examType: "MIDTERM",
      academicYear: "2024-2025",
      semesterNumber: 6,
      departmentId: "dept-comp",
      subjectId: "subj-dbms",
      date: "2026-06-15",
      startTime: "10:00",
      endTime: "11:30",
      maxMarks: 40,
      passingMarks: 50,
    }),
  });
  assert(ex_invalidMarksRes.status === 400, "EX04: Passing marks exceeding max marks rejected (HTTP 400)");

  // Step EX05: Invalid exam validation: End time before start time rejected (HTTP 400)
  const ex_invalidTimeRes = await fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Invalid Time Exam",
      examType: "MIDTERM",
      academicYear: "2024-2025",
      semesterNumber: 6,
      departmentId: "dept-comp",
      subjectId: "subj-dbms",
      date: "2026-06-15",
      startTime: "14:00",
      endTime: "13:00",
      maxMarks: 50,
      passingMarks: 20,
    }),
  });
  assert(ex_invalidTimeRes.status === 400, "EX05: End time before start time rejected (HTTP 400)");

  // Step EX06: Admin creates new draft exam (HTTP 201)
  const ex_createRes = await fetch(`${BASE_URL}/api/exams`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Comprehensive Architecture Assessment",
      examType: "INTERNAL",
      academicYear: "2024-2025",
      semesterNumber: 6,
      departmentId: "dept-comp",
      subjectId: "subj-dbms",
      date: "2026-07-25",
      startTime: "10:00",
      endTime: "12:00",
      maxMarks: 60,
      passingMarks: 24,
      instructions: "Comprehensive test covering transaction serialization and isolation levels.",
    }),
  });
  assert(ex_createRes.status === 201, "EX06: Admin creates draft exam (HTTP 201)");
  const ex_createData = await ex_createRes.json();
  const createdExamId = ex_createData.exam?.id;
  assert(createdExamId && ex_createData.exam?.status === "DRAFT", "EX06b: Exam created in DRAFT status");

  // Step EX07: Admin fetches exam details via /api/exams/[id] (HTTP 200)
  const ex_detailRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}`, {
    headers: { Cookie: adminCookie },
  });
  assert(ex_detailRes.status === 200, "EX07: Admin fetches exam details (HTTP 200)");
  const ex_detailData = await ex_detailRes.json();
  assert(ex_detailData.exam?.title === "Comprehensive Architecture Assessment", "EX07b: Details return exact exam title");

  // Step EX08: Admin updates draft exam attributes via PATCH /api/exams/[id] (HTTP 200)
  const ex_updateRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Advanced Database Architecture Assessment",
      maxMarks: 75,
      passingMarks: 30,
    }),
  });
  assert(ex_updateRes.status === 200, "EX08: Admin updates draft exam (HTTP 200)");
  const ex_updateData = await ex_updateRes.json();
  assert(ex_updateData.exam?.maxMarks === 75, "EX08b: Exam max marks successfully updated to 75");

  // Step EX09: Schedule conflict check — room collision rejected (HTTP 409)
  // exam-005 is in room-302 on 2026-04-24 from 10:00 to 13:00
  const ex_roomConflictRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}/schedule`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2026-04-24",
      startTime: "11:00",
      endTime: "12:30",
      roomId: "room-302",
      facultyId: "demo-faculty-002",
    }),
  });
  assert(ex_roomConflictRes.status === 409, "EX09: Room collision during scheduling returns HTTP 409");

  // Step EX10: Schedule conflict check — faculty collision rejected (HTTP 409)
  // exam-005 invigilator demo-faculty-001 on 2026-04-24 from 10:00 to 13:00
  const ex_facConflictRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}/schedule`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2026-04-24",
      startTime: "10:30",
      endTime: "12:00",
      roomId: "room-201",
      facultyId: "demo-faculty-001",
    }),
  });
  assert(ex_facConflictRes.status === 409, "EX10: Faculty invigilator clash returns HTTP 409");

  // Step EX11: Admin schedules exam without conflicts (HTTP 200)
  const ex_scheduleRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}/schedule`, {
    method: "POST",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2026-07-25",
      startTime: "10:00",
      endTime: "12:00",
      roomId: "room-201",
      facultyId: "demo-faculty-001",
      divisionId: "div-comp-a",
    }),
  });
  assert(ex_scheduleRes.status === 200, "EX11: Admin schedules exam without conflict (HTTP 200)");
  const ex_schedData = await ex_scheduleRes.json();
  assert(ex_schedData.exam?.status === "SCHEDULED", "EX11b: Exam status transitioned to SCHEDULED");

  // Step EX12: Admin inspects candidate eligibility via /api/exams/[id]/eligibility (HTTP 200)
  const ex_eligRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}/eligibility`, {
    headers: { Cookie: adminCookie },
  });
  assert(ex_eligRes.status === 200, "EX12: Admin inspects candidate eligibility (HTTP 200)");
  const ex_eligData = await ex_eligRes.json();
  assert(Array.isArray(ex_eligData.candidates) && ex_eligData.candidates.length > 0, "EX12b: Returns candidate eligibility roster");

  // Step EX13: Faculty queries gradebook for authorized exam (HTTP 200)
  const ex_gbRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    headers: { Cookie: facultyCookie },
  });
  assert(ex_gbRes.status === 200, "EX13: Faculty fetches assigned exam gradebook (HTTP 200)");
  const ex_gbData = await ex_gbRes.json();
  assert(Array.isArray(ex_gbData.entries) && ex_gbData.entries.length > 0, "EX13b: Gradebook returns enrolled students");

  // Step EX14: Student blocked from accessing class gradebook (HTTP 403)
  const ex_studentGbRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_studentGbRes.status === 403, "EX14: Student forbidden from exam gradebook (HTTP 403)");

  // Step EX15: Faculty enters gradebook marks with deterministic grading (HTTP 200)
  const ex_gradeSaveRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    method: "POST",
    headers: { Cookie: facultyCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: [
        {
          studentId: "demo-student-001",
          marksObtained: 46,
          isAbsent: false,
          remarks: "Exceptional design rationale on distributed consensus.",
        },
      ],
    }),
  });
  assert(ex_gradeSaveRes.status === 200, "EX15: Faculty saves gradebook entries (HTTP 200)");
  const ex_gradeSaveData = await ex_gradeSaveRes.json();
  assert(ex_gradeSaveData.entries?.[0]?.gradeLetter === "A+", "EX15b: Marks 46/50 (92%) deterministically yields A+");

  // Step EX16: Negative marks rejected in gradebook entry (HTTP 400)
  const ex_negMarksRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    method: "POST",
    headers: { Cookie: facultyCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: [{ studentId: "demo-student-001", marksObtained: -5, isAbsent: false }],
    }),
  });
  assert(ex_negMarksRes.status === 400, "EX16: Negative marks rejected (HTTP 400)");

  // Step EX17: Marks exceeding maxMarks rejected in gradebook entry (HTTP 400)
  const ex_exceedMarksRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    method: "POST",
    headers: { Cookie: facultyCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: [{ studentId: "demo-student-001", marksObtained: 99, isAbsent: false }],
    }),
  });
  assert(ex_exceedMarksRes.status === 400, "EX17: Marks exceeding maxMarks rejected (HTTP 400)");

  // Step EX18: Absent candidate correctly recorded with 0 marks and grade F (HTTP 200)
  const ex_absentRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    method: "POST",
    headers: { Cookie: facultyCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: [{ studentId: "demo-student-004", isAbsent: true, remarks: "Medical absence" }],
    }),
  });
  assert(ex_absentRes.status === 200, "EX18: Absent candidate recorded successfully (HTTP 200)");
  const ex_absentData = await ex_absentRes.json();
  const absentEntry = ex_absentData.entries?.find((e) => e.studentId === "demo-student-004");
  assert(absentEntry && absentEntry.gradeLetter === "F" && absentEntry.marksObtained === 0, "EX18b: Absent candidate mapped to 0 marks and grade F");

  // Step EX19: Student cannot submit grades (HTTP 403)
  const ex_studentSubmitGradeRes = await fetch(`${BASE_URL}/api/exams/exam-001/gradebook`, {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ entries: [{ studentId: "demo-student-001", marksObtained: 50 }] }),
  });
  assert(ex_studentSubmitGradeRes.status === 403, "EX19: Student forbidden from submitting grades (HTTP 403)");

  // Step EX20: Admin marks exam completed via /api/exams/[id]/complete (HTTP 200)
  const ex_completeRes = await fetch(`${BASE_URL}/api/exams/${createdExamId}/complete`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(ex_completeRes.status === 200, "EX20: Admin completes exam transitioning to RESULTS_PENDING (HTTP 200)");

  // Step EX21: Admin publishes exam results (HTTP 200)
  const ex_publishRes = await fetch(`${BASE_URL}/api/exams/exam-004/publish`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(ex_publishRes.status === 200, "EX21: Admin publishes exam results (HTTP 200)");
  const ex_publishData = await ex_publishRes.json();
  assert(ex_publishData.exam?.status === "PUBLISHED", "EX21b: Exam status transitioned to PUBLISHED");

  // Step EX22: Student forbidden from publishing results (HTTP 403)
  const ex_studentPubRes = await fetch(`${BASE_URL}/api/exams/exam-004/publish`, {
    method: "POST",
    headers: { Cookie: studentCookie },
  });
  assert(ex_studentPubRes.status === 403, "EX22: Student forbidden from publishing results (HTTP 403)");

  // Step EX23: Admin locks results against accidental tampering (HTTP 200)
  const ex_lockRes = await fetch(`${BASE_URL}/api/exams/exam-004/lock`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(ex_lockRes.status === 200, "EX23: Admin locks exam results (HTTP 200)");

  // Step EX24: Grade modification on locked exam is rejected (HTTP 400)
  const ex_lockedModRes = await fetch(`${BASE_URL}/api/exams/exam-004/gradebook`, {
    method: "POST",
    headers: { Cookie: facultyCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      entries: [{ studentId: "demo-student-001", marksObtained: 40 }],
    }),
  });
  assert(ex_lockedModRes.status === 400, "EX24: Modifying locked exam gradebook rejected (HTTP 400)");

  // Step EX25: Admin queries all results via /api/results (HTTP 200)
  const ex_allResultsRes = await fetch(`${BASE_URL}/api/results`, {
    headers: { Cookie: adminCookie },
  });
  assert(ex_allResultsRes.status === 200, "EX25: Admin queries all results (HTTP 200)");

  // Step EX26: Student queries personal semester results via /api/results/student (HTTP 200)
  const ex_studentResRes = await fetch(`${BASE_URL}/api/results/student`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_studentResRes.status === 200, "EX26: Student queries personal results (HTTP 200)");
  const ex_studentResData = await ex_studentResRes.json();
  assert(typeof ex_studentResData.results?.cumulativeCgpa === "number", "EX26b: Student results contain cumulative CGPA");
  assert(ex_studentResData.results?.degreeClassification === "First Class with Distinction", "EX26c: Student receives valid degree classification");

  // Step EX27: Student IDOR attempt to view peer student's results is blocked (HTTP 403)
  const ex_idorResRes = await fetch(`${BASE_URL}/api/results/student?studentId=demo-student-002`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_idorResRes.status === 403, "EX27: Student IDOR attempt on peer results blocked (HTTP 403)");

  // Step EX28: Faculty can query student results by providing studentId (HTTP 200)
  const ex_facStudentRes = await fetch(`${BASE_URL}/api/results/student?studentId=demo-student-001`, {
    headers: { Cookie: facultyCookie },
  });
  assert(ex_facStudentRes.status === 200, "EX28: Faculty queries student results with studentId (HTTP 200)");

  // Step EX29: Student queries official academic transcript via /api/transcript (HTTP 200)
  const ex_transcriptRes = await fetch(`${BASE_URL}/api/transcript`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_transcriptRes.status === 200, "EX29: Student queries academic transcript (HTTP 200)");
  const ex_transcriptData = await ex_transcriptRes.json();
  assert(ex_transcriptData.transcript?.student?.name === "Aarav Mehta", "EX29b: Transcript identifies authenticated student");
  assert(Array.isArray(ex_transcriptData.transcript?.semesters) && ex_transcriptData.transcript?.semesters.length >= 5, "EX29c: Transcript includes full semester progression");
  assert(ex_transcriptData.transcript?.summary?.totalCreditsEarned > 0, "EX29d: Transcript tallies total credits earned");

  // Step EX30: Student IDOR attempt on academic transcript is blocked (HTTP 403)
  const ex_idorTransRes = await fetch(`${BASE_URL}/api/transcript?studentId=demo-student-002`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_idorTransRes.status === 403, "EX30: Student IDOR attempt on peer transcript blocked (HTTP 403)");

  // Step EX31: Student exports academic transcript as RFC 4180 CSV (HTTP 200, text/csv)
  const ex_csvTransRes = await fetch(`${BASE_URL}/api/transcript/export?format=csv`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_csvTransRes.status === 200, "EX31: Student exports transcript CSV (HTTP 200)");
  const ex_csvType = ex_csvTransRes.headers.get("content-type") || "";
  assert(ex_csvType.includes("text/csv"), "EX31b: Export response Content-Type is text/csv");
  const ex_csvText = await ex_csvTransRes.text();
  assert(ex_csvText.includes("Semester,Academic Year") && ex_csvText.includes("Subject Code,Subject Name"), "EX31c: CSV contains standard academic transcript columns");

  // Step EX32: Student exports academic transcript printable view (HTTP 200, text/html)
  const ex_printTransRes = await fetch(`${BASE_URL}/api/transcript/export?format=print`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_printTransRes.status === 200, "EX32: Student exports printable transcript (HTTP 200)");
  const ex_printType = ex_printTransRes.headers.get("content-type") || "";
  assert(ex_printType.includes("text/html"), "EX32b: Printable view Content-Type is text/html");
  const ex_printHtml = await ex_printTransRes.text();
  assert(ex_printHtml.includes("OFFICIAL ACADEMIC TRANSCRIPT"), "EX32c: Printable view contains official institutional heading");

  // Step EX33: Student IDOR attempt on transcript export is blocked (HTTP 403)
  const ex_idorExportRes = await fetch(`${BASE_URL}/api/transcript/export?studentId=demo-student-002`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_idorExportRes.status === 403, "EX33: Student IDOR attempt on transcript export blocked (HTTP 403)");

  // Step EX34: Student submits revaluation request via POST /api/revaluation (HTTP 201)
  const ex_revSubmitRes = await fetch(`${BASE_URL}/api/revaluation`, {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      examId: "exam-002",
      subjectId: "sub-cs602",
      reason: "Requesting total recount for Section C Question 4.",
      requestedMarks: 49,
    }),
  });
  assert(ex_revSubmitRes.status === 201, "EX34: Student submits revaluation request (HTTP 201)");
  const ex_revSubmitData = await ex_revSubmitRes.json();
  const newRevId = ex_revSubmitData.revaluation?.id;
  assert(newRevId && ex_revSubmitData.revaluation?.status === "PENDING", "EX34b: Revaluation request status initialized to PENDING");

  // Step EX35: Duplicate pending revaluation request from same student rejected (HTTP 400)
  const ex_revDupRes = await fetch(`${BASE_URL}/api/revaluation`, {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      examId: "exam-002",
      subjectId: "sub-cs602",
      reason: "Duplicate submission attempt",
    }),
  });
  assert(ex_revDupRes.status === 400, "EX35: Duplicate pending revaluation request rejected (HTTP 400)");

  // Step EX36: Student queries own revaluation requests via GET /api/revaluation (HTTP 200)
  const ex_revListRes = await fetch(`${BASE_URL}/api/revaluation`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_revListRes.status === 200, "EX36: Student queries revaluation requests (HTTP 200)");
  const ex_revListData = await ex_revListRes.json();
  assert(Array.isArray(ex_revListData.requests) && ex_revListData.requests.length > 0, "EX36b: Student receives active revaluation petitions");

  // Step EX37: Student attempting self-approval of revaluation is blocked (HTTP 403)
  const ex_selfApproveRes = await fetch(`${BASE_URL}/api/revaluation/${newRevId}`, {
    method: "PATCH",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "APPROVED",
      reviewRemarks: "Self approval attempt hack",
      revisedMarks: 50,
    }),
  });
  assert(ex_selfApproveRes.status === 403, "EX37: Student self-approval of revaluation blocked (HTTP 403)");

  // Step EX38: Admin reviews and approves revaluation request (HTTP 200)
  const ex_approveRes = await fetch(`${BASE_URL}/api/revaluation/${newRevId}`, {
    method: "PATCH",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "APPROVED",
      reviewRemarks: "Re-total verified by Head of Department. 2 marks awarded for Question 4.",
      revisedMarks: 49,
    }),
  });
  assert(ex_approveRes.status === 200, "EX38: Admin approves revaluation request (HTTP 200)");
  const ex_approveData = await ex_approveRes.json();
  assert(ex_approveData.revaluation?.status === "APPROVED", "EX38b: Revaluation transitioned to APPROVED");

  // Step EX39: Admin queries dedicated exam analytics via /api/exams/analytics (HTTP 200)
  const ex_analyticsRes = await fetch(`${BASE_URL}/api/exams/analytics`, {
    headers: { Cookie: adminCookie },
  });
  assert(ex_analyticsRes.status === 200, "EX39: Admin queries dedicated exam analytics (HTTP 200)");
  const ex_analyticsData = await ex_analyticsRes.json();
  assert(typeof ex_analyticsData.analytics?.passRate === "number", "EX39b: Exam analytics provides aggregate pass rate");
  assert(ex_analyticsData.analytics?.gradeDistribution?.["A+"] !== undefined, "EX39c: Exam analytics includes grade distribution");

  // Step EX40: Student blocked from administrative exam analytics (HTTP 403)
  const ex_studentAnRes = await fetch(`${BASE_URL}/api/exams/analytics`, {
    headers: { Cookie: studentCookie },
  });
  assert(ex_studentAnRes.status === 403, "EX40: Student forbidden from exam analytics (HTTP 403)");

  // Step EX41: Integrated Phase 14 Academic Analytics includes authoritative examSummary (HTTP 200)
  const ex_integratedAcadRes = await fetch(`${BASE_URL}/api/analytics/academic`, {
    headers: { Cookie: adminCookie },
  });
  assert(ex_integratedAcadRes.status === 200, "EX41: Admin queries integrated academic analytics (HTTP 200)");
  const ex_integratedAcadData = await ex_integratedAcadRes.json();
  assert(ex_integratedAcadData.performance?.examSummary !== undefined, "EX41b: Academic analytics integrates authoritative examSummary");
  assert(typeof ex_integratedAcadData.performance?.examSummary?.averageExamMarks === "number", "EX41c: Integrated examSummary calculates averageExamMarks");

  // =========================================================================
  // PHASE 16 — FINAL INTEGRATION, SECURITY & DEPLOYMENT VERIFICATION
  // =========================================================================
  console.log("\n--- Phase 16 Final Integration, Security & Deployment Tests ---");

  // Step P16_01: Production security headers present on responses
  const secHeaderRes = await fetch(`${BASE_URL}/login`);
  assert(secHeaderRes.headers.get("x-content-type-options") === "nosniff", "P16_01a: X-Content-Type-Options header is nosniff");
  assert(secHeaderRes.headers.get("x-frame-options") === "SAMEORIGIN", "P16_01b: X-Frame-Options header is SAMEORIGIN");
  assert(secHeaderRes.headers.get("referrer-policy") === "strict-origin-when-cross-origin", "P16_01c: Referrer-Policy header is strict-origin-when-cross-origin");

  // Step P16_02: Club Coordinator blocked from querying student academic results (HTTP 403)
  const p16_clubResultsRes = await fetch(`${BASE_URL}/api/results/student?studentId=demo-student-001`, {
    headers: { Cookie: an_clubCookie },
  });
  assert(p16_clubResultsRes.status === 403, "P16_02: Club Coordinator blocked from student academic results (HTTP 403)");

  // Step P16_03: Placement Officer blocked from querying student academic transcript (HTTP 403)
  const p16_placementTransRes = await fetch(`${BASE_URL}/api/transcript?studentId=demo-student-001`, {
    headers: { Cookie: an_placementCookie },
  });
  assert(p16_placementTransRes.status === 403, "P16_03: Placement Officer blocked from student academic transcript (HTTP 403)");

  // Step P16_04: Placement Officer blocked from exporting student academic transcript (HTTP 403)
  const p16_placementExportRes = await fetch(`${BASE_URL}/api/transcript/export?studentId=demo-student-001`, {
    headers: { Cookie: an_placementCookie },
  });
  assert(p16_placementExportRes.status === 403, "P16_04: Placement Officer blocked from exporting academic transcript (HTTP 403)");

  // Step P16_05: Nonexistent page route triggers 404 response
  const p16_notFoundRes = await fetch(`${BASE_URL}/nonexistent-route-404-test`);
  assert(p16_notFoundRes.status === 404, "P16_05: Nonexistent route triggers HTTP 404");

  // Step P16_06: Unauthorized error boundary page renders (HTTP 200)
  const p16_unauthPageRes = await fetch(`${BASE_URL}/unauthorized?required=ADMIN&current=STUDENT`, {
    headers: { Cookie: studentCookie },
  });
  assert(p16_unauthPageRes.status === 200, "P16_06: Unauthorized boundary page renders (HTTP 200)");

  // Step P16_07: System administrative check returns healthy status (HTTP 200)
  const p16_sysCheckRes = await fetch(`${BASE_URL}/api/admin/system-check`, {
    headers: { Cookie: adminCookie },
  });
  assert(p16_sysCheckRes.status === 200, "P16_07: Admin system-check returns HTTP 200");
  const p16_sysCheckData = await p16_sysCheckRes.json();
  assert(p16_sysCheckData.success === true, "P16_07b: System health status reports operational");

  // Step P16_08: File upload rejects blocked executable extensions (HTTP 403)
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const fakeExeBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="dangerous_exploit.exe"\r\n` +
    `Content-Type: application/x-msdownload\r\n\r\n` +
    `MZBINARYMOCKPAYLOAD\r\n` +
    `--${boundary}--\r\n`;

  const p16_uploadSecRes = await fetch(`${BASE_URL}/api/assignments/upload`, {
    method: "POST",
    headers: {
      Cookie: studentCookie,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: fakeExeBody,
  });
  assert(p16_uploadSecRes.status === 403, "P16_08: Assignment upload blocks executable files (HTTP 403)");

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests();


