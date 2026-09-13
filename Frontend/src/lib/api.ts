import { supabase } from "./supabase";
import type { Booking, HajjFormBatch, HajjPackage, HotelAllocation, Investment, OfficeExpense, Role, Task, UmrahPackage } from "../types";

type Row = Record<string, unknown>;
const asNumber = (value: unknown) => Number(value ?? 0);
const asString = (value: unknown) => String(value ?? "");
const unwrap = <T>(value: T[] | T | null): T | null => Array.isArray(value) ? value[0] ?? null : value;

const packageToDb = (value: HajjPackage | UmrahPackage) => {
  const common = { name: value.name, airline_name: value.airlineName, transport_type: value.transportType.toLowerCase(), food_cost: value.foodCost, other_cost: value.otherCost, selling_price: value.sellingPrice, agent_price: value.agentPrice, duration_days: value.durationDays, description: value.description, inclusions: value.inclusions };
  if ("hotelCost" in value) {
    return { ...common, mode: value.mode === "Form Resale to Agent" ? "form_resale_to_agent" : "company_organized", hotel_cost: value.hotelCost, ticket_cost: value.ticketCost, visa_cost: value.visaCost, transport_cost: value.transportCost, forms_remaining: value.formsRemaining };
  }
  return { ...common, airline_cost: value.airlineCost, visa_cost: value.visaCost, hotel_madina_cost: value.hotelMadinaCost, hotel_makkah_cost: value.hotelMakkahCost, transport_cost: value.transportCost };
};

const hajjFromDb = (row: Row): HajjPackage => ({ id: asString(row.id), name: asString(row.name), mode: row.mode === "form_resale_to_agent" ? "Form Resale to Agent" : "Company-Organized", airlineName: asString(row.airline_name), hotelCost: asNumber(row.hotel_cost), ticketCost: asNumber(row.ticket_cost), visaCost: asNumber(row.visa_cost), transportCost: asNumber(row.transport_cost), transportType: row.transport_type === "car" ? "Car" : "Bus", foodCost: asNumber(row.food_cost), otherCost: asNumber(row.other_cost), sellingPrice: asNumber(row.selling_price), agentPrice: asNumber(row.agent_price), formsRemaining: asNumber(row.forms_remaining), durationDays: asNumber(row.duration_days), description: asString(row.description), inclusions: Array.isArray(row.inclusions) ? row.inclusions as string[] : [] });
const umrahFromDb = (row: Row): UmrahPackage => ({ id: asString(row.id), name: asString(row.name), airlineName: asString(row.airline_name), airlineCost: asNumber(row.airline_cost), visaCost: asNumber(row.visa_cost), hotelMadinaCost: asNumber(row.hotel_madina_cost), hotelMakkahCost: asNumber(row.hotel_makkah_cost), transportCost: asNumber(row.transport_cost), transportType: row.transport_type === "car" ? "Car" : "Bus", foodCost: asNumber(row.food_cost), otherCost: asNumber(row.other_cost), sellingPrice: asNumber(row.selling_price), agentPrice: asNumber(row.agent_price), durationDays: asNumber(row.duration_days), description: asString(row.description), inclusions: Array.isArray(row.inclusions) ? row.inclusions as string[] : [] });

export const authApi = {
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  session: () => supabase.auth.getSession(),
  profile: async () => { const { data, error } = await supabase.from("profiles").select("id, full_name, role").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(); if (error) throw error; if (!data) throw new Error("Profile not found"); return data as { id: string; full_name: string; role: Role }; },
};

async function savePackage<T extends { id: string }>(table: string, item: T, fromDb: (r: Row) => T): Promise<T> {
  const isNew = item.id.length !== 36;
  const row = packageToDb(item as unknown as HajjPackage);
  if (isNew) {
    const { data, error } = await supabase.from(table).insert(row as never).select().single();
    if (error) throw error;
    return fromDb(data as Row);
  } else {
    const { data, error } = await supabase.from(table).update(row as never).eq("id", item.id).select().single();
    if (error) throw error;
    return fromDb(data as Row);
  }
}

