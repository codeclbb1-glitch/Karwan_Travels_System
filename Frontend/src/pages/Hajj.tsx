import { useState, useMemo } from "react";
import { Plus, Moon, FileText, Pencil, Trash2, Calculator } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatDate } from "../data";
import type { HajjFormBatch, HajjPackage, TransportType, PackageMode } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

const emptyBatch: Omit<HajjFormBatch, "id"> = {
  batchName: "",
  quantity: 0,
  pricePerForm: 0,
  datePurchased: "",
  used: 0,
};

const emptyPackage: Omit<HajjPackage, "id"> = {
  name: "",
  mode: "Company-Organized",
  hotelCost: 0,
  ticketCost: 0,
  visaCost: 0,
  transportCost: 0,
  transportType: "Bus",
  foodCost: 0,
  otherCost: 0,
  sellingPrice: 0,
  agentPrice: 0,
  formsRemaining: 0,
  durationDays: 30,
  description: "",
  inclusions: [],
  airlineInventoryId: undefined,
  hotelMakkahId: undefined,
};

export default function Hajj() {
  const { role, hajjFormBatches, setHajjFormBatches, hajjPackages, saveHajjPackage, deleteHajjPackage, airlineTickets, hotelAllocations, showToast } = useApp();
  const isAdmin = role === "admin";

  const [tab, setTab] = useState<"packages" | "forms">("packages");
  const [batchModal, setBatchModal] = useState(false);
  const [pkgModal, setPkgModal] = useState(false);
  const [editBatchId, setEditBatchId] = useState<string | null>(null);
  const [editPkgId, setEditPkgId] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState<Omit<HajjFormBatch, "id">>(emptyBatch);
  const [pkgForm, setPkgForm] = useState<Omit<HajjPackage, "id">>(emptyPackage);
  const [batchErrors, setBatchErrors] = useState<FieldErrors>({});
  const [pkgErrors, setPkgErrors] = useState<FieldErrors>({});

  const validateBatch = () => collectErrors([
    ["batchName", validators.required(batchForm.batchName, "Batch name")],
    ["quantity", validators.positiveNumber(batchForm.quantity, "Quantity")],
    ["pricePerForm", validators.positiveNumber(batchForm.pricePerForm, "Price per form")],
    ["datePurchased", validators.dateRequired(batchForm.datePurchased, "Date purchased")],
    ["used", batchForm.used > batchForm.quantity ? "Used cannot exceed quantity" : ""],
  ]);

  const validatePkg = () => collectErrors([
    ["name", validators.required(pkgForm.name, "Package name")],
    ["name", pkgForm.name.trim() ? validators.minLength(pkgForm.name, 3, "Package name") : ""],
    ["sellingPrice", validators.positiveNumber(pkgForm.sellingPrice, "Selling price")],
    ["agentPrice", validators.positiveNumber(pkgForm.agentPrice, "Agent price")],
    ["durationDays", validators.numberRange(pkgForm.durationDays, 1, 365, "Duration")],
    ["formsRemaining", validators.nonNegativeNumber(pkgForm.formsRemaining, "Forms remaining")],
  ]);

  const batchTotalCost = batchForm.quantity * batchForm.pricePerForm;

  const pkgTotalCost = useMemo(() => {
    return pkgForm.hotelCost + pkgForm.ticketCost + pkgForm.visaCost + pkgForm.transportCost + pkgForm.foodCost + pkgForm.otherCost;
  }, [pkgForm]);

  const pkgProfit = pkgForm.sellingPrice - pkgTotalCost;
  const agentProfit = pkgForm.agentPrice - pkgTotalCost;

  const openAddBatch = () => { setEditBatchId(null); setBatchForm(emptyBatch); setBatchErrors({}); setBatchModal(true); };
  const openEditBatch = (b: HajjFormBatch) => { setEditBatchId(b.id); const { id, ...rest } = b; setBatchForm(rest); setBatchErrors({}); setBatchModal(true); };
  const deleteBatch = async (id: string) => {
    try {
      await setHajjFormBatches(hajjFormBatches.filter((b) => b.id !== id));
      showToast("Batch deleted", "info");
    } catch { showToast("Failed to delete batch", "error"); }
  };

  const saveBatch = async () => {
    const errors = validateBatch();
    setBatchErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    try {
      if (editBatchId) {
        await setHajjFormBatches(hajjFormBatches.map((b) => (b.id === editBatchId ? { ...batchForm, id: editBatchId } : b)));
        showToast("Batch updated successfully");
      } else {
        await setHajjFormBatches([...hajjFormBatches, { ...batchForm, id: "hb" + Date.now() }]);
        showToast("Batch added successfully");
      }
      setBatchModal(false);
    } catch { showToast("Failed to save batch", "error"); }
  };

  const openAddPkg = () => { setEditPkgId(null); setPkgForm(emptyPackage); setPkgErrors({}); setPkgModal(true); };
  const openEditPkg = (p: HajjPackage) => { setEditPkgId(p.id); const { id, ...rest } = p; setPkgForm(rest); setPkgErrors({}); setPkgModal(true); };
  const deletePkg = async (id: string) => {
    try {
      await deleteHajjPackage(id);
      showToast("Package deleted", "info");
    } catch { showToast("Failed to delete package", "error"); }
  };

  const savePkg = async () => {
    const errors = validatePkg();
    setPkgErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    try {
      await saveHajjPackage(editPkgId ? { ...pkgForm, id: editPkgId } : { ...pkgForm, id: "hp" + Date.now() });
      showToast(editPkgId ? "Package updated successfully" : "Package saved successfully");
      setPkgModal(false);
    } catch { showToast("Failed to save package", "error"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Hajj Module</h1>
          <p className="text-navy-400 text-sm mt-1">Manage Hajj packages and government form batches</p>
        </div>
        <div className="flex gap-2">
          {tab === "packages" && isAdmin && (
            <button onClick={openAddPkg} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Package
            </button>
          )}
          {tab === "forms" && isAdmin && (
            <button onClick={openAddBatch} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Form Batch
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-navy-100">
        <button
          onClick={() => setTab("packages")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "packages" ? "border-primary-600 text-primary-700" : "border-transparent text-navy-400 hover:text-navy-600"
          }`}
        >
          <Moon className="w-4 h-4 inline mr-1.5" /> Packages
        </button>
        <button
          onClick={() => setTab("forms")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "forms" ? "border-primary-600 text-primary-700" : "border-transparent text-navy-400 hover:text-navy-600"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" /> Govt Form Management
        </button>
      </div>

      {/* Packages tab */}
      {tab === "packages" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50 border-b border-navy-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Package Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Mode</th>
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Cost</th>}
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Agent Price</th>}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Customer Price</th>
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Profit</th>}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Forms Left</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {hajjPackages.map((p) => {
                  const cost = p.hotelCost + p.ticketCost + p.visaCost + p.transportCost + p.foodCost + p.otherCost;
                  const profit = p.sellingPrice - cost;
                  return (
                    <tr key={p.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <p className="font-medium text-navy-800 text-sm">{p.name}</p>
                        <p className="text-xs text-navy-400">{p.durationDays} days</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.mode === "Company-Organized" ? "badge-green" : "badge-gold"}`}>
                          {p.mode === "Company-Organized" ? "Company" : "Resale"}
                        </span>
                      </td>
                      {isAdmin && <td className="px-4 py-3 text-right text-sm text-navy-600">{formatPKR(cost)}</td>}
                      {isAdmin && <td className="px-4 py-3 text-right text-sm text-navy-600">{formatPKR(p.agentPrice)}</td>}
                      <td className="px-4 py-3 text-right text-sm font-semibold text-navy-800">{formatPKR(p.sellingPrice)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${profit >= 0 ? "text-primary-600" : "text-red-500"}`}>
                            {formatPKR(profit)}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${p.formsRemaining > 5 ? "badge-green" : p.formsRemaining > 0 ? "badge-gold" : "badge-red"}`}>
                          {p.formsRemaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {isAdmin && (
                            <button onClick={() => openEditPkg(p)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => void deletePkg(p.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forms tab */}
      {tab === "forms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hajjFormBatches.map((b) => {
            const total = b.quantity * b.pricePerForm;
            const remaining = b.quantity - b.used;
            return (
              <div key={b.id} className="card p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditBatch(b)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => void deleteBatch(b.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-display font-bold text-navy-900">{b.batchName}</h3>
                <p className="text-xs text-navy-400 mb-3">Purchased {formatDate(b.datePurchased)}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Quantity</span>
                    <span className="font-medium text-navy-700">{b.quantity} forms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Price per form</span>
                    <span className="font-medium text-navy-700">{formatPKR(b.pricePerForm)}</span>
                  </div>
                  <div className="flex justify-between border-t border-navy-50 pt-2">
                    <span className="text-navy-400">Total cost</span>
                    <span className="font-bold text-navy-900">{formatPKR(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Used</span>
                    <span className="font-medium text-navy-700">{b.used}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Remaining</span>
                    <span className={`font-bold ${remaining > 10 ? "text-primary-600" : remaining > 0 ? "text-gold-600" : "text-red-500"}`}>
                      {remaining} forms
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-navy-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${(b.used / b.quantity) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Modal */}
      <Modal open={batchModal} onClose={() => setBatchModal(false)} title={editBatchId ? "Edit Form Batch" : "Add Form Batch"}>
        <div className="space-y-4">
          <div>
            <label className="label">Batch Name</label>
            <input className={inputClass("input", batchErrors.batchName)} value={batchForm.batchName} onChange={(e) => setBatchForm({ ...batchForm, batchName: e.target.value })} placeholder="e.g. Hajj 2025 Batch A" />
            <FieldError error={batchErrors.batchName} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity of Forms</label>
              <input type="number" min="1" className={inputClass("input", batchErrors.quantity)} value={batchForm.quantity || ""} onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })} />
              <FieldError error={batchErrors.quantity} />
            </div>
            <div>
              <label className="label">Price per Form (PKR)</label>
              <input type="number" min="0" className={inputClass("input", batchErrors.pricePerForm)} value={batchForm.pricePerForm || ""} onChange={(e) => setBatchForm({ ...batchForm, pricePerForm: Number(e.target.value) })} />
              <FieldError error={batchErrors.pricePerForm} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date Purchased</label>
              <input type="date" className={inputClass("input", batchErrors.datePurchased)} value={batchForm.datePurchased} onChange={(e) => setBatchForm({ ...batchForm, datePurchased: e.target.value })} />
              <FieldError error={batchErrors.datePurchased} />
            </div>
            <div>
              <label className="label">Used (forms)</label>
              <input type="number" min="0" className={inputClass("input", batchErrors.used)} value={batchForm.used || ""} onChange={(e) => setBatchForm({ ...batchForm, used: Number(e.target.value) })} />
              <FieldError error={batchErrors.used} />
            </div>
          </div>
          <div className="bg-navy-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-navy-600 flex items-center gap-2"><Calculator className="w-4 h-4" /> Total Cost (auto)</span>
            <span className="text-lg font-bold text-navy-900">{formatPKR(batchTotalCost)}</span>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setBatchModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void saveBatch()} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* Package Modal */}
      <Modal open={pkgModal} onClose={() => setPkgModal(false)} title={editPkgId ? "Edit Hajj Package" : "Add Hajj Package"} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Package Name</label>
              <input className={inputClass("input", pkgErrors.name)} value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="e.g. Hajj Premium 40 Days" />
              <FieldError error={pkgErrors.name} />
            </div>
            <div>
              <label className="label">Package Mode</label>
              <select className="input" value={pkgForm.mode} onChange={(e) => setPkgForm({ ...pkgForm, mode: e.target.value as PackageMode })}>
                <option value="Company-Organized">Company-Organized</option>
                <option value="Form Resale to Agent">Form Resale to Agent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} placeholder="Package description" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-700 mb-3">Cost Components (per pilgrim)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Airline — from inventory */}
              <div className="sm:col-span-3">
                <label className="label">Airline Ticket <span className="text-navy-400 font-normal">(from inventory)</span></label>
                <select className="input" value={pkgForm.airlineInventoryId ?? ""} onChange={(e) => {
                  const inv = airlineTickets.find((a) => a.id === e.target.value);
                  setPkgForm({ ...pkgForm, airlineInventoryId: e.target.value || undefined, ticketCost: inv ? inv.costPerTicket : 0 });
                }}>
                  <option value="">— None / Manual —</option>
                  {airlineTickets.map((a) => (
                    <option key={a.id} value={a.id}>{a.airline} · {a.route} · {formatDate(a.travelDate)} · {formatPKR(a.costPerTicket)} · {a.quantity - a.sold} left</option>
                  ))}
                </select>
                {!pkgForm.airlineInventoryId && (
                  <input type="number" min="0" className="input mt-2" placeholder="Manual ticket cost" value={pkgForm.ticketCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, ticketCost: Number(e.target.value) })} />
                )}
                {pkgForm.airlineInventoryId && <p className="text-xs text-primary-600 mt-1">Cost auto-filled: {formatPKR(pkgForm.ticketCost)}</p>}
              </div>
              {/* Hotel Makkah — from inventory */}
              <div className="sm:col-span-3">
                <label className="label">Hotel Makkah <span className="text-navy-400 font-normal">(from inventory)</span></label>
                <select className="input" value={pkgForm.hotelMakkahId ?? ""} onChange={(e) => {
                  const inv = hotelAllocations.find((h) => h.id === e.target.value);
                  setPkgForm({ ...pkgForm, hotelMakkahId: e.target.value || undefined, hotelCost: inv ? inv.costPerNight : 0 });
                }}>
                  <option value="">— None / Manual —</option>
                  {hotelAllocations.filter((h) => h.city === "Makkah").map((h) => (
                    <option key={h.id} value={h.id}>{h.hotelName} · {h.roomType} · {formatPKR(h.costPerNight)}/night · {h.quantity - h.booked} left</option>
                  ))}
                </select>
                {!pkgForm.hotelMakkahId && (
                  <input type="number" min="0" className="input mt-2" placeholder="Manual hotel cost" value={pkgForm.hotelCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, hotelCost: Number(e.target.value) })} />
                )}
                {pkgForm.hotelMakkahId && <p className="text-xs text-primary-600 mt-1">Cost auto-filled: {formatPKR(pkgForm.hotelCost)}</p>}
              </div>
              <div>
                <label className="label">Visa Cost</label>
                <input type="number" min="0" className="input" value={pkgForm.visaCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, visaCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Transport Cost</label>
                <input type="number" min="0" className="input" value={pkgForm.transportCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, transportCost: Number(e.target.value) })} />
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
                <input type="number" min="0" className="input" value={pkgForm.foodCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, foodCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Other Expenses</label>
                <input type="number" min="0" className="input" value={pkgForm.otherCost || ""} onChange={(e) => setPkgForm({ ...pkgForm, otherCost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Duration (days)</label>
                <input type="number" min="1" max="365" className={inputClass("input", pkgErrors.durationDays)} value={pkgForm.durationDays || ""} onChange={(e) => setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })} />
                <FieldError error={pkgErrors.durationDays} />
              </div>
              <div>
                <label className="label">Forms Remaining</label>
                <input type="number" min="0" className={inputClass("input", pkgErrors.formsRemaining)} value={pkgForm.formsRemaining || ""} onChange={(e) => setPkgForm({ ...pkgForm, formsRemaining: Number(e.target.value) })} />
                <FieldError error={pkgErrors.formsRemaining} />
              </div>
            </div>
          </div>
          <div className="bg-navy-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Total Cost / Pilgrim</p><p className="text-lg font-bold text-navy-900">{formatPKR(pkgTotalCost)}</p></div>
            <div><p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Company Profit</p><p className={`text-lg font-bold ${pkgProfit >= 0 ? "text-primary-600" : "text-red-500"}`}>{formatPKR(pkgProfit)}</p></div>
            <div><p className="text-xs text-navy-400 font-medium uppercase tracking-wide">Agent Profit</p><p className={`text-lg font-bold ${agentProfit >= 0 ? "text-gold-600" : "text-red-500"}`}>{formatPKR(agentProfit)}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Selling Price (Customer)</label>
              <input type="number" min="0" className={inputClass("input", pkgErrors.sellingPrice)} value={pkgForm.sellingPrice || ""} onChange={(e) => setPkgForm({ ...pkgForm, sellingPrice: Number(e.target.value) })} />
              <FieldError error={pkgErrors.sellingPrice} />
            </div>
            <div>
              <label className="label">Agent Price</label>
              <input type="number" min="0" className={inputClass("input", pkgErrors.agentPrice)} value={pkgForm.agentPrice || ""} onChange={(e) => setPkgForm({ ...pkgForm, agentPrice: Number(e.target.value) })} />
              <FieldError error={pkgErrors.agentPrice} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPkgModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void savePkg()} className="btn-primary">Save Package</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
