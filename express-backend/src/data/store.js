import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedDrivers, seedVehicles } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, "store.json");

const fallback = {
  drivers: seedDrivers,
  vehicles: seedVehicles
};

export async function readStore() {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      drivers: Array.isArray(parsed.drivers) ? parsed.drivers : seedDrivers,
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : seedVehicles
    };
  } catch {
    await writeStore(fallback);
    return structuredClone(fallback);
  }
}

export async function writeStore(store) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}
