import express from "express";
import { getAllCategories } from "../controllers/categories.controllers.js";

const router = express.Router();

router.get("/", getAllCategories);

export default router;
