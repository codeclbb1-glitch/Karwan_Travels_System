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
  airlineName: string;
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
  airlineName: string;
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
  packageId: string;         // empty string for custom bookings
  packageName: string;
  selectedInclusions: string[];
  finalPrice: number;
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  advanceAmount: number;
  bookingDate: string;
  departureDate: string;
  arrivalDate: string;
  airlineName: string;
  airlineCost: number;
  hotelMakkahId: string;
  hotelMadinaId: string;
  isCustom?: boolean;
  customPackageName?: string;
  customPrice?: number;
  customLineItems?: { label: string; price: number }[];
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

export type OccupancyType = "Sharing" | "Quad" | "Triple" | "Double";

export interface HotelAllocation {
  id: string;
  hotelName: string;
  city: "Makkah" | "Madina";
  pricePerPerson: number; // legacy / default fallback
  sharingPrice: number;
  quadPrice: number;
  triplePrice: number;
  doublePrice: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;       // user id
  assignedBy: string;       // user id
  assignedToName: string;   // display name snapshot
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;          // ISO string or ""
  completedAt: string;      // ISO string or ""
  createdAt: string;
}
