import { useApp } from "../context";
import { Settings as SettingsIcon, Shield, User, Moon, Building2, Bell } from "lucide-react";

export default function Settings() {
  const { role } = useApp();
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-navy-400 text-sm mt-1">Agency configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Agency Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Agency Name</label>
              <input className="input" defaultValue="Karwan Travels (KMR)" readOnly />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input" defaultValue="0800-KMR-HAJJ" readOnly />
            </div>
            <div>
              <label className="label">Main Office Address</label>
              <input className="input" defaultValue="Gulberg III, Lahore" readOnly />
            </div>
            <div>
              <label className="label">Second Office Address</label>
              <input className="input" defaultValue="PECHS, Karachi" readOnly />
            </div>
          </div>
        </div>

        {/* Role Info */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Current Role</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-50">
              {isAdmin ? <Shield className="w-5 h-5 text-gold-600" /> : <User className="w-5 h-5 text-navy-600" />}
              <div>
                <p className="font-medium text-navy-800">{isAdmin ? "Super Admin / CEO" : "User / Staff"}</p>
                <p className="text-xs text-navy-400">
                  {isAdmin ? "Full access to all modules including financials" : "Limited access — no cost or financial data"}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-navy-700">Access Summary:</p>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-green">Dashboard</span>
                <span className="badge badge-green">Hajj</span>
                <span className="badge badge-green">Umrah</span>
                <span className="badge badge-green">Bookings</span>
                <span className="badge badge-green">Inventory</span>
                <span className="badge badge-green">Display Screen</span>
                {isAdmin && <span className="badge badge-gold">Pricing</span>}
                {isAdmin && <span className="badge badge-gold">Finance</span>}
                {isAdmin && <span className="badge badge-gold">Investments</span>}
                {isAdmin && <span className="badge badge-gold">Office Expenses</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-navy-700">Currency</p>
                <p className="text-xs text-navy-400">Display format for all amounts</p>
              </div>
              <span className="badge badge-navy">PKR (Rs.)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-navy-50">
              <div>
                <p className="text-sm font-medium text-navy-700">Date Format</p>
                <p className="text-xs text-navy-400">How dates are shown</p>
              </div>
              <span className="badge badge-navy">DD Mon YYYY</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-navy-50">
              <div>
                <p className="text-sm font-medium text-navy-700">Theme</p>
                <p className="text-xs text-navy-400">Visual appearance</p>
              </div>
              <span className="badge badge-green">Green / Gold / Navy</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Moon className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">About</h2>
          </div>
          <div className="space-y-3 text-sm text-navy-500">
            <p><span className="font-medium text-navy-700">System:</span> Karwan Travels (KMR) — Hajj & Umrah Management System</p>
            <p><span className="font-medium text-navy-700">Version:</span> 1.0.0 (Demo)</p>
            <p><span className="font-medium text-navy-700">Purpose:</span> Client presentation with realistic mock data</p>
            <p className="text-xs text-navy-400 pt-2 border-t border-navy-50">
              This is a demonstration system. All data shown is sample/mock data for presentation purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
