import { useRef } from "react";
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
    booking.paymentStatus === "Paid" ? "#15803d" :
    booking.paymentStatus === "Partial" ? "#b45309" : "#dc2626";
  const statusBg =
    booking.paymentStatus === "Paid" ? "#dcfce7" :
    booking.paymentStatus === "Partial" ? "#fef3c7" : "#fee2e2";

  const serviceRows = (() => {
    if (isCustom && booking.customLineItems && booking.customLineItems.length > 0) {
      return booking.customLineItems.map((item, i) => `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">${i + 1}</td>
          <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${item.label}</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${formatPKR(item.price)}</td>
        </tr>`).join("");
    }
    if (booking.selectedInclusions.length > 0) {
      return booking.selectedInclusions.map((inc, i) => `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;">${i + 1}</td>
          <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${inc}</td>
          <td style="padding:10px 14px;font-size:13px;color:#94a3b8;text-align:right;font-style:italic;border-bottom:1px solid #f1f5f9;">Included</td>
        </tr>`).join("");
    }
    return `<tr><td colspan="3" style="padding:14px;text-align:center;color:#94a3b8;font-size:13px;">No services listed</td></tr>`;
  })();

  const remainingRow = remaining > 0 ? `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:rgba(255,255,255,0.7);">Balance Remaining</td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;color:#fca5a5;text-align:right;">${formatPKR(remaining)}</td>
    </tr>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt — ${booking.customerName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f8fafc; color:#1e293b; }
  .page { max-width:740px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.10); }
  .top-bar { background:#14532d; height:6px; }
  .inner { padding:40px 44px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:28px; border-bottom:1px solid #e2e8f0; }
  .brand { display:flex; align-items:center; gap:16px; }
  .logo { width:56px; height:56px; background:#14532d; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900; color:#fbbf24; flex-shrink:0; }
  .brand-text h1 { font-size:20px; font-weight:800; color:#14532d; letter-spacing:-0.3px; }
  .brand-text p { font-size:11px; color:#64748b; margin-top:2px; }
  .brand-text .tagline { font-size:11px; color:#94a3b8; margin-top:4px; }
  .receipt-meta { text-align:right; }
  .receipt-meta h2 { font-size:22px; font-weight:800; color:#14532d; letter-spacing:1px; text-transform:uppercase; }
  .receipt-meta .ref { font-size:11px; color:#94a3b8; margin-top:6px; }
  .receipt-meta .date { font-size:12px; color:#64748b; margin-top:3px; }
  .status-pill { display:inline-block; margin-top:10px; padding:4px 14px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; background:${statusBg}; color:${statusColor}; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-bottom:28px; }
  .section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #f1f5f9; }
  .field { margin-bottom:10px; }
  .field-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:2px; }
  .field-value { font-size:13px; font-weight:600; color:#1e293b; }
  .field-value.muted { color:#64748b; font-weight:400; }
  .services-section { margin-bottom:28px; }
  .services-table { width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
  .services-table thead tr { background:#f8fafc; }
  .services-table thead th { padding:10px 14px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; text-align:left; border-bottom:1px solid #e2e8f0; }
  .services-table thead th:last-child { text-align:right; }
  .payment-box { background:#14532d; border-radius:14px; padding:24px 28px; }
  .payment-box table { width:100%; border-collapse:collapse; }
  .payment-box td { padding:7px 0; font-size:13px; color:rgba(255,255,255,0.75); vertical-align:middle; }
  .payment-box td:last-child { text-align:right; font-weight:600; color:#fff; }
  .payment-divider { border:none; border-top:1px solid rgba(255,255,255,0.15); margin:12px 0; }
  .payment-total-label { font-size:15px; font-weight:700; color:#fff; }
  .payment-total-value { font-size:24px; font-weight:800; color:#fbbf24; }
  .footer { margin-top:32px; padding-top:20px; border-top:1px solid #f1f5f9; text-align:center; }
  .footer p { font-size:11px; color:#94a3b8; margin-bottom:4px; }
  .footer .thank-you { font-size:13px; font-weight:600; color:#14532d; margin-bottom:6px; }
  .bottom-bar { background:#14532d; height:4px; margin-top:32px; }
  @media print {
    body { background:#fff; }
    .page { box-shadow:none; margin:0; border-radius:0; }
    .top-bar, .bottom-bar { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .payment-box { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .status-pill { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="top-bar"></div>
  <div class="inner">

    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="logo">K</div>
        <div class="brand-text">
          <h1>Karwan Travels</h1>
          <p style="font-weight:700;letter-spacing:2px;color:#b45309;">KMR</p>
          <p class="tagline">Hajj &amp; Umrah Management</p>
          <p class="tagline">Gulberg III, Lahore &nbsp;|&nbsp; PECHS, Karachi</p>
        </div>
      </div>
      <div class="receipt-meta">
        <h2>Booking Receipt</h2>
        <p class="ref">Ref No: <strong style="color:#1e293b;">${booking.id.slice(-10).toUpperCase()}</strong></p>
        <p class="date">Issued: ${formatDate(booking.bookingDate)}</p>
        <div class="status-pill">${booking.paymentStatus}</div>
      </div>
    </div>

    <!-- Customer & Booking Info -->
    <div class="two-col">
      <div>
        <div class="section-label">Customer Information</div>
        <div class="field"><div class="field-label">Full Name</div><div class="field-value">${booking.customerName}</div></div>
        <div class="field"><div class="field-label">CNIC / Passport</div><div class="field-value">${booking.cnicPassport}</div></div>
        <div class="field"><div class="field-label">Phone</div><div class="field-value">${booking.phone}</div></div>
        <div class="field"><div class="field-label">Address</div><div class="field-value muted">${booking.address || "—"}</div></div>
        ${booking.nextOfKin ? `<div class="field"><div class="field-label">Next of Kin</div><div class="field-value muted">${booking.nextOfKin}${booking.nextOfKinPhone ? " &nbsp;·&nbsp; " + booking.nextOfKinPhone : ""}</div></div>` : ""}
      </div>
      <div>
        <div class="section-label">Booking Information</div>
        <div class="field"><div class="field-label">Service Type</div><div class="field-value">${booking.serviceType}</div></div>
        <div class="field"><div class="field-label">Package / Plan</div><div class="field-value">${booking.packageName}</div></div>
        <div class="field"><div class="field-label">Booking Type</div><div class="field-value">${isCustom ? "Custom Booking" : "Standard Package"}</div></div>
        <div class="field"><div class="field-label">Booking Date</div><div class="field-value">${formatDate(booking.bookingDate)}</div></div>
        <div class="field"><div class="field-label">Departure Date</div><div class="field-value">${booking.departureDate ? formatDate(booking.departureDate) : "—"}</div></div>
      </div>
    </div>

    <!-- Services -->
    <div class="services-section">
      <div class="section-label">Services Included</div>
      <table class="services-table">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>Service / Description</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${serviceRows}
        </tbody>
      </table>
    </div>

    <!-- Payment Summary -->
    <div class="payment-box">
      <div class="section-label" style="color:rgba(255,255,255,0.5);border-bottom-color:rgba(255,255,255,0.1);">Payment Summary</div>
      <table>
        <tr>
          <td>Total Package Price</td>
          <td>${formatPKR(booking.finalPrice)}</td>
        </tr>
        <tr>
          <td>Amount Paid</td>
          <td style="color:#86efac;">${formatPKR(booking.advanceAmount)}</td>
        </tr>
        ${remaining > 0 ? `<tr><td>Balance Remaining</td><td style="color:#fca5a5;">${formatPKR(remaining)}</td></tr>` : ""}
      </table>
      <hr class="payment-divider"/>
      <table>
        <tr>
          <td class="payment-total-label">Grand Total</td>
          <td class="payment-total-value">${formatPKR(booking.finalPrice)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="thank-you">Thank you for choosing Karwan Travels (KMR)</p>
      <p>0800-KMR-HAJJ &nbsp;|&nbsp; Gulberg III, Lahore &nbsp;|&nbsp; PECHS, Karachi</p>
      <p style="margin-top:8px;font-size:10px;">This is a computer-generated receipt and does not require a physical signature.</p>
    </div>

  </div>
  <div class="bottom-bar"></div>
</div>
</body>
</html>`;
}

export default function BookingReceipt({ booking, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = buildReceiptHTML(booking);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=820,height=960");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-3xl flex flex-col"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
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

        {/* iframe preview — renders the exact same HTML as print */}
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="flex-1 w-full rounded-b-2xl"
          style={{ minHeight: "600px", border: "none" }}
          title="Receipt Preview"
        />
      </div>
    </div>
  );
}
