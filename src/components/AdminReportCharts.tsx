import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REPORT_CHART_COLORS, type AdminReportDashboard } from "@/core/reportDashboard";

function formatShortDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fulfillmentLabel(s: string): string {
  if (s === "reservation") return "Dine-in / Seat";
  if (s === "delivery") return "Delivery";
  return statusLabel(s);
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="admin-reports-chart-empty">
      <p>{message}</p>
    </div>
  );
}

export function KpiSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="admin-reports-kpi-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="kpiSparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#059669" strokeWidth={2} fill="url(#kpiSparkGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function GaugeCenter({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="admin-reports-gauge-center">
      <span className="admin-reports-gauge-value">{percent}%</span>
      <span className="admin-reports-gauge-label">{label}</span>
    </div>
  );
}

type AdminReportChartsProps = {
  report: AdminReportDashboard;
  hasData: boolean;
  /** Slightly shorter charts on the dashboard overview */
  compact?: boolean;
  idPrefix?: string;
};

export function AdminReportCharts({ report, hasData, compact = false, idPrefix = "report" }: AdminReportChartsProps) {
  const dailyChart = useMemo(
    () =>
      (report.daily ?? []).map((d) => ({
        ...d,
        label: formatShortDate(d.date),
        revenue: d.revenue_cents / 100,
      })),
    [report],
  );

  const maxRevenue = useMemo(() => Math.max(1, ...dailyChart.map((d) => d.revenue), 0), [dailyChart]);
  const maxOrders = useMemo(() => Math.max(1, ...dailyChart.map((d) => d.orders), 0), [dailyChart]);

  const statusChart = useMemo(
    () =>
      (report.by_status ?? []).map((s, i) => ({
        name: statusLabel(s.status),
        value: s.count,
        revenue: s.revenue_cents / 100,
        fill: REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length],
      })),
    [report],
  );

  const fulfillmentChart = useMemo(
    () =>
      (report.by_fulfillment ?? []).map((f, i) => ({
        name: fulfillmentLabel(f.fulfillment_type),
        value: f.count,
        revenue: f.revenue_cents / 100,
        fill: REPORT_CHART_COLORS[(i + 2) % REPORT_CHART_COLORS.length],
      })),
    [report],
  );

  const topProductsChart = useMemo(
    () =>
      (report.top_products ?? []).map((p) => ({
        name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
        fullName: p.name,
        qty: p.quantity,
        revenue: p.revenue_cents / 100,
      })),
    [report],
  );

  const summary = report.summary;

  const paymentChart = useMemo(() => {
    const pendingPay = Math.max(0, summary.active_orders - summary.confirmed_payments);
    return [
      { name: "GCash confirmed", value: summary.confirmed_payments, fill: "#059669" },
      { name: "Awaiting payment", value: pendingPay, fill: "#FACC15" },
    ].filter((s) => s.value > 0);
  }, [summary]);

  const completionPercent = useMemo(() => {
    if (summary.total_orders <= 0) return 0;
    return Math.round((summary.completed_orders / summary.total_orders) * 100);
  }, [summary]);

  const completionGauge = useMemo(
    () => [{ name: "Completed", value: completionPercent, fill: "#059669" }],
    [completionPercent],
  );

  const composedHeight = compact ? 260 : 300;
  const pieHeight = compact ? 240 : 280;
  const topBarHeight = Math.max(compact ? 200 : 260, topProductsChart.length * (compact ? 36 : 42) + 48);

  return (
    <div className="admin-reports-chart-grid">
      <section className="admin-card admin-reports-chart-card admin-reports-chart-card--wide">
        <h3 className="admin-reports-chart-title">Daily revenue &amp; orders</h3>
        <div className="admin-reports-chart-wrap">
          {!hasData ? (
            <ChartEmpty message="Daily trend appears once you have orders in range." />
          ) : (
            <ResponsiveContainer width="100%" height={composedHeight}>
              <ComposedChart data={dailyChart} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id={`${idPrefix}RevenueGrad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} interval="preserveStartEnd" />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: "#059669" }}
                  tickFormatter={(v) => `₱${v}`}
                  domain={[0, Math.ceil(maxRevenue * 1.15)]}
                  width={56}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#CA8A04" }}
                  allowDecimals={false}
                  domain={[0, Math.ceil(maxOrders * 1.2)]}
                  width={36}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "revenue"
                      ? [`₱${Number(value ?? 0).toFixed(2)}`, "Revenue"]
                      : [Number(value ?? 0), "Orders"]
                  }
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                />
                <Legend />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill={`url(#${idPrefix}RevenueGrad)`}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue trend"
                  stroke="#047857"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#FACC15", stroke: "#065F46", strokeWidth: 1 }}
                  activeDot={{ r: 5, fill: "#FACC15" }}
                  legendType="none"
                />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  name="Orders"
                  fill="#FACC15"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                  opacity={0.9}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="admin-card admin-reports-chart-card">
        <h3 className="admin-reports-chart-title">Orders by status</h3>
        <div className="admin-reports-chart-wrap admin-reports-chart-wrap--pie">
          {statusChart.length === 0 ? (
            <ChartEmpty message="No status breakdown yet." />
          ) : (
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {statusChart.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill ?? REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${Number(value ?? 0)} orders · ₱${Number(item.payload?.revenue ?? 0).toFixed(2)}`,
                    item.name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="admin-card admin-reports-chart-card">
        <h3 className="admin-reports-chart-title">Fulfillment mix</h3>
        <div className="admin-reports-chart-wrap admin-reports-chart-wrap--pie">
          {fulfillmentChart.length === 0 ? (
            <ChartEmpty message="No fulfillment data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie data={fulfillmentChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {fulfillmentChart.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill ?? REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${Number(value ?? 0)} orders · ₱${Number(item.payload?.revenue ?? 0).toFixed(2)}`,
                    item.name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="admin-card admin-reports-chart-card">
        <h3 className="admin-reports-chart-title">GCash payment mix</h3>
        <div className="admin-reports-chart-wrap admin-reports-chart-wrap--pie">
          {paymentChart.length === 0 ? (
            <ChartEmpty message="Payment breakdown appears with active orders." />
          ) : (
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie data={paymentChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3}>
                  {paymentChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${Number(value ?? 0)} orders`, String(name)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="admin-card admin-reports-chart-card">
        <h3 className="admin-reports-chart-title">Completion rate</h3>
        <div className="admin-reports-chart-wrap admin-reports-chart-wrap--gauge relative">
          {!hasData ? (
            <ChartEmpty message="Completion gauge fills as orders complete." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={pieHeight}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%" barSize={14} data={completionGauge} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: "#ECFDF5" }} dataKey="value" cornerRadius={8} fill="#059669" />
                </RadialBarChart>
              </ResponsiveContainer>
              <GaugeCenter percent={completionPercent} label="orders completed" />
            </>
          )}
        </div>
      </section>

      <section className="admin-card admin-reports-chart-card admin-reports-chart-card--wide">
        <h3 className="admin-reports-chart-title">Top products by revenue</h3>
        <div className="admin-reports-chart-wrap">
          {topProductsChart.length === 0 ? (
            <ChartEmpty message="Top sellers appear after menu orders come in." />
          ) : (
            <ResponsiveContainer width="100%" height={topBarHeight}>
              <BarChart data={topProductsChart} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `₱${v}`} domain={[0, "auto"]} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#374151" }} />
                <Tooltip formatter={(value) => [`₱${Number(value ?? 0).toFixed(2)}`, "Revenue"]} labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ""} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={20}>
                  {topProductsChart.map((entry, i) => (
                    <Cell key={entry.fullName} fill={REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
