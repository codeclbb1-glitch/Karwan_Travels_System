import { useState, useMemo } from "react";
import { Plus, Trash2, Building2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import { formatPKR, formatPKRShort } from "../data";
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
  const { officeExpenses, setOfficeExpenses, showToast } = useApp();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<OfficeExpense, "id">>({
    category: "Salaries",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    office: "Office 1",
  });

  const [calMonth, setCalMonth] = useState(new Date("2025-08-01"));

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

  // Calendar
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calMonth]);

  const expensesOnDay = (day: number) => {
    const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return officeExpenses.filter((e) => e.date === dateStr);
  };

  const openAdd = () => {
    setForm({ category: "Salaries", amount: 0, date: new Date().toISOString().slice(0, 10), description: "", office: "Office 1" });
    setModal(true);
  };

  const save = () => {
    const errors = collectErrors([
      ["amount", validators.positiveNumber(form.amount, "Amount")],
      ["date", validators.dateRequired(form.date, "Date")],
    ]);
    if (hasErrors(errors)) {
      showToast(Object.values(errors)[0], "error");
      return;
    }
    setOfficeExpenses([{ ...form, id: "oe" + Date.now() }, ...officeExpenses]);
    showToast("Expense added successfully");
    setModal(false);
  };

  const remove = (id: string) => {
    setOfficeExpenses(officeExpenses.filter((e) => e.id !== id));
    showToast("Expense removed", "info");
  };

  const monthName = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Office Expenses</h1>
          <p className="text-navy-400 text-sm mt-1">Track expenses by category and office, with calendar view</p>
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

      {/* Calendar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-navy-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            {monthName}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="btn-ghost p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="btn-ghost p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-navy-400 uppercase py-2">
              {d}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="aspect-square"></div>;
            const dayExpenses = expensesOnDay(day);
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl border p-2 overflow-hidden transition-all ${
                  dayExpenses.length > 0
                    ? "border-primary-200 bg-primary-50/50 hover:shadow-sm cursor-pointer"
                    : "border-navy-50"
                }`}
              >
                <p className="text-xs font-medium text-navy-600">{day}</p>
                {dayExpenses.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-bold text-primary-700">{formatPKRShort(dayTotal)}</p>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayExpenses.slice(0, 3).map((e) => (
                        <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[e.category] }}></span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100">
          <h2 className="font-display font-bold text-navy-900">All Expense Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Office</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {officeExpenses.map((e) => (
                <tr key={e.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm text-navy-500">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-700">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[e.category] }}></span>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${e.office === "Office 1" ? "badge-green" : "badge-gold"}`}>{e.office}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-navy-500">{e.description}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-navy-800">{formatPKR(e.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => remove(e.id)} className="text-navy-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Office Expense">
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
            <button onClick={save} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
