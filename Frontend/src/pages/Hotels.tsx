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
  sharingPrice: 0,
  quadPrice: 0,
  triplePrice: 0,
  doublePrice: 0,
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
    ["sharingPrice", validators.nonNegativeNumber(form.sharingPrice, "Sharing price")],
    ["quadPrice", validators.nonNegativeNumber(form.quadPrice, "Quad price")],
    ["triplePrice", validators.nonNegativeNumber(form.triplePrice, "Triple price")],
    ["doublePrice", validators.nonNegativeNumber(form.doublePrice, "Double price")],
  ]);

  const openAdd = () => { setEditId(null); setForm(emptyHotel); setErrors({}); setModal(true); };
  const openEdit = (h: HotelAllocation) => { setEditId(h.id); const { id, ...rest } = h; setForm(rest); setErrors({}); setModal(true); };

  const save = async () => {
    const errs = validate();
    setErrors(errs);
    if (hasErrors(errs)) { showToast("Please fix the errors", "error"); return; }
    // Use the lowest non-zero occupancy price as the legacy pricePerPerson fallback
    const prices = [form.sharingPrice, form.quadPrice, form.triplePrice, form.doublePrice].filter((p) => p > 0);
    const fallback = prices.length > 0 ? Math.min(...prices) : 0;
    const withFallback = { ...form, pricePerPerson: fallback };
    try {
      if (editId) {
        await setHotelAllocations(hotelAllocations.map((h) => h.id === editId ? { ...withFallback, id: editId } : h));
        showToast("Hotel updated");
      } else {
        await setHotelAllocations([...hotelAllocations, { ...withFallback, id: "ha" + Date.now() }]);
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
                    <div className="space-y-1.5 text-sm">
                      {(["Sharing", "Quad", "Triple", "Double"] as const).map((type) => {
                        const key = (type.toLowerCase() + "Price") as keyof HotelAllocation;
                        const price = h[key] as number;
                        return price > 0 ? (
                          <div key={type} className="flex justify-between">
                            <span className="text-navy-400">{type}</span>
                            <span className="font-semibold text-primary-700">{formatPKR(price)}</span>
                          </div>
                        ) : null;
                      })}
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <p className="label mb-2">Occupancy Prices (PKR per person)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sharing</label>
                <input type="number" min="0" className={inputClass("input", errors.sharingPrice)} value={form.sharingPrice || ""} onChange={(e) => setForm({ ...form, sharingPrice: Number(e.target.value) })} placeholder="0" />
                <FieldError error={errors.sharingPrice} />
              </div>
              <div>
                <label className="label">Quad (4-person)</label>
                <input type="number" min="0" className={inputClass("input", errors.quadPrice)} value={form.quadPrice || ""} onChange={(e) => setForm({ ...form, quadPrice: Number(e.target.value) })} placeholder="0" />
                <FieldError error={errors.quadPrice} />
              </div>
              <div>
                <label className="label">Triple (3-person)</label>
                <input type="number" min="0" className={inputClass("input", errors.triplePrice)} value={form.triplePrice || ""} onChange={(e) => setForm({ ...form, triplePrice: Number(e.target.value) })} placeholder="0" />
                <FieldError error={errors.triplePrice} />
              </div>
              <div>
                <label className="label">Double (2-person)</label>
                <input type="number" min="0" className={inputClass("input", errors.doublePrice)} value={form.doublePrice || ""} onChange={(e) => setForm({ ...form, doublePrice: Number(e.target.value) })} placeholder="0" />
                <FieldError error={errors.doublePrice} />
              </div>
            </div>
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
