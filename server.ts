import http from "http";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { executeTransformation } from "./server/generationService";

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
        if (result.error.includes("GEMINI_API_KEY") || result.error.includes("API key")) {
          return res.status(500).json({ detail: result.error });
        }
        if (result.error.toLowerCase().includes("quota") || result.error.toLowerCase().includes("rate limit")) {
          return res.status(429).json({ detail: "Gemini API rate limit exceeded. Please try again in a moment." });
        }
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error("[Server] Transformation endpoint error:", err.message || err);
      const msg = err.message || "An unexpected error occurred during AI transformation.";
      return res.status(500).json({ detail: msg });
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
