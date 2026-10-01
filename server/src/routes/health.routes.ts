import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Tourism Digital Wallet API is running"
  });
});

export default router;