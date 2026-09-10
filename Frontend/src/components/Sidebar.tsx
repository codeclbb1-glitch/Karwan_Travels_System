import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Moon,
  Globe,
  CalendarCheck,
  Monitor,
  Tag,
  Wallet,
  TrendingUp,
  Building2,
  Package,
  Settings,
  LogOut,
  X,
  Users,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useApp } from "../context";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { role, logout } = useApp();
  const isAdmin = role === "admin";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/hajj", label: "Hajj", icon: Moon, show: true },
    { to: "/umrah", label: "Umrah", icon: Globe, show: true },
    { to: "/bookings", label: "Bookings", icon: CalendarCheck, show: true },
    { to: "/display", label: "Display Screen", icon: Monitor, show: true },
    { to: "/pricing", label: "Pricing", icon: Tag, show: isAdmin },
    { to: "/finance", label: "Finance", icon: Wallet, show: isAdmin },
    { to: "/investments", label: "Investments", icon: TrendingUp, show: isAdmin },
    { to: "/office-expenses", label: "Office Expenses", icon: Building2, show: isAdmin },
    { to: "/users", label: "User Management", icon: Users, show: isAdmin },
    { to: "/inventory", label: "Inventory", icon: Package, show: true },
    { to: "/tasks", label: "Tasks", icon: ClipboardList, show: true },
    { to: "/settings", label: "Settings", icon: Settings, show: true },
  ].filter((item) => item.show);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-navy-900/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-navy-50 border-r border-navy-100 z-40 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center shadow-sm">
              <span className="text-gold-400 font-display font-bold text-lg">K</span>
            </div>
            <div>
              <p className="font-display font-bold text-navy-900 text-sm leading-tight">Karwan Travels</p>
              <p className="text-xs text-navy-400 font-medium">KMR</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-navy-400 hover:text-navy-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-navy-100">
          <button
            onClick={() => setConfirmOpen(true)}
            className="sidebar-link w-full text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign-out confirmation modal */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={() => !signingOut && setConfirmOpen(false)}>
          <div
            className="modal-panel w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-navy-900 text-lg">Sign Out?</h3>
                <p className="text-navy-400 text-sm mt-1">
                  You will be returned to the login screen. Any unsaved changes will be lost.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-1">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={signingOut}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="btn-danger flex-1"
                >
                  {signingOut ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing out...
                    </span>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
