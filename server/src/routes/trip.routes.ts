import { Router } from "express";
import {
  confirmAttachmentHandler,
  listAttachmentsHandler,
  requestUploadUrlHandler,
} from "../controllers/attachment.controller.js";
import {
  createChecklistHandler,
  deleteChecklistHandler,
  listChecklistHandler,
  reorderChecklistHandler,
  updateChecklistHandler,
} from "../controllers/checklist.controller.js";
import {
  createExpenseHandler,
  deleteExpenseHandler,
  listExpensesHandler,
  updateExpenseHandler,
} from "../controllers/expense.controller.js";
import {
  createItineraryHandler,
  deleteItineraryHandler,
  listItineraryHandler,
  updateItineraryHandler,
} from "../controllers/itinerary.controller.js";
import {
  createImportantDateHandler,
  deleteImportantDateHandler,
  getImportantDateHandler,
  listImportantDatesHandler,
  updateImportantDateHandler,
} from "../controllers/importantDate.controller.js";
import {
  createTravelItemHandler,
  deleteTravelItemHandler,
  getTravelItemHandler,
  listTravelItemsHandler,
  updateTravelItemHandler,
} from "../controllers/travelItem.controller.js";
import {
  createTripHandler,
  deleteTripHandler,
  getTripHandler,
  listTripsHandler,
  updateTripHandler,
} from "../controllers/trip.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", createTripHandler);
router.get("/", listTripsHandler);
router.get("/:id", getTripHandler);
router.patch("/:id", updateTripHandler);
router.delete("/:id", deleteTripHandler);

router.post("/:tripId/items", createTravelItemHandler);
router.get("/:tripId/items", listTravelItemsHandler);
router.get("/:tripId/items/:itemId", getTravelItemHandler);
router.patch("/:tripId/items/:itemId", updateTravelItemHandler);
router.delete("/:tripId/items/:itemId", deleteTravelItemHandler);

router.post(
  "/:tripId/items/:itemId/attachments/upload-url",
  requestUploadUrlHandler,
);
router.post("/:tripId/items/:itemId/attachments", confirmAttachmentHandler);
router.get("/:tripId/items/:itemId/attachments", listAttachmentsHandler);

router.post("/:tripId/dates", createImportantDateHandler);
router.get("/:tripId/dates", listImportantDatesHandler);
router.get("/:tripId/dates/:dateId", getImportantDateHandler);
router.patch("/:tripId/dates/:dateId", updateImportantDateHandler);
router.delete("/:tripId/dates/:dateId", deleteImportantDateHandler);

router.get("/:tripId/itinerary", listItineraryHandler);
router.post("/:tripId/itinerary", createItineraryHandler);
router.patch("/:tripId/itinerary/:itemId", updateItineraryHandler);
router.delete("/:tripId/itinerary/:itemId", deleteItineraryHandler);

router.get("/:tripId/checklist", listChecklistHandler);
router.post("/:tripId/checklist", createChecklistHandler);
router.patch("/:tripId/checklist/reorder", reorderChecklistHandler);
router.patch("/:tripId/checklist/:itemId", updateChecklistHandler);
router.delete("/:tripId/checklist/:itemId", deleteChecklistHandler);

router.get("/:tripId/expenses", listExpensesHandler);
router.post("/:tripId/expenses", createExpenseHandler);
router.patch("/:tripId/expenses/:expenseId", updateExpenseHandler);
router.delete("/:tripId/expenses/:expenseId", deleteExpenseHandler);

export default router;
