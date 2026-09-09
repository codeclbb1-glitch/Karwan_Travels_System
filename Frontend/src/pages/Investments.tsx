import { useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp, Building2, Percent } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { formatPKR, formatPKRShort, formatDate } from "../data";
import type { Investment } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass, type FieldErrors } from "../lib/validation";

export default function Investments() {
  const { investments, setInvestments, showToast } = useApp();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<Investment, "id">>({
    name: "",
    ownershipPercent: 0,
    amountInvested: 0,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const validate = () => collectErrors([
    ["name", validators.required(form.name, "Investment name")],
    ["amountInvested", validators.positiveNumber(form.amountInvested, "Amount invested")],
    ["ownershipPercent", validators.percentage(form.ownershipPercent, "Ownership %")],
    ["date", validators.dateRequired(form.date, "Date")],
  ]);

  const totalInvested = useMemo(() => investments.reduce((s, i) => s + i.amountInvested, 0), [investments]);

  const openAdd = () => {
    setForm({ name: "", ownershipPercent: 0, amountInvested: 0, date: new Date().toISOString().slice(0, 10), notes: "" });
    setFormErrors({});
    setModal(true);
  };

  const save = () => {
    const errors = validate();
    setFormErrors(errors);
    if (hasErrors(errors)) { showToast("Please fix the errors", "error"); return; }
    setInvestments([{ ...form, id: "inv" + Date.now() }, ...investments]);
    showToast("Investment added successfully");
    setModal(false);
  };

  const remove = (id: string) => {
    setInvestments(investments.filter((i) => i.id !== id));
    showToast("Investment removed", "info");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Investments</h1>
          <p className="text-navy-400 text-sm mt-1">Company investment portfolio</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Investment
        </button>
      </div>

      <StatCard label="Total Invested" value={formatPKRShort(totalInvested)} icon={<TrendingUp className="w-6 h-6" />} accent="gold" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {investments.map((inv) => (
          <div key={inv.id} className="card p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
                <Building2 className="w-6 h-6" />
              </div>
              <button onClick={() => remove(inv.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-display font-bold text-navy-900 text-lg">{inv.name}</h3>
            <p className="text-xs text-navy-400 mb-3">Invested {formatDate(inv.date)}</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wide">Ownership</p>
                <p className="text-lg font-bold text-navy-900 flex items-center gap-1">
                  <Percent className="w-4 h-4 text-gold-500" />
                  {inv.ownershipPercent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wide">Amount</p>
                <p className="text-lg font-bold text-primary-700">{formatPKR(inv.amountInvested)}</p>
              </div>
            </div>
            <p className="text-sm text-navy-500 pt-3 border-t border-navy-50">{inv.notes}</p>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Investment">
        <div className="space-y-4">
          <div>
            <label className="label">Investment Name</label>
            <input className={inputClass("input", formErrors.name)} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Travel Valley Resort" />
            <FieldError error={formErrors.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ownership (%)</label>
              <input type="number" min="0" max="100" className={inputClass("input", formErrors.ownershipPercent)} value={form.ownershipPercent || ""} onChange={(e) => setForm({ ...form, ownershipPercent: Number(e.target.value) })} />
              <FieldError error={formErrors.ownershipPercent} />
            </div>
            <div>
              <label className="label">Amount Invested (PKR)</label>
              <input type="number" min="0" className={inputClass("input", formErrors.amountInvested)} value={form.amountInvested || ""} onChange={(e) => setForm({ ...form, amountInvested: Number(e.target.value) })} />
              <FieldError error={formErrors.amountInvested} />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className={inputClass("input", formErrors.date)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <FieldError error={formErrors.date} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
