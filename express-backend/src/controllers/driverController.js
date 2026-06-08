import { driverService } from "../services/driverService.js";
import { success, fail } from "../utils/apiResponse.js";

export async function getDrivers(req, res, next) {
  try {
    const result = await driverService.list(req.query);
    return success(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getDriverById(req, res, next) {
  try {
    const driver = await driverService.getById(req.params.id);
    if (!driver) return fail(res, "Driver not found", 404);
    return success(res, driver);
  } catch (error) {
    next(error);
  }
}

export async function createDriver(req, res, next) {
  try {
    const driver = await driverService.create(req.body);
    return success(res, driver, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateDriver(req, res, next) {
  try {
    const driver = await driverService.update(req.params.id, req.body);
    if (!driver) return fail(res, "Driver not found", 404);
    return success(res, driver);
  } catch (error) {
    next(error);
  }
}

export async function changeDriverStatus(req, res, next) {
  try {
    const driver = await driverService.changeStatus(req.params.id, req.body.status);
    if (!driver) return fail(res, "Driver not found", 404);
    return success(res, driver);
  } catch (error) {
    next(error);
  }
}

export async function deleteDriver(req, res, next) {
  try {
    const driver = await driverService.remove(req.params.id);
    if (!driver) return fail(res, "Driver not found", 404);
    return success(res, { message: "Driver deleted", data: driver });
  } catch (error) {
    next(error);
  }
}
