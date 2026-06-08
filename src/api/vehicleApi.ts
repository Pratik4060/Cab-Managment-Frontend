import { apiRequest, unwrapData } from "./client";

export type VehiclePayload = {
  registrationNumber: string;
  vehicleType: string;
  vehicleModel: string;
  cabType: string;
  seatingCapacity: number;
  ratePerKm: number;
  status?: string;
};

export const vehicleApi = {
  async getVehicles() {
    return normalizeVehicleList(unwrapData<any>(await apiRequest({ url: "/vehicles", method: "GET" })));
  },
  async getVehicleById(id: string) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: `/vehicles/${id}`, method: "GET" })));
  },
  async createVehicle(payload: VehiclePayload) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: "/vehicles", method: "POST", data: payload })));
  },
  async updateVehicle(id: string, payload: Partial<VehiclePayload>) {
    return normalizeVehicle(unwrapData<any>(await apiRequest({ url: `/vehicles/${id}`, method: "PUT", data: payload })));
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
  if (!vehicle) return vehicle;
  return {
    ...vehicle,
    _id: String(vehicle._id || vehicle.id),
    registrationNumber: vehicle.registrationNumber || vehicle.registration_number || "",
    vehicleType: vehicle.vehicleType || vehicle.vehicle_type || "",
    vehicleModel: vehicle.vehicleModel || vehicle.vehicle_model || "",
    cabType: vehicle.cabType || vehicle.cab_type || "",
    seatingCapacity: Number(vehicle.seatingCapacity ?? vehicle.seating_capacity ?? 0),
    ratePerKm: Number(vehicle.ratePerKm ?? vehicle.rate_per_km ?? 0),
    status: vehicle.status || "Available",
    createdAt: vehicle.createdAt || vehicle.created_at,
    updatedAt: vehicle.updatedAt || vehicle.updated_at
  };
}
