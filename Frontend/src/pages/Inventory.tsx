import { useState, useMemo } from "react";
import { Plus, Trash2, Plane, Hotel, Building2, MapPin, Calendar, Pencil } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatDate } from "../data";
import type { AirlineTicketBatch, HotelAllocation } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

type Tab = "airline" | "hotel";

export default function Inventory() {
  const { role, airlineTickets, setAirlineTickets, hotelAllocations, setHotelAllocations, showToast } = useApp();
  const isAdmin = role === "admin";

  const [tab, setTab] = useState<Tab>("airline");
  const [airModal, setAirModal] = useState(false);
  const [hotelModal, setHotelModal] = useState(false);
  const [editAirId, setEditAirId] = useState<string | null>(null);
  const [editHotelId, setEditHotelId] = useState<string | null>(null);

  const emptyAir: Omit<AirlineTicketBatch, "id"> = {
    airline: "",
    route: "",
    quantity: 0,
    costPerTicket: 0,
    travelDate: "",
    returnDate: "",
    sold: 0,
  };

  const emptyHotel: Omit<HotelAllocation, "id"> = {
    hotelName: "",
    city: "Makkah",
    roomType: "",
    quantity: 0,
    costPerNight: 0,
    checkIn: "",
    checkOut: "",
    booked: 0,
  };

  const [airForm, setAirForm] = useState<Omit<AirlineTicketBatch, "id">>(emptyAir);
  const [hotelForm, setHotelForm] = useState<Omit<HotelAllocation, "id">>(emptyHotel);
  const [airErrors, setAirErrors] = useState<FieldErrors>({});
  const [hotelErrors, setHotelErrors] = useState<FieldErrors>({});

  const validateAir = () => collectErrors([
    ["airline", validators.required(airForm.airline, "Airline name")],
    ["route", validators.required(airForm.route, "Route")],
    ["quantity", validators.positiveNumber(airForm.quantity, "Quantity")],
    ["costPerTicket", validators.nonNegativeNumber(airForm.costPerTicket, "Cost per ticket")],
    ["travelDate", validators.dateRequired(airForm.travelDate, "Travel date")],
    ["returnDate", validators.dateRequired(airForm.returnDate, "Return date")],
    ["returnDate", validators.dateOrder(airForm.travelDate, airForm.returnDate, "Travel date", "Return date")],
    ["sold", airForm.sold > airForm.quantity ? "Sold cannot exceed quantity" : ""],
  ]);

  const validateHotel = () => collectErrors([
    ["hotelName", validators.required(hotelForm.hotelName, "Hotel name")],
    ["roomType", validators.required(hotelForm.roomType, "Room type")],
    ["quantity", validators.positiveNumber(hotelForm.quantity, "Quantity")],
    ["costPerNight", validators.nonNegativeNumber(hotelForm.costPerNight, "Cost per night")],
    ["checkIn", validators.dateRequired(hotelForm.checkIn, "Check-in date")],
    ["checkOut", validators.dateRequired(hotelForm.checkOut, "Check-out date")],
    ["checkOut", validators.dateOrder(hotelForm.checkIn, hotelForm.checkOut, "Check-in", "Check-out")],
    ["booked", hotelForm.booked > hotelForm.quantity ? "Booked cannot exceed quantity" : ""],
  ]);

  const openAddAir = () => { setEditAirId(null); setAirForm(emptyAir); setAirErrors({}); setAirModal(true); };
  const openEditAir = (a: AirlineTicketBatch) => { setEditAirId(a.id); const { id, ...rest } = a; setAirForm(rest); setAirErrors({}); setAirModal(true); };

  const saveAir = () => {
    const errors = validateAir();
    setAirErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    if (editAirId) {
      setAirlineTickets(airlineTickets.map((a) => (a.id === editAirId ? { ...airForm, id: editAirId } : a)));
      showToast("Ticket batch updated");
    } else {
      setAirlineTickets([...airlineTickets, { ...airForm, id: "at" + Date.now() }]);
      showToast("Ticket batch added");
    }
    setAirModal(false);
  };

  const deleteAir = (id: string) => { setAirlineTickets(airlineTickets.filter((a) => a.id !== id)); showToast("Ticket batch removed", "info"); };

  const openAddHotel = () => { setEditHotelId(null); setHotelForm(emptyHotel); setHotelErrors({}); setHotelModal(true); };
  const openEditHotel = (h: HotelAllocation) => { setEditHotelId(h.id); const { id, ...rest } = h; setHotelForm(rest); setHotelErrors({}); setHotelModal(true); };

  const saveHotel = () => {
    const errors = validateHotel();
    setHotelErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    if (editHotelId) {
      setHotelAllocations(hotelAllocations.map((h) => (h.id === editHotelId ? { ...hotelForm, id: editHotelId } : h)));
      showToast("Hotel allocation updated");
    } else {
      setHotelAllocations([...hotelAllocations, { ...hotelForm, id: "ha" + Date.now() }]);
      showToast("Hotel allocation added");
    }
    setHotelModal(false);
  };

  const deleteHotel = (id: string) => { setHotelAllocations(hotelAllocations.filter((h) => h.id !== id)); showToast("Hotel allocation removed", "info"); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Inventory Management</h1>
        <p className="text-navy-400 text-sm mt-1">Track airline tickets and hotel room allocations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-navy-100">
        <button
          onClick={() => setTab("airline")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "airline" ? "border-primary-600 text-primary-700" : "border-transparent text-navy-400 hover:text-navy-600"
          }`}
        >
          <Plane className="w-4 h-4 inline mr-1.5" /> Airline Tickets
        </button>
        <button
          onClick={() => setTab("hotel")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "hotel" ? "border-primary-600 text-primary-700" : "border-transparent text-navy-400 hover:text-navy-600"
          }`}
        >
          <Hotel className="w-4 h-4 inline mr-1.5" /> Hotel Rooms
        </button>
      </div>

      {/* Airline tab */}
      {tab === "airline" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={openAddAir} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Ticket Batch
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {airlineTickets.map((a) => {
              const remaining = a.quantity - a.sold;
              const totalValue = a.quantity * a.costPerTicket;
              return (
                <div key={a.id} className="card p-5 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
                      <Plane className="w-5 h-5" />
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditAir(a)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteAir(a.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-navy-900">{a.airline}</h3>
                  <p className="text-sm text-navy-400 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {a.route}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Quantity</span>
                      <span className="font-medium text-navy-700">{a.quantity} tickets</span>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-between">
                        <span className="text-navy-400">Cost / ticket</span>
                        <span className="font-medium text-navy-700">{formatPKR(a.costPerTicket)}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex justify-between border-t border-navy-50 pt-2">
                        <span className="text-navy-400">Total value</span>
                        <span className="font-bold text-navy-900">{formatPKR(totalValue)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-navy-400">Sold</span>
                      <span className="font-medium text-navy-700">{a.sold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Remaining</span>
                      <span className={`font-bold ${remaining > 10 ? "text-primary-600" : remaining > 0 ? "text-gold-600" : "text-red-500"}`}>
                        {remaining}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-navy-400 pt-2 border-t border-navy-50">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(a.travelDate)}</span>
                      <span>Return: {formatDate(a.returnDate)}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-navy-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(a.sold / a.quantity) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hotel tab */}
      {tab === "hotel" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={openAddHotel} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Hotel Allocation
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotelAllocations.map((h) => {
              const remaining = h.quantity - h.booked;
              return (
                <div key={h.id} className="card p-5 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditHotel(h)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteHotel(h.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-navy-900">{h.hotelName}</h3>
                  <p className="text-sm text-navy-400 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {h.city} · {h.roomType}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Rooms / Beds</span>
                      <span className="font-medium text-navy-700">{h.quantity}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-between">
                        <span className="text-navy-400">Cost / night</span>
                        <span className="font-medium text-navy-700">{formatPKR(h.costPerNight)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-navy-400">Booked</span>
                      <span className="font-medium text-navy-700">{h.booked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Remaining</span>
                      <span className={`font-bold ${remaining > 5 ? "text-primary-600" : remaining > 0 ? "text-gold-600" : "text-red-500"}`}>
                        {remaining}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-navy-400 pt-2 border-t border-navy-50">
                      <span>Check-in: {formatDate(h.checkIn)}</span>
                      <span>Out: {formatDate(h.checkOut)}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-navy-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500 rounded-full transition-all" style={{ width: `${(h.booked / h.quantity) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Airline Modal */}
      <Modal open={airModal} onClose={() => setAirModal(false)} title={editAirId ? "Edit Ticket Batch" : "Add Ticket Batch"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Airline Name</label>
              <input className={inputClass("input", airErrors.airline)} value={airForm.airline} onChange={(e) => setAirForm({ ...airForm, airline: e.target.value })} placeholder="e.g. Saudi Airlines" />
              <FieldError error={airErrors.airline} />
            </div>
            <div>
              <label className="label">Route</label>
              <input className={inputClass("input", airErrors.route)} value={airForm.route} onChange={(e) => setAirForm({ ...airForm, route: e.target.value })} placeholder="e.g. Lahore → Jeddah" />
              <FieldError error={airErrors.route} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="1" className={inputClass("input", airErrors.quantity)} value={airForm.quantity || ""} onChange={(e) => setAirForm({ ...airForm, quantity: Number(e.target.value) })} />
              <FieldError error={airErrors.quantity} />
            </div>
            <div>
              <label className="label">Cost / Ticket</label>
              <input type="number" min="0" className={inputClass("input", airErrors.costPerTicket)} value={airForm.costPerTicket || ""} onChange={(e) => setAirForm({ ...airForm, costPerTicket: Number(e.target.value) })} />
              <FieldError error={airErrors.costPerTicket} />
            </div>
            <div>
              <label className="label">Sold</label>
              <input type="number" min="0" className={inputClass("input", airErrors.sold)} value={airForm.sold || ""} onChange={(e) => setAirForm({ ...airForm, sold: Number(e.target.value) })} />
              <FieldError error={airErrors.sold} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Travel Date</label>
              <input type="date" className={inputClass("input", airErrors.travelDate)} value={airForm.travelDate} onChange={(e) => setAirForm({ ...airForm, travelDate: e.target.value })} />
              <FieldError error={airErrors.travelDate} />
            </div>
            <div>
              <label className="label">Return Date</label>
              <input type="date" className={inputClass("input", airErrors.returnDate)} value={airForm.returnDate} onChange={(e) => setAirForm({ ...airForm, returnDate: e.target.value })} />
              <FieldError error={airErrors.returnDate} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAirModal(false)} className="btn-outline">Cancel</button>
            <button onClick={saveAir} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* Hotel Modal */}
      <Modal open={hotelModal} onClose={() => setHotelModal(false)} title={editHotelId ? "Edit Hotel Allocation" : "Add Hotel Allocation"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hotel Name</label>
              <input className={inputClass("input", hotelErrors.hotelName)} value={hotelForm.hotelName} onChange={(e) => setHotelForm({ ...hotelForm, hotelName: e.target.value })} placeholder="e.g. Makkah Hilton" />
              <FieldError error={hotelErrors.hotelName} />
            </div>
            <div>
              <label className="label">City</label>
              <select className="input" value={hotelForm.city} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value as "Makkah" | "Madina" })}>
                <option value="Makkah">Makkah</option>
                <option value="Madina">Madina</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Room Type</label>
              <input className={inputClass("input", hotelErrors.roomType)} value={hotelForm.roomType} onChange={(e) => setHotelForm({ ...hotelForm, roomType: e.target.value })} placeholder="e.g. Triple" />
              <FieldError error={hotelErrors.roomType} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="1" className={inputClass("input", hotelErrors.quantity)} value={hotelForm.quantity || ""} onChange={(e) => setHotelForm({ ...hotelForm, quantity: Number(e.target.value) })} />
              <FieldError error={hotelErrors.quantity} />
            </div>
            <div>
              <label className="label">Cost / Night</label>
              <input type="number" min="0" className={inputClass("input", hotelErrors.costPerNight)} value={hotelForm.costPerNight || ""} onChange={(e) => setHotelForm({ ...hotelForm, costPerNight: Number(e.target.value) })} />
              <FieldError error={hotelErrors.costPerNight} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check-in</label>
              <input type="date" className={inputClass("input", hotelErrors.checkIn)} value={hotelForm.checkIn} onChange={(e) => setHotelForm({ ...hotelForm, checkIn: e.target.value })} />
              <FieldError error={hotelErrors.checkIn} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="date" className={inputClass("input", hotelErrors.checkOut)} value={hotelForm.checkOut} onChange={(e) => setHotelForm({ ...hotelForm, checkOut: e.target.value })} />
              <FieldError error={hotelErrors.checkOut} />
            </div>
          </div>
          <div>
            <label className="label">Booked</label>
            <input type="number" min="0" className={inputClass("input", hotelErrors.booked)} value={hotelForm.booked || ""} onChange={(e) => setHotelForm({ ...hotelForm, booked: Number(e.target.value) })} />
            <FieldError error={hotelErrors.booked} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setHotelModal(false)} className="btn-outline">Cancel</button>
            <button onClick={saveHotel} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
