import { success } from "../utils/apiResponse.js";

export function getHealth(req, res) {
  return success(res, {
    ok: true,
    service: "cab-management-express-backend"
  });
}
