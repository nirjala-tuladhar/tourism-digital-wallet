import { Router } from "express";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listNotificationsHandler);
router.post("/read-all", markAllNotificationsReadHandler);
router.patch("/:id/read", markNotificationReadHandler);

export default router;
