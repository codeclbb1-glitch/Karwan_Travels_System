import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Moon } from "lucide-react";
import { useApp } from "../context";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async () => {
    setPending(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Unable to sign in. Check your credentials or Supabase configuration.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 islamic-pattern">
      <div className="absolute inset-0 bg-navy-900/20"></div>
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-700 shadow-lg mb-4">
            <Moon className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white">Karwan Travels</h1>
          <p className="text-gold-300 font-semibold tracking-widest text-sm mt-1">KMR</p>
          <p className="text-white/70 text-sm mt-2">Hajj & Umrah Management System</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 animate-slide-up">
          <h2 className="font-display font-bold text-navy-900 text-lg mb-1">Welcome Back</h2>
          <p className="text-sm text-navy-400 mb-5">Sign in with your agency account</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
          <button onClick={() => void handleLogin()} disabled={pending} className="btn-primary w-full text-base py-3 disabled:opacity-60">
            {pending ? "Signing In..." : "Sign In"}
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-navy-300 mt-4">Access is granted by your Supabase profile role.</p>
        </div>
      </div>
    </div>
  );
}
