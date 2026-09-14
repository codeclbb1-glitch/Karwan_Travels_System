import { Printer, X } from "lucide-react";
import { formatPKR, formatDate } from "../data";
import type { Booking } from "../types";

interface Props {
  booking: Booking;
  onClose: () => void;
}

function buildReceiptHTML(booking: Booking): string {
  const isCustom = !booking.packageId;
  const remaining = booking.finalPrice - booking.advanceAmount;

  const statusColor =
    booking.paymentStatus === "Paid"    ? "#15803d" :
    booking.paymentStatus === "Partial" ? "#b45309" : "#dc2626";
  const statusBg =
    booking.paymentStatus === "Paid"    ? "#dcfce7" :
    booking.paymentStatus === "Partial" ? "#fef3c7" : "#fee2e2";

  const inclusions = isCustom
    ? (booking.customLineItems ?? []).map((i) => i.label)
    : booking.selectedInclusions;

  const inclusionChips = inclusions.length > 0
    ? inclusions.map((inc) =>
        `<span style="display:inline-block;padding:3px 10px;margin:3px 3px 0 0;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;font-size:11px;color:#15803d;font-weight:600;">${inc}</span>`
      ).join("")
    : `<span style="font-size:12px;color:#94a3b8;font-style:italic;">No inclusions listed</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt — ${booking.customerName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f1f5f9; color:#1e293b; font-size:12px; }
  .page { max-width:680px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 20px rgba(0,0,0,0.08); }
  /* Header */
  .header { background:#14532d; padding:18px 24px; display:flex; justify-content:space-between; align-items:center; }
  .brand { display:flex; align-items:center; gap:12px; }
  .logo-wrap { width:44px; height:44px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }
  .logo-wrap img { width:32px; height:32px; object-fit:contain; }
  .brand-name { color:#fff; font-size:16px; font-weight:800; letter-spacing:-0.3px; line-height:1.2; }
  .brand-sub { color:#86efac; font-size:10px; font-weight:600; letter-spacing:2px; margin-top:2px; }
  .receipt-label { text-align:right; }
  .receipt-label h2 { color:#fbbf24; font-size:18px; font-weight:800; letter-spacing:1px; text-transform:uppercase; }
  .receipt-label .ref { color:rgba(255,255,255,0.6); font-size:10px; margin-top:4px; }
  .receipt-label .ref strong { color:#fff; }
  /* Body */
  .body { padding:20px 24px; }
  /* Status bar */
  .status-bar { display:flex; align-items:center; justify-content:space-between; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:16px; }
  .status-bar .issued { font-size:11px; color:#64748b; }
  .status-bar .issued strong { color:#1e293b; }
  .status-pill { padding:4px 12px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; background:${statusBg}; color:${statusColor}; }
  /* Two col */
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; }
  .section-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
  .field { margin-bottom:7px; }
  .field:last-child { margin-bottom:0; }
  .field-label { font-size:9px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:1px; }
  .field-value { font-size:12px; font-weight:600; color:#1e293b; }
  .field-value.muted { color:#64748b; font-weight:400; }
  /* Inclusions */
  .inclusions-section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:16px; }
  /* Payment */
  .payment { background:#14532d; border-radius:8px; padding:14px 18px; }
  .payment-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:rgba(255,255,255,0.5); margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.1); }
  .pay-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; }
  .pay-label { font-size:11px; color:rgba(255,255,255,0.65); }
  .pay-value { font-size:11px; font-weight:600; color:#fff; }
  .pay-divider { border:none; border-top:1px solid rgba(255,255,255,0.12); margin:8px 0; }
  .pay-total-label { font-size:13px; font-weight:700; color:#fff; }
  .pay-total-value { font-size:20px; font-weight:800; color:#fbbf24; }
  /* Footer */
  .footer { text-align:center; padding:12px 24px 16px; border-top:1px solid #f1f5f9; }
  .footer .thank { font-size:11px; font-weight:600; color:#14532d; margin-bottom:3px; }
  .footer .note { font-size:10px; color:#94a3b8; }
  @media print {
    body { background:#fff; }
    .page { box-shadow:none; margin:0; border-radius:0; max-width:100%; }
    .header, .payment { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .status-pill { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .inclusions-section span { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="logo-wrap">
        <img src="/logo.jpg" alt="KMR Logo" />
      </div>
      <div>
        <div class="brand-name">Karwan-e-Miftah</div>
        <div class="brand-sub">KMR · HAJJ &amp; UMRAH</div>
      </div>
    </div>
    <div class="receipt-label">
      <h2>Booking Receipt</h2>
      <div class="ref">Ref: <strong>${booking.id.slice(-10).toUpperCase()}</strong></div>
    </div>
  </div>

  <div class="body">

    <!-- Status bar -->
    <div class="status-bar">
      <div class="issued">Issued: <strong>${formatDate(booking.bookingDate)}</strong> &nbsp;·&nbsp; ${booking.serviceType} &nbsp;·&nbsp; ${isCustom ? "Custom Booking" : "Standard Package"}</div>
      <div class="status-pill">${booking.paymentStatus}</div>
    </div>

    <!-- Customer + Booking Info -->
    <div class="two-col">
      <div class="section">
        <div class="section-title">Customer</div>
        <div class="field"><div class="field-label">Full Name</div><div class="field-value">${booking.customerName}</div></div>
        <div class="field"><div class="field-label">CNIC / Passport</div><div class="field-value">${booking.cnicPassport}</div></div>
        <div class="field"><div class="field-label">Phone</div><div class="field-value">${booking.phone}</div></div>
        <div class="field"><div class="field-label">Address</div><div class="field-value muted">${booking.address || "—"}</div></div>
        ${booking.nextOfKin ? `<div class="field"><div class="field-label">Next of Kin</div><div class="field-value muted">${booking.nextOfKin}${booking.nextOfKinPhone ? " · " + booking.nextOfKinPhone : ""}</div></div>` : ""}
      </div>
      <div class="section">
        <div class="section-title">Trip Details</div>
        <div class="field"><div class="field-label">Package</div><div class="field-value">${booking.packageName}</div></div>
        <div class="field"><div class="field-label">Departure</div><div class="field-value">${booking.departureDate ? formatDate(booking.departureDate) : "—"}</div></div>
        <div class="field"><div class="field-label">Arrival</div><div class="field-value">${booking.arrivalDate ? formatDate(booking.arrivalDate) : "—"}</div></div>
        ${booking.airlineName ? `<div class="field"><div class="field-label">Airline</div><div class="field-value">${booking.airlineName}</div></div>` : ""}
        <div class="field"><div class="field-label">Booking Date</div><div class="field-value">${formatDate(booking.bookingDate)}</div></div>
      </div>
    </div>

    <!-- Inclusions -->
    <div class="inclusions-section">
      <div class="section-title">Services Included</div>
      <div>${inclusionChips}</div>
    </div>

    <!-- Payment -->
    <div class="payment">
      <div class="payment-title">Payment Summary</div>
      <div class="pay-row"><span class="pay-label">Package Price</span><span class="pay-value">${formatPKR(booking.finalPrice)}</span></div>
      <div class="pay-row"><span class="pay-label">Amount Paid</span><span class="pay-value" style="color:#86efac;">${formatPKR(booking.advanceAmount)}</span></div>
      ${remaining > 0 ? `<div class="pay-row"><span class="pay-label">Balance Due</span><span class="pay-value" style="color:#fca5a5;">${formatPKR(remaining)}</span></div>` : ""}
      <hr class="pay-divider"/>
      <div class="pay-row">
        <span class="pay-total-label">Total</span>
        <span class="pay-total-value">${formatPKR(booking.finalPrice)}</span>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="thank">Thank you for choosing Karwan-e-Miftah (KMR)</div>
    <div class="note">This is a computer-generated receipt · Deans Trade Centre, Office UG 324&amp;326, Saddar Cantt, Peshawar &nbsp;|&nbsp; 0321-9961199</div>
  </div>

</div>
</body>
</html>`;
}

export default function BookingReceipt({ booking, onClose }: Props) {
  const html = buildReceiptHTML(booking);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=760,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 rounded-t-2xl bg-white flex-shrink-0">
          <h3 className="text-lg font-display font-bold text-navy-900">Booking Receipt</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg p-1.5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <iframe
          srcDoc={html}
          className="flex-1 w-full rounded-b-2xl"
          style={{ minHeight: "560px", border: "none" }}
          title="Receipt Preview"
        />
      </div>
    </div>
  );
}
