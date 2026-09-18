import { useState, useMemo } from "react";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Search } from "lucide-react";
import { useApp } from "../context";
import StatCard from "../components/StatCard";
import { formatPKR, formatPKRShort, formatDate } from "../data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import Pagination from "../components/Pagination";

export default function Finance() {
  const { bookings, officeExpenses } = useApp();
  const [search, setSearch] = useState("");
  const [financePage, setFinancePage] = useState(1);
  const FINANCE_PAGE_SIZE = 10;

  const stats = useMemo(() => {
    const hajjBookings = bookings.filter((b) => b.serviceType === "Hajj");
    const umrahBookings = bookings.filter((b) => b.serviceType === "Umrah");

    const sum = (arr: typeof bookings, key: "advanceAmount" | "finalPrice") =>
      arr.reduce((s, b) => s + b[key], 0);

    const hajjCollected = sum(hajjBookings, "advanceAmount");
    const hajjTotal = sum(hajjBookings, "finalPrice");
    const umrahCollected = sum(umrahBookings, "advanceAmount");
    const umrahTotal = sum(umrahBookings, "finalPrice");

    const totalCollected = hajjCollected + umrahCollected;
    const totalOutstanding = (hajjTotal - hajjCollected) + (umrahTotal - umrahCollected);
    const totalExpenses = officeExpenses.reduce((s, e) => s + e.amount, 0);

    return {
      totalCollected, totalOutstanding, totalExpenses,
      net: totalCollected - totalExpenses,
      hajjCollected, hajjOutstanding: hajjTotal - hajjCollected,
      umrahCollected, umrahOutstanding: umrahTotal - umrahCollected,
    };
  }, [bookings, officeExpenses]);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; collected: number; expenses: number }> = {};

    bookings.forEach((b) => {
      const key = b.bookingDate.slice(0, 7);
      if (!months[key]) months[key] = { month: key, collected: 0, expenses: 0 };
      months[key].collected += b.advanceAmount;
    });

    officeExpenses.forEach((e) => {
      const key = e.date.slice(0, 7);
      if (!months[key]) months[key] = { month: key, collected: 0, expenses: 0 };
      months[key].expenses += e.amount;
    });

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({
        ...d,
        month: new Date(d.month + "-01").toLocaleDateString("en-PK", { month: "short", year: "2-digit" }),
      }));
  }, [bookings, officeExpenses]);

  const filteredBookings = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      b.customerName.toLowerCase().includes(q) ||
      b.packageName.toLowerCase().includes(q) ||
      b.serviceType.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const pagedFinanceBookings = useMemo(
    () => filteredBookings.slice((financePage - 1) * FINANCE_PAGE_SIZE, financePage * FINANCE_PAGE_SIZE),
    [filteredBookings, financePage]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Financial Overview</h1>
        <p className="text-navy-400 text-sm mt-1">Auto-calculated from bookings and office expenses</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatPKRShort(stats.totalCollected)} icon={<ArrowUpCircle className="w-6 h-6" />} accent="primary" />
        <StatCard label="Outstanding" value={formatPKRShort(stats.totalOutstanding)} icon={<Clock className="w-6 h-6" />} accent="gold" />
        <StatCard label="Office Expenses" value={formatPKRShort(stats.totalExpenses)} icon={<ArrowDownCircle className="w-6 h-6" />} accent="red" />
        <StatCard label="Net Balance" value={formatPKRShort(stats.net)} icon={<Wallet className="w-6 h-6" />} accent={stats.net >= 0 ? "primary" : "red"} />
      </div>

      {/* Hajj vs Umrah breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <h2 className="font-display font-bold text-navy-900">Hajj Income</h2>
          <div className="flex justify-between text-sm">
            <span className="text-navy-500">Collected</span>
            <span className="font-semibold text-primary-600">{formatPKR(stats.hajjCollected)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-navy-500">Outstanding</span>
            <span className="font-semibold text-gold-600">{formatPKR(stats.hajjOutstanding)}</span>
          </div>
          <div className="border-t border-navy-100 pt-2 flex justify-between text-sm font-bold">
            <span className="text-navy-700">Total Value</span>
            <span className="text-navy-900">{formatPKR(stats.hajjCollected + stats.hajjOutstanding)}</span>
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <h2 className="font-display font-bold text-navy-900">Umrah Income</h2>
          <div className="flex justify-between text-sm">
            <span className="text-navy-500">Collected</span>
            <span className="font-semibold text-primary-600">{formatPKR(stats.umrahCollected)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-navy-500">Outstanding</span>
            <span className="font-semibold text-gold-600">{formatPKR(stats.umrahOutstanding)}</span>
          </div>
          <div className="border-t border-navy-100 pt-2 flex justify-between text-sm font-bold">
            <span className="text-navy-700">Total Value</span>
            <span className="text-navy-900">{formatPKR(stats.umrahCollected + stats.umrahOutstanding)}</span>
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-navy-900 mb-4">Monthly: Collected vs Expenses</h2>
        {chartData.length === 0 ? (
          <p className="text-navy-400 text-sm text-center py-10">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatPKRShort(v).replace("Rs. ", "")} />
              <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="collected" name="Collected" fill="#15803d" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bookings income table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display font-bold text-navy-900">Booking Income</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input className="input pl-9 w-56 text-sm" placeholder="Search customer or package..." value={search} onChange={(e) => { setSearch(e.target.value); setFinancePage(1); }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-50 border-b border-navy-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Package</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Collected</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wide">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filteredBookings.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-navy-400 text-sm">{search ? "No results found" : "No bookings yet"}</td></tr>
              )}
              {pagedFinanceBookings.map((b) => (
                <tr key={b.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm text-navy-500">{formatDate(b.bookingDate)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-navy-700">{b.customerName}</td>
                  <td className="px-4 py-3 text-sm text-navy-500">{b.packageName}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${b.serviceType === "Hajj" ? "badge-green" : "badge-blue"}`}>{b.serviceType}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-primary-600">{formatPKR(b.advanceAmount)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gold-600">{formatPKR(b.finalPrice - b.advanceAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={financePage} totalPages={Math.max(1, Math.ceil(filteredBookings.length / FINANCE_PAGE_SIZE))} totalItems={filteredBookings.length} pageSize={FINANCE_PAGE_SIZE} onPageChange={setFinancePage} />
      </div>
    </div>
  );
}
