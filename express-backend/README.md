# Cab Management Express Backend

REST API for drivers and cabs with a clean controller-route-service structure.

## Structure

```txt
src/
  app.js
  server.js
  config/
  controllers/
  data/
  middlewares/
  routes/
  services/
  utils/
```

## Install

```bash
cd express-backend
npm install
```

## Run

```bash
npm run dev
```

## Endpoints

- `GET /api/health`
- `GET /api/drivers`
- `POST /api/drivers`
- `GET /api/drivers/:id`
- `PUT /api/drivers/:id`
- `PATCH /api/drivers/:id/status`
- `DELETE /api/drivers/:id`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PUT /api/vehicles/:id`
- `PATCH /api/vehicles/:id/status`
- `DELETE /api/vehicles/:id`

## Notes

This version uses local JSON storage in `src/data/store.json`. The file will be created automatically on first run.
