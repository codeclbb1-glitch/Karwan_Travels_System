import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Star, BarChart3, Users, Lock } from "lucide-react";
import { useApp } from "../context";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { 
      setError("Please enter your email and password."); 
      return; 
    }
    setPending(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid credentials. Please check your email and password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* ── Left panel (Branding) ── */}
      <div className="relative hidden lg:flex flex-col overflow-hidden bg-primary-900 islamic-pattern">
        {/* Subtle, elegant gradient overlay instead of glowing blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-900/90 to-primary-950/95" />

        {/* Content Wrapper */}
        <div className="relative flex flex-col h-full px-12 py-10 justify-between">
          
          {/* Top Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm overflow-hidden shadow-sm">
              <img src="/logo.jpeg" alt="KMR Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-none tracking-wide">
                Karwan-e-Miftah
              </p>
              <p className="text-gold-400 text-xs font-semibold tracking-widest mt-1">KMR</p>
            </div>
          </div>

          {/* Center Copy */}
          <div className="max-w-md mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 mb-8">
              <Moon className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-wider">
                Agency Portal
              </span>
            </div>
            
            <h1 className="font-display font-bold text-white leading-tight text-4xl lg:text-5xl mb-6">
              Hajj & Umrah <br />
              <span className="text-gold-400">Management.</span>
            </h1>
            
            <p className="text-white/70 text-lg leading-relaxed mb-12">
              The complete operational platform for Karwan Travels. Manage bookings, oversee finances, and control inventory from one dashboard.
            </p>

            {/* Feature Grid - Professional layout instead of floating pills */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8">
              {[
                { icon: Moon, text: "Package Assembly" },
                { icon: Users, text: "Customer Tracking" },
                { icon: BarChart3, text: "Financial Oversight" },
                { icon: Star, text: "Inventory Control" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col gap-2">
                  <Icon className="w-5 h-5 text-gold-400" />
                  <span className="text-white/90 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex items-center justify-between text-white/40 text-xs font-medium">
            <p>© {new Date().getFullYear()} Karwan-e-Miftah (KMR). All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Secure Server</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (Form) ── */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-12 lg:px-16">
        
        {/* Mobile-only logo header */}
        <div className="lg:hidden flex flex-col items-center mb-10 w-full max-w-sm">
          <div className="w-12 h-12 rounded-sm overflow-hidden shadow-sm mb-4">
            <img src="/logo.jpeg" alt="KMR Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-navy-900 text-2xl">Karwan-e-Miftah</h1>
          <p className="text-gold-600 text-xs font-semibold tracking-widest mt-1">AGENCY PORTAL</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8 lg:mb-10 text-left">
            <h2 className="font-display font-bold text-3xl text-navy-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-navy-500 text-sm mt-2">
              Sign in to your agency account to continue.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                // Kept your .input class, but added robust fallback utility classes for a crisp look
                className="input w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                autoComplete="email"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
              <div className="mt-0.5 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium leading-tight">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={() => void handleLogin()}
            disabled={pending}
            className="btn-primary w-full flex items-center justify-center gap-2 bg-primary-900 hover:bg-primary-800 disabled:bg-primary-900/70 text-white font-medium py-2.5 px-4 rounded-lg mt-6 transition-all shadow-sm focus:ring-4 focus:ring-primary-900/10"
          >
            {pending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Note */}
          <p className="text-center text-xs text-navy-400 mt-8">
            System access is managed by your administrator. <br />
            Need help? Contact IT support.
          </p>
        </div>
      </div>

    </div>
  );
}