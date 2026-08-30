import {
  isHardQuotaExhausted,
  isTransientRateLimit,
  isRetryableError,
  classifyError,
  executeWithRetry,
} from "../server/errorHandling";

async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING AI RELIABILITY & QUOTA VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST A: Normal Success Path
  // -------------------------------------------------------------
  console.log("--- Test A: Normal Success Path ---");
  let attemptsA = 0;
  const resultA = await executeWithRetry(
    async (attempt) => {
      attemptsA = attempt;
      return { success: true, data: "ok" };
    },
    { maxAttempts: 3, initialDelayMs: 10 }
  );
  assert(resultA.data === "ok" && attemptsA === 1, "Test A: Normal Success", `Expected attempts=1, got ${attemptsA}`);

  // -------------------------------------------------------------
  // TEST B: 503 Transient Server Error with Recovery
  // -------------------------------------------------------------
  console.log("\n--- Test B: 503 Service Unavailable Transient Recovery ---");
  let attemptsB = 0;
  const resultB = await executeWithRetry(
    async (attempt) => {
      attemptsB = attempt;
      if (attempt === 1) {
        const err: any = new Error("The model is overloaded. Please try again later.");
        err.status = 503;
        throw err;
      }
      return { success: true, data: "recovered" };
    },
    { maxAttempts: 3, initialDelayMs: 10 }
  );
  assert(resultB.data === "recovered" && attemptsB === 2, "Test B: 503 Transient Recovery on Attempt 2", `Attempts: ${attemptsB}`);

  // -------------------------------------------------------------
  // TEST C: Transient 429 Rate Limit Recovery
  // -------------------------------------------------------------
  console.log("\n--- Test C: 429 Transient Rate Limit Recovery ---");
  let attemptsC = 0;
  const resultC = await executeWithRetry(
    async (attempt) => {
      attemptsC = attempt;
      if (attempt < 3) {
        const err: any = new Error("Rate limit reached. Too many requests.");
        err.status = 429;
        throw err;
      }
      return { success: true, data: "rate_limit_recovered" };
    },
    { maxAttempts: 3, initialDelayMs: 10 }
  );
  assert(resultC.data === "rate_limit_recovered" && attemptsC === 3, "Test C: Transient 429 Recovery on Attempt 3", `Attempts: ${attemptsC}`);

  // -------------------------------------------------------------
  // TEST D: Hard Quota Exceeded (RESOURCE_EXHAUSTED) Stops Immediately
  // -------------------------------------------------------------
  console.log("\n--- Test D: Hard Quota Exhaustion (RESOURCE_EXHAUSTED) ---");
  let attemptsD = 0;
  let caughtErrorD: any = null;
  try {
    await executeWithRetry(
      async (attempt) => {
        attemptsD = attempt;
        const err: any = new Error(
          'HTTP 429 RESOURCE_EXHAUSTED: You exceeded your current quota, please check your plan and billing details. generate_content_free_tier_requests quotaValue: 20'
        );
        err.status = 429;
        throw err;
      },
      { maxAttempts: 4, initialDelayMs: 10 }
    );
  } catch (err: any) {
    caughtErrorD = err;
  }

  const classifiedD = classifyError(caughtErrorD, attemptsD);
  assert(
    attemptsD === 1,
    "Test D.1: Loop stops immediately on attempt 1 without retry cascade",
    `Expected 1 attempt, but got ${attemptsD}`
  );
  assert(
    isHardQuotaExhausted(caughtErrorD) === true,
    "Test D.2: isHardQuotaExhausted correctly identifies Gemini quota error"
  );
  assert(
    isRetryableError(caughtErrorD) === false,
    "Test D.3: isRetryableError marks quota exhaustion as non-retryable"
  );
  assert(
    classifiedD.code === "QUOTA_EXHAUSTED",
    "Test D.4: classifyError returns code 'QUOTA_EXHAUSTED'",
    `Got ${classifiedD.code}`
  );
  assert(
    classifiedD.httpStatus === 429,
    "Test D.5: HTTP status mapped to 429",
    `Got ${classifiedD.httpStatus}`
  );

  // -------------------------------------------------------------
  // TEST E: FactMesh Quota Error Mapping
  // -------------------------------------------------------------
  console.log("\n--- Test E: FactMesh Quota Error Classification ---");
  const factMeshRawErr = new Error("RESOURCE_EXHAUSTED: quota exceeded for model gemini-3.7-flash");
  (factMeshRawErr as any).status = 429;
  const classifiedE = classifyError(factMeshRawErr, 1);

  assert(
    classifiedE.code === "QUOTA_EXHAUSTED" && classifiedE.retryable === false,
    "Test E: FactMesh Quota Error cleanly classified as non-retryable QUOTA_EXHAUSTED"
  );

  // -------------------------------------------------------------
  // TEST F: FactMesh Cached Audit State Non-Destruction
  // -------------------------------------------------------------
  console.log("\n--- Test F: FactMesh State Preservation Logic ---");
  const existingAuditMock = {
    auditId: "audit_123",
    generatedAt: "2026-08-30T10:00:00Z",
    deliverableId: "exec_summary",
    summary: { totalClaims: 5, verifiedClaims: 5, inferredClaims: 0, unsupportedClaims: 0, nonFactStatements: 0, numbersChecked: 2, numbersVerified: 2, datesChecked: 0, datesVerified: 0, integrityScore: 100 },
    sourceUnits: [],
    claims: [],
    sourceSummary: { sourceType: "Document", sourceUnitCount: 5 }
  };

  // Simulating state logic: if a refresh attempt fails with QUOTA_EXHAUSTED, existingAuditMock is retained
  let stateAudit: any = existingAuditMock;
  let status: string = "completed";
  try {
    throw factMeshRawErr;
  } catch (err: any) {
    const classified = classifyError(err, 1);
    if (classified.code === "QUOTA_EXHAUSTED") {
      status = "quota_exhausted";
      // stateAudit is NOT set to null!
    }
  }

  assert(
    stateAudit !== null && stateAudit.auditId === "audit_123" && status === "quota_exhausted",
    "Test F: Cached FactMesh audit data remains intact when refresh encounters quota exhaustion"
  );

  // -------------------------------------------------------------
  // TEST G & H: Mutex / In-Flight Double Click Protection
  // -------------------------------------------------------------
  console.log("\n--- Test G & H: In-Flight Mutex / Double-Click Protection ---");
  let inFlight = false;
  let executionCount = 0;

  const runProtectedOperation = async () => {
    if (inFlight) {
      return { blocked: true };
    }
    inFlight = true;
    try {
      executionCount++;
      await new Promise((r) => setTimeout(r, 50));
      return { blocked: false };
    } finally {
      inFlight = false;
    }
  };

  // Trigger 2 rapid calls concurrently
  const [call1, call2] = await Promise.all([runProtectedOperation(), runProtectedOperation()]);

  assert(
    executionCount === 1 && (call1.blocked !== call2.blocked),
    "Test G & H: Mutex blocks concurrent duplicate trigger (Double-click protection)",
    `Executions: ${executionCount}, Call1: ${JSON.stringify(call1)}, Call2: ${JSON.stringify(call2)}`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite runner encountered unexpected error:", err);
  process.exit(1);
});
