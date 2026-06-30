import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildReportDashboardFromOrders,
  isReportEmpty,
  parseAdminReportDashboard,
  pickRicherReport,
  REPORT_DEFAULT_DAYS,
  type AdminReportDashboard,
} from "@/core/reportDashboard";
import { pesoFromCents } from "@/core/formatters";
import { loadAdminReportDashboard, loadOrders } from "@/services/supabaseService";
import { PageHeader } from "@/components/ui";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { AdminReportCharts, KpiSparkline } from "@/components/AdminReportCharts";

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

export function AdminReportsPanel() {
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(REPORT_DEFAULT_DAYS);
  const [report, setReport] = useState<AdminReportDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"rpc" | "orders">("orders");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await loadOrders();
      const localReport = buildReportDashboardFromOrders(orders, days);

      try {
        const raw = await loadAdminReportDashboard(days);
        const rpcReport = parseAdminReportDashboard(raw);
        const chosen = pickRicherReport(rpcReport, localReport);
        setReport(chosen);
        setSource(isReportEmpty(rpcReport) || chosen.summary.total_orders === localReport.summary.total_orders ? "orders" : "rpc");
      } catch {
        setReport(localReport);
        setSource("orders");
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = report?.summary;

  const revenueSparkline = useMemo(
    () =>
      (report?.daily ?? [])
        .slice(-14)
        .map((d) => d.revenue_cents / 100),
    [report],
  );

  const hasData = summary != null && summary.total_orders > 0;

  return (
    <div className="page-section admin-reports-root">
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.reports.title}
        subtitle={`${ADMIN_SECTIONS.reports.subtitle} · last ${days} days${
          report ? ` (${report.from_date} → ${report.to_date})` : ""
        }${source === "rpc" ? " · database RPC" : " · from your orders"}`}
        action={
          <button type="button" className="btn-secondary btn-sm" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <div className="admin-reports">
        <div className="admin-reports-toolbar admin-reports-toolbar--below-header">
          <div className="admin-reports-range" role="group" aria-label="Date range">
            {RANGE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`admin-reports-range-btn${days === d ? " is-active" : ""}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading && !report ? (
          <p className="admin-empty">Loading report data…</p>
        ) : !report ? (
          <p className="admin-empty">Could not load reports. Check your connection and try again.</p>
        ) : (
          <>
            {!hasData ? (
              <p className="admin-reports-empty-banner">
                No orders in this date range yet. Place test orders from the customer app, then refresh.
              </p>
            ) : null}

            <div className="admin-reports-kpi-grid">
              <article className="admin-reports-kpi admin-reports-kpi--hero">
                <span className="admin-reports-kpi-label">Total revenue</span>
                <strong className="admin-reports-kpi-value">{pesoFromCents(summary!.total_revenue_cents)}</strong>
                <span className="admin-reports-kpi-hint">{summary!.active_orders} active orders</span>
                <KpiSparkline values={revenueSparkline} />
              </article>
              <article className="admin-reports-kpi">
                <span className="admin-reports-kpi-label">Orders</span>
                <strong className="admin-reports-kpi-value">{summary!.total_orders}</strong>
                <span className="admin-reports-kpi-hint">{summary!.completed_orders} completed</span>
              </article>
              <article className="admin-reports-kpi">
                <span className="admin-reports-kpi-label">Avg order</span>
                <strong className="admin-reports-kpi-value">{pesoFromCents(summary!.avg_order_cents)}</strong>
                <span className="admin-reports-kpi-hint">excludes cancelled</span>
              </article>
              <article className="admin-reports-kpi">
                <span className="admin-reports-kpi-label">Pending</span>
                <strong className="admin-reports-kpi-value">{summary!.pending_orders}</strong>
                <span className="admin-reports-kpi-hint">{summary!.confirmed_payments} paid</span>
              </article>
              <article className="admin-reports-kpi">
                <span className="admin-reports-kpi-label">Dine-in</span>
                <strong className="admin-reports-kpi-value">{summary!.reservation_orders}</strong>
                <span className="admin-reports-kpi-hint">seat reservations</span>
              </article>
              <article className="admin-reports-kpi">
                <span className="admin-reports-kpi-label">Delivery</span>
                <strong className="admin-reports-kpi-value">{summary!.delivery_orders}</strong>
                <span className="admin-reports-kpi-hint">{summary!.cancelled_orders} cancelled</span>
              </article>
            </div>

            <AdminReportCharts report={report} hasData={hasData} idPrefix="reports" />
          </>
        )}
      </div>
    </div>
  );
}
