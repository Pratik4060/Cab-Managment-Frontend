const now = new Date("2026-06-01T09:00:00+05:30");

const iso = (daysAgo, hour = 9) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const recentDays = [0, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22, 27, 34, 45, 60, 90, 130, 180, 250];

const driverNames = [
  "Suresh Yadav", "Mahesh Pawar", "Imran Khan", "Rakesh Kumar", "Santosh Patil",
  "Ajay Nair", "Prakash Jadhav", "Ganesh More", "Naveen Shetty", "Deepak Solanki",
  "Harish Gowda", "Ramesh Chauhan", "Vilas Shinde", "Sameer Qureshi", "Mohan Kadam"
];

export const seedDrivers = Array.from({ length: 15 }, (_, index) => ({
  _id: `drv-${String(index + 1).padStart(3, "0")}`,
  driverName: driverNames[index],
  contactNumber: `98${String(45000000 + index * 7311).padStart(8, "0")}`,
  alternateContact: `97${String(33000000 + index * 4219).padStart(8, "0")}`,
  aadhaarNumber: `42${String(1000000000 + index * 17391).padStart(10, "0")}`,
  panNumber: `ABCDE${String(1000 + index)}F`,
  licenseNumber: `MH${String(12 + index).padStart(2, "0")}2026${String(4500 + index)}`,
  aadhaarCardPhoto: "",
  panCardPhoto: "",
  licensePhoto: "",
  address: `${index + 11}, Fleet Colony, Pune`,
  status: index < 6 ? "In Trip" : index === 14 ? "Unavailable" : "Available",
  createdAt: iso(recentDays[index] ?? index)
}));

const vehicleCompanies = ["Toyota", "Maruti Suzuki", "Honda", "Toyota", "Hyundai", "Maruti Suzuki", "Tata", "Mahindra", "Kia", "Honda", "Hyundai", "Toyota"];
const vehicleModels = ["Etios", "Dzire", "City", "Innova", "Aura", "Ertiga", "Nexon", "XUV700", "Carens", "Amaze", "Creta", "Rumion"];
const cabTypes = ["Sedan", "Sedan", "Sedan", "MUV/MPV", "Sedan", "MUV/MPV", "SUV", "SUV", "MUV/MPV", "Sedan", "SUV", "MUV/MPV"];

export const seedVehicles = Array.from({ length: 12 }, (_, index) => ({
  _id: `veh-${String(index + 1).padStart(3, "0")}`,
  registrationNumber: `MH 12 ${["AB", "CD", "EF", "GH", "JK", "LM", "NP", "QR", "ST", "UV", "WX", "YZ"][index]} ${String(2100 + index * 137)}`,
  vehicleType: vehicleCompanies[index],
  vehicleModel: vehicleModels[index],
  cabType: cabTypes[index],
  seatingCapacity: cabTypes[index] === "Hatchback" ? 4 : cabTypes[index] === "Sedan" ? 4 : 6,
  ratePerKm: cabTypes[index] === "Hatchback" ? 16 : cabTypes[index] === "Sedan" ? 20 : cabTypes[index] === "SUV" ? 28 : 26,
  status: index < 3 ? "In Trip" : index === 10 ? "Maintenance" : "Available",
  createdAt: iso(recentDays[index] ?? index)
}));
