// Node.js verification script testing all Phase 2 endpoints over HTTP
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING LIVE HTTP API VERIFICATION FOR PHASE 2");
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

  // Test 1: Invalid credentials
  console.log("\n--- Test 1: Invalid Credentials Rejection ---");
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@campussphere.edu",
      password: "WrongPassword999",
    }),
  });
  const badLoginData = await badLoginRes.json();
  assert(badLoginRes.status === 401, "Invalid password returns HTTP 401 Unauthorized");
  assert(badLoginData.success === false, "Returns success: false");

  // Test 2: Student Login & Cookie Setting
  console.log("\n--- Test 2: Student Login & Session Cookie ---");
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@campussphere.edu",
      password: "StudentPassword@123",
    }),
  });
  const studentCookie = studentLoginRes.headers.get("set-cookie");
  const studentData = await studentLoginRes.json();

  assert(studentLoginRes.status === 200, "Student login returns HTTP 200");
  assert(studentData.user.role === "STUDENT", "Student user role is STUDENT");
  assert(
    studentCookie && studentCookie.includes("campussphere_session"),
    "HTTP-only session cookie is set in response headers"
  );

  // Test 3: Authenticated /api/auth/me for Student
  console.log("\n--- Test 3: Current User API (/api/auth/me) ---");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: studentCookie || "" },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, "/api/auth/me returns HTTP 200 for authenticated session");
  assert(meData.user.email === "student@campussphere.edu", "Verified email matches session");

  // Test 4: Server-Side RBAC Guard (/api/admin/system-check) blocked for Student
  console.log("\n--- Test 4: Server-Side RBAC Guard (Student blocked from Admin API) ---");
  const forbiddenRes = await fetch(`${BASE_URL}/api/admin/system-check`, {
    headers: { Cookie: studentCookie || "" },
  });
  assert(forbiddenRes.status === 403, "Student accessing Admin API receives HTTP 403 Forbidden");

  // Test 5: Admin Login & Access to Protected Admin API
  console.log("\n--- Test 5: Admin Login & Access to Protected Admin API ---");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@campussphere.edu",
      password: "AdminPassword@123",
    }),
  });
  const adminCookie = adminLoginRes.headers.get("set-cookie");
  const adminData = await adminLoginRes.json();

  assert(adminLoginRes.status === 200, "Admin login returns HTTP 200");
  assert(adminData.user.role === "ADMIN", "Admin role verified");

  const adminCheckRes = await fetch(`${BASE_URL}/api/admin/system-check`, {
    headers: { Cookie: adminCookie || "" },
  });
  const adminCheckData = await adminCheckRes.json();
  assert(adminCheckRes.status === 200, "Admin accessing Admin API receives HTTP 200 OK");
  assert(adminCheckData.operator.role === "ADMIN", "RBAC operator verified as ADMIN");

  // Test 6: Verify Remaining Demo Roles (Faculty, Placement Officer, Club Coordinator)
  console.log("\n--- Test 6: Verify Other Demo Accounts ---");
  const rolesToTest = [
    { email: "faculty@campussphere.edu", pass: "FacultyPassword@123", role: "FACULTY" },
    { email: "placement@campussphere.edu", pass: "PlacementPassword@123", role: "PLACEMENT_OFFICER" },
    { email: "club@campussphere.edu", pass: "ClubPassword@123", role: "CLUB_COORDINATOR" },
  ];

  for (const r of rolesToTest) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: r.email, password: r.pass }),
    });
    const d = await res.json();
    assert(res.status === 200 && d.user.role === r.role, `Demo account ${r.role} authenticated successfully`);
  }

  // Test 7: Logout API
  console.log("\n--- Test 7: Logout Flow ---");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: adminCookie || "" },
  });
  const logoutCookie = logoutRes.headers.get("set-cookie");
  assert(logoutRes.status === 200, "Logout endpoint returns HTTP 200");
  assert(
    logoutCookie && (logoutCookie.includes("Max-Age=0") || logoutCookie.includes("expires=")),
    "Logout header deletes session cookie"
  );

  // Test 8: Unauthenticated access to /api/auth/me
  console.log("\n--- Test 8: Unauthenticated Me Check ---");
  const unauthMe = await fetch(`${BASE_URL}/api/auth/me`);
  assert(unauthMe.status === 401, "Unauthenticated request to /api/auth/me returns HTTP 401");

  // Test 9: Middleware Redirection on /dashboard without cookie
  console.log("\n--- Test 9: Middleware Edge Guard on /dashboard ---");
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  assert(
    dashRes.status === 307 || dashRes.status === 302,
    "Unauthenticated request to /dashboard is redirected (HTTP 307/302)"
  );
  const redirectLocation = dashRes.headers.get("location");
  assert(
    redirectLocation && redirectLocation.includes("/login"),
    "Redirect location points to /login?callbackUrl="
  );

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
