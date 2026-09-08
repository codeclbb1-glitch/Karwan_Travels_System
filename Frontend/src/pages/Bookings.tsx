import { useState, useMemo } from "react";
import { Plus, Search, CalendarCheck, Phone, MapPin, User, Filter, X, Check } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatDate } from "../data";
import type { Booking as BookingType, ServiceType } from "../types";

const emptyBooking: Omit<BookingType, "id"> = {
  customerName: "",
  cnicPassport: "",
  phone: "",
  address: "",
  nextOfKin: "",
  nextOfKinPhone: "",
  serviceType: "Hajj",
  packageId: "",
  packageName: "",
  selectedInclusions: [],
  finalPrice: 0,
  paymentStatus: "Unpaid",
  advanceAmount: 0,
  bookingDate: new Date().toISOString().slice(0, 10),
  departureDate: "",
};

export default function Bookings() {
  const { role, bookings, hajjPackages, umrahPackages, createBooking, showToast } = useApp();
  const isAdmin = role === "admin";

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<BookingType, "id">>(emptyBooking);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const availablePackages = form.serviceType === "Hajj" ? hajjPackages : umrahPackages;

  const selectedPackage = useMemo(() => {
    if (!form.packageId) return null;
    return availablePackages.find((p) => p.id === form.packageId) || null;
  }, [form.packageId, availablePackages]);

  // Calculate live price based on selected inclusions
  const livePrice = useMemo(() => {
    if (!selectedPackage) return 0;
    let price = selectedPackage.sellingPrice;
    // If any inclusions are deselected, subtract their proportional cost
    const allInclusions = selectedPackage.inclusions;
    const deselected = allInclusions.filter((inc) => !form.selectedInclusions.includes(inc));
    if (deselected.length > 0) {
      // Estimate each inclusion's share of the selling price
      const perInclusionCost = selectedPackage.sellingPrice / allInclusions.length;
      price -= deselected.length * perInclusionCost;
    }
    return Math.round(price);
  }, [selectedPackage, form.selectedInclusions]);

  const openAdd = () => {
    setForm({ ...emptyBooking, bookingDate: new Date().toISOString().slice(0, 10) });
    setModal(true);
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setForm({ ...form, serviceType: type, packageId: "", packageName: "", selectedInclusions: [] });
  };

  const handlePackageSelect = (pkgId: string) => {
    const pkg = availablePackages.find((p) => p.id === pkgId);
    if (pkg) {
      setForm({
        ...form,
        packageId: pkgId,
        packageName: pkg.name,
        selectedInclusions: [...pkg.inclusions],
      });
    }
  };

  const toggleInclusion = (inc: string) => {
    setForm({
      ...form,
      selectedInclusions: form.selectedInclusions.includes(inc)
        ? form.selectedInclusions.filter((i) => i !== inc)
        : [...form.selectedInclusions, inc],
    });
  };

  const save = async () => {
    if (!form.customerName || !form.packageId) {
      showToast("Please fill in customer name and select a package", "error");
      return;
    }
    const newBooking: BookingType = {
      ...form,
      id: "bk" + Date.now(),
      finalPrice: livePrice,
    };
    try {
      await createBooking(newBooking);
      showToast("Booking created successfully");
      setModal(false);
    } catch {
      showToast("Unable to create booking. Check the package and payment details.", "error");
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.packageName.toLowerCase().includes(search.toLowerCase()) ||
        b.cnicPassport.toLowerCase().includes(search.toLowerCase());
      const matchService = filterService === "all" || b.serviceType === filterService;
      const matchStatus = filterStatus === "all" || b.paymentStatus === filterStatus;
      return matchSearch && matchService && matchStatus;
    });
  }, [bookings, search, filterService, filterStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Bookings</h1>
          <p className="text-navy-400 text-sm mt-1">Manage customer bookings and payments</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <input
            className="input pl-10"
            placeholder="Search by name, package, CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select className="input sm:w-40" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
            <option value="all">All Services</option>
            <option value="Hajj">Hajj</option>
            <option value="Umrah">Umrah</option>
          </select>
          <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Bookings table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((b) => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-800 text-sm">{b.customerName}</p>
                    <p className="text-xs text-navy-400">{b.cnicPassport}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${b.serviceType === "Hajj" ? "badge-green" : "badge-gold"}`}>{b.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-600">{b.packageName}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-navy-800">{formatPKR(b.finalPrice)}</td>
                  {isAdmin && <td className="px-4 py-3 text-right text-sm text-navy-600">{formatPKR(b.advanceAmount)}</td>}
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${b.paymentStatus === "Paid" ? "badge-green" : b.paymentStatus === "Partial" ? "badge-gold" : "badge-red"}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">{formatDate(b.departureDate)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-navy-400 text-sm">
                    No bookings found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Booking Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Booking" size="xl">
        <div className="space-y-5">
          {/* Service type toggle */}
          <div>
            <label className="label">Service Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleServiceTypeChange("Hajj")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  form.serviceType === "Hajj" ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"
                }`}
              >
                <CalendarCheck className={`w-5 h-5 ${form.serviceType === "Hajj" ? "text-primary-600" : "text-navy-400"}`} />
                <span className={`font-medium ${form.serviceType === "Hajj" ? "text-primary-700" : "text-navy-500"}`}>Hajj</span>
              </button>
              <button
                onClick={() => handleServiceTypeChange("Umrah")}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  form.serviceType === "Umrah" ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"
                }`}
              >
                <CalendarCheck className={`w-5 h-5 ${form.serviceType === "Umrah" ? "text-primary-600" : "text-navy-400"}`} />
                <span className={`font-medium ${form.serviceType === "Umrah" ? "text-primary-700" : "text-navy-500"}`}>Umrah</span>
              </button>
            </div>
          </div>

          {/* Customer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Customer name" />
            </div>
            <div>
              <label className="label">CNIC / Passport No.</label>
              <input className="input" value={form.cnicPassport} onChange={(e) => setForm({ ...form, cnicPassport: e.target.value })} placeholder="e.g. 35202-1234567-8" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92-300-1234567" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
            </div>
            <div>
              <label className="label">Next of Kin</label>
              <input className="input" value={form.nextOfKin} onChange={(e) => setForm({ ...form, nextOfKin: e.target.value })} placeholder="Next of kin name" />
            </div>
            <div>
              <label className="label">Next of Kin Phone</label>
              <input className="input" value={form.nextOfKinPhone} onChange={(e) => setForm({ ...form, nextOfKinPhone: e.target.value })} placeholder="+92-300-7654321" />
            </div>
          </div>

          {/* Package selection */}
          <div>
            <label className="label">Select Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePackages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePackageSelect(p.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    form.packageId === p.id ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200"
                  }`}
                >
                  <p className="font-medium text-navy-800 text-sm">{p.name}</p>
                  <p className="text-xs text-navy-400 mt-1">{p.durationDays} days</p>
                  <p className="text-sm font-bold text-primary-700 mt-1">{formatPKR(p.sellingPrice)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Inclusions toggles */}
          {selectedPackage && (
            <div>
              <label className="label">Included Services (toggle to adjust price)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPackage.inclusions.map((inc) => {
                  const active = form.selectedInclusions.includes(inc);
                  return (
                    <button
                      key={inc}
                      onClick={() => toggleInclusion(inc)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                        active ? "border-primary-500 bg-primary-50 text-primary-700" : "border-navy-100 text-navy-400"
                      }`}
                    >
                      {active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {inc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Departure Date</label>
              <input type="date" className="input" value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as BookingType["paymentStatus"] })}>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="label">Advance Amount</label>
              <input type="number" className="input" value={form.advanceAmount || ""} onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })} />
            </div>
          </div>

          {/* Final price */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-sm font-medium uppercase tracking-wide">Final Price Customer Pays</p>
              <p className="text-3xl font-display font-extrabold text-white mt-1">{formatPKR(livePrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-primary-200 text-sm">Package</p>
              <p className="text-gold-300 font-semibold">{form.packageName || "—"}</p>
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
