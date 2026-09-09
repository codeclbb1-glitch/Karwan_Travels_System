import { supabase } from "./supabase";
import type { AirlineTicketBatch, Booking, HajjFormBatch, HajjPackage, HotelAllocation, Investment, LedgerEntry, OfficeExpense, Role, UmrahPackage } from "../types";

type Row = Record<string, unknown>;
const asNumber = (value: unknown) => Number(value ?? 0);
const asString = (value: unknown) => String(value ?? "");
const unwrap = <T>(value: T[] | T | null): T | null => Array.isArray(value) ? value[0] ?? null : value;

const packageToDb = (value: HajjPackage | UmrahPackage) => {
  const common = { name: value.name, transport_type: value.transportType.toLowerCase(), food_cost: value.foodCost, other_cost: value.otherCost, selling_price: value.sellingPrice, agent_price: value.agentPrice, duration_days: value.durationDays, description: value.description, inclusions: value.inclusions };
  return "hotelCost" in value ? { ...common, mode: value.mode === "Form Resale to Agent" ? "form_resale_to_agent" : "company_organized", hotel_cost: value.hotelCost, ticket_cost: value.ticketCost, visa_cost: value.visaCost, transport_cost: value.transportCost, forms_remaining: value.formsRemaining } : { ...common, airline_cost: value.airlineCost, visa_cost: value.visaCost, hotel_madina_cost: value.hotelMadinaCost, hotel_makkah_cost: value.hotelMakkahCost, transport_cost: value.transportCost };
};

const hajjFromDb = (row: Row): HajjPackage => ({ id: asString(row.id), name: asString(row.name), mode: row.mode === "form_resale_to_agent" ? "Form Resale to Agent" : "Company-Organized", hotelCost: asNumber(row.hotel_cost), ticketCost: asNumber(row.ticket_cost), visaCost: asNumber(row.visa_cost), transportCost: asNumber(row.transport_cost), transportType: row.transport_type === "car" ? "Car" : "Bus", foodCost: asNumber(row.food_cost), otherCost: asNumber(row.other_cost), sellingPrice: asNumber(row.selling_price), agentPrice: asNumber(row.agent_price), formsRemaining: asNumber(row.forms_remaining), durationDays: asNumber(row.duration_days), description: asString(row.description), inclusions: Array.isArray(row.inclusions) ? row.inclusions as string[] : [] });
const umrahFromDb = (row: Row): UmrahPackage => ({ id: asString(row.id), name: asString(row.name), airlineCost: asNumber(row.airline_cost), visaCost: asNumber(row.visa_cost), hotelMadinaCost: asNumber(row.hotel_madina_cost), hotelMakkahCost: asNumber(row.hotel_makkah_cost), transportCost: asNumber(row.transport_cost), transportType: row.transport_type === "car" ? "Car" : "Bus", foodCost: asNumber(row.food_cost), otherCost: asNumber(row.other_cost), sellingPrice: asNumber(row.selling_price), agentPrice: asNumber(row.agent_price), durationDays: asNumber(row.duration_days), description: asString(row.description), inclusions: Array.isArray(row.inclusions) ? row.inclusions as string[] : [] });

export const authApi = {
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  session: () => supabase.auth.getSession(),
  profile: async () => { const { data, error } = await supabase.from("profiles").select("id, full_name, role").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(); if (error) throw error; if (!data) throw new Error("Profile not found"); return data as { id: string; full_name: string; role: Role }; },
};

