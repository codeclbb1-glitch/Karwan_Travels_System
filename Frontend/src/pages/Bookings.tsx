import { useState, useMemo } from "react";
import { Plus, Search, CalendarCheck, X, Check, Package, Pencil, Receipt, Trash2 } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import BookingReceipt from "../components/BookingReceipt";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatPKR, formatDate } from "../data";
import type { Booking as BookingType, ServiceType } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

type BookingMode = "package" | "custom";

interface LineItem { label: string; price: number; }

const emptyBooking: Omit<BookingType, "id"> = {
  customerName: "", cnicPassport: "", phone: "", address: "",
  nextOfKin: "", nextOfKinPhone: "",
  serviceType: "Hajj", packageId: "", packageName: "",
  selectedInclusions: [], finalPrice: 0,
  paymentStatus: "Unpaid", advanceAmount: 0,
  bookingDate: new Date().toISOString().slice(0, 10),
  departureDate: "", arrivalDate: "",
  airlineName: "", airlineCost: 0,
  hotelMakkahId: "", hotelMadinaId: "",
  isCustom: false, customPackageName: "", customPrice: 0, customLineItems: [],
};

export default function Bookings() {
  const { role, bookings, hajjPackages, umrahPackages, hotelAllocations, createBooking, deleteBooking, showToast } = useApp();
  const isAdmin = role === "admin";

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<BookingType, "id">>(emptyBooking);
  const [bookingMode, setBookingMode] = useState<BookingMode>("package");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineLabel, setLineLabel] = useState("");
  const [linePrice, setLinePrice] = useState("");
  const [receiptBooking, setReceiptBooking] = useState<BookingType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const availablePackages = (form.serviceType === "Hajj" ? hajjPackages : umrahPackages).filter((p) => !("mode" in p && p.mode === "Form Resale to Agent"));

  const selectedPackage = useMemo(() => {
    if (!form.packageId || bookingMode === "custom") return null;
    return availablePackages.find((p) => p.id === form.packageId) ?? null;
  }, [form.packageId, availablePackages, bookingMode]);

  const inclusionCostMap = useMemo((): Record<string, number> => {
    if (!selectedPackage) return {};
    if ("hotelCost" in selectedPackage) {
      return { "Hotel": selectedPackage.hotelCost, "Air Ticket": selectedPackage.ticketCost, "Visa": selectedPackage.visaCost, "Transport": selectedPackage.transportCost, "Food": selectedPackage.foodCost, "Other": selectedPackage.otherCost };
    }
    return { "Airline": selectedPackage.airlineCost, "Visa": selectedPackage.visaCost, "Hotel Madina": selectedPackage.hotelMadinaCost, "Hotel Makkah": selectedPackage.hotelMakkahCost, "Transport": selectedPackage.transportCost, "Food": selectedPackage.foodCost, "Other": selectedPackage.otherCost };
  }, [selectedPackage]);

  const customTotal = useMemo(() => lineItems.reduce((s, i) => s + i.price, 0), [lineItems]);

  const livePrice = useMemo(() => {
    if (bookingMode === "custom") return customTotal;
    if (!selectedPackage) return 0;
    const deselected = selectedPackage.inclusions.filter((inc) => !form.selectedInclusions.includes(inc));
    const deducted = deselected.reduce((sum, inc) => sum + (inclusionCostMap[inc] ?? 0), 0);
    return Math.max(0, Math.round(selectedPackage.sellingPrice - deducted));
  }, [bookingMode, customTotal, selectedPackage, form.selectedInclusions, inclusionCostMap]);

  const openAdd = () => {
    setForm({ ...emptyBooking, bookingDate: new Date().toISOString().slice(0, 10) });
    setBookingMode("package");
    setLineItems([]);
    setLineLabel("");
    setLinePrice("");
    setFormErrors({});
    setModal(true);
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setForm({ ...form, serviceType: type, packageId: "", packageName: "", selectedInclusions: [], hotelMakkahId: "", hotelMadinaId: "" });
  };

  const switchMode = (mode: BookingMode) => {
    setBookingMode(mode);
    setLineItems([]);
    setForm((f) => ({ ...f, packageId: "", packageName: "", selectedInclusions: [], isCustom: mode === "custom", customPackageName: "", customPrice: 0, customLineItems: [], hotelMakkahId: "", hotelMadinaId: "" }));
    setFormErrors({});
  };

  const handlePackageSelect = (pkgId: string) => {
    const pkg = availablePackages.find((p) => p.id === pkgId);
    if (!pkg) return;
    let inclusions: string[];
    if ("hotelCost" in pkg) {
      const map: [string, number][] = [["Air Ticket", pkg.ticketCost], ["Visa", pkg.visaCost], ["Hotel", pkg.hotelCost], ["Transport", pkg.transportCost], ["Food", pkg.foodCost], ["Other", pkg.otherCost]];
      inclusions = map.filter(([, v]) => v > 0).map(([k]) => k);
    } else {
      inclusions = [...pkg.inclusions];
    }
    setForm({ ...form, packageId: pkgId, packageName: pkg.name, selectedInclusions: inclusions });
  };

  const toggleInclusion = (inc: string) => {
    setForm({ ...form, selectedInclusions: form.selectedInclusions.includes(inc) ? form.selectedInclusions.filter((i) => i !== inc) : [...form.selectedInclusions, inc] });
  };

  const addLineItem = () => {
    const label = lineLabel.trim();
    const price = Number(linePrice);
    if (!label || price <= 0) return;
    setLineItems((prev) => [...prev, { label, price }]);
    setLineLabel("");
    setLinePrice("");
  };

  const removeLineItem = (idx: number) => setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const base: [string, string][] = [
      ["customerName", validators.required(form.customerName, "Full name")],
      ["customerName", form.customerName.trim() ? validators.minLength(form.customerName, 3, "Full name") : ""],
      ["cnicPassport", validators.required(form.cnicPassport, "CNIC / Passport")],
      ["cnicPassport", form.cnicPassport.trim() ? validators.cnicOrPassport(form.cnicPassport) : ""],
      ["phone", validators.required(form.phone, "Phone")],
      ["phone", form.phone.trim() ? validators.phone(form.phone) : ""],
      ["address", validators.required(form.address, "Address")],
      ["departureDate", validators.dateRequired(form.departureDate, "Departure date")],
      ["advanceAmount", form.paymentStatus === "Partial" && form.advanceAmount <= 0 ? "Advance amount required for partial payment" : ""],
      ["advanceAmount", form.paymentStatus === "Partial" && form.advanceAmount >= livePrice ? "Advance must be less than total price" : ""],
    ];
    if (bookingMode === "package") {
      base.push(["packageId", !form.packageId ? "Please select a package" : ""]);
    } else {
      base.push(["customPackageName", validators.required(form.customPackageName ?? "", "Package / service name")]);
      base.push(["customPrice", lineItems.length === 0 ? "Add at least one service item" : ""]);
    }
    return collectErrors(base);
  };

  const save = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors before submitting", "error"); return; }
    const newBooking: BookingType = {
      ...form,
      id: "bk" + Date.now(),
      finalPrice: livePrice,
      packageName: bookingMode === "custom" ? (form.customPackageName ?? "") : form.packageName,
      selectedInclusions: bookingMode === "custom" ? lineItems.map((i) => i.label) : form.selectedInclusions,
      customLineItems: bookingMode === "custom" ? lineItems : [],
      customPrice: bookingMode === "custom" ? customTotal : 0,
    };
    try {
      await createBooking(newBooking);
      showToast("Booking created successfully");
      setModal(false);
    } catch {
      showToast("Unable to create booking. Check the details and try again.", "error");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteBooking(id);
      showToast("Booking deleted", "info");
    } catch {
      showToast("Failed to delete booking", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = useMemo(() => bookings.filter((b) => {
    const q = search.toLowerCase();
    return (b.customerName.toLowerCase().includes(q) || b.packageName.toLowerCase().includes(q) || b.cnicPassport.toLowerCase().includes(q))
      && (filterService === "all" || b.serviceType === filterService)
      && (filterStatus === "all" || b.paymentStatus === filterStatus)
      && (!filterDateFrom || b.bookingDate >= filterDateFrom)
      && (!filterDateTo || b.bookingDate <= filterDateTo);
  }), [bookings, search, filterService, filterStatus, filterDateFrom, filterDateTo]);

  const pagedBookings = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Bookings</h1>
          <p className="text-navy-400 text-sm mt-1">Manage customer bookings and payments</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Booking</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input className="input pl-10" placeholder="Search by name, package, CNIC..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex flex-wrap gap-3">
          <select className="input sm:w-40" value={filterService} onChange={(e) => { setFilterService(e.target.value); setPage(1); }}>
            <option value="all">All Services</option>
            <option value="Hajj">Hajj</option>
            <option value="Umrah">Umrah</option>
          </select>
          <select className="input sm:w-40" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <input type="date" className="input sm:w-40" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} title="From date" />
          <input type="date" className="input sm:w-40" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} title="To date" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Package</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Price</th>
                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Advance</th>}
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Departure</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Arrival</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Receipt</th>
                {isAdmin && <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Delete</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {pagedBookings.map((b) => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-800 text-sm">{b.customerName}</p>
                    <p className="text-xs text-navy-400">{b.cnicPassport}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${b.serviceType === "Hajj" ? "badge-green" : "badge-gold"}`}>{b.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">
                    {b.packageName}
                    {!b.packageId && <span className="ml-2 badge badge-navy">Custom</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-navy-800">{formatPKR(b.finalPrice)}</td>
                  {isAdmin && <td className="px-4 py-3 text-right text-sm text-navy-600">{formatPKR(b.advanceAmount)}</td>}
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${b.paymentStatus === "Paid" ? "badge-green" : b.paymentStatus === "Partial" ? "badge-gold" : "badge-red"}`}>{b.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">{formatDate(b.departureDate)}</td>
                  <td className="px-4 py-3 text-sm text-navy-500">{b.arrivalDate ? formatDate(b.arrivalDate) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setReceiptBooking(b)} className="btn-ghost p-2" title="View Receipt">
                      <Receipt className="w-4 h-4 text-navy-500" />
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setConfirmDelete({ id: b.id, name: b.customerName })} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 10 : 8} className="text-center py-12 text-navy-400 text-sm">No bookings found matching your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Receipt modal */}
      {receiptBooking && <BookingReceipt booking={receiptBooking} onClose={() => setReceiptBooking(null)} />}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete Booking"
        message={`Booking for "${confirmDelete?.name}" will be permanently deleted. This cannot be undone.`}
        onConfirm={() => confirmDelete && void handleDeleteBooking(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* New Booking Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Booking" size="xl">
        <div className="space-y-5">

          {/* Service type */}
          <div>
            <label className="label">Service Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["Hajj", "Umrah"] as ServiceType[]).map((type) => (
                <button key={type} onClick={() => handleServiceTypeChange(type)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${form.serviceType === type ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"}`}>
                  <CalendarCheck className={`w-5 h-5 ${form.serviceType === type ? "text-primary-600" : "text-navy-400"}`} />
                  <span className={`font-medium ${form.serviceType === type ? "text-primary-700" : "text-navy-500"}`}>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Booking mode */}
          <div>
            <label className="label">Booking Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => switchMode("package")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${bookingMode === "package" ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"}`}>
                <Package className={`w-5 h-5 ${bookingMode === "package" ? "text-primary-600" : "text-navy-400"}`} />
                <div className="text-left">
                  <p className={`font-medium text-sm ${bookingMode === "package" ? "text-primary-700" : "text-navy-600"}`}>Standard Package</p>
                  <p className="text-xs text-navy-400">Choose from existing packages</p>
                </div>
              </button>
              <button onClick={() => switchMode("custom")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${bookingMode === "custom" ? "border-gold-500 bg-gold-50" : "border-navy-100 hover:border-navy-200"}`}>
                <Pencil className={`w-5 h-5 ${bookingMode === "custom" ? "text-gold-600" : "text-navy-400"}`} />
                <div className="text-left">
                  <p className={`font-medium text-sm ${bookingMode === "custom" ? "text-gold-700" : "text-navy-600"}`}>Custom Booking</p>
                  <p className="text-xs text-navy-400">Set your own services & price</p>
                </div>
              </button>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className={inputClass("input", formErrors.customerName)} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Customer full name" />
              <FieldError error={formErrors.customerName} />
            </div>
            <div>
              <label className="label">CNIC / Passport No.</label>
              <input className={inputClass("input", formErrors.cnicPassport)} value={form.cnicPassport} onChange={(e) => setForm({ ...form, cnicPassport: e.target.value })} placeholder="35202-1234567-8 or AB1234567" />
              <FieldError error={formErrors.cnicPassport} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className={inputClass("input", formErrors.phone)} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
              <FieldError error={formErrors.phone} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className={inputClass("input", formErrors.address)} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
              <FieldError error={formErrors.address} />
            </div>
            <div>
              <label className="label">Next of Kin <span className="text-navy-400 font-normal">(optional)</span></label>
              <input className="input" value={form.nextOfKin} onChange={(e) => setForm({ ...form, nextOfKin: e.target.value })} placeholder="Next of kin name" />
            </div>
            <div>
              <label className="label">Next of Kin Phone <span className="text-navy-400 font-normal">(optional)</span></label>
              <input className="input" value={form.nextOfKinPhone} onChange={(e) => setForm({ ...form, nextOfKinPhone: e.target.value })} placeholder="03XX-XXXXXXX" />
              {form.nextOfKinPhone && <FieldError error={validators.phone(form.nextOfKinPhone)} />}
            </div>
          </div>

          {/* ── STANDARD PACKAGE MODE ── */}
          {bookingMode === "package" && (
            <>
              <div>
                <label className="label">Select Package</label>
                <FieldError error={formErrors.packageId} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                  {availablePackages.map((p) => {
                    const noForms = "formsRemaining" in p && p.formsRemaining === 0;
                    return (
                      <button key={p.id} onClick={() => !noForms && handlePackageSelect(p.id)} disabled={noForms}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          noForms ? "border-navy-100 bg-navy-50 opacity-50 cursor-not-allowed" :
                          form.packageId === p.id ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"
                        }`}>
                        <p className="font-medium text-navy-800 text-sm">{p.name}</p>
                        <p className="text-xs text-navy-400 mt-1">{p.durationDays} days</p>
                        <p className="text-sm font-bold text-primary-700 mt-1">{formatPKR(p.sellingPrice)}</p>
                        {noForms && <p className="text-xs text-red-400 mt-1 font-medium">No forms left</p>}
                      </button>
                    );
                  })}
                  {availablePackages.length === 0 && <p className="text-sm text-navy-400 col-span-3 py-2">No {form.serviceType} packages available.</p>}
                </div>
              </div>

              {selectedPackage && selectedPackage.inclusions.length > 0 && (
                <div>
                  <label className="label">Included Services <span className="text-navy-400 font-normal">(toggle to adjust price)</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedPackage.inclusions.map((inc) => {
                      const active = form.selectedInclusions.includes(inc);
                      return (
                        <button key={inc} onClick={() => toggleInclusion(inc)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${active ? "border-primary-500 bg-primary-50 text-primary-700" : "border-navy-100 text-navy-400"}`}>
                          {active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {inc}
                          {inclusionCostMap[inc] ? <span className="ml-auto text-xs opacity-60">{(inclusionCostMap[inc] / 1000).toFixed(0)}K</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CUSTOM BOOKING MODE ── */}
          {bookingMode === "custom" && (
            <div className="space-y-4 p-4 rounded-2xl bg-gold-50 border border-gold-200">
              <p className="text-sm font-semibold text-gold-800">Custom Booking Details</p>
              <div>
                <label className="label">Package / Service Name</label>
                <input className={inputClass("input", formErrors.customPackageName)} value={form.customPackageName ?? ""} onChange={(e) => setForm({ ...form, customPackageName: e.target.value })} placeholder="e.g. Custom Umrah 15 Days" />
                <FieldError error={formErrors.customPackageName} />
              </div>

              {/* Line items */}
              <div>
                <label className="label">Service Items & Prices</label>
                <FieldError error={formErrors.customPrice} />
                {lineItems.length > 0 && (
                  <div className="border border-gold-200 rounded-xl overflow-hidden mb-3">
                    <table className="w-full">
                      <thead className="bg-gold-100">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gold-800">Service</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-gold-800">Price</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-100">
                        {lineItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-navy-700">{item.label}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-navy-800 text-right">{formatPKR(item.price)}</td>
                            <td className="px-2 py-2">
                              <button onClick={() => removeLineItem(idx)} className="text-navy-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gold-50">
                          <td className="px-3 py-2 text-sm font-bold text-gold-800">Total</td>
                          <td className="px-3 py-2 text-sm font-bold text-gold-800 text-right">{formatPKR(customTotal)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex gap-2">
                  <input className="input flex-1" value={lineLabel} onChange={(e) => setLineLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLineItem()} placeholder="Service name (e.g. Hotel Makkah)" />
                  <input type="number" min="0" className="input w-36" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLineItem()} placeholder="Price (PKR)" />
                  <button onClick={addLineItem} className="btn-gold px-4">Add</button>
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Departure Date</label>
              <input type="date" className={inputClass("input", formErrors.departureDate)} value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
              <FieldError error={formErrors.departureDate} />
            </div>
            <div>
              <label className="label">Arrival Date <span className="text-navy-400 font-normal">(optional)</span></label>
              <input type="date" className="input" value={form.arrivalDate} onChange={(e) => setForm({ ...form, arrivalDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={form.paymentStatus} onChange={(e) => {
              const status = e.target.value as BookingType["paymentStatus"];
              setForm({ ...form, paymentStatus: status, advanceAmount: status === "Paid" ? livePrice : status === "Unpaid" ? 0 : form.advanceAmount });
            }}>
                <option value="Paid">Paid (Full)</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="label">Advance Amount {form.paymentStatus === "Unpaid" && <span className="text-navy-400 font-normal">(0 for unpaid)</span>}</label>
              <input type="number" min="0" className={inputClass("input", formErrors.advanceAmount)} value={form.advanceAmount || ""} onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })} disabled={form.paymentStatus !== "Partial"} />
              <FieldError error={formErrors.advanceAmount} />
            </div>
          </div>

          {/* Price banner */}
          <div className={`rounded-2xl p-5 flex items-center justify-between ${bookingMode === "custom" ? "bg-gradient-to-r from-gold-600 to-gold-500" : "bg-gradient-to-r from-primary-700 to-primary-600"}`}>
            <div>
              <p className={`text-sm font-medium uppercase tracking-wide ${bookingMode === "custom" ? "text-gold-100" : "text-primary-200"}`}>Final Price Customer Pays</p>
              <p className="text-3xl font-display font-extrabold text-white mt-1">{formatPKR(livePrice)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${bookingMode === "custom" ? "text-gold-100" : "text-primary-200"}`}>{bookingMode === "custom" ? "Custom" : "Package"}</p>
              <p className={`font-semibold ${bookingMode === "custom" ? "text-white" : "text-gold-300"}`}>
                {bookingMode === "custom" ? (form.customPackageName || "—") : (form.packageName || "—")}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void save()} className="btn-primary">Create Booking</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
