import { useState, useMemo } from "react";
import { Plus, Trash2, Pencil, Building2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatPKRShort, formatDate } from "../data";
import type { OfficeExpense, OfficeExpenseCategory } from "../types";
import { validators, collectErrors, hasErrors, FieldError, inputClass } from "../lib/validation";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const categories: OfficeExpenseCategory[] = ["Salaries", "Bills", "Rent", "Food", "Miscellaneous"];
const categoryColors: Record<string, string> = {
  Salaries: "#15803d",
  Bills: "#d97706",
  Rent: "#1e2f44",
  Food: "#f59e0b",
  Miscellaneous: "#64748b",
};

export default function OfficeExpenses() {
  const { officeExpenses, addOfficeExpense, updateOfficeExpense, deleteOfficeExpense, showToast } = useApp();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<OfficeExpense, "id">>({
    category: "Salaries",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    office: "Office 1",
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [officeFilter, setOfficeFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"date" | "amount" | "category">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const totalExpenses = useMemo(() => officeExpenses.reduce((s, e) => s + e.amount, 0), [officeExpenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    officeExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return categories.map((c) => ({ name: c, value: map.get(c) || 0, color: categoryColors[c] })).filter((c) => c.value > 0);
  }, [officeExpenses]);

  const byOffice = useMemo(() => {
    const office1 = officeExpenses.filter((e) => e.office === "Office 1").reduce((s, e) => s + e.amount, 0);
    const office2 = officeExpenses.filter((e) => e.office === "Office 2").reduce((s, e) => s + e.amount, 0);
    return [
      { name: "Office 1", amount: office1, color: "#15803d" },
      { name: "Office 2", amount: office2, color: "#d97706" },
    ];
  }, [officeExpenses]);

  const filteredExpenses = useMemo(() => {
    let list = officeExpenses;
    if (categoryFilter !== "All") list = list.filter((e) => e.category === categoryFilter);
    if (officeFilter !== "All") list = list.filter((e) => e.office === officeFilter);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "amount") cmp = a.amount - b.amount;
      else if (sortField === "category") cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [officeExpenses, categoryFilter, officeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: "date" | "amount" | "category") => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: "date" | "amount" | "category" }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ category: "Salaries", amount: 0, date: new Date().toISOString().slice(0, 10), description: "", office: "Office 1" });
    setModal(true);
  };

  const openEdit = (e: OfficeExpense) => {
    setEditId(e.id);
    setForm({ category: e.category, amount: e.amount, date: e.date, description: e.description, office: e.office });
    setModal(true);
  };

  const save = async () => {
    const errors = collectErrors([
      ["amount", validators.positiveNumber(form.amount, "Amount")],
      ["date", validators.dateRequired(form.date, "Date")],
    ]);
    if (hasErrors(errors)) { showToast(Object.values(errors)[0], "error"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateOfficeExpense(editId, form);
        showToast("Expense updated successfully");
      } else {
        await addOfficeExpense(form);
        showToast("Expense added successfully");
        setPage(1);
      }
      setModal(false);
    } catch { showToast("Failed to save expense", "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await deleteOfficeExpense(id);
      showToast("Expense removed", "info");
    } catch { showToast("Failed to delete expense", "error"); }
    finally { setConfirmDeleteId(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Office Expenses</h1>
          <p className="text-navy-400 text-sm mt-1">Track expenses by category and office</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wide">Total Expenses</p>
              <p className="text-xl font-bold text-navy-900">{formatPKRShort(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs text-navy-400 uppercase tracking-wide mb-1">Office 1 Total</p>
          <p className="text-xl font-bold text-primary-700">{formatPKRShort(byOffice[0].amount)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-navy-400 uppercase tracking-wide mb-1">Office 2 Total</p>
          <p className="text-xl font-bold text-gold-600">{formatPKRShort(byOffice[1].amount)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-display font-bold text-navy-900 mb-4">Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name }) => name} labelLine={false}>
                {byCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold text-navy-900 mb-4">Office Comparison</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byOffice}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatPKRShort(v).replace("Rs. ", "")} />
              <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                {byOffice.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display font-bold text-navy-900">All Expense Entries</h2>
          <div className="flex gap-2">
            <select className="input w-auto text-sm" value={officeFilter} onChange={(e) => { setOfficeFilter(e.target.value); setPage(1); }}>
              <option value="All">All Offices</option>
              <option value="Office 1">Office 1</option>
              <option value="Office 2">Office 2</option>
            </select>
            <select className="input w-auto text-sm" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="All">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <colgroup>
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-24" />
                <col />
                <col className="w-36" />
                <col className="w-24" />
              </colgroup>
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-navy-800" onClick={() => toggleSort("date")}>Date <SortIcon field="date" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 hover:text-navy-800" onClick={() => toggleSort("category")}>Category <SortIcon field="category" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Office</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                  <button className="flex items-center gap-1 ml-auto hover:text-navy-800" onClick={() => toggleSort("amount")}>Amount <SortIcon field="amount" /></button>
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {pagedExpenses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-navy-400 text-sm">No expenses found</td></tr>
              )}
              {pagedExpenses.map((e) => (
                <tr key={e.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm text-navy-500 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[e.category] }}></span>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge whitespace-nowrap ${e.office === "Office 1" ? "badge-green" : "badge-gold"}`}>{e.office}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">{e.description}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-navy-800 whitespace-nowrap">{formatPKR(e.amount)}</td>
                  <td className="px-4 py-3">
                    {confirmDeleteId === e.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => void remove(e.id)} className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold text-navy-600 bg-navy-100 hover:bg-navy-200 px-2 py-1 rounded">No</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(e)} className="text-navy-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(e.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-navy-100 flex items-center justify-between text-sm text-navy-500">
            <span>{filteredExpenses.length} entries · Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-navy-100 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p === page ? "bg-primary-600 text-white" : "hover:bg-navy-100"}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-navy-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Office Expense" : "Add Office Expense"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as OfficeExpenseCategory })}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Office</label>
              <select className="input" value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value as "Office 1" | "Office 2" })}>
                <option value="Office 1">Office 1</option>
                <option value="Office 2">Office 2</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (PKR)</label>
              <input type="number" className="input" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={() => void save()} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
