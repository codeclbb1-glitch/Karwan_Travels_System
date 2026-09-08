import { useState, useMemo } from "react";
import { Plus, Globe, Pencil, Trash2, Plane, Hotel, Car, Bus, Stamp, Utensils, Package } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR } from "../data";
import type { UmrahPackage, TransportType } from "../types";

const emptyPackage: Omit<UmrahPackage, "id"> = {
  name: "",
  airlineCost: 0,
  visaCost: 0,
  hotelMadinaCost: 0,
  hotelMakkahCost: 0,
  transportCost: 0,
  transportType: "Bus",
  foodCost: 0,
  otherCost: 0,
  sellingPrice: 0,
  agentPrice: 0,
  durationDays: 10,
  description: "",
  inclusions: ["Airline", "Visa", "Hotel Madina", "Hotel Makkah", "Transport", "Food"],
};

const allServices = [
  { key: "Airline", label: "Airline", icon: Plane, costField: "airlineCost" as const },
  { key: "Visa", label: "Visa", icon: Stamp, costField: "visaCost" as const },
  { key: "Hotel Madina", label: "Hotel Madina", icon: Hotel, costField: "hotelMadinaCost" as const },
  { key: "Hotel Makkah", label: "Hotel Makkah", icon: Hotel, costField: "hotelMakkahCost" as const },
  { key: "Transport", label: "Transport", icon: Car, costField: "transportCost" as const },
  { key: "Food", label: "Food", icon: Utensils, costField: "foodCost" as const },
];

