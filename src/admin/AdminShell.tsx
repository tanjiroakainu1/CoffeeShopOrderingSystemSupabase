import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Coffee,
  FolderTree,
  LifeBuoy,
  LogOut,
  Armchair,
  QrCode,
  RefreshCw,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import { AdminQueryState, useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/context/AuthContext";
import { AdminOrderCard } from "@/components/AdminOrderCard";
import { AdminDashboardPanel } from "@/components/AdminDashboardPanel";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
import { AdminReportsPanel } from "@/components/AdminReportsPanel";
import { AdminCategoriesPanel } from "@/components/AdminCategoriesPanel";
import { AdminProductsPanel } from "@/components/AdminProductsPanel";
import { AdminRecoveryPanel } from "@/components/AdminRecoveryPanel";
import { AdminSeatsPanel } from "@/components/AdminSeatsPanel";
import { Pagination } from "@/components/Pagination";
import {
  deleteOrder,
  loadOrders,
  loadCafePaymentSettings,
  saveCafePaymentSettings,
  updateOrderFulfillment,
  updateOrderGcashAdminAttachment,
  updateOrderPayment,
  updateOrderStatus,
} from "@/services/supabaseService";
import { Button, Card, Logo, PageHeader, SectionLabel } from "@/components/ui";
import { AppBrand } from "@/core/assets";
import {
  ADMIN_NAV_ORDER,
  ADMIN_SECTIONS,
  adminSectionFromPath,
  type AdminSection,
} from "@/core/appRoutes";
import { base64ImageDataUrl, fileToBase64, MAX_GCASH_QR_BYTES } from "@/core/formatters";
import { ADMIN_ORDERS_PAGE_SIZE, paginateSlice } from "@/core/pagination";

const adminTabIcons: Record<AdminSection, typeof ClipboardList> = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  reports: BarChart3,
  products: Coffee,
  categories: FolderTree,
  seats: Armchair,
  users: Users,
  recovery: LifeBuoy,
  gcash: QrCode,
};

export function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const location = useLocation();
  const section = adminSectionFromPath(location.pathname);
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <Navigate to={ADMIN_SECTIONS.dashboard.path} replace />;
  }

  if (section === null) {
    return <Navigate to={ADMIN_SECTIONS.dashboard.path} replace />;
  }

  const navItems = ADMIN_NAV_ORDER.map((id) => ({
    id,
    to: ADMIN_SECTIONS[id].path,
    label: ADMIN_SECTIONS[id].navLabel,
    icon: adminTabIcons[id],
  }));

  const brand = (
    <div className="app-sidebar-brand app-sidebar-brand-admin">
      <Logo className="h-10 w-10 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-serif text-base font-bold text-white">{AppBrand.displayName}</p>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/50">Admin</p>
      </div>
    </div>
  );

  const sidebarFooter = user ? (
    <>
      <p className="truncate rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">{user.email}</p>
      <p className="mt-2 px-1 text-center text-[0.65rem] font-semibold text-white/55">
        Developed by {AppBrand.developerName}
      </p>
    </>
  ) : null;

  return (
    <AppSidebarShell
      variant="admin"
      navItems={navItems}
      activePath={ADMIN_SECTIONS[section].path}
      brand={brand}
      sidebarFooter={sidebarFooter}
      topBarTitle={ADMIN_SECTIONS[section].title}
      topBarSubtitle={user?.email}
      mobileOpen={mobileOpen}
      onToggleMobile={() => setMobileOpen((o) => !o)}
      onCloseMobile={() => setMobileOpen(false)}
      shellClassName="admin-app"
      showDesktopTopBarTitle
      topBarActions={
        <button type="button" className="app-shell-signout" onClick={onSignOut}>
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      }
    >
      <main className="admin-shell flex-1 py-5 sm:py-6 sidebar:py-8">
        {section === "dashboard" ? <AdminDashboardPanel /> : null}
        {section === "orders" ? <AdminOrdersPanel /> : null}
        {section === "reports" ? <AdminReportsPanel /> : null}
        {section === "products" ? <AdminProductsPanel /> : null}
        {section === "categories" ? <AdminCategoriesPanel /> : null}
        {section === "seats" ? <AdminSeatsPanel /> : null}
        {section === "users" ? <AdminUsersPanel /> : null}
        {section === "recovery" ? <AdminRecoveryPanel /> : null}
        {section === "gcash" ? <AdminGcashPanel /> : null}
      </main>
    </AppSidebarShell>
  );
}

