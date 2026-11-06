/**
 * verify_careers_talent_pool_blackbox.ts
 * Standalone Hardcore Black-Box Verification Script for POST /api/careers/talent-pool
 *
 * Implements the black-box testing standard:
 * 1. Invokes top-level route handler directly (POST from app/api/careers/talent-pool/route).
 * 2. Mandatory request logging (Method, Path, Payload/FormData, Caller Context).
 * 3. Mandatory response logging formatted via JSON.stringify(..., null, 2).
 * 4. Full test matrix: Origin Check, Honeypot Bot Defeat, Validation (Name & Email), Happy Path (JSON & FormData), and 500 Error Handling.
 * 5. Deterministic exit codes and zero residual test pollution.
 */

import "../preload.cjs";
import { POST } from "@/app/api/careers/talent-pool/route";
import { getContainer, resetRootContainer } from "@/lib/di/container";
import { CareerApplyService } from "@/lib/services/career-apply.service";
import { API_ENDPOINTS } from "@/lib/constants/endpoints.constants";
import { AppError, ErrorCode } from "@/lib/errors";
import { CAREER_ERRORS } from "@/lib/constants/careers.constants";

const PASS = "✓ PASS";
const FAIL = "✗ FAIL";

let passCount = 0;
let failCount = 0;

function logSection(title: string) {
  console.log(`\n======================================================================`);
  console.log(`  ${title}`);
  console.log(`======================================================================`);
}

function logRequest(details: {
  caseNum: number;
  description: string;
  method: string;
  path: string;
  payload: Record<string, unknown>;
  caller: Record<string, unknown>;
}) {
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`[TEST CASE ${details.caseNum}] ${details.description}`);
  console.log(`Incoming Request:`);
  console.log(`  Method:  ${details.method}`);
  console.log(`  Path:    ${details.path}`);
  console.log(`  Payload: ${JSON.stringify(details.payload)}`);
  console.log(`  Caller:  ${JSON.stringify(details.caller)}`);
}

function logResponse(status: number, headers: Headers, body: unknown) {
  console.log(`Controller Response (HTTP ${status}):`);
  console.log(`Headers: x-request-id=${headers.get("x-request-id")}, cache-control=${headers.get("cache-control")}`);
  console.log(JSON.stringify(body, null, 2));
}

function assertTest(condition: boolean, caseNum: number, message: string) {
  if (condition) {
    console.log(`${PASS} [Case ${caseNum}]: ${message}`);
    passCount++;
  } else {
    console.error(`${FAIL} [Case ${caseNum}]: Assertion failed - ${message}`);
    failCount++;
  }
}

