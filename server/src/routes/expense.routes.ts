import { Router } from "express";
import { listExpenseBoardHandler } from "../controllers/expense.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, listExpenseBoardHandler);

export default router;