export default function Umrah() {
  const { role, umrahPackages, setUmrahPackages, showToast } = useApp();
  const isAdmin = role === "admin";

  const [pkgModal, setPkgModal] = useState(false);
  const [editPkgId, setEditPkgId] = useState<string | null>(null);
  const [pkgForm, setPkgForm] = useState<Omit<UmrahPackage, "id">>(emptyPackage);

  const pkgTotalCost = useMemo(() => {
    return pkgForm.airlineCost + pkgForm.visaCost + pkgForm.hotelMadinaCost + pkgForm.hotelMakkahCost + pkgForm.transportCost + pkgForm.foodCost + pkgForm.otherCost;
  }, [pkgForm]);

  const pkgProfit = pkgForm.sellingPrice - pkgTotalCost;
  const agentProfit = pkgForm.agentPrice - pkgTotalCost;

  const openAddPkg = () => {
    setEditPkgId(null);
    setPkgForm(emptyPackage);
    setPkgModal(true);
  };

  const openEditPkg = (p: UmrahPackage) => {
    setEditPkgId(p.id);
    const { id, ...rest } = p;
    setPkgForm(rest);
    setPkgModal(true);
  };

  const savePkg = () => {
    if (!pkgForm.name) {
      showToast("Please enter a package name", "error");
      return;
    }
    if (editPkgId) {
      setUmrahPackages(umrahPackages.map((p) => (p.id === editPkgId ? { ...pkgForm, id: editPkgId } : p)));
      showToast("Package updated successfully");
    } else {
      setUmrahPackages([...umrahPackages, { ...pkgForm, id: "up" + Date.now() }]);
      showToast("Package saved successfully");
    }
    setPkgModal(false);
  };

  const deletePkg = (id: string) => {
    setUmrahPackages(umrahPackages.filter((p) => p.id !== id));
    showToast("Package deleted", "info");
  };

  const toggleInclusion = (key: string) => {
    const inclusions = pkgForm.inclusions.includes(key)
      ? pkgForm.inclusions.filter((i) => i !== key)
      : [...pkgForm.inclusions, key];
    setPkgForm({ ...pkgForm, inclusions });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Umrah Module</h1>
          <p className="text-navy-400 text-sm mt-1">Manage Umrah packages with dynamic cost components</p>
        </div>
        <button onClick={openAddPkg} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {umrahPackages.map((p) => {
          const cost = p.airlineCost + p.visaCost + p.hotelMadinaCost + p.hotelMakkahCost + p.transportCost + p.foodCost + p.otherCost;
          const profit = p.sellingPrice - cost;
          return (
            <div key={p.id} className="card p-5 card-hover flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditPkg(p)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePkg(p.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-bold text-navy-900 text-lg">{p.name}</h3>
              <p className="text-xs text-navy-400 mb-3">{p.durationDays} days · {p.description}</p>

              {/* Inclusions */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.inclusions.map((inc) => (
                  <span key={inc} className="badge badge-green">{inc}</span>
                ))}
              </div>

              {/* Price summary */}
              <div className="space-y-2 mt-auto pt-3 border-t border-navy-50">
                {isAdmin && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Total Cost</span>
                      <span className="font-medium text-navy-700">{formatPKR(cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Agent Price</span>
                      <span className="font-medium text-navy-700">{formatPKR(p.agentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Profit</span>
                      <span className={`font-bold ${profit >= 0 ? "text-primary-600" : "text-red-500"}`}>{formatPKR(profit)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-navy-50">
                  <span className="text-sm font-medium text-navy-600">Customer Price</span>
                  <span className="text-xl font-bold text-primary-700">{formatPKR(p.sellingPrice)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Modal */}
      <Modal open={pkgModal} onClose={() => setPkgModal(false)} title={editPkgId ? "Edit Umrah Package" : "Add Umrah Package"} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Package Name</label>
              <input className="input" value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="e.g. Umrah Deluxe 15 Days" />
            </div>
            <div>
              <label className="label">Duration (days)</label>
              <input type="number" className="input" value={pkgForm.durationDays || ""} onChange={(e) => setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Package description" />
          </div>

          {/* Cost components */}
          <div>
            <h4 className="text-sm font-semibold text-navy-700 mb-3">Cost Components (vendor-sourced)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Airline Cost</label>
                <input type="number" className="input" value={pkgForm.airlineCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, airlineCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Visa Cost</label>
                <input type="number" className="input" value={pkgForm.visaCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, visaCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Hotel Madina Cost</label>
                <input type="number" className="input" value={pkgForm.hotelMadinaCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, hotelMadinaCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Hotel Makkah Cost</label>
                <input type="number" className="input" value={pkgForm.hotelMakkahCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, hotelMakkahCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Transport Cost</label>
                <input type="number" className="input" value={pkgForm.transportCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, transportCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Transport Type</label>
                <select className="input" value={pkgForm.transportType} onChange={(e) => setPkgForm({ ...pkgForm, transportType: e.target.value as TransportType })}>
                  <option value="Bus">Bus</option>
                  <option value="Car">Car</option>
                </select>
              </div>
              <div>
                <label className="label">Food Cost</label>
                <input type="number" className="input" value={pkgForm.foodCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, foodCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Other Cost</label>
                <input type="number" className="input" value={pkgForm.otherCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, otherCost: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Service toggles */}
          <div>
            <h4 className="text-sm font-semibold text-navy-700 mb-3">Included Services (toggle per package)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allServices.map((s) => {
                const active = pkgForm.inclusions.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleInclusion(s.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                      active ? "border-primary-500 bg-primary-50 text-primary-700" : "border-navy-100 text-navy-400 hover:border-navy-200"
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                    <span className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? "border-primary-600 bg-primary-600" : "border-navy-200"}`}>
                      {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-navy-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Total Cost</p>
              <p className="text-lg font-bold text-navy-900">{formatPKR(pkgTotalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Company Profit</p>
              <p className={`text-lg font-bold ${pkgProfit >= 0 ? "text-primary-600" : "text-red-500"}`}>{formatPKR(pkgProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Agent Profit</p>
              <p className={`text-lg font-bold ${agentProfit >= 0 ? "text-gold-600" : "text-red-500"}`}>{formatPKR(agentProfit)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer Selling Price</label>
              <input type="number" className="input" value={pkgForm.sellingPrice || ""} onChange={(e) => setPkgForm({ ...pkgForm, sellingPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Agent Price</label>
              <input type="number" className="input" value={pkgForm.agentPrice || ""} onChange={(e) => setPkgForm({ ...pkgForm, agentPrice: Number(e.target.value) })} />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setPkgModal(false)} className="btn-outline">Cancel</button>
            <button onClick={savePkg} className="btn-primary">Save Package</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
