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

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests();
