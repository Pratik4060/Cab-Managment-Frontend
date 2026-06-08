import { fail } from "../utils/apiResponse.js";

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;
  return fail(res, error.message || "Internal server error", statusCode);
}
