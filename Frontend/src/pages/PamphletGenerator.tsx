import { useState } from "react";
import { Printer, FileText, Moon, Globe, Check } from "lucide-react";
import { useApp } from "../context";
import { formatPKR } from "../data";
import { buildPamphletHtml } from "../lib/pamphletHtml";

export default function PamphletGenerator() {
  const { hajjPackages, umrahPackages } = useApp();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("0300-0000000");
  const [email, setEmail] = useState("info@karwanmiftah.com");
  const [address, setAddress] = useState("Main Office, Lahore");
  const [tagline, setTagline] = useState("Your Trusted Partner for Hajj & Umrah");

  const allPackages = [
    ...hajjPackages.map((p) => ({ ...p, serviceType: "Hajj" as const })),
    ...umrahPackages.map((p) => ({ ...p, serviceType: "Umrah" as const })),
  ];

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handlePrint = () => {
    const selected = allPackages.filter((p) => selectedIds.has(p.id));
    if (!selected.length) return;
    const html = buildPamphletHtml(selected, phone, email, address, tagline);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Pamphlet Generator</h1>
        <p className="text-navy-400 text-sm mt-1">Select packages, fill contact details, then generate a print-ready pamphlet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package selector */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-navy-900">Select Packages</h2>
              {selectedIds.size > 0 && (
                <span className="text-xs text-primary-600 font-semibold">{selectedIds.size} selected</span>
              )}
            </div>

            {allPackages.length === 0 ? (
              <p className="text-navy-400 text-sm py-6 text-center">No packages found. Add Hajj or Umrah packages first.</p>
            ) : (
              <div className="space-y-2">
                {allPackages.map((pkg) => {
                  const active = selectedIds.has(pkg.id);
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => toggle(pkg.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        active ? "border-primary-500 bg-primary-50" : "border-navy-100 hover:border-navy-200 bg-white"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? "bg-primary-600" : pkg.serviceType === "Hajj" ? "bg-green-50" : "bg-amber-50"
                      }`}>
                        {active
                          ? <Check className="w-4 h-4 text-white" />
                          : pkg.serviceType === "Hajj"
                            ? <Moon className="w-4 h-4 text-green-700" />
                            : <Globe className="w-4 h-4 text-amber-700" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-navy-800 text-sm">{pkg.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pkg.serviceType === "Hajj" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>{pkg.serviceType}</span>
                        </div>
                        <p className="text-xs text-navy-400 mt-0.5 truncate">
                          {pkg.durationDays} days
                          {pkg.inclusions.length > 0 && ` · ${pkg.inclusions.slice(0, 4).join(", ")}${pkg.inclusions.length > 4 ? "…" : ""}`}
                        </p>
                      </div>
                      <span className="font-bold text-primary-700 text-sm flex-shrink-0">{formatPKR(pkg.sellingPrice)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Settings + generate */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-display font-bold text-navy-900">Contact Details</h2>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300-0000000" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@example.com" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Office address" />
            </div>
            <div>
              <label className="label">Tagline</label>
              <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your tagline" />
            </div>
          </div>

          <button
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Generate &amp; Print ({selectedIds.size} package{selectedIds.size !== 1 ? "s" : ""})
          </button>

          <p className="text-xs text-navy-400 text-center leading-relaxed">
            Opens a print-ready A4 pamphlet in a new tab.<br />Use browser "Save as PDF" to export.
          </p>
        </div>
      </div>
    </div>
  );
}
