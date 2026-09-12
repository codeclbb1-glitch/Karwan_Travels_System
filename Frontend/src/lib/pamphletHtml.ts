import type { HajjPackage, UmrahPackage } from "../types";

type AnyPackage = (HajjPackage | UmrahPackage) & { serviceType: "Hajj" | "Umrah" };

const formatPKR = (n: number) =>
  "Rs. " + n.toLocaleString("en-PK", { minimumFractionDigits: 0 });

// Inline SVG icons — no external deps needed in print window
const svgPhone = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const svgMail = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const svgClock = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const svgCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const svgStar = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const svgPlane = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.5-.9 1 0 .3.1.6.3.8l7 7c.2.2.5.3.8.3.5 0 .9-.4 1-.9L11 8l3 3-1.2 8.2c-.1.5.2 1 .7 1.2.2.1.4.1.6.1.3 0 .6-.1.8-.3l2.5-2.5c.3-.3.4-.7.4-1.1z"/></svg>`;
const svgHotel = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/><path d="m9 22 .01-4h6L15 22"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>`;
const svgCar = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5v-5l2-6h10l2 6v5z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>`;
const svgVisa = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 10h18"/></svg>`;
const svgFood = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`;
const svgShield = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const svgAward = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
const svgUsers = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgGlobe = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

const inclusionIcon: Record<string, string> = {
  "Airline": svgPlane, "Air Ticket": svgPlane,
  "Visa": svgVisa,
  "Hotel": svgHotel, "Hotel Madina": svgHotel, "Hotel Makkah": svgHotel, "Private Room": svgHotel,
  "Transport": svgCar,
  "Food": svgFood,
  "Guide": svgStar,
};

function inclusionPill(inc: string): string {
  const icon = inclusionIcon[inc] ?? svgCheck;
  return `<div style="display:inline-flex;align-items:center;gap:5px;background:#f8f7f4;border:1px solid #e5e2db;border-radius:4px;padding:5px 10px;font-size:10.5px;font-weight:500;color:#2c2c2c;margin:3px;">${icon}<span>${inc}</span></div>`;
}

function packageCard(pkg: AnyPackage, index: number): string {
  const isHajj = pkg.serviceType === "Hajj";
  const accentDark = isHajj ? "#0d3d1f" : "#6b2d0a";
  const accentMid = isHajj ? "#15803d" : "#c2610c";
  const accentLight = isHajj ? "#dcfce7" : "#fff7ed";
  const accentBorder = isHajj ? "#86efac" : "#fed7aa";
  const accentText = isHajj ? "#14532d" : "#7c2d12";
  const formsRemaining = "formsRemaining" in pkg ? (pkg as HajjPackage).formsRemaining : null;

  return `
  <div style="background:#fff;border-radius:0;margin-bottom:0;page-break-inside:avoid;position:relative;border-left:4px solid ${accentMid};">
    <!-- left accent stripe already via border-left -->
    <div style="display:flex;align-items:stretch;min-height:160px;">

      <!-- Index number column -->
      <div style="width:44px;background:linear-gradient(180deg,${accentDark},${accentMid});display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:22px;font-weight:900;color:rgba(255,255,255,0.25);font-family:'Georgia',serif;writing-mode:vertical-rl;letter-spacing:2px;">${String(index + 1).padStart(2,"0")}</span>
      </div>

      <!-- Main content -->
      <div style="flex:1;padding:18px 20px 16px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
          <div>
            <div style="display:inline-block;background:${accentLight};border:1px solid ${accentBorder};border-radius:3px;padding:2px 8px;font-size:9px;font-weight:700;color:${accentText};letter-spacing:1.5px;margin-bottom:6px;">${pkg.serviceType.toUpperCase()}</div>
            <div style="font-size:17px;font-weight:800;color:#1a1a1a;line-height:1.2;font-family:'Georgia',serif;">${pkg.name}</div>
            ${pkg.description ? `<div style="font-size:11px;color:#6b6b6b;margin-top:4px;line-height:1.5;font-style:italic;">${pkg.description}</div>` : ""}
          </div>
          <!-- Price box -->
          <div style="flex-shrink:0;text-align:right;background:linear-gradient(135deg,${accentDark},${accentMid});border-radius:8px;padding:10px 16px;min-width:120px;">
            <div style="font-size:8.5px;color:rgba(255,255,255,0.6);letter-spacing:1.5px;margin-bottom:3px;">STARTING FROM</div>
            <div style="font-size:16px;font-weight:900;color:#fcd34d;line-height:1;">${formatPKR(pkg.sellingPrice)}</div>
            <div style="font-size:8px;color:rgba(255,255,255,0.5);margin-top:2px;">per pilgrim</div>
          </div>
        </div>

        <!-- Duration + seats row -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;color:#334155;">
            ${svgClock}<span>${pkg.durationDays} Days</span>
          </div>
          ${formsRemaining !== null && formsRemaining > 0 ? `<div style="display:inline-flex;align-items:center;gap:5px;background:#fffbeb;border:1px solid #fde68a;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;color:#92400e;"><span>${formsRemaining} Seats Available</span></div>` : ""}
        </div>

        <!-- Inclusions -->
        ${pkg.inclusions.length > 0 ? `
        <div>
          <div style="font-size:8.5px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;margin-bottom:6px;">INCLUDES</div>
          <div style="display:flex;flex-wrap:wrap;gap:0;">${pkg.inclusions.map(inclusionPill).join("")}</div>
        </div>` : ""}
      </div>
    </div>

    <!-- Bottom separator line -->
    <div style="height:1px;background:linear-gradient(90deg,${accentMid},transparent);margin-left:44px;"></div>
  </div>`;
}

export function buildPamphletHtml(
  packages: AnyPackage[],
  phone: string,
  email: string,
  address: string,
  tagline: string,
): string {
  const year = new Date().getFullYear();

  const featureItems = [
    { icon: svgAward, label: "Licensed & Trusted" },
    { icon: svgShield, label: "Secure Bookings" },
    { icon: svgPlane, label: "Direct Flights" },
    { icon: svgHotel, label: "Premium Hotels" },
    { icon: svgUsers, label: "Expert Guides" },
    { icon: svgGlobe, label: "Visa Assistance" },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Karwan-e-Miftah — ${year}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  body{font-family:'Inter','Segoe UI',sans-serif;background:#fff;width:210mm;min-height:297mm;}
  @page{size:A4;margin:0;}
</style>
</head>
<body>

<!-- TOP ACCENT BAR -->
<div style="height:5px;background:linear-gradient(90deg,#0d3d1f 0%,#15803d 30%,#d97706 60%,#fcd34d 80%,#d97706 100%);"></div>

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#071a0e 0%,#0d3d1f 40%,#14532d 100%);padding:30px 40px 24px;position:relative;overflow:hidden;">
  <!-- decorative geometric shapes -->
  <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;border-radius:50%;border:40px solid rgba(217,119,6,0.08);"></div>
  <div style="position:absolute;bottom:-80px;right:80px;width:160px;height:160px;border-radius:50%;border:30px solid rgba(255,255,255,0.04);"></div>
  <div style="position:absolute;top:20px;right:200px;width:60px;height:60px;border-radius:50%;background:rgba(217,119,6,0.06);"></div>

  <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;">
    <!-- Logo + name -->
    <div style="display:flex;align-items:center;gap:18px;">
      <div style="width:70px;height:70px;border-radius:12px;overflow:hidden;border:2px solid rgba(217,119,6,0.5);box-shadow:0 4px 20px rgba(0,0,0,0.4);flex-shrink:0;">
        <img src="/logo.jpeg" style="width:100%;height:100%;object-fit:cover;" alt="Logo"/>
      </div>
      <div>
        <div style="font-size:26px;font-weight:900;color:#fff;font-family:'Playfair Display',Georgia,serif;letter-spacing:-0.5px;line-height:1;">Karwan-e-Miftah</div>
        <div style="font-size:10px;color:#fcd34d;font-weight:600;letter-spacing:4px;margin-top:5px;">HAJJ &amp; UMRAH SPECIALISTS</div>
        <div style="width:40px;height:2px;background:linear-gradient(90deg,#d97706,#fcd34d);margin-top:6px;border-radius:2px;"></div>
      </div>
    </div>
    <!-- Year badge -->
    <div style="text-align:right;">
      <div style="border:1px solid rgba(217,119,6,0.35);border-radius:6px;padding:10px 18px;background:rgba(217,119,6,0.1);">
        <div style="font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:2px;">SEASON</div>
        <div style="font-size:22px;font-weight:800;color:#fcd34d;line-height:1.1;">${year}</div>
      </div>
    </div>
  </div>

  <!-- Tagline -->
  <div style="position:relative;z-index:1;margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:10px;">
    <div style="width:3px;height:28px;background:linear-gradient(180deg,#d97706,#fcd34d);border-radius:2px;flex-shrink:0;"></div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);font-style:italic;font-weight:300;letter-spacing:0.3px;">${tagline}</div>
  </div>
</div>

<!-- GOLD RULE -->
<div style="height:3px;background:linear-gradient(90deg,#0d3d1f,#d97706 30%,#fcd34d 50%,#d97706 70%,#0d3d1f);"></div>

<!-- SECTION HEADING -->
<div style="background:#faf9f7;padding:20px 40px 0;">
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,#d4c9b0);"></div>
    <div style="text-align:center;">
      <div style="font-size:9px;font-weight:700;color:#d97706;letter-spacing:4px;">OUR PACKAGES ${year}</div>
    </div>
    <div style="flex:1;height:1px;background:linear-gradient(90deg,#d4c9b0,transparent);"></div>
  </div>
</div>

<!-- PACKAGES -->
<div style="background:#faf9f7;padding:16px 40px 24px;">
  ${packages.map((p, i) => packageCard(p, i)).join("\n")}
</div>

<!-- FEATURES STRIP -->
<div style="background:#111827;padding:18px 40px;">
  <div style="font-size:8.5px;font-weight:700;color:#d97706;letter-spacing:3px;text-align:center;margin-bottom:14px;">WHY CHOOSE KARWAN-E-MIFTAH</div>
  <div style="display:flex;justify-content:space-between;gap:8px;">
    ${featureItems.map(({ icon, label }) => `
    <div style="text-align:center;flex:1;">
      <div style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 6px;color:#d97706;">${icon}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.65);font-weight:500;line-height:1.3;">${label}</div>
    </div>`).join("")}
  </div>
</div>

<!-- CONTACT FOOTER -->
<div style="background:linear-gradient(135deg,#071a0e,#0d3d1f 50%,#14532d);padding:22px 40px;">
  <div style="font-size:9px;font-weight:700;color:#fcd34d;letter-spacing:3px;text-align:center;margin-bottom:16px;">GET IN TOUCH</div>
  <div style="display:flex;justify-content:center;gap:0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;">
    <div style="flex:1;padding:14px 16px;border-right:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:10px;">
      <div style="width:30px;height:30px;border-radius:6px;background:rgba(217,119,6,0.2);border:1px solid rgba(217,119,6,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fcd34d;">${svgPhone}</div>
      <div><div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:1.5px;margin-bottom:2px;">PHONE</div><div style="font-size:12px;font-weight:700;color:#fff;">${phone}</div></div>
    </div>
    <div style="flex:1;padding:14px 16px;border-right:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:10px;">
      <div style="width:30px;height:30px;border-radius:6px;background:rgba(217,119,6,0.2);border:1px solid rgba(217,119,6,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fcd34d;">${svgMail}</div>
      <div><div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:1.5px;margin-bottom:2px;">EMAIL</div><div style="font-size:12px;font-weight:700;color:#fff;">${email}</div></div>
    </div>
    <div style="flex:1;padding:14px 16px;display:flex;align-items:center;gap:10px;">
      <div style="width:30px;height:30px;border-radius:6px;background:rgba(217,119,6,0.2);border:1px solid rgba(217,119,6,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fcd34d;">${svgPin}</div>
      <div><div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:1.5px;margin-bottom:2px;">ADDRESS</div><div style="font-size:12px;font-weight:700;color:#fff;">${address}</div></div>
    </div>
  </div>
</div>

<!-- BOTTOM BAR -->
<div style="background:#040d07;padding:8px 40px;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:1px;">&copy; ${year} KARWAN-E-MIFTAH &middot; ALL RIGHTS RESERVED</div>
  <div style="font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:1px;">PRICES SUBJECT TO CHANGE &middot; T&amp;C APPLY</div>
</div>

<!-- BOTTOM ACCENT BAR -->
<div style="height:4px;background:linear-gradient(90deg,#0d3d1f 0%,#15803d 30%,#d97706 60%,#fcd34d 80%,#d97706 100%);"></div>

</body>
</html>`;
}
