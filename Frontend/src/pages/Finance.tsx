import { useState, useMemo } from "react";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useApp } from "../context";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import { formatPKR, formatPKRShort, formatDate } from "../data";
import type { LedgerEntry } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Finance() {
  const { ledger, setLedger, showToast } = useApp();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Omit<LedgerEntry, "id">>({
    type: "income",
    category: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const totals = useMemo(() => {
    const income = ledger.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = ledger.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [ledger]);

  const chartData = useMemo(() => {
    const sorted = [...ledger].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.map((e) => {
      running += e.type === "income" ? e.amount : -e.amount;
      return { date: formatDate(e.date).slice(0, 6), amount: running, type: e.type };
    });
  }, [ledger]);

  const openAdd = () => {
    setForm({ type: "income", category: "", amount: 0, date: new Date().toISOString().slice(0, 10), description: "" });
    setModal(true);
  };

  const save = () => {
    if (!form.category || form.amount <= 0) {
      showToast("Please fill in category and amount", "error");
      return;
    }
    setLedger([{ ...form, id: "le" + Date.now() }, ...ledger]);
    showToast("Entry added successfully");
    setModal(false);
  };

  const remove = (id: string) => {
    setLedger(ledger.filter((e) => e.id !== id));
    showToast("Entry removed", "info");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Financial Management</h1>
          <p className="text-navy-400 text-sm mt-1">Income & expense ledger with running totals</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Income" value={formatPKRShort(totals.income)} icon={<ArrowUpCircle className="w-6 h-6" />} accent="primary" />
        <StatCard label="Total Expense" value={formatPKRShort(totals.expense)} icon={<ArrowDownCircle className="w-6 h-6" />} accent="red" />
        <StatCard label="Net Balance" value={formatPKRShort(totals.net)} icon={<Wallet className="w-6 h-6" />} accent={totals.net >= 0 ? "gold" : "red"} />
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-navy-900 mb-4">Running Balance Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatPKRShort(v).replace("Rs. ", "")} />
            <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Area type="monotone" dataKey="amount" name="Balance" stroke="#15803d" strokeWidth={2} fill="url(#balanceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ledger table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100">
          <h2 className="font-display font-bold text-navy-900">Ledger Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Description</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {ledger.map((e) => (
                <tr key={e.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm text-navy-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${e.type === "income" ? "badge-green" : "badge-red"}`}>
                      {e.type === "income" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-navy-700">{e.category}</td>
                  <td className="px-4 py-3 text-sm text-navy-500">{e.description}</td>
                  <td className={`px-4 py-3 text-right text-sm font-bold ${e.type === "income" ? "text-primary-600" : "text-red-500"}`}>
                    {e.type === "income" ? "+" : "−"}{formatPKR(e.amount)}
                  </td>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Add Ledger Entry">
        <div className="space-y-4">
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setForm({ ...form, type: "income" })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  form.type === "income" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-navy-100 text-navy-400"
                }`}
              >
                <ArrowUpCircle className="w-5 h-5" /> Income
              </button>
              <button
                onClick={() => setForm({ ...form, type: "expense" })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  form.type === "expense" ? "border-red-500 bg-red-50 text-red-600" : "border-navy-100 text-navy-400"
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" /> Expense
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hajj Booking" />
            </div>
            <div>
              <label className="label">Amount (PKR)</label>
              <input type="number" className="input" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button onClick={save} className="btn-primary">Save Entry</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
