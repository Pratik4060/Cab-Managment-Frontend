const now = new Date("2026-05-29T09:00:00+05:30");
const iso = (daysAgo: number, hour = 9) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const names = [
  "Aarav Mehta", "Priya Sharma", "Rahul Verma", "Neha Iyer", "Vikram Rao",
  "Ananya Singh", "Karan Patel", "Meera Nair", "Rohan Das", "Sneha Kapoor",
  "Aditya Joshi", "Kavya Menon", "Siddharth Jain", "Isha Malhotra", "Nitin Kulkarni",
  "Pooja Reddy", "Manav Bansal", "Ritika Shah", "Arjun Pillai", "Tanvi Gupta",
  "Dev Khanna", "Sara Thomas"
];

export const seedDrivers = Array.from({ length: 12 }, (_, index) => ({
  _id: `drv-${String(index + 1).padStart(3, "0")}`,
  driverName: ["Suresh Yadav", "Mahesh Pawar", "Imran Khan", "Rakesh Kumar", "Santosh Patil", "Ajay Nair", "Prakash Jadhav", "Ganesh More", "Naveen Shetty", "Deepak Solanki", "Harish Gowda", "Ramesh Chauhan"][index],
  contactNumber: `98${String(45000000 + index * 7311).padStart(8, "0")}`,
  alternateContact: `97${String(33000000 + index * 4219).padStart(8, "0")}`,
  licenseNumber: `MH${String(12 + index).padStart(2, "0")}2026${String(4500 + index)}`,
  address: `${index + 11}, Fleet Colony, Pune`,
  status: index < 3 ? "In Trip" : index === 11 ? "Unavailable" : "Available",
  createdAt: iso(40 - index)
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
  createdAt: iso(35 - index)
}));

export const seedBookings = names.map((name, index) => ({
  _id: `trp-req-${String(index + 1).padStart(3, "0")}`,
  bookingId: `TRP-2026-${String(index + 1).padStart(4, "0")}`,
  businessUnit: ["Zonixtec", "Acme Finance", "Northstar Labs", "Metro Health"][index % 4],
  passengerName: name,
  mobileNumber: `9${String(100000000 + index * 51937).padStart(9, "0")}`,
  travelStartDate: ["22-05-2026 07:00 AM", "23-05-2026 09:30 AM", "24-05-2026 06:45 AM", "25-05-2026 10:00 AM"][index % 4],
  travelEndDate: ["22-05-2026 18:00 PM", "23-05-2026 15:30 PM", "24-05-2026 20:00 PM", "25-05-2026 17:30 PM"][index % 4],
  departmentName: ["Systems/Project Engineering", "Finance Operations", "Customer Success", "Plant Maintenance"][index % 4],
  reportingAddress: ["Hinjewadi Phase 1", "Koregaon Park", "Baner", "Kharadi", "Viman Nagar"][index % 5],
  dropAddress: ["Pune Airport", "Magarpatta City", "Shivajinagar", "Aundh", "Hadapsar"][index % 5],
  carType: ["Sedan", "SUV", "MUV/MPV", "Hatchback"][index % 4],
  cabRequestNumber: `CRN-${String(7300 + index)}`,
  projectExpenses: index % 2 === 0 ? "Yes" : "No",
  costCenterOfProject: index % 2 === 0 ? String(3348019 + index) : "",
  bookedBy: name,
  purposeOfCabBooking: ["Client visit", "Project review", "Integration progress check", "Airport transfer"][index % 4],
  employeeCount: 1 + (index % 3),
  status: index < 15 ? "Assigned" : "New",
  senderEmail: `travel${index + 1}@client.local`,
  createdAt: iso(22 - index, 8 + (index % 8))
}));

export const seedTrips = Array.from({ length: 15 }, (_, index) => {
  const kmOut = 12000 + index * 146;
  const totalKm = 42 + index * 5;
  const booking = seedBookings[index]!;
  const driver = seedDrivers[index % seedDrivers.length]!;
  const vehicle = seedVehicles[index % seedVehicles.length]!;
  return {
    _id: `trp-${String(index + 1).padStart(3, "0")}`,
    tripNumber: `TRP-2026-${String(index + 1).padStart(4, "0")}`,
    bookingId: booking._id,
    driverId: driver._id,
    vehicleId: vehicle._id,
    booking,
    driver,
    vehicle,
    status: "Assigned",
    kmOut,
    kmIn: kmOut + totalKm,
    totalKm,
    timeOut: iso(15 - index, 9),
    timeIn: iso(15 - index, 13),
    tollCharges: 80 + index * 10,
    parkingCharges: 40 + index * 5,
    extraCharges: index % 4 === 0 ? 150 : 0,
    createdAt: iso(15 - index)
  };
});

export const seedInvoices = Array.from({ length: 20 }, (_, index) => {
  const trip = seedTrips[index % seedTrips.length]!;
  const subtotal = Math.round((trip.totalKm || 35 + index) * (18 + (index % 4) * 2) + (trip.tollCharges || 60) + (trip.parkingCharges || 30) + (trip.extraCharges || 0));
  const gstAmount = Math.round(subtotal * 0.05);
  const finalAmount = subtotal + gstAmount;
  const paidAmount = index < 8 ? finalAmount : index < 15 ? Math.round(finalAmount * 0.55) : 0;
  const balanceAmount = finalAmount - paidAmount;
  return {
    _id: `inv-${String(index + 1).padStart(3, "0")}`,
    invoiceNumber: `INV-2026-${String(index + 1).padStart(4, "0")}`,
    tripId: trip._id,
    bookingId: trip.bookingId,
    trip,
    booking: trip.booking,
    clientName: trip.booking.businessUnit,
    clientEmail: trip.booking.senderEmail,
    subtotal,
    gstPercent: 5,
    gstAmount,
    finalAmount,
    paidAmount,
    balanceAmount,
    remainingAmount: balanceAmount,
    status: balanceAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : index % 5 === 0 ? "Overdue" : "Sent",
    sentAt: index > 2 ? iso(18 - index, 10) : undefined,
    createdAt: iso(20 - index)
  };
});

export const seedPayments = seedInvoices.slice(0, 15).map((invoice, index) => ({
  _id: `pay-${String(index + 1).padStart(3, "0")}`,
  invoiceId: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  amount: invoice.paidAmount,
  method: ["UPI", "NEFT", "Cash", "Bank Transfer"][index % 4],
  referenceNumber: `TXN${String(902100 + index * 47)}`,
  notes: "Demo payment",
  paidAt: iso(14 - index, 16),
  createdAt: iso(14 - index, 16)
})).filter((payment) => payment.amount > 0);

export const seedAdmins = [
  { _id: "adm-001", name: "Super Admin", email: "superadmin@caberp.local", password: "Admin@12345", role: "Super Admin", phone: "9876543210", isActive: true, createdAt: iso(60) },
  { _id: "adm-002", name: "Billing Admin", email: "billing@caberp.local", password: "Admin@12345", role: "Billing Admin", phone: "9876501234", isActive: true, createdAt: iso(45) },
  { _id: "adm-003", name: "Operations Admin", email: "ops@caberp.local", password: "Admin@12345", role: "Operations Admin", phone: "9876512340", isActive: true, createdAt: iso(30) }
];
