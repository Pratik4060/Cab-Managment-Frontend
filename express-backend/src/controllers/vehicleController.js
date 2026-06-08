import { vehicleService } from "../services/vehicleService.js";
import { success, fail } from "../utils/apiResponse.js";

export async function getVehicles(req, res, next) {
  try {
    const result = await vehicleService.list(req.query);
    return success(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getVehicleById(req, res, next) {
  try {
    const vehicle = await vehicleService.getById(req.params.id);
    if (!vehicle) return fail(res, "Vehicle not found", 404);
    return success(res, vehicle);
  } catch (error) {
    next(error);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.create(req.body);
    return success(res, vehicle, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.update(req.params.id, req.body);
    if (!vehicle) return fail(res, "Vehicle not found", 404);
    return success(res, vehicle);
  } catch (error) {
    next(error);
  }
}

export async function changeVehicleStatus(req, res, next) {
  try {
    const vehicle = await vehicleService.changeStatus(req.params.id, req.body.status);
    if (!vehicle) return fail(res, "Vehicle not found", 404);
    return success(res, vehicle);
  } catch (error) {
    next(error);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await vehicleService.remove(req.params.id);
    if (!vehicle) return fail(res, "Vehicle not found", 404);
    return success(res, { message: "Vehicle deleted", data: vehicle });
  } catch (error) {
    next(error);
  }
}
