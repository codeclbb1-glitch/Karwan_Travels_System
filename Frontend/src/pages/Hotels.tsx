import { useState } from "react";
import { Plus, Pencil, Trash2, Hotel } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR } from "../data";
import type { HotelAllocation } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

const emptyHotel: Omit<HotelAllocation, "id"> = {
  hotelName: "",
  city: "Makkah",
  pricePerPerson: 0,
};

export default function Hotels() {
  const { role, hotelAllocations, setHotelAllocations, deleteHotel, showToast } = useApp();
  const isAdmin = role === "admin";

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<HotelAllocation, "id">>(emptyHotel);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = () => collectErrors([
    ["hotelName", validators.required(form.hotelName, "Hotel name")],
    ["pricePerPerson", validators.positiveNumber(form.pricePerPerson, "Price per person")],
  ]);

  const openAdd = () => { setEditId(null); setForm(emptyHotel); setErrors({}); setModal(true); };
  const openEdit = (h: HotelAllocation) => { setEditId(h.id); const { id, ...rest } = h; setForm(rest); setErrors({}); setModal(true); };

  const save = async () => {
    const errs = validate();
    setErrors(errs);
    if (hasErrors(errs)) { showToast("Please fix the errors", "error"); return; }
    try {
      if (editId) {
        await setHotelAllocations(hotelAllocations.map((h) => h.id === editId ? { ...form, id: editId } : h));
        showToast("Hotel updated");
      } else {
        await setHotelAllocations([...hotelAllocations, { ...form, id: "ha" + Date.now() }]);
        showToast("Hotel added");
      }
      setModal(false);
    } catch { showToast("Failed to save hotel", "error"); }
  };

  const remove = async (id: string) => {
    try {
      await deleteHotel(id);
      showToast("Hotel removed", "info");
    } catch { showToast("Failed to delete hotel", "error"); }
  };

  const makkahHotels = hotelAllocations.filter((h) => h.city === "Makkah");
  const madinaHotels = hotelAllocations.filter((h) => h.city === "Madina");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Hotels</h1>
          <p className="text-navy-400 text-sm mt-1">Manage hotel options for Makkah and Madina</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Hotel
          </button>
        )}
      </div>

      {(["Makkah", "Madina"] as const).map((city) => {
        const hotels = city === "Makkah" ? makkahHotels : madinaHotels;
        return (
          <div key={city}>
            <h2 className="font-display font-bold text-navy-700 mb-3">{city}</h2>
            {hotels.length === 0 ? (
              <p className="text-navy-400 text-sm">No hotels added for {city} yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotels.map((h) => (
                  <div key={h.id} className="card p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                        <Hotel className="w-5 h-5" />
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(h)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => void remove(h.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-navy-900">{h.hotelName}</h3>
                    <p className="text-xs text-navy-400 mb-3">{h.city}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Price / Person</span>
                      <span className="font-bold text-primary-700">{formatPKR(h.pricePerPerson)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Hotel" : "Add Hotel"}>
        <div className="space-y-4">
          <div>
            <label className="label">Hotel Name</label>
            <input className={inputClass("input", errors.hotelName)} value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} placeholder="e.g. Makkah Hilton" />
            <FieldError error={errors.hotelName} />
          </div>
          <div>
            <label className="label">City</label>
            <select className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value as "Makkah" | "Madina" })}>
              <option value="Makkah">Makkah</option>
              <option value="Madina">Madina</option>
            </select>
          </div>
          <div>
            <label className="label">Price per Person (PKR)</label>
            <input type="number" min="0" className={inputClass("input", errors.pricePerPerson)} value={form.pricePerPerson || ""} onChange={(e) => setForm({ ...form, pricePerPerson: Number(e.target.value) })} placeholder="0" />
            <FieldError error={errors.pricePerPerson} />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void save()} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
