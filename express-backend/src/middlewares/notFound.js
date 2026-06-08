import { fail } from "../utils/apiResponse.js";

export function notFound(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
