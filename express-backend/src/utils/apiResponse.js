export function success(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

export function fail(res, message, statusCode = 500, extra = {}) {
  return res.status(statusCode).json({ message, ...extra });
}
