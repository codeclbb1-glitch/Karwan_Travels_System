import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, User, Building2, CheckCircle, KeyRound } from "lucide-react";
import { useApp } from "../context";
import { authApi } from "../lib/api";
import { usersApi } from "../lib/userManagementApi";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { role, showToast } = useApp();
  const isAdmin = role === "admin";

  const [profile, setProfile] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [p, { data: userData }] = await Promise.all([authApi.profile(), authApi.session()]);
        const email = userData.session?.user.email ?? "—";
        setProfile({ id: p.id, full_name: p.full_name, email });
        setFullName(p.full_name);
      } catch { /* silent */ }
    })();
  }, []);

  const handleSave = async () => {
    if (!profile || !fullName.trim()) return;
    setSaving(true);
    try {
      await usersApi.updateProfile(profile.id, fullName.trim());
      setProfile((prev) => prev ? { ...prev, full_name: fullName.trim() } : prev);
      setDirty(false);
      showToast("Profile updated successfully");
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    if (!pwForm.next || pwForm.next.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    setPwSaving(true);
    try {
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user");
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pwForm.current });
      if (signInErr) { setPwError("Current password is incorrect"); return; }
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      setPwForm({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully");
    } catch (e) {
      if (!pwError) setPwError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-navy-400 text-sm mt-1">Agency configuration and your account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agency Info */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Agency Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: "Agency Name", value: "Karwan Travels (KMR)" },
              { label: "Contact Number", value: "0321-9961199" },
              { label: "Address", value: "Deans Trade Centre, Office UG 324 & 326" },
              { label: "City", value: "Saddar Cantt, Peshawar" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-navy-50 last:border-0">
                <span className="text-navy-500">{label}</span>
                <span className="font-medium text-navy-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Account */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">My Account</h2>
          </div>
          {profile ? (
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setDirty(true); }}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-navy-50 text-navy-500 cursor-not-allowed" value={profile.email} readOnly />
              </div>
              <div>
                <label className="label">Role</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-navy-200 bg-navy-50">
                  {isAdmin ? <Shield className="w-4 h-4 text-gold-600" /> : <User className="w-4 h-4 text-navy-500" />}
                  <span className="text-sm font-medium text-navy-700">
                    {isAdmin ? "Super Admin / CEO" : "Staff"}
                  </span>
                </div>
              </div>
              {dirty && (
                <button onClick={() => void handleSave()} disabled={saving} className="btn-primary w-full">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-navy-100 animate-pulse" />
              ))}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Change Password</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} placeholder="Min. 8 characters" autoComplete="new-password" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Repeat new password" autoComplete="new-password" />
            </div>
            {pwError && <p className="text-xs text-red-500">{pwError}</p>}
            <button onClick={() => void handleChangePassword()} disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm} className="btn-primary w-full">
              <KeyRound className="w-4 h-4" />
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>

        {/* Access Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">Access Summary</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Dashboard", "Hajj", "Umrah", "Bookings", "Inventory", "Display Screen"].map((m) => (
              <span key={m} className="badge badge-green">{m}</span>
            ))}
            {isAdmin && ["Pricing", "Finance", "Investments", "Office Expenses", "User Management"].map((m) => (
              <span key={m} className="badge badge-gold">{m}</span>
            ))}
          </div>
          <p className="text-xs text-navy-400 mt-3">
            {isAdmin ? "Full access — all modules including financials and user management." : "Standard access — financial and admin modules are restricted."}
          </p>
        </div>

        {/* System Info */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h2 className="font-display font-bold text-navy-900">System</h2>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: "System", value: "KMR Hajj & Umrah Management" },
              { label: "Version", value: "1.0.0" },
              { label: "Currency", value: "PKR (Rs.)" },
              { label: "Date Format", value: "DD Mon YYYY" },
              { label: "Theme", value: "Green / Gold / Navy" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-navy-50 last:border-0">
                <span className="text-navy-500">{label}</span>
                <span className="font-medium text-navy-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
