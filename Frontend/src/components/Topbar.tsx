import { Menu, Bell, Shield, User } from "lucide-react";
import { useApp } from "../context";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { role } = useApp();
  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-navy-100 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-navy-600 hover:bg-navy-100 rounded-lg p-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center lg:hidden">
            <span className="text-gold-400 font-display font-bold text-sm">K</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-navy-900 text-base lg:text-lg leading-tight">
              Karwan Travels <span className="text-gold-600">(KMR)</span>
            </h1>
            <p className="text-xs text-navy-400 hidden sm:block">Hajj & Umrah Management System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`badge ${isAdmin ? "badge-gold" : "badge-navy"}`}>
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          {isAdmin ? "Super Admin" : "Staff"}
        </div>
        <button className="relative text-navy-500 hover:bg-navy-100 rounded-lg p-2 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full"></span>
        </button>
        <div className="w-9 h-9 rounded-full bg-navy-200 flex items-center justify-center text-navy-700 font-semibold text-sm">
          {isAdmin ? "SA" : "ST"}
        </div>
      </div>
    </header>
  );
}
