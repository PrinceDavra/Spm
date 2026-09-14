// Node.js live verification script testing Phase 2 and Phase 3 endpoints over HTTP
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING LIVE HTTP API VERIFICATION FOR PHASE 2 & 3");
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

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests();

