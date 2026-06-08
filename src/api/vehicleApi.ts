import { apiRequest, unwrapData } from "./client";

export type VehiclePayload = {
  registration_number: string;
  vehicle_type: string;
  vehicle_model: string;
  cab_type: string;
  seating_capacity: number;
  rate_per_km: number;
  status?: string;
  insurance_policy_number?: string;
  insurance_expiry?: string;
  registration_date?: string;
};

export const vehicleApi = {
  async getVehicles() {
    return normalizeVehicleList(unwrapData<any>(await apiRequest({ url: "/vehicles", method: "GET" })));
  },
  async getVehicleById(id: string) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: `/vehicles/${id}`, method: "GET" })));
  },
  async createVehicle(payload: VehiclePayload) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: "/vehicles", method: "POST", data: toBackendVehiclePayload(payload) })));
  },
  async updateVehicle(id: string, payload: Partial<VehiclePayload>) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: `/vehicles/${id}`, method: "PUT", data: toBackendVehiclePayload(payload) })));
  },
  async deleteVehicle(id: string) {
    await apiRequest({ url: `/vehicles/${id}`, method: "DELETE" });
    return id;
  }
};

function normalizeVehicleList(value: any) {
  const rows = Array.isArray(value) ? value : value?.items || value?.vehicles || value?.rows || [];
  return rows.map(normalizeVehicle);
}

function normalizeVehicle(vehicle: any) {
  if (vehicle?.vehicle) return normalizeVehicle(vehicle.vehicle);
  if (vehicle?.data && !vehicle.id && !vehicle._id && !vehicle.registration_number && !vehicle.registrationNumber) return normalizeVehicle(vehicle.data);
  if (!vehicle) return vehicle;
  return {
    ...vehicle,
    _id: String(vehicle._id || vehicle.id),
    registration_number: vehicle.registration_number || vehicle.registrationNumber || "",
    vehicle_type: vehicle.vehicle_type || vehicle.vehicleType || "",
    vehicle_model: vehicle.vehicle_model || vehicle.vehicleModel || "",
    cab_type: vehicle.cab_type || vehicle.cabType || "",
    seating_capacity: Number(vehicle.seating_capacity ?? vehicle.seatingCapacity ?? 0),
    rate_per_km: Number(vehicle.rate_per_km ?? vehicle.ratePerKm ?? 0),
    status: vehicle.status || "Available",
    insurance_policy_number: vehicle.insurance_policy_number || vehicle.insurancePolicyNumber || null,
    insurance_expiry: vehicle.insurance_expiry || vehicle.insuranceExpiry || null,
    registration_date: vehicle.registration_date || vehicle.registrationDate || null,
    created_at: vehicle.created_at || vehicle.createdAt,
    updated_at: vehicle.updated_at || vehicle.updatedAt
  };
}

function toBackendVehiclePayload(payload: any) {
  const backendPayload: Record<string, unknown> = {};
  assignIfPresent(backendPayload, "registration_number", payload.registration_number ?? payload.registrationNumber);
  assignIfPresent(backendPayload, "vehicle_type", payload.vehicle_type ?? payload.vehicleType);
  assignIfPresent(backendPayload, "vehicle_model", payload.vehicle_model ?? payload.vehicleModel);
  assignIfPresent(backendPayload, "cab_type", payload.cab_type ?? payload.cabType);
  assignIfPresent(backendPayload, "seating_capacity", payload.seating_capacity ?? payload.seatingCapacity, true);
  assignIfPresent(backendPayload, "rate_per_km", payload.rate_per_km ?? payload.ratePerKm, true);
  assignIfPresent(backendPayload, "status", payload.status);
  assignIfPresent(backendPayload, "insurance_policy_number", payload.insurance_policy_number ?? payload.insurancePolicyNumber);
  assignIfPresent(backendPayload, "insurance_expiry", payload.insurance_expiry ?? payload.insuranceExpiry);
  assignIfPresent(backendPayload, "registration_date", payload.registration_date ?? payload.registrationDate);
  return backendPayload;
}

function assignIfPresent(target: Record<string, unknown>, key: string, value: unknown, numeric = false) {
  if (value === undefined || value === null || value === "") return;
  target[key] = numeric ? Number(value) : value;
}
