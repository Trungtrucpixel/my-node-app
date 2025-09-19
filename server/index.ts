import express, { type Request, Response, NextFunction } from "express";
import session from "express-session"; // Import session
import pgSession from "connect-pg-simple"; // Import PostgreSQL session store
import pg from "pg"; // Import toàn bộ module pg (CommonJS)

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cấu hình PostgreSQL session store với Neon
const { Pool } = pg; // Lấy Pool từ module pg
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Cho phép SSL (cần cho Neon)
});
const PgStore = pgSession(session);
app.use(session({
  store: new PgStore({
    pool: pgPool,
    ttl: 24 * 60 * 60 // Thời gian sống của session: 24 giờ
  }),
  secret: process.env.SESSION_SECRET || "mySecretKey123!@#", // Sử dụng SESSION_SECRET
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" } // Secure cookie trong production
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