function AdminOrdersPanel() {
  const [prepMin, setPrepMin] = useState<Record<string, string>>({});
  const [seat, setSeat] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [proofRefresh, setProofRefresh] = useState(0);
  const load = useCallback(() => loadOrders(), []);
  const { data: orders, loading, error, reload } = useSupabaseQuery(load, []);
  const list = orders ?? [];
  const paged = useMemo(() => paginateSlice(list, page, ADMIN_ORDERS_PAGE_SIZE), [list, page]);

  const reloadOrders = useCallback(() => {
    void reload().then(() => setProofRefresh((k) => k + 1));
  }, [reload]);

  useEffect(() => {
    if (page !== paged.page) setPage(paged.page);
  }, [page, paged.page]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.orders.title}
        subtitle={`${ADMIN_SECTIONS.orders.subtitle} · ${list.length} order${list.length === 1 ? "" : "s"}`}
        action={
          <Button variant="toolbar" onClick={() => reloadOrders()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <AdminQueryState
        loading={loading}
        error={error}
        empty={!loading && !error && list.length === 0}
        emptyMessage="No orders yet"
        onRetry={() => reloadOrders()}
      >
        <div className="admin-card-grid">
          {paged.items.map((o) => (
            <AdminOrderCard
              key={o.orderId}
              order={o}
              proofRefreshKey={proofRefresh}
              prepMin={prepMin[o.orderId] ?? String(o.prepTimeMinutes ?? 15)}
              seat={seat[o.orderId] ?? o.seatLabel ?? "A1"}
              onPrepMinChange={(v) => setPrepMin((m) => ({ ...m, [o.orderId]: v }))}
              onSeatChange={(v) => setSeat((m) => ({ ...m, [o.orderId]: v }))}
              onSavePrep={() =>
                void updateOrderFulfillment(
                  o.orderId,
                  Number(prepMin[o.orderId] ?? 15),
                  seat[o.orderId] ?? "A1",
                ).then(reloadOrders)
              }
              onStatus={(s) => void updateOrderStatus(o.orderId, s).then(reloadOrders)}
              onConfirmGcash={() => void updateOrderPayment(o.orderId, "confirmed").then(reloadOrders)}
              onAttachReceipt={(b64) => void updateOrderGcashAdminAttachment(o.orderId, b64).then(reloadOrders)}
              onDelete={() => void deleteOrder(o.orderId).then(reloadOrders)}
            />
          ))}
        </div>
        <Pagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          pageSize={ADMIN_ORDERS_PAGE_SIZE}
          onPageChange={setPage}
        />
      </AdminQueryState>
    </div>
  );
}

function AdminGcashPanel() {
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    void loadCafePaymentSettings().then((s) => setQr(s.gcashQrBase64 ?? null));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Choose a PNG or JPG image file.");
      return;
    }
    if (file.size > MAX_GCASH_QR_BYTES) {
      setMsg(`Image too large (max ${MAX_GCASH_QR_BYTES / 1024} KB).`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const b64 = await fileToBase64(file);
      await saveCafePaymentSettings({ gcashQrBase64: b64 });
      setQr(b64);
      setMsg("GCash QR saved — customers will see it at checkout.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save QR.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onRemove = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await saveCafePaymentSettings({ gcashQrBase64: null });
      setQr(null);
      setMsg("Shop QR removed.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not remove QR.");
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = base64ImageDataUrl(qr);

  return (
    <div>
      <PageHeader eyebrow="Admin" title={ADMIN_SECTIONS.gcash.title} subtitle={ADMIN_SECTIONS.gcash.subtitle} />
      <Card className="max-w-xl space-y-5">
        <div>
          <SectionLabel>Merchant QR image</SectionLabel>
          <p className="mt-1 text-sm text-muted">PNG or JPG recommended. Shown to customers at checkout on web and mobile.</p>
        </div>

        <div className="flex aspect-square max-h-72 items-center justify-center overflow-hidden rounded-xl border border-emerald-deep/10 bg-[#FAF7F4]">
          {previewUrl ? (
            <img src={previewUrl} alt="GCash QR preview" className="max-h-full max-w-full object-contain p-4" />
          ) : (
            <p className="px-6 text-center text-sm text-muted">No QR uploaded yet. Choose an image file below.</p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0])}
        />

        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {busy ? "Saving…" : qr ? "Replace image file" : "Choose image file"}
          </Button>
          <Button variant="ghost" disabled={busy || !qr} className="text-red-700 hover:bg-red-50" onClick={() => void onRemove()}>
            <Trash2 className="h-4 w-4" />
            Remove QR
          </Button>
        </div>

        {msg ? <p className={msg.includes("saved") || msg.includes("removed") ? "alert-success" : "alert-error"}>{msg}</p> : null}
      </Card>
    </div>
  );
}
