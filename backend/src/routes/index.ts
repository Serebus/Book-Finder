import { Router } from "express";
import authRoutes from "./auth.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);

export default apiRouter;
