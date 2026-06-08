import { Router } from "express";
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  changeDriverStatus,
  deleteDriver
} from "../controllers/driverController.js";

const router = Router();

router.get("/", getDrivers);
router.post("/", createDriver);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.patch("/:id/status", changeDriverStatus);
router.delete("/:id", deleteDriver);

export default router;
