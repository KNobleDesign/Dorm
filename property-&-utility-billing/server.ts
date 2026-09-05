import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  
  // Bind to port 3000 inside AI Studio development sandbox (behind Nginx reverse proxy),
  // or PORT provided by Cloud Run in production (default 8080)
  const isDevContainer = Boolean(process.env.NGINX_PORT || process.env.CONTROL_PLANE_PORT);
  const targetPort = Number(process.env.PORT) || 3000;
  const PORT = isDevContainer ? 3000 : targetPort;

  // Cloud Run / container health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (mode: ${process.env.NODE_ENV || "development"})`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && PORT !== 3000) {
      console.warn(`Port ${PORT} in use, falling back to 3000...`);
      app.listen(3000, "0.0.0.0", () => {
        console.log(`Server listening on fallback port http://0.0.0.0:3000`);
      });
    } else {
      console.error("Server startup error:", err);
    }
  });
}

startServer();
