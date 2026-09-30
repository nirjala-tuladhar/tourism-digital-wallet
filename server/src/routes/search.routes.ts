import { Router } from "express";
import { searchHandler } from "../controllers/search.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, searchHandler);

export default router;
