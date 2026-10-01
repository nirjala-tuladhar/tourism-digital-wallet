import { Router } from "express";
import {
  deleteAttachmentHandler,
  getAttachmentUrlHandler,
} from "../controllers/attachment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/:attachmentId/url", getAttachmentUrlHandler);
router.delete("/:attachmentId", deleteAttachmentHandler);

export default router;
