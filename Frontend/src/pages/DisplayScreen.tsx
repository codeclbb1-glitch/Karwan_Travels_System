import { useState, useEffect, useMemo } from "react";
import { Moon, Globe, Plane, Hotel, Car, Utensils, Stamp, MapPin, Clock, Star } from "lucide-react";
import { useApp } from "../context";
import { formatPKR } from "../data";

const serviceIcons: Record<string, typeof Plane> = {
  "Airline": Plane,
  "Visa": Stamp,
  "Hotel": Hotel,
  "Hotel Madina": Hotel,
  "Hotel Makkah": Hotel,
  "Transport": Car,
  "Food": Utensils,
  "Guide": Star,
  "Air Ticket": Plane,
  "Private Room": Hotel,
};

export default function DisplayScreen() {
  const { hajjPackages, umrahPackages } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"carousel" | "grid">("carousel");

  const allPackages = useMemo(() => {
    const hajj = hajjPackages.map((p) => ({
      id: p.id,
      name: p.name,
      type: "Hajj" as const,
      price: p.sellingPrice,
      durationDays: p.durationDays,
      inclusions: p.inclusions,
      description: p.description,
    }));
    const umrah = umrahPackages.map((p) => ({
      id: p.id,
      name: p.name,
      type: "Umrah" as const,
      price: p.sellingPrice,
      durationDays: p.durationDays,
      inclusions: p.inclusions,
      description: p.description,
    }));
    return [...hajj, ...umrah];
  }, [hajjPackages, umrahPackages]);

  useEffect(() => {
    if (mode !== "carousel" || allPackages.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allPackages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [mode, allPackages.length]);

  const currentPackage = allPackages[currentIndex];

  return (
    <div className="min-h-screen overflow-hidden relative">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg_display.jpg')" }}></div>
      <div className="absolute inset-0 backdrop-blur-sm bg-navy-900/40"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-gold-400/30">
            <img src="/logo.jpeg" alt="KMR Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-white">Karwan-e-Miftah</h1>
            <p className="text-gold-300 font-semibold tracking-widest text-sm">KMR · HAJJ & UMRAH</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode("carousel")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === "carousel" ? "bg-gold-500 text-navy-900" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Carousel
          </button>
          <button
            onClick={() => setMode("grid")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === "grid" ? "bg-gold-500 text-navy-900" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Carousel mode */}
      {mode === "carousel" && currentPackage && (
        <div className="relative z-10 flex items-center justify-center px-8 pb-8" style={{ minHeight: "calc(100vh - 120px)" }}>
          <div key={currentPackage.id} className="w-full max-w-4xl animate-scale-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10">
              <div className="flex items-center justify-between mb-6">
                <span className={`badge ${currentPackage.type === "Hajj" ? "badge-green" : "badge-gold"} text-base px-4 py-1.5`}>
                  {currentPackage.type === "Hajj" ? <Moon className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  {currentPackage.type}
                </span>
                <div className="flex items-center gap-2 text-navy-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">{currentPackage.durationDays} Days</span>
                </div>
              </div>

              <h2 className="font-display font-extrabold text-4xl text-navy-900 mb-3">{currentPackage.name}</h2>
              <p className="text-lg text-navy-500 mb-6">{currentPackage.description}</p>

              {/* Inclusions */}
              <div className="flex flex-wrap gap-3 mb-8">
                {currentPackage.inclusions.map((inc) => {
                  const Icon = serviceIcons[inc] || Star;
                  return (
                    <div key={inc} className="flex items-center gap-2 bg-navy-50 rounded-xl px-4 py-2.5">
                      <Icon className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-medium text-navy-700">{inc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-primary-200 text-sm font-medium uppercase tracking-wide">Starting Price</p>
                  <p className="text-4xl font-display font-extrabold text-white mt-1">{formatPKR(currentPackage.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-200 text-sm">Per Pilgrim</p>
                  <p className="text-gold-300 font-semibold mt-1">All inclusive</p>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {allPackages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIndex ? "w-8 bg-gold-400" : "w-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid mode */}
      {mode === "grid" && (
        <div className="relative z-10 px-8 pb-8 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${pkg.type === "Hajj" ? "badge-green" : "badge-gold"}`}>
                    {pkg.type === "Hajj" ? <Moon className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {pkg.type}
                  </span>
                  <span className="text-sm text-navy-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {pkg.durationDays}d
                  </span>
                </div>
                <h3 className="font-display font-bold text-navy-900 text-lg mb-1">{pkg.name}</h3>
                <p className="text-xs text-navy-400 mb-3">{pkg.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {pkg.inclusions.slice(0, 4).map((inc) => {
                    const Icon = serviceIcons[inc] || Star;
                    return (
                      <span key={inc} className="inline-flex items-center gap-1 text-xs text-navy-500 bg-navy-50 px-2 py-1 rounded-lg">
                        <Icon className="w-3 h-3" /> {inc}
                      </span>
                    );
                  })}
                  {pkg.inclusions.length > 4 && (
                    <span className="text-xs text-navy-400 px-2 py-1">+{pkg.inclusions.length - 4} more</span>
                  )}
                </div>
                <div className="pt-3 border-t border-navy-50">
                  <p className="text-xs text-navy-400">Price</p>
                  <p className="text-2xl font-display font-bold text-primary-700">{formatPKR(pkg.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-8 py-3 bg-navy-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between text-white/60 text-sm">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Main Office, Lahore · Karachi
          </span>
          <span>For bookings & inquiries contact: 0800-KMR-HAJJ</span>
        </div>
      </div>
    </div>
  );
}
