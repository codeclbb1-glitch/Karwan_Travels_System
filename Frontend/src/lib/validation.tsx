// Shared form validation utilities

export type FieldErrors = Record<string, string>;

export const validators = {
  required: (v: string, label: string) =>
    !v.trim() ? `${label} is required` : "",

  minLength: (v: string, min: number, label: string) =>
    v.trim().length < min ? `${label} must be at least ${min} characters` : "",

  cnicOrPassport: (v: string) => {
    const cnic = /^\d{5}-\d{7}-\d$/.test(v.trim()) || /^\d{13}$/.test(v.trim());
    const passport = /^[A-Z]{2}\d{7}$/i.test(v.trim());
    return !cnic && !passport ? "Enter a valid CNIC (35202-1234567-8) or Passport (AB1234567)" : "";
  },

  phone: (v: string) => {
    const cleaned = v.replace(/[\s-]/g, "");
    return !/^03\d{9}$/.test(cleaned) && !/^\+923\d{9}$/.test(cleaned)
      ? "Enter a valid phone number (03XX-XXXXXXX or +923XXXXXXXXX)"
      : "";
  },

  positiveNumber: (v: number, label: string) =>
    v <= 0 ? `${label} must be greater than 0` : "",

  nonNegativeNumber: (v: number, label: string) =>
    v < 0 ? `${label} cannot be negative` : "",

  dateRequired: (v: string, label: string) =>
    !v ? `${label} is required` : "",

  dateOrder: (from: string, to: string, _fromLabel: string, toLabel: string) =>
    from && to && to < from ? `${toLabel} must be after start date` : "",

  percentage: (v: number, label: string) =>
    v < 0 || v > 100 ? `${label} must be between 0 and 100` : "",

  numberRange: (v: number, min: number, max: number, label: string) =>
    v < min || v > max ? `${label} must be between ${min} and ${max}` : "",
};

export function collectErrors(checks: [string, string][]): FieldErrors {
  const errors: FieldErrors = {};
  for (const [key, msg] of checks) {
    if (msg && !errors[key]) errors[key] = msg;
  }
  return errors;
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-red-500 mt-1">{error}</p>;
}

export function inputClass(base: string, error?: string) {
  return error ? `${base} border-red-400 focus:ring-red-300` : base;
}
