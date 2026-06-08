import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import driverRoutes from "./driverRoutes.js";
import vehicleRoutes from "./vehicleRoutes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);

export default router;
