import type { OrderRecord } from "@/types";

export type ReportDailyPoint = {
  date: string;
  orders: number;
  revenue_cents: number;
};

export type ReportStatusSlice = {
  status: string;
  count: number;
  revenue_cents: number;
};

export type ReportFulfillmentSlice = {
  fulfillment_type: string;
  count: number;
  revenue_cents: number;
};

export type ReportTopProduct = {
  name: string;
  quantity: number;
  revenue_cents: number;
};

export type ReportSummary = {
  total_orders: number;
  active_orders: number;
  total_revenue_cents: number;
  avg_order_cents: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  confirmed_payments: number;
  reservation_orders: number;
  delivery_orders: number;
};

export type AdminReportDashboard = {
  days: number;
  from_date: string;
  to_date: string;
  summary: ReportSummary;
  daily: ReportDailyPoint[];
  by_status: ReportStatusSlice[];
  by_fulfillment: ReportFulfillmentSlice[];
  top_products: ReportTopProduct[];
};

/** Default report window (aligned with Flutter ReportConstants.defaultDays and SQL RPC). */
export const REPORT_DEFAULT_DAYS = 90;

function orderTotalCents(o: OrderRecord): number {
  return o.lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
}

function manilaDateKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function buildReportDashboardFromOrders(orders: OrderRecord[], days = REPORT_DEFAULT_DAYS): AdminReportDashboard {
  const safeDays = Math.max(1, Math.min(days, 365));
  const toDate = manilaDateKey(new Date().toISOString());
  const fromDate = addDays(toDate, -(safeDays - 1));

  const inRange = orders.filter((o) => {
    const k = manilaDateKey(o.createdAt);
    return k >= fromDate && k <= toDate;
  });

  const active = inRange.filter((o) => o.status !== "cancelled");
  const totalRevenue = active.reduce((s, o) => s + orderTotalCents(o), 0);

  const dailyMap = new Map<string, { orders: number; revenue_cents: number }>();
  for (let i = 0; i < safeDays; i++) {
    const d = addDays(fromDate, i);
    dailyMap.set(d, { orders: 0, revenue_cents: 0 });
  }
  for (const o of inRange) {
    const k = manilaDateKey(o.createdAt);
    const row = dailyMap.get(k);
    if (!row) continue;
    row.orders += 1;
    if (o.status !== "cancelled") row.revenue_cents += orderTotalCents(o);
  }

  const statusMap = new Map<string, ReportStatusSlice>();
  for (const o of inRange) {
    const cur = statusMap.get(o.status) ?? { status: o.status, count: 0, revenue_cents: 0 };
    cur.count += 1;
    if (o.status !== "cancelled") cur.revenue_cents += orderTotalCents(o);
    statusMap.set(o.status, cur);
  }

  const fulfillmentMap = new Map<string, ReportFulfillmentSlice>();
  for (const o of inRange) {
    const key = o.fulfillmentType;
    const cur = fulfillmentMap.get(key) ?? { fulfillment_type: key, count: 0, revenue_cents: 0 };
    cur.count += 1;
    if (o.status !== "cancelled") cur.revenue_cents += orderTotalCents(o);
    fulfillmentMap.set(key, cur);
  }

  const productMap = new Map<string, ReportTopProduct>();
  for (const o of active) {
    for (const l of o.lines) {
      const cur = productMap.get(l.name) ?? { name: l.name, quantity: 0, revenue_cents: 0 };
      cur.quantity += l.quantity;
      cur.revenue_cents += l.quantity * l.unitPriceCents;
      productMap.set(l.name, cur);
    }
  }

  return {
    days: safeDays,
    from_date: fromDate,
    to_date: toDate,
    summary: {
      total_orders: inRange.length,
      active_orders: active.length,
      total_revenue_cents: totalRevenue,
      avg_order_cents: active.length ? Math.round(totalRevenue / active.length) : 0,
      completed_orders: inRange.filter((o) => o.status === "completed").length,
      pending_orders: inRange.filter((o) => o.status === "pending").length,
      cancelled_orders: inRange.filter((o) => o.status === "cancelled").length,
      confirmed_payments: inRange.filter((o) => o.paymentStatus === "confirmed").length,
      reservation_orders: inRange.filter((o) => o.fulfillmentType === "reservation").length,
      delivery_orders: inRange.filter((o) => o.fulfillmentType === "delivery").length,
    },
    daily: [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
    by_status: [...statusMap.values()].sort((a, b) => b.count - a.count),
    by_fulfillment: [...fulfillmentMap.values()].sort((a, b) => b.count - a.count),
    top_products: [...productMap.values()].sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 8),
  };
}

