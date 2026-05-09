import express from "express";
import {
  createRegistration,
  deleteRegistration,
} from "../controllers/registrations.controllers.js";
import { getMyEvents } from "../controllers/events.controllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/my-events", authenticate, getMyEvents);
router.post("/", authenticate, createRegistration);
router.delete("/:id", authenticate, deleteRegistration);

export default router;
