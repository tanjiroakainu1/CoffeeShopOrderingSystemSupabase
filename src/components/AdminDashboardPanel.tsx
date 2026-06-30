import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import {
  Armchair,
  BarChart3,
  ClipboardList,
  Coffee,
  LifeBuoy,
  QrCode,
} from "lucide-react";
import {
  buildReportDashboardFromOrders,
  parseAdminReportDashboard,
  pickRicherReport,
  type AdminReportDashboard,
} from "@/core/reportDashboard";
import { pesoFromCents } from "@/core/formatters";
import { PageHeader, StatusBadge } from "@/components/ui";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { loadAdminReportDashboard, loadOrders, loadRecoveryRequests } from "@/services/supabaseService";
import type { OrderRecord } from "@/types";
import { AdminReportCharts, KpiSparkline } from "@/components/AdminReportCharts";

const DASHBOARD_DAYS = 90;

function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const quickLinks = [
  { section: "orders" as const, icon: ClipboardList, hint: "Kitchen & GCash" },
  { section: "reports" as const, icon: BarChart3, hint: "Charts & KPIs" },
  { section: "products" as const, icon: Coffee, hint: "Menu catalog" },
  { section: "recovery" as const, icon: LifeBuoy, hint: "Customer requests" },
  { section: "seats" as const, icon: Armchair, hint: "Dine-in tables" },
  { section: "gcash" as const, icon: QrCode, hint: "Payment QR" },
] as const;

export function AdminDashboardPanel() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AdminReportDashboard | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [pendingRecovery, setPendingRecovery] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [orderList, recovery] = await Promise.all([loadOrders(), loadRecoveryRequests()]);
      setOrders(orderList);
      setPendingRecovery(recovery.filter((r) => r.status === "pending").length);

      const localReport = buildReportDashboardFromOrders(orderList, DASHBOARD_DAYS);
      try {
        const raw = await loadAdminReportDashboard(DASHBOARD_DAYS);
        const rpcReport = parseAdminReportDashboard(raw);
        setReport(pickRicherReport(rpcReport, localReport));
      } catch {
        setReport(localReport);
      }
    } catch {
      setReport(null);
      setOrders([]);
      setPendingRecovery(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = report?.summary;
  const hasData = summary != null && summary.total_orders > 0;

  const revenueSparkline = useMemo(
    () => (report?.daily ?? []).slice(-14).map((d) => d.revenue_cents / 100),
    [report],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [orders],
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing").length,
    [orders],
  );

  return (
    <div className="page-section admin-dashboard">
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.dashboard.title}
        subtitle={`${ADMIN_SECTIONS.dashboard.subtitle} · last ${DASHBOARD_DAYS} days`}
        action={
          <button type="button" className="btn-secondary btn-sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {loading && !report ? (
        <p className="admin-empty">Loading dashboard…</p>
      ) : (
        <>
          <div className="admin-reports-kpi-grid admin-dashboard-kpi-grid">
            <article className="admin-reports-kpi admin-reports-kpi--hero">
              <span className="admin-reports-kpi-label">Revenue ({DASHBOARD_DAYS}d)</span>
              <strong className="admin-reports-kpi-value">
                {summary ? pesoFromCents(summary.total_revenue_cents) : "—"}
              </strong>
              <span className="admin-reports-kpi-hint">
                {summary ? `${summary.total_orders} orders` : "No data yet"}
              </span>
              <KpiSparkline values={revenueSparkline} />
            </article>
            <article className="admin-reports-kpi">
              <span className="admin-reports-kpi-label">Active pipeline</span>
              <strong className="admin-reports-kpi-value">{pendingOrders}</strong>
              <span className="admin-reports-kpi-hint">pending · preparing</span>
            </article>
            <article className="admin-reports-kpi">
              <span className="admin-reports-kpi-label">GCash confirmed</span>
              <strong className="admin-reports-kpi-value">{summary?.confirmed_payments ?? 0}</strong>
              <span className="admin-reports-kpi-hint">payments verified</span>
            </article>
            <article className="admin-reports-kpi">
              <span className="admin-reports-kpi-label">Recovery</span>
              <strong className="admin-reports-kpi-value">{pendingRecovery}</strong>
              <span className="admin-reports-kpi-hint">awaiting review</span>
            </article>
            <article className="admin-reports-kpi">
              <span className="admin-reports-kpi-label">Dine-in</span>
              <strong className="admin-reports-kpi-value">{summary?.reservation_orders ?? 0}</strong>
              <span className="admin-reports-kpi-hint">seat reservations</span>
            </article>
            <article className="admin-reports-kpi">
              <span className="admin-reports-kpi-label">Delivery</span>
              <strong className="admin-reports-kpi-value">{summary?.delivery_orders ?? 0}</strong>
              <span className="admin-reports-kpi-hint">{summary?.completed_orders ?? 0} completed</span>
            </article>
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-card admin-dashboard-quick lg:col-span-1">
              <h3 className="admin-reports-chart-title">Quick actions</h3>
              <div className="admin-dashboard-quick-grid">
                {quickLinks.map(({ section, icon: Icon, hint }) => {
                  const meta = ADMIN_SECTIONS[section];
                  const badge =
                    section === "orders" && pendingOrders > 0
                      ? pendingOrders
                      : section === "recovery" && pendingRecovery > 0
                        ? pendingRecovery
                        : null;
                  return (
                    <Link key={section} to={meta.path} className="admin-dashboard-quick-card">
                      <span className="admin-dashboard-quick-icon">
                        <Icon className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold text-brown-deep">
                          {meta.navLabel}
                          {badge != null ? (
                            <span className="customer-site-nav-badge">{badge}</span>
                          ) : null}
                        </span>
                        <span className="block text-xs text-muted">{hint}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="admin-card admin-dashboard-recent lg:col-span-1">
              <div className="admin-dashboard-section-head">
                <h3 className="admin-reports-chart-title">Recent orders</h3>
                <Link to={ADMIN_SECTIONS.orders.path} className="admin-dashboard-link">
                  View all →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                <ul className="admin-dashboard-order-list">
                  {recentOrders.map((o) => {
                    const total = o.lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
                    return (
                      <li key={o.orderId} className="admin-dashboard-order-row">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-brown-deep">
                            {o.customerDisplayName || o.customerEmail}
                          </p>
                          <p className="text-xs text-muted">{formatOrderTime(o.createdAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusBadge status={o.status} />
                          <p className="mt-1 font-semibold text-emerald-deep">{pesoFromCents(total)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {report ? (
            <div className="mt-6">
              <div className="admin-dashboard-section-head mb-4">
                <h2 className="font-serif text-xl font-bold text-brown-deep">Analytics snapshot</h2>
                <Link to={ADMIN_SECTIONS.reports.path} className="admin-dashboard-link">
                  Full reports →
                </Link>
              </div>
              <AdminReportCharts report={report} hasData={hasData} compact idPrefix="dash" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