async function runBlackboxSuite() {
  logSection("STARTING HARDCORE BLACK-BOX VERIFICATION: POST /api/careers/talent-pool");

  resetRootContainer();

  const validTalentId = "t1111111-2222-4333-8444-555555555555";
  const validCandidate = {
    id: validTalentId,
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+919876543210",
    skills: ["React", "TypeScript", "Next.js"],
    preferredRole: "Senior Frontend Engineer",
    experienceLevel: "senior",
  };

  const mockApplyService = {
    submitTalentPool: async (payload: any) => {
      if (payload.name === "Crash Trigger") {
        throw new Error("Simulated storage / database timeout");
      }
      return {
        ...validCandidate,
        name: payload.name || validCandidate.name,
        email: payload.email || validCandidate.email,
      };
    },
  };

  const container = getContainer();
  container.bind({ provide: CareerApplyService, useValue: mockApplyService as unknown as CareerApplyService });

  // Case 1: Untrusted origin
  {
    const payload = { name: "Aarav Sharma", email: "aarav@example.com" };
    logRequest({
      caseNum: 1,
      description: "Reject foreign origin with 403 FORBIDDEN",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "anonymous", origin: "https://untrusted-spoofing-site.com" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: {
        origin: "https://untrusted-spoofing-site.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 403 && json.ok === false && json.code === ErrorCode.FORBIDDEN, 1, "Returns 403 FORBIDDEN for untrusted origin");
  }

  // Case 2: Bot honeypot defeat
  {
    const payload = { website_url: "https://bot-crawler.ru", name: "Spam Bot", email: "bot@spam.com" };
    logRequest({
      caseNum: 2,
      description: "Defeat spam bots with 200 OK simulated-id",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "bot" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(res.status === 200 && json.ok === true && json.id === "simulated-id", 2, "Returns 200 simulated-id for honeypot bot");
  }

  // Case 3: Missing candidate name
  {
    const payload = { name: "", email: "aarav@example.com" };
    logRequest({
      caseNum: 3,
      description: "Reject missing candidate name with 400 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "candidate" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 400 && json.ok === false && json.code === ErrorCode.VALIDATION && Boolean(json.errorPayload?.fieldErrors?.name),
      3,
      "Returns 400 VALIDATION with fieldErrors for name",
    );
  }

  // Case 4: Invalid email format
  {
    const payload = { name: "Aarav Sharma", email: "not-an-email" };
    logRequest({
      caseNum: 4,
      description: "Reject invalid email format with 400 VALIDATION",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "candidate" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 400 && json.ok === false && json.code === ErrorCode.VALIDATION && Boolean(json.errorPayload?.fieldErrors?.email),
      4,
      "Returns 400 VALIDATION with fieldErrors for email",
    );
  }

  // Case 5: Happy path (JSON payload)
  {
    const payload = {
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+919876543210",
      skills: ["React", "TypeScript", "Next.js"],
      preferredRole: "Senior Frontend Engineer",
      experienceLevel: "senior",
      notes: "Excited about engineering opportunities.",
      privacyConsent: true,
    };
    logRequest({
      caseNum: 5,
      description: "Happy path: submit candidate profile via JSON",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "candidate" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 200 &&
        json.ok === true &&
        json.data?.id === validTalentId &&
        json.id === validTalentId &&
        Boolean(res.headers.get("x-request-id")) &&
        res.headers.get("cache-control") === "no-store, private",
      5,
      "Returns 200 OK with full envelope, ID, and tracking headers",
    );
  }

  // Case 6: Happy path (FormData payload with resume attachment)
  {
    const formData = new FormData();
    formData.append("name", "Aarav Sharma");
    formData.append("email", "aarav.sharma@example.com");
    formData.append("skills", "React, Node.js, GraphQL");
    formData.append("preferredRole", "Fullstack Architect");

    const resumeBlob = new Blob(["%PDF-1.4 test resume bytes"], { type: "application/pdf" });
    formData.append("resumeFile", resumeBlob, "aarav_resume.pdf");

    logRequest({
      caseNum: 6,
      description: "Happy path: submit candidate profile via Multipart FormData with resume",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload: { name: "Aarav Sharma", email: "aarav.sharma@example.com", resumeFile: "aarav_resume.pdf" },
      caller: { role: "candidate" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 200 && json.ok === true && json.data?.id === validTalentId,
      6,
      "Returns 200 OK for Multipart FormData submission with resume",
    );
  }

  // Case 7: Service exception handling
  {
    const payload = { name: "Crash Trigger", email: "crash@example.com" };
    logRequest({
      caseNum: 7,
      description: "Handle unexpected server failure with 500 INTERNAL",
      method: "POST",
      path: API_ENDPOINTS.CAREERS.TALENT_POOL,
      payload,
      caller: { role: "candidate" },
    });

    const req = new Request(`http://localhost:3000${API_ENDPOINTS.CAREERS.TALENT_POOL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();
    logResponse(res.status, res.headers, json);

    assertTest(
      res.status === 500 && json.ok === false && json.code === ErrorCode.INTERNAL,
      7,
      "Returns 500 INTERNAL on unexpected service exception",
    );
  }

  logSection("EXECUTION AUDIT SUMMARY");
  console.log(`Total Test Cases Executed: ${passCount + failCount}`);
  console.log(`Passed:                   ${passCount}`);
  console.log(`Failed:                   ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ BLACK-BOX VERIFICATION FAILED WITH ${failCount} FAILURES`);
    process.exit(1);
  } else {
    console.log(`\n✅ HARDCORE BLACK-BOX VERIFICATION PASSED (ALL ${passCount} TESTS CONFIRMED)`);
    process.exit(0);
  }
}

runBlackboxSuite().catch((err) => {
  console.error("Unhandled error in blackbox verification script:", err);
  process.exit(1);
});