export const dataApi = {
  async load(role: Role) {
    const [hajj, umrah, forms, bookings, investments, expenses, hotel] = await Promise.all([
      role === "admin" ? supabase.from("hajj_packages").select("*").is("deleted_at", null).order("created_at", { ascending: false }) : supabase.from("staff_hajj_packages").select("*").order("created_at", { ascending: false }),
      role === "admin" ? supabase.from("umrah_packages").select("*").is("deleted_at", null).order("created_at", { ascending: false }) : supabase.from("staff_umrah_packages").select("*").order("created_at", { ascending: false }),
      role === "admin" ? supabase.from("hajj_form_batches").select("*").order("date_purchased", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      supabase.from("bookings").select("*, customers(*)").order("booking_date", { ascending: false }),
      role === "admin" ? supabase.from("investments").select("*").order("investment_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      role === "admin" ? supabase.from("office_expenses").select("*").order("expense_date", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      supabase.from("hotel_inventory").select("*").order("hotel_name", { ascending: true }),
    ]);
    const result = [hajj, umrah, forms, bookings, investments, expenses, hotel];
    const failed = result.find((item) => item.error);
    if (failed?.error) throw failed.error;
    return {
      hajjPackages: (hajj.data ?? []).map(hajjFromDb), umrahPackages: (umrah.data ?? []).map(umrahFromDb),
      hajjFormBatches: (forms.data ?? []).map((r: Row) => ({ id: asString(r.id), batchName: asString(r.batch_name), quantity: asNumber(r.quantity_purchased), pricePerForm: asNumber(r.price_per_form), datePurchased: asString(r.date_purchased), used: asNumber(r.used) })),
      bookings: (bookings.data ?? []).map((r: Row) => { const customer = (r.customers ?? {}) as Row; return { id: asString(r.id), customerName: asString(customer.full_name), cnicPassport: asString(customer.cnic_passport), phone: asString(customer.phone), address: asString(customer.address), nextOfKin: asString(customer.next_of_kin), nextOfKinPhone: asString(customer.next_of_kin_phone), serviceType: (r.service_type === "umrah" ? "Umrah" : "Hajj") as Booking["serviceType"], packageId: asString(r.service_type === "umrah" ? r.umrah_package_id : r.hajj_package_id), packageName: asString(r.package_name_snapshot), selectedInclusions: Array.isArray(r.selected_inclusions) ? r.selected_inclusions as string[] : [], finalPrice: asNumber(r.final_price), paymentStatus: (r.payment_status === "paid" ? "Paid" : r.payment_status === "partial" ? "Partial" : "Unpaid") as Booking["paymentStatus"], advanceAmount: asNumber(r.advance_amount), bookingDate: asString(r.booking_date), departureDate: asString(r.departure_date), arrivalDate: asString(r.arrival_date), airlineName: asString(r.airline_name), airlineCost: asNumber(r.airline_cost), hotelMakkahId: asString(r.hotel_makkah_id), hotelMadinaId: asString(r.hotel_madina_id) }; }),
      investments: (investments.data ?? []).map((r: Row) => ({ id: asString(r.id), name: asString(r.name), ownershipPercent: asNumber(r.ownership_percent), amountInvested: asNumber(r.amount_invested), date: asString(r.investment_date), notes: asString(r.notes) })),
      officeExpenses: (expenses.data ?? []).map((r: Row) => ({ id: asString(r.id), category: ({ salaries: "Salaries", bills: "Bills", rent: "Rent", food: "Food", miscellaneous: "Miscellaneous" } as Record<string, string>)[asString(r.category)] as OfficeExpense["category"], amount: asNumber(r.amount), date: asString(r.expense_date), description: asString(r.description), office: (r.office === "office_2" ? "Office 2" : "Office 1") as OfficeExpense["office"] })),
      hotelAllocations: (hotel.data ?? []).map((r: Row) => ({ id: asString(r.id), hotelName: asString(r.hotel_name), city: (r.city === "madina" ? "Madina" : "Makkah") as HotelAllocation["city"], pricePerPerson: asNumber(r.cost_per_night) })),
    };
  },

  saveHajjPackage: async (item: HajjPackage): Promise<HajjPackage> => savePackage("hajj_packages", item, hajjFromDb),
  saveUmrahPackage: async (item: UmrahPackage): Promise<UmrahPackage> => savePackage("umrah_packages", item, umrahFromDb),
  deleteHajjPackage: async (id: string): Promise<void> => { const { error } = await supabase.from("hajj_packages").update({ deleted_at: new Date().toISOString() }).eq("id", id); if (error) throw error; },
  deleteUmrahPackage: async (id: string): Promise<void> => { const { error } = await supabase.from("umrah_packages").update({ deleted_at: new Date().toISOString() }).eq("id", id); if (error) throw error; },
  createBooking: async (item: Booking) => { const { data, error } = await supabase.rpc("create_booking", { p_service_type: item.serviceType.toLowerCase(), p_package_id: item.packageId || null, p_selected_inclusions: item.selectedInclusions, p_customer_name: item.customerName, p_cnic_passport: item.cnicPassport, p_phone: item.phone, p_address: item.address, p_next_of_kin: item.nextOfKin, p_next_of_kin_phone: item.nextOfKinPhone, p_payment_status: item.paymentStatus.toLowerCase(), p_advance_amount: item.advanceAmount, p_departure_date: item.departureDate || null, p_arrival_date: item.arrivalDate || null, p_airline_name: item.airlineName || null, p_airline_cost: item.airlineCost || 0, p_hotel_makkah_id: item.hotelMakkahId || null, p_hotel_madina_id: item.hotelMadinaId || null, p_custom_package_name: item.customPackageName || null, p_custom_price: item.customPrice ?? null }); if (error) throw error; return unwrap(data); },
  saveForms: async (items: HajjFormBatch[]) => {
    const toRow = (item: HajjFormBatch) => ({ batch_name: item.batchName, quantity_purchased: item.quantity, price_per_form: item.pricePerForm, date_purchased: item.datePurchased, used: item.used });
    const existing = items.filter((i) => i.id.length === 36);
    const newItems = items.filter((i) => i.id.length !== 36);
    if (existing.length) { const { error } = await supabase.from("hajj_form_batches").upsert(existing.map((i) => ({ id: i.id, ...toRow(i) })), { onConflict: "id" }); if (error) throw error; }
    if (newItems.length) { const { error } = await supabase.from("hajj_form_batches").insert(newItems.map(toRow)); if (error) throw error; }
  },
  saveInvestments: async (items: Investment[]) => {
    const toRow = (i: Investment) => ({ name: i.name, ownership_percent: i.ownershipPercent, amount_invested: i.amountInvested, investment_date: i.date, notes: i.notes });
    const ex = items.filter((i) => i.id.length === 36), nw = items.filter((i) => i.id.length !== 36);
    if (ex.length) { const { error } = await supabase.from("investments").upsert(ex.map((i) => ({ id: i.id, ...toRow(i) })), { onConflict: "id" }); if (error) throw error; }
    if (nw.length) { const { error } = await supabase.from("investments").insert(nw.map(toRow)); if (error) throw error; }
  },
  saveExpenses: async (items: OfficeExpense[]) => {
    const toRow = (i: OfficeExpense) => ({ office: i.office === "Office 2" ? "office_2" : "office_1", category: i.category.toLowerCase(), amount: i.amount, expense_date: i.date, description: i.description });
    const ex = items.filter((i) => i.id.length === 36), nw = items.filter((i) => i.id.length !== 36);
    if (ex.length) { const { error } = await supabase.from("office_expenses").upsert(ex.map((i) => ({ id: i.id, ...toRow(i) })), { onConflict: "id" }); if (error) throw error; }
    if (nw.length) { const { error } = await supabase.from("office_expenses").insert(nw.map(toRow)); if (error) throw error; }
  },
saveHotels: async (items: HotelAllocation[]): Promise<HotelAllocation[]> => {
    const toRow = (i: HotelAllocation) => ({ hotel_name: i.hotelName, city: i.city.toLowerCase(), cost_per_night: i.pricePerPerson });
    const ex = items.filter((i) => i.id.length === 36), nw = items.filter((i) => i.id.length !== 36);
    const results: Row[] = [];
    if (ex.length) { const { data, error } = await supabase.from("hotel_inventory").upsert(ex.map((i) => ({ id: i.id, ...toRow(i) })), { onConflict: "id" }).select(); if (error) throw error; results.push(...(data ?? [])); }
    if (nw.length) { const { data, error } = await supabase.from("hotel_inventory").insert(nw.map(toRow)).select(); if (error) throw error; results.push(...(data ?? [])); }
    return results.map((r) => ({ id: asString(r.id), hotelName: asString(r.hotel_name), city: (r.city === "madina" ? "Madina" : "Makkah") as HotelAllocation["city"], pricePerPerson: asNumber(r.cost_per_night) }));
  },
  deleteHotel: async (id: string): Promise<void> => { const { error } = await supabase.from("hotel_inventory").delete().eq("id", id); if (error) throw error; },
};

const taskFromDb = (r: Row): Task => ({
  id: asString(r.id),
  title: asString(r.title),
  description: asString(r.description),
  assignedTo: asString(r.assigned_to),
  assignedBy: asString(r.assigned_by),
  assignedToName: asString(r.assigned_to_name),
  status: (r.status as Task["status"]) ?? "pending",
  priority: (r.priority as Task["priority"]) ?? "medium",
  dueDate: asString(r.due_date),
  completedAt: asString(r.completed_at),
  createdAt: asString(r.created_at),
});

export const tasksApi = {
  load: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(taskFromDb);
  },

  create: async (task: Omit<Task, "id" | "createdAt" | "completedAt">): Promise<Task> => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: task.title,
        description: task.description,
        assigned_to: task.assignedTo,
        assigned_by: task.assignedBy,
        assigned_to_name: task.assignedToName,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate || null,
      })
      .select()
      .single();
    if (error) throw error;
    return taskFromDb(data as Row);
  },

  updateStatus: async (id: string, status: Task["status"]): Promise<void> => {
    const { error } = await supabase
      .from("tasks")
      .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};
