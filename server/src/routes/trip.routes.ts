import { Router } from "express";
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

router.post("/:tripId/dates", createImportantDateHandler);
router.get("/:tripId/dates", listImportantDatesHandler);
router.get("/:tripId/dates/:dateId", getImportantDateHandler);
router.patch("/:tripId/dates/:dateId", updateImportantDateHandler);
router.delete("/:tripId/dates/:dateId", deleteImportantDateHandler);

export default router;
