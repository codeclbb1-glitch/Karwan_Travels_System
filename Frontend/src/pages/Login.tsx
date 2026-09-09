import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Star, BarChart3, Users } from "lucide-react";
import { useApp } from "../context";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="relative hidden lg:flex flex-col islamic-pattern overflow-hidden">
        {/* dark overlay */}
        <div className="absolute inset-0 bg-primary-900/85" />

        {/* glow blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* content */}
        <div className="relative flex flex-col h-full px-12 py-10">

          {/* top logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-gold-400/30 flex items-center justify-center">
              <span className="text-gold-400 font-display font-bold text-lg">K</span>
            </div>
            <div>
              <p className="font-display font-bold text-white text-base leading-tight">Karwan Travels</p>
              <p className="text-gold-400 text-xs font-semibold tracking-[0.2em]">KMR</p>
            </div>
          </div>

          {/* center */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-gold-400/20 flex items-center justify-center">
              <Moon className="w-8 h-8 text-gold-400" />
            </div>

            <div>
              <h1 className="font-display font-extrabold text-white leading-tight" style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)" }}>
                Hajj &amp; Umrah<br />
                <span className="text-gold-400">Management</span>
              </h1>
              <p className="text-white/55 text-base mt-4 leading-relaxed max-w-xs">
                Complete operations platform for Karwan Travels — bookings, finance, inventory, and more.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { icon: Moon,      text: "Manage Hajj & Umrah packages" },
                { icon: Users,     text: "Track bookings and customers"  },
                { icon: BarChart3, text: "Full financial oversight"       },
                { icon: Star,      text: "Inventory & display screen"     },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-400/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <span className="text-white/65 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* bottom */}
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} Karwan Travels (KMR). All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 sm:px-12">

        {/* mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center shadow-lg mb-3">
            <Moon className="w-7 h-7 text-gold-400" />
          </div>
          <p className="font-display font-bold text-navy-900 text-xl">Karwan Travels</p>
          <p className="text-gold-600 text-xs font-semibold tracking-widest mt-1">KMR</p>
        </div>

        <div className="w-full max-w-md">

          {/* heading */}
          <div className="mb-8">
            <h2 className="font-display font-extrabold text-3xl text-navy-900 leading-tight">Welcome back</h2>
            <p className="text-navy-400 text-sm mt-2">Sign in to your agency account to continue</p>
          </div>

          {/* form */}
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={() => void handleLogin()}
            disabled={pending}
            className="btn-primary w-full text-base py-3 mt-6"
          >
            {pending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-xs text-navy-300 mt-6">
            Access is managed by your administrator.
          </p>
        </div>
      </div>

    </div>
  );
}
