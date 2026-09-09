import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Moon,
  Globe,
  CalendarClock,
  Plane,
  Building2,
  CalendarCheck,
  Package,
  ArrowRight,
  Users,
} from "lucide-react";
import { useApp } from "../context";
import StatCard from "../components/StatCard";
import { formatPKR, formatPKRShort, formatDate } from "../data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const {
    role,
    bookings,
    hajjPackages,
    umrahPackages,
    ledger,
    investments,
    officeExpenses,
  } = useApp();

  const isAdmin = role === "admin";

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((s, b) => s + b.advanceAmount, 0);
    const totalCost = ledger.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    const totalIncome = ledger.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalProfit = totalIncome - totalCost;
    const activePackages = hajjPackages.length + umrahPackages.length;
    const pendingBookings = bookings.filter((b) => b.paymentStatus !== "Paid").length;
    const totalInvested = investments.reduce((s, i) => s + i.amountInvested, 0);
    const totalExpenses = officeExpenses.reduce((s, e) => s + e.amount, 0);
    return { totalRevenue, totalProfit, activePackages, pendingBookings, totalInvested, totalExpenses };
  }, [bookings, hajjPackages, umrahPackages, ledger, investments, officeExpenses]);

  const upcomingDepartures = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
      .slice(0, 5);
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
      .slice(0, 5);
  }, [bookings]);

  // Chart data
  const incomeVsExpense = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    ledger.forEach((e) => {
      const month = new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const entry = map.get(month) ?? { income: 0, expense: 0 };
      if (e.type === "income") entry.income += e.amount;
      else entry.expense += e.amount;
      map.set(month, entry);
    });
    return Array.from(map.entries())
      .sort((a, b) => new Date("1 " + a[0]).getTime() - new Date("1 " + b[0]).getTime())
      .map(([month, v]) => ({ month, ...v }));
  }, [ledger]);

  const packageDistribution = useMemo(() => {
    return [
      { name: "Hajj", value: hajjPackages.length, color: "#15803d" },
      { name: "Umrah", value: umrahPackages.length, color: "#d97706" },
    ];
  }, [hajjPackages, umrahPackages]);

  if (!isAdmin) {
    // Staff dashboard
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="section-title">Staff Dashboard</h1>
          <p className="text-navy-400 text-sm mt-1">Quick overview of today's activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Bookings" value={String(bookings.filter(b => b.bookingDate === new Date().toISOString().slice(0, 10)).length)} icon={<CalendarCheck className="w-6 h-6" />} accent="primary" />
          <StatCard label="Available Packages" value={String(hajjPackages.length + umrahPackages.length)} icon={<Package className="w-6 h-6" />} accent="gold" />
          <StatCard label="Hajj Packages" value={String(hajjPackages.length)} icon={<Moon className="w-6 h-6" />} accent="navy" />
          <StatCard label="Umrah Packages" value={String(umrahPackages.length)} icon={<Globe className="w-6 h-6" />} accent="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-navy-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/bookings" className="btn-primary">
                <CalendarCheck className="w-5 h-5" />
                New Booking
              </Link>
              <Link to="/hajj" className="btn-outline">
                <Moon className="w-5 h-5" />
                View Hajj
              </Link>
              <Link to="/umrah" className="btn-outline">
                <Globe className="w-5 h-5" />
                View Umrah
              </Link>
              <Link to="/inventory" className="btn-outline">
                <Package className="w-5 h-5" />
                Inventory
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display font-bold text-navy-900 mb-4">Recent Bookings</h2>
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-navy-50 last:border-0">
                  <div>
                    <p className="font-medium text-navy-800 text-sm">{b.customerName}</p>
                    <p className="text-xs text-navy-400">{b.packageName}</p>
                  </div>
                  <span className={`badge ${b.paymentStatus === "Paid" ? "badge-green" : b.paymentStatus === "Partial" ? "badge-gold" : "badge-red"}`}>
                    {b.paymentStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="text-navy-400 text-sm mt-1">Overview of Karwan Travels operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatPKRShort(stats.totalRevenue)} icon={<Wallet className="w-6 h-6" />} accent="primary" />
        <StatCard label="Net Profit" value={formatPKRShort(Math.round(stats.totalProfit))} icon={<TrendingUp className="w-6 h-6" />} accent={stats.totalProfit >= 0 ? "gold" : "red"} />
        <StatCard label="Active Packages" value={String(stats.activePackages)} icon={<Package className="w-6 h-6" />} accent="navy" />
        <StatCard label="Pending Bookings" value={String(stats.pendingBookings)} icon={<CalendarClock className="w-6 h-6" />} accent="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Investment Portfolio" value={formatPKRShort(stats.totalInvested)} icon={<Building2 className="w-6 h-6" />} accent="primary" />
        <StatCard label="Office Expenses" value={formatPKRShort(stats.totalExpenses)} icon={<Wallet className="w-6 h-6" />} accent="navy" />
        <StatCard label="Hajj Packages" value={String(hajjPackages.length)} icon={<Moon className="w-6 h-6" />} accent="gold" />
        <StatCard label="Umrah Packages" value={String(umrahPackages.length)} icon={<Globe className="w-6 h-6" />} accent="primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold text-navy-900 mb-4">Income vs Expense</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatPKRShort(v).replace("Rs. ", "")} />
              <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#15803d" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold text-navy-900 mb-4">Package Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={packageDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {packageDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming departures & recent bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-navy-900">Upcoming Departures</h2>
            <Link to="/bookings" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingDepartures.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-navy-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-800 text-sm truncate">{b.customerName}</p>
                  <p className="text-xs text-navy-400">{b.packageName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy-700">{formatDate(b.departureDate)}</p>
                  <p className="text-xs text-navy-400">{b.serviceType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-navy-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-navy-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-800 text-sm truncate">{b.customerName}</p>
                  <p className="text-xs text-navy-400">{formatDate(b.bookingDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy-700">{formatPKRShort(b.finalPrice)}</p>
                  <span className={`badge ${b.paymentStatus === "Paid" ? "badge-green" : b.paymentStatus === "Partial" ? "badge-gold" : "badge-red"}`}>
                    {b.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
