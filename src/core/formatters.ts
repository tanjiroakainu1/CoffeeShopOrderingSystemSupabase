/** Mirrors `lib/core/formatters.dart` */
export function pesoFromCents(cents: number): string {
  return `₱${(cents / 100).toFixed(2)}`;
}

export function pesoWholePhp(whole: number): string {
  return `₱${whole.toLocaleString("en-PH")}`;
}

export function dateIso(d: Date): string {
  const l = d;
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${l.getFullYear()}-${p(l.getMonth() + 1)}-${p(l.getDate())}`;
}

export function dateUsShortFromIso(iso?: string | null): string {
  if (!iso || iso.length < 10) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
}

export function formatDateLong(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function isReservationDateValid(d: Date): boolean {
  const t = todayLocal();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day >= t;
}

export function visitTimeSlotsHourly(): string[] {
  return Array.from({ length: 24 }, (_, h) => {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const m = "00";
    const ap = h < 12 ? "AM" : "PM";
    return `${h12}:${m} ${ap}`;
  });
}

export function newOrderId(): string {
  return `${Date.now()}_${Math.floor(Math.random() * (1 << 20))}`;
}

export function orderDisplayCode(orderId: string): string {
  const tail = orderId.replace(/\D/g, "").slice(-3) || "000";
  return `RB${tail.padStart(3, "0")}`;
}

export function orderTotalCents(lines: { quantity: number; unitPriceCents: number }[]): number {
  return lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
}

/** Max GCash QR upload size — matches Flutter admin_gcash_settings_tab.dart */
export const MAX_GCASH_QR_BYTES = 480 * 1024;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      resolve(s.includes(",") ? s.split(",")[1]! : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function base64ImageDataUrl(base64: string | null | undefined): string | null {
  if (!base64?.trim()) return null;
  const trimmed = base64.trim();
  const mime = trimmed.startsWith("/9j/")
    ? "image/jpeg"
    : trimmed.startsWith("iVBOR")
      ? "image/png"
      : trimmed.startsWith("R0lGOD")
        ? "image/gif"
        : trimmed.startsWith("UklGR")
          ? "image/webp"
          : "image/jpeg";
  return `data:${mime};base64,${trimmed}`;
}
