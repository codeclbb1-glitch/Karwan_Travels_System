export type Role = "admin" | "staff";

export type ServiceType = "Hajj" | "Umrah";

export type TransportType = "Car" | "Bus";

export type PackageMode = "Company-Organized" | "Form Resale to Agent";

export interface HajjFormBatch {
  id: string;
  batchName: string;
  quantity: number;
  pricePerForm: number;
  datePurchased: string;
  used: number;
}

export interface HajjPackage {
  id: string;
  name: string;
  mode: PackageMode;
  hotelCost: number;
  ticketCost: number;
  visaCost: number;
  transportCost: number;
  transportType: TransportType;
  foodCost: number;
  otherCost: number;
  sellingPrice: number;
  agentPrice: number;
  formsRemaining: number;
  durationDays: number;
  description: string;
  inclusions: string[];
}

export interface UmrahPackage {
  id: string;
  name: string;
  airlineCost: number;
  visaCost: number;
  hotelMadinaCost: number;
  hotelMakkahCost: number;
  transportCost: number;
  transportType: TransportType;
  foodCost: number;
  otherCost: number;
  sellingPrice: number;
  agentPrice: number;
  durationDays: number;
  description: string;
  inclusions: string[];
}

export interface Booking {
  id: string;
  customerName: string;
  cnicPassport: string;
  phone: string;
  address: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  serviceType: ServiceType;
  packageId: string;
  packageName: string;
  selectedInclusions: string[];
  finalPrice: number;
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  advanceAmount: number;
  bookingDate: string;
  departureDate: string;
}

export interface LedgerEntry {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Investment {
  id: string;
  name: string;
  ownershipPercent: number;
  amountInvested: number;
  date: string;
  notes: string;
}

export type OfficeExpenseCategory =
  | "Salaries"
  | "Bills"
  | "Rent"
  | "Food"
  | "Miscellaneous";

export interface OfficeExpense {
  id: string;
  category: OfficeExpenseCategory;
  amount: number;
  date: string;
  description: string;
  office: "Office 1" | "Office 2";
}

export interface AirlineTicketBatch {
  id: string;
  airline: string;
  route: string;
  quantity: number;
  costPerTicket: number;
  travelDate: string;
  returnDate: string;
  sold: number;
}

export interface HotelAllocation {
  id: string;
  hotelName: string;
  city: "Makkah" | "Madina";
  roomType: string;
  quantity: number;
  costPerNight: number;
  checkIn: string;
  checkOut: string;
  booked: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}
