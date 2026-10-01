import { Router } from "express";
import {
  deleteNotificationHandler,
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
  unreadCountHandler,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", listNotificationsHandler);
router.get("/unread-count", unreadCountHandler);
router.patch("/read-all", markAllNotificationsReadHandler);
router.post("/read-all", markAllNotificationsReadHandler);
router.patch("/:id/read", markNotificationReadHandler);
router.delete("/:id", deleteNotificationHandler);

export default router;
