import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { swaggerSpec } from "./config/swagger.js";

export function createApp(): Express {
  const app = express();

  // Security and common middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI assets to load properly
    })
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Interactive Swagger UI Documentation
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API routes
  app.use("/api", routes);

  // Fallback 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: "NotFound",
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
