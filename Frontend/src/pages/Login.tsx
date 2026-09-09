import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Moon, Star, MapPin } from "lucide-react";
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
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12 islamic-pattern overflow-hidden">
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-primary-900/80" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-400/20 blur-3xl" />

        {/* Top logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-700/80 border border-gold-400/30 flex items-center justify-center shadow-lg">
            <span className="text-gold-400 font-display font-bold text-xl">K</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">Karwan Travels</p>
            <p className="text-gold-300 text-xs font-semibold tracking-widest">KMR</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-primary-700/60 border border-gold-400/20 flex items-center justify-center shadow-2xl">
            <Moon className="w-10 h-10 text-gold-400" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-4xl xl:text-5xl text-white leading-tight">
              Hajj & Umrah<br />
              <span className="text-gold-400">Management</span>
            </h1>
            <p className="text-white/60 text-lg mt-4 max-w-sm leading-relaxed">
              Complete operations platform for Karwan Travels — bookings, finance, inventory, and more.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: Star, text: "Manage Hajj & Umrah packages" },
              { icon: MapPin, text: "Track bookings and customers" },
              { icon: Moon, text: "Full financial oversight" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <span className="text-white/70 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Karwan Travels (KMR). All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center shadow-lg mb-3">
            <Moon className="w-8 h-8 text-gold-400" />
          </div>
          <p className="font-display font-bold text-navy-900 text-xl">Karwan Travels</p>
          <p className="text-gold-600 text-xs font-semibold tracking-widest mt-0.5">KMR</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display font-extrabold text-2xl text-navy-900">Welcome back</h2>
            <p className="text-navy-400 text-sm mt-1">Sign in to your agency account</p>
          </div>

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
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
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
