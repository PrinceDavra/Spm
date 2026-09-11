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
  assert(validEditData.result.newStatus === "PRESENT", "Status updated to PRESENT");

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests();
