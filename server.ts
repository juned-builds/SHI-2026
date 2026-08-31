import http from "http";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { executeTransformation } from "./server/generationService";
import { executeFactMeshAudit } from "./server/factMeshService";
import { executeRefineSelection } from "./server/refinementService";
import { testGeminiAvailability, STABLE_GEMINI_MODELS } from "./server/geminiService";
import { classifyError } from "./server/errorHandling";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  // Middleware for body parsing
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // --- API Routes (MUST be registered before Vite middleware) ---

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "content-transformation-platform",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Minimal Gemini availability & diagnostics endpoint
  app.get("/api/health/gemini", async (req: Request, res: Response) => {
    try {
      const modelToTest = (req.query.model as string) || undefined;
      const forceRefresh = req.query.refresh === "true";
      const result = await testGeminiAvailability(modelToTest, forceRefresh);
      res.json({
        success: result.available,
        status: result.status,
        availableModels: STABLE_GEMINI_MODELS,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        status: "TEMPORARILY_UNAVAILABLE",
        error: err?.message || String(err),
      });
    }
  });

  // Primary GenAI Content Transformation endpoint
  app.post("/api/v1/generation/generate", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ detail: "Invalid request payload." });
      }

      if (!payload.sourceText || !payload.sourceText.trim()) {
        return res.status(400).json({ detail: "sourceText cannot be empty." });
      }

      if (!payload.deliverables || !Array.isArray(payload.deliverables) || payload.deliverables.length === 0) {
        return res.status(400).json({ detail: "At least one target deliverable must be selected." });
      }

      const result = await executeTransformation(payload);

      if (!result.success && result.error) {
        if (result.error.includes("QUOTA_EXHAUSTED") || result.error.toLowerCase().includes("quota")) {
          return res.status(429).json({
            success: false,
            sessionId: result.sessionId,
            status: "failed",
            error: {
              code: "QUOTA_EXHAUSTED",
              message: "Gemini usage quota has been reached for the current API plan. Your project and generated content are safe and unchanged.",
              retryable: false,
              provider: "gemini",
            },
            detail: "Gemini usage quota has been reached for the current API plan. Your project and generated content are safe and unchanged.",
          });
        }
        if (result.error.includes("GEMINI_API_KEY") || result.error.includes("API key")) {
          return res.status(500).json({ detail: result.error });
        }
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("[Server] Transformation endpoint error:", err.message || err);
      const msg = err.message || "An unexpected error occurred during AI transformation.";
      return res.status(500).json({ detail: msg });
    }
  });

  // FactMesh™ Grounding & Provenance Audit endpoint
  app.post("/api/v1/generation/audit-grounding", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload.",
            retryable: false,
            attempts: 0,
          },
          detail: "Invalid request payload.",
        });
      }

      if (!payload.sourceText || !payload.sourceText.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Source text cannot be empty for grounding audit.",
            retryable: false,
            attempts: 0,
          },
          detail: "Source text cannot be empty for grounding audit.",
        });
      }

      if (!payload.generatedContent || !payload.generatedContent.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Generated deliverable content cannot be empty for grounding audit.",
            retryable: false,
            attempts: 0,
          },
          detail: "Generated deliverable content cannot be empty for grounding audit.",
        });
      }

      const auditResult = await executeFactMeshAudit(payload);
      return res.status(200).json({
        success: true,
        data: auditResult,
        ...auditResult, // Backward-compatibility
      });
    } catch (err: any) {
      const classified = classifyError(err, 3);
      if (classified.code === "QUOTA_EXHAUSTED") {
        console.log(`[Server] FactMesh audit unavailable: provider quota exhausted`);
      } else {
        console.warn(
          `[Server] FactMesh audit failed with [${classified.code}] (HTTP ${classified.httpStatus}): ${classified.message}`
        );
      }
      return res.status(classified.httpStatus).json({
        success: false,
        error: {
          code: classified.code,
          message: classified.message,
          retryable: classified.retryable,
          provider: classified.provider || "gemini",
          attempts: classified.attempts || 1,
        },
        detail: classified.message,
      });
    }
  });

  // Surgical Directive Refiner endpoint (Module 1.1)
  app.post("/api/v1/generation/refine-selection", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload.",
            retryable: false,
          },
          detail: "Invalid request payload.",
        });
      }

      if (!payload.selectedText || !payload.selectedText.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "selectedText cannot be empty.",
            retryable: false,
          },
          detail: "selectedText cannot be empty.",
        });
      }

      if (!payload.instruction || !payload.instruction.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "instruction cannot be empty.",
            retryable: false,
          },
          detail: "instruction cannot be empty.",
        });
      }

      const result = await executeRefineSelection(payload);

      if (!result.success && result.error) {
        const errorObj = typeof result.error === "string"
          ? { code: "UNKNOWN_ERROR", message: result.error, retryable: false }
          : result.error;

        const httpStatus = errorObj.code === "QUOTA_EXHAUSTED" ? 429
          : errorObj.code === "VALIDATION_ERROR" ? 400
          : errorObj.code === "INVALID_API_KEY" ? 401
          : errorObj.code === "TIMEOUT_ERROR" ? 504
          : errorObj.retryable ? 503 : 500;

        return res.status(httpStatus).json(result);
      }

      return res.status(200).json(result);
    } catch (err: any) {
      const classified = classifyError(err, 1);
      return res.status(classified.httpStatus).json({
        success: false,
        error: {
          code: classified.code,
          message: classified.message,
          retryable: classified.retryable,
          provider: classified.provider || "gemini",
        },
        detail: classified.message,
      });
    }
  });

  // --- Vite & Frontend Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled =
      process.env.DISABLE_HMR === "true" ||
      Boolean(process.env.K_SERVICE) ||
      Boolean(process.env.APPLET_ID);

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled
          ? false
          : {
              server: httpServer,
            },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack Content Transformation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
