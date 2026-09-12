import { useEffect, useState } from "react";
import { Menu, Shield, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context";
import { authApi } from "../lib/api";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { role } = useApp();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [fullName, setFullName] = useState("");

  useEffect(() => {
    void authApi.profile().then((p) => setFullName(p.full_name)).catch(() => {});
  }, []);

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || (isAdmin ? "SA" : "ST");

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
              Karwan-e-Miftah <span className="text-gold-600"></span>
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

        {fullName && (
          <span className="hidden sm:block text-sm font-medium text-navy-700 max-w-[140px] truncate">
            {fullName}
          </span>
        )}

        <button
          onClick={() => navigate("/settings")}
          title="Settings"
          className="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-white font-semibold text-sm hover:bg-primary-800 transition-colors"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