export function parseAdminReportDashboard(raw: unknown): AdminReportDashboard {
  const o = (raw ?? {}) as Record<string, unknown>;
  const summaryRaw = (o.summary ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const str = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  return {
    days: num(o.days) || REPORT_DEFAULT_DAYS,
    from_date: str(o.from_date),
    to_date: str(o.to_date),
    summary: {
      total_orders: num(summaryRaw.total_orders),
      active_orders: num(summaryRaw.active_orders),
      total_revenue_cents: num(summaryRaw.total_revenue_cents),
      avg_order_cents: num(summaryRaw.avg_order_cents),
      completed_orders: num(summaryRaw.completed_orders),
      pending_orders: num(summaryRaw.pending_orders),
      cancelled_orders: num(summaryRaw.cancelled_orders),
      confirmed_payments: num(summaryRaw.confirmed_payments),
      reservation_orders: num(summaryRaw.reservation_orders),
      delivery_orders: num(summaryRaw.delivery_orders),
    },
    daily: Array.isArray(o.daily)
      ? o.daily.map((d) => {
          const row = d as Record<string, unknown>;
          return {
            date: str(row.date),
            orders: num(row.orders),
            revenue_cents: num(row.revenue_cents),
          };
        })
      : [],
    by_status: Array.isArray(o.by_status)
      ? o.by_status.map((d) => {
          const row = d as Record<string, unknown>;
          return {
            status: String(row.status ?? ""),
            count: num(row.count),
            revenue_cents: num(row.revenue_cents),
          };
        })
      : [],
    by_fulfillment: Array.isArray(o.by_fulfillment)
      ? o.by_fulfillment.map((d) => {
          const row = d as Record<string, unknown>;
          return {
            fulfillment_type: String(row.fulfillment_type ?? ""),
            count: num(row.count),
            revenue_cents: num(row.revenue_cents),
          };
        })
      : [],
    top_products: Array.isArray(o.top_products)
      ? o.top_products.map((d) => {
          const row = d as Record<string, unknown>;
          return {
            name: String(row.name ?? ""),
            quantity: num(row.quantity),
            revenue_cents: num(row.revenue_cents),
          };
        })
      : [],
  };
}

export function isReportEmpty(report: AdminReportDashboard): boolean {
  return (
    report.summary.total_orders === 0 &&
    report.daily.every((d) => d.orders === 0 && d.revenue_cents === 0)
  );
}

export function pickRicherReport(
  primary: AdminReportDashboard,
  fallback: AdminReportDashboard,
): AdminReportDashboard {
  let chosen: AdminReportDashboard;
  if (isReportEmpty(primary) && !isReportEmpty(fallback)) chosen = fallback;
  else if (fallback.summary.total_orders > primary.summary.total_orders) chosen = fallback;
  else if (fallback.summary.total_revenue_cents > primary.summary.total_revenue_cents) chosen = fallback;
  else chosen = primary;

  const other = chosen === primary ? fallback : primary;
  return mergeReportSlices(chosen, other);
}

function mergeReportSlices(
  primary: AdminReportDashboard,
  fallback: AdminReportDashboard,
): AdminReportDashboard {
  const dailyHasPoints = primary.daily.some((d) => d.orders > 0 || d.revenue_cents > 0);
  return {
    ...primary,
    daily: dailyHasPoints ? primary.daily : fallback.daily,
    by_status: primary.by_status.length > 0 ? primary.by_status : fallback.by_status,
    by_fulfillment:
      primary.by_fulfillment.length > 0 ? primary.by_fulfillment : fallback.by_fulfillment,
    top_products: primary.top_products.length > 0 ? primary.top_products : fallback.top_products,
  };
}

export const REPORT_CHART_COLORS = [
  "#059669",
  "#FACC15",
  "#065F46",
  "#6B9080",
  "#047857",
  "#CA8A04",
  "#10B981",
  "#92400E",
];
