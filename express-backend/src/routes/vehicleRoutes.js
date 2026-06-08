import { Router } from "express";
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  changeVehicleStatus,
  deleteVehicle
} from "../controllers/vehicleController.js";

const router = Router();

router.get("/", getVehicles);
router.post("/", createVehicle);
router.get("/:id", getVehicleById);
router.put("/:id", updateVehicle);
router.patch("/:id/status", changeVehicleStatus);
router.delete("/:id", deleteVehicle);

export default router;
