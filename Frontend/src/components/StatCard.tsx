import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: "primary" | "gold" | "navy" | "red";
}

export default function StatCard({ label, value, icon, trend, trendUp, accent = "primary" }: StatCardProps) {
  const accentClasses = {
    primary: "bg-primary-50 text-primary-600",
    gold: "bg-gold-50 text-gold-600",
    navy: "bg-navy-100 text-navy-600",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="stat-card card-hover">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-display font-bold text-navy-900 truncate">{value}</p>
        {trend && (
          <p className={`text-xs font-medium mt-0.5 ${trendUp ? "text-primary-600" : "text-red-500"}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
