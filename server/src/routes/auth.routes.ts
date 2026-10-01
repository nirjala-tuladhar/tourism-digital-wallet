import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  me,
  register,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);
router.patch("/password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

export default router;
