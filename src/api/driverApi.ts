import { apiRequest, unwrapData } from "./client";

export type DriverPayload = {
  driverName: string;
  contactNumber: string;
  alternateContact?: string;
  aadhaarNumber: string;
  panNumber: string;
  licenseNumber: string;
  aadhaarCardPhoto?: string;
  panCardPhoto?: string;
  licensePhoto?: string;
  address: string;
  status?: string;
};

type DriverFilter = {
  status?: string;
  search?: string;
};

const FILE_FIELDS = ["aadhaarCardPhoto", "panCardPhoto", "licensePhoto"] as const;

export const driverApi = {
  async getDrivers(filter: DriverFilter = {}) {
    if (filter.search) {
      return normalizeDriverList(
        unwrapData<any>(await apiRequest({ url: "/drivers/search", method: "GET", params: { search: filter.search } }))
      );
    }

    return normalizeDriverList(unwrapData<any>(await apiRequest({ url: "/drivers", method: "GET" })));
  },

  async getDriverById(id: string) {
    return normalizeDriver(unwrapData<any>(await apiRequest({ url: `/drivers/${id}`, method: "GET" })));
  },

  async createDriver(payload: DriverPayload) {
    const formData = toDriverFormData(payload);
    return normalizeDriver(unwrapData<any>(await apiRequest({ url: "/drivers", method: "POST", data: formData })));
  },

  async updateDriver(id: string, payload: Partial<DriverPayload>) {
    return normalizeDriver(unwrapData<any>(await apiRequest({ url: `/drivers/${id}`, method: "PUT", data: payload })));
  },

  async changeDriverStatus(id: string, status: string) {
    return normalizeDriver(unwrapData<any>(await apiRequest({ url: `/drivers/${id}/status`, method: "PATCH", data: { status } })));
  },

  async deleteDriver(id: string) {
    await apiRequest({ url: `/drivers/${id}`, method: "DELETE" });
    return id;
  }
};

function normalizeDriverList(value: any) {
  const rows = Array.isArray(value) ? value : value?.items || value?.drivers || value?.rows || [];
  return rows.map(normalizeDriver);
}

function normalizeDriver(driver: any) {
  if (!driver) return driver;
  return {
    ...driver,
    _id: String(driver._id || driver.id),
    driverName: driver.driverName || driver.driver_name || "",
    contactNumber: driver.contactNumber || driver.contact_number || "",
    alternateContact: driver.alternateContact || driver.alternate_contact || "",
    aadhaarNumber: driver.aadhaarNumber || driver.aadhaar_number || "",
    panNumber: driver.panNumber || driver.pan_number || "",
    licenseNumber: driver.licenseNumber || driver.license_number || "",
    aadhaarCardPhoto: driver.aadhaarCardPhoto || driver.aadhaar_card_photo || "",
    panCardPhoto: driver.panCardPhoto || driver.pan_card_photo || "",
    licensePhoto: driver.licensePhoto || driver.license_photo || "",
    address: driver.address || "",
    status: driver.status || "Available",
    createdAt: driver.createdAt || driver.created_at,
    updatedAt: driver.updatedAt || driver.updated_at
  };
}

function toDriverFormData(payload: DriverPayload) {
  const formData = new FormData();
  const body = stripFileFields(payload);

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    formData.append(key, String(value));
  }

  for (const field of FILE_FIELDS) {
    const value = payload[field];
    const file = toFile(value, field);
    if (file) {
      formData.append(field, file);
    }
  }

  return formData;
}

function stripFileFields(payload: Partial<DriverPayload>) {
  const { aadhaarCardPhoto, panCardPhoto, licensePhoto, ...rest } = payload;
  return rest;
}

function toFile(value: string | undefined, fieldName: string) {
  if (!value || !value.startsWith("data:")) return null;
  const parsed = parseDataUrl(value);
  if (!parsed) return null;
  return new File([parsed.blob], `${fieldName}.${parsed.extension}`, { type: parsed.mimeType });
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const mimeType = match[1] as string;
  const base64 = match[2] as string;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return {
    mimeType,
    extension: mimeType.split("/")[1] || "bin",
    blob: new Blob([bytes], { type: mimeType })
  };
}
