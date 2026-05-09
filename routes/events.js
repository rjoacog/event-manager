import express from "express";
import {
  getAllEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addCategoriesToEvent,
  syncEventCategories,
  getEventCategories,
} from "../controllers/events.controllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getAllEvents);
router.get("/my-events", authenticate, getMyEvents);
router.post("/", authenticate, createEvent);
router.post("/:id/categories", authenticate, addCategoriesToEvent);
router.put("/:id/categories", authenticate, syncEventCategories);
router.get("/:id/categories", getEventCategories);
router.get("/:id", getEventById);
router.put("/:id", authenticate, updateEvent);
router.delete("/:id", authenticate, deleteEvent);

export default router;
