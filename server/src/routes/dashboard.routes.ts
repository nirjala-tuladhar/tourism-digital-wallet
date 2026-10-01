import { Router } from "express";
import { getDashboardHandler } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getDashboardHandler);

export default router;