export const dataApi = {
  async load(role: Role) {
    const [hajj, umrah, forms, bookings, ledger, investments, expenses, airline, hotel] = await Promise.all([
      role === "admin" ? supabase.from("hajj_packages").select("*").is("deleted_at", null).order("created_at", { ascending: false }) : supabase.from("staff_hajj_packages").select("*").order("created_at", { ascending: false }),
      role === "admin" ? supabase.from("umrah_packages").select("*").is("deleted_at", null).order("created_at", { ascending: false }) : supabase.from("staff_umrah_packages").select("*").order("created_at", { ascending: false }),
      role === "admin" ? supabase.from("hajj_form_batches").select("*").order("date_purchased", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      supabase.from("bookings").select("*, customers(*)").order("booking_date", { ascending: false }),
      role === "admin" ? supabase.from("financial_transactions").select("*").order("transaction_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      role === "admin" ? supabase.from("investments").select("*").order("investment_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      role === "admin" ? supabase.from("office_expenses").select("*").order("expense_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      supabase.from("airline_inventory_view").select("*").order("travel_date", { ascending: true }),
      supabase.from("hotel_inventory_view").select("*").order("check_in", { ascending: true }),
    ]);
    const result = [hajj, umrah, forms, bookings, ledger, investments, expenses, airline, hotel];
    const failed = result.find((item) => item.error);
    if (failed?.error) throw failed.error;
    return {
      hajjPackages: (hajj.data ?? []).map(hajjFromDb), umrahPackages: (umrah.data ?? []).map(umrahFromDb),
      hajjFormBatches: (forms.data ?? []).map((r: Row) => ({ id: asString(r.id), batchName: asString(r.batch_name), quantity: asNumber(r.quantity), pricePerForm: asNumber(r.price_per_form), datePurchased: asString(r.date_purchased), used: asNumber(r.used) })),
      bookings: (bookings.data ?? []).map((r: Row) => { const customer = (r.customers ?? {}) as Row; return { id: asString(r.id), customerName: asString(customer.full_name), cnicPassport: asString(customer.cnic_passport), phone: asString(customer.phone), address: asString(customer.address), nextOfKin: asString(customer.next_of_kin), nextOfKinPhone: asString(customer.next_of_kin_phone), serviceType: (r.service_type === "umrah" ? "Umrah" : "Hajj") as Booking["serviceType"], packageId: asString(r.service_type === "umrah" ? r.umrah_package_id : r.hajj_package_id), packageName: asString(r.package_name_snapshot), selectedInclusions: Array.isArray(r.selected_inclusions) ? r.selected_inclusions as string[] : [], finalPrice: asNumber(r.final_price), paymentStatus: (r.payment_status === "paid" ? "Paid" : r.payment_status === "partial" ? "Partial" : "Unpaid") as Booking["paymentStatus"], advanceAmount: asNumber(r.advance_amount), bookingDate: asString(r.booking_date), departureDate: asString(r.departure_date) }; }),
      ledger: (ledger.data ?? []).map((r: Row) => ({ id: asString(r.id), type: r.type as "income" | "expense", category: asString(r.category), amount: asNumber(r.amount), date: asString(r.transaction_date), description: asString(r.description) })),
      investments: (investments.data ?? []).map((r: Row) => ({ id: asString(r.id), name: asString(r.name), ownershipPercent: asNumber(r.ownership_percent), amountInvested: asNumber(r.amount_invested), date: asString(r.investment_date), notes: asString(r.notes) })),
      officeExpenses: (expenses.data ?? []).map((r: Row) => ({ id: asString(r.id), category: ({ salaries: "Salaries", bills: "Bills", rent: "Rent", food: "Food", miscellaneous: "Miscellaneous" } as Record<string, string>)[asString(r.category)] as OfficeExpense["category"], amount: asNumber(r.amount), date: asString(r.expense_date), description: asString(r.description), office: (r.office === "office_2" ? "Office 2" : "Office 1") as OfficeExpense["office"] })),
      airlineTickets: (airline.data ?? []).map((r: Row) => ({ id: asString(r.id), airline: asString(r.airline_name), route: asString(r.route), quantity: asNumber(r.quantity), costPerTicket: asNumber(r.cost_per_ticket), travelDate: asString(r.travel_date), returnDate: asString(r.return_date), sold: asNumber(r.sold) })),
      hotelAllocations: (hotel.data ?? []).map((r: Row) => ({ id: asString(r.id), hotelName: asString(r.hotel_name), city: (r.city === "madina" ? "Madina" : "Makkah") as HotelAllocation["city"], roomType: asString(r.room_type), quantity: asNumber(r.quantity), costPerNight: asNumber(r.cost_per_night), checkIn: asString(r.check_in), checkOut: asString(r.check_out), booked: asNumber(r.booked) })),
    };
  },

  saveHajjPackages: async (items: HajjPackage[]) => { for (const item of items) { const { error } = await supabase.from("hajj_packages").upsert({ id: item.id.length === 36 ? item.id : undefined, ...packageToDb(item) }); if (error) throw error; } },
  saveUmrahPackages: async (items: UmrahPackage[]) => { for (const item of items) { const { error } = await supabase.from("umrah_packages").upsert({ id: item.id.length === 36 ? item.id : undefined, ...packageToDb(item) }); if (error) throw error; } },
  createBooking: async (item: Booking) => { const { data, error } = await supabase.rpc("create_booking", { p_service_type: item.serviceType.toLowerCase(), p_package_id: item.packageId || null, p_selected_inclusions: item.selectedInclusions, p_customer_name: item.customerName, p_cnic_passport: item.cnicPassport, p_phone: item.phone, p_address: item.address, p_next_of_kin: item.nextOfKin, p_next_of_kin_phone: item.nextOfKinPhone, p_payment_status: item.paymentStatus.toLowerCase(), p_advance_amount: item.advanceAmount, p_departure_date: item.departureDate || null, p_custom_package_name: item.customPackageName || null, p_custom_price: item.customPrice ?? null }); if (error) throw error; return unwrap(data); },
  saveForms: async (items: HajjFormBatch[]) => { for (const item of items) { const { error } = await supabase.from("hajj_form_batches").upsert({ id: item.id.length === 36 ? item.id : undefined, batch_name: item.batchName, quantity_purchased: item.quantity, price_per_form: item.pricePerForm, date_purchased: item.datePurchased, used: item.used }); if (error) throw error; } },
  saveLedger: async (items: LedgerEntry[]) => { for (const item of items) { const { error } = await supabase.from("financial_transactions").upsert({ id: item.id.length === 36 ? item.id : undefined, type: item.type, category: item.category, amount: item.amount, transaction_date: item.date, description: item.description }); if (error) throw error; } },
  saveInvestments: async (items: Investment[]) => { for (const item of items) { const { error } = await supabase.from("investments").upsert({ id: item.id.length === 36 ? item.id : undefined, name: item.name, ownership_percent: item.ownershipPercent, amount_invested: item.amountInvested, investment_date: item.date, notes: item.notes }); if (error) throw error; } },
  saveExpenses: async (items: OfficeExpense[]) => { for (const item of items) { const { error } = await supabase.from("office_expenses").upsert({ id: item.id.length === 36 ? item.id : undefined, office: item.office === "Office 2" ? "office_2" : "office_1", category: item.category.toLowerCase(), amount: item.amount, expense_date: item.date, description: item.description }); if (error) throw error; } },
  saveAirline: async (items: AirlineTicketBatch[]) => { for (const item of items) { const { error } = await supabase.from("airline_inventory").upsert({ id: item.id.length === 36 ? item.id : undefined, airline_name: item.airline, route: item.route, quantity_purchased: item.quantity, cost_per_ticket: item.costPerTicket, quantity_sold: item.sold, travel_date: item.travelDate, return_date: item.returnDate }); if (error) throw error; } },
  saveHotels: async (items: HotelAllocation[]) => { for (const item of items) { const { error } = await supabase.from("hotel_inventory").upsert({ id: item.id.length === 36 ? item.id : undefined, hotel_name: item.hotelName, city: item.city.toLowerCase(), room_type: item.roomType, quantity_blocked: item.quantity, cost_per_night: item.costPerNight, quantity_booked: item.booked, check_in: item.checkIn, check_out: item.checkOut }); if (error) throw error; } },
};
