import { useState } from "react";
import { Plus, Trash2, Plane, MapPin, Calendar, Pencil } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatDate } from "../data";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

interface AirlineTicket {
  id: string;
  airline: string;
  route: string;
  quantity: number;
  costPerTicket: number;
  travelDate: string;
  returnDate: string;
  sold: number;
}

const emptyAir: Omit<AirlineTicket, "id"> = {
  airline: "", route: "", quantity: 0, costPerTicket: 0, travelDate: "", returnDate: "", sold: 0,
};

export default function Inventory() {
  const { role, showToast } = useApp();
  const isAdmin = role === "admin";

  const [tickets, setTickets] = useState<AirlineTicket[]>([]);
  const [airModal, setAirModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [airForm, setAirForm] = useState<Omit<AirlineTicket, "id">>(emptyAir);
  const [airErrors, setAirErrors] = useState<FieldErrors>({});

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

  const openAdd = () => { setEditId(null); setAirForm(emptyAir); setAirErrors({}); setAirModal(true); };
  const openEdit = (a: AirlineTicket) => { setEditId(a.id); const { id, ...rest } = a; setAirForm(rest); setAirErrors({}); setAirModal(true); };

  const save = () => {
    const errors = validateAir();
    setAirErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    if (editId) {
      setTickets((prev) => prev.map((a) => a.id === editId ? { ...airForm, id: editId } : a));
      showToast("Ticket batch updated");
    } else {
      setTickets((prev) => [...prev, { ...airForm, id: "at" + Date.now() }]);
      showToast("Ticket batch added");
    }
    setAirModal(false);
  };

  const remove = (id: string) => { setTickets((prev) => prev.filter((a) => a.id !== id)); showToast("Ticket batch removed", "info"); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Inventory</h1>
          <p className="text-navy-400 text-sm mt-1">Track airline ticket batches</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Ticket Batch
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map((a) => {
          const remaining = a.quantity - a.sold;
          return (
            <div key={a.id} className="card p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
                  <Plane className="w-5 h-5" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(a.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <h3 className="font-display font-bold text-navy-900">{a.airline}</h3>
              <p className="text-sm text-navy-400 flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5" /> {a.route}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-navy-400">Quantity</span><span className="font-medium text-navy-700">{a.quantity} tickets</span></div>
                {isAdmin && <div className="flex justify-between"><span className="text-navy-400">Cost / ticket</span><span className="font-medium text-navy-700">{formatPKR(a.costPerTicket)}</span></div>}
                {isAdmin && <div className="flex justify-between border-t border-navy-50 pt-2"><span className="text-navy-400">Total value</span><span className="font-bold text-navy-900">{formatPKR(a.quantity * a.costPerTicket)}</span></div>}
                <div className="flex justify-between"><span className="text-navy-400">Sold</span><span className="font-medium text-navy-700">{a.sold}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Remaining</span><span className={`font-bold ${remaining > 10 ? "text-primary-600" : remaining > 0 ? "text-gold-600" : "text-red-500"}`}>{remaining}</span></div>
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
        {tickets.length === 0 && <p className="text-sm text-navy-400 col-span-3 py-8 text-center">No ticket batches added yet.</p>}
      </div>

      <Modal open={airModal} onClose={() => setAirModal(false)} title={editId ? "Edit Ticket Batch" : "Add Ticket Batch"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Airline Name</label>
              <input className={inputClass("input", airErrors.airline)} value={airForm.airline} onChange={(e) => setAirForm({ ...airForm, airline: e.target.value })} placeholder="e.g. Saudi Airlines" />
              <FieldError error={airErrors.airline} />
            </div>
            <div>
              <label className="label">Route</label>
              <input className={inputClass("input", airErrors.route)} value={airForm.route} onChange={(e) => setAirForm({ ...airForm, route: e.target.value })} placeholder="e.g. Peshawar → Jeddah" />
              <FieldError error={airErrors.route} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
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
            <button onClick={save} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
