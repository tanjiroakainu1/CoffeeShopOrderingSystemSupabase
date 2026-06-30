import type { ReactNode } from "react";
import { Download, Heart, Home, LogOut, Menu, RefreshCw, Settings, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import { pesoFromCents } from "@/core/formatters";
import { Logo } from "@/components/ui";
import { AppBrand } from "@/core/assets";
import { APP_DOWNLOAD } from "@/core/appDownload";
import { CUSTOMER_NAV_ORDER, CUSTOMER_SECTIONS, type CustomerSection } from "@/core/appRoutes";
import type { UserAccount } from "@/types";

export type CustomerTab = CustomerSection;

const navIcons: Record<CustomerSection, typeof Home> = {
  home: Home,
  menu: Menu,
  bag: ShoppingBag,
  favorites: Heart,
  profile: User,
  account: Settings,
};

export function CustomerSiteLayout({
  user,
  current,
  cartCount,
  cartTotalCents,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
  onSignOut,
  onViewBag,
  showMenuRefresh,
  onRefreshMenu,
  children,
}: {
  user: UserAccount;
  current: CustomerTab;
  cartCount: number;
  cartTotalCents: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
  onSignOut: () => void;
  onViewBag: () => void;
  showMenuRefresh?: boolean;
  onRefreshMenu?: () => void;
  children: ReactNode;
}) {
  const displayName = user.displayName.trim() || user.email.split("@")[0];
  const sectionMeta = CUSTOMER_SECTIONS[current];

  const navItems = CUSTOMER_NAV_ORDER.map((id) => ({
    id,
    to: CUSTOMER_SECTIONS[id].path,
    label: CUSTOMER_SECTIONS[id].navLabel,
    icon: navIcons[id],
    badge: id === "bag" ? cartCount : undefined,
  }));

  const brand = (
    <Link to={CUSTOMER_SECTIONS.home.path} className="app-sidebar-brand" onClick={onCloseMobile}>
      <Logo className="h-10 w-10 shrink-0" />
      <div className="min-w-0">
        <p className="truncate font-serif text-base font-bold text-brown-deep">{AppBrand.displayName}</p>
        <p className="truncate text-[0.65rem] text-muted">Signed in as {displayName}</p>
      </div>
    </Link>
  );

  const sidebarFooter = (
    <>
      {showMenuRefresh && onRefreshMenu ? (
        <button type="button" className="app-sidebar-footer-btn" onClick={onRefreshMenu}>
          <RefreshCw className="h-4 w-4 shrink-0" />
          Refresh menu
        </button>
      ) : null}
      <p className="mt-1 px-1 text-center text-[0.65rem] text-muted">
        <Link to="/menu" className="font-semibold text-emerald" onClick={onCloseMobile}>
          View public menu
        </Link>
      </p>
      <a
        href={APP_DOWNLOAD.apkPath}
        download={APP_DOWNLOAD.fileName}
        className="app-sidebar-footer-btn mt-1"
        onClick={onCloseMobile}
      >
        <Download className="h-4 w-4 shrink-0" />
        Download Android app
      </a>
    </>
  );

  return (
    <AppSidebarShell
      variant="customer"
      navItems={navItems}
      activePath={CUSTOMER_SECTIONS[current].path}
      brand={brand}
      sidebarFooter={sidebarFooter}
      topBarTitle={sectionMeta.title}
      topBarSubtitle={displayName}
      mobileOpen={mobileOpen}
      onToggleMobile={onToggleMobile}
      onCloseMobile={onCloseMobile}
      shellClassName="customer-app"
      topBarActions={
        <>
          {showMenuRefresh && onRefreshMenu ? (
            <button type="button" className="btn-toolbar hidden sm:inline-flex" onClick={onRefreshMenu}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          ) : null}
          <button
            type="button"
            className={`customer-site-cart ${cartCount <= 0 ? "customer-site-cart-empty" : ""}`}
            aria-label={`Bag with ${cartCount} items`}
            onClick={onViewBag}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{cartCount > 0 ? pesoFromCents(cartTotalCents) : "Bag"}</span>
            {cartCount > 0 ? <span className="customer-site-nav-badge">{cartCount}</span> : null}
          </button>
          <button type="button" className="app-shell-signout" onClick={onSignOut}>
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline">Sign out</span>
          </button>
        </>
      }
    >
      {children}
    </AppSidebarShell>
  );
}

/** @deprecated Use CustomerSiteLayout */
export const CustomerSiteHeader = CustomerSiteLayout;
/** @deprecated Use CustomerSiteLayout */
export const CustomerSidebar = CustomerSiteLayout;

export function CustomerCartBanner({
  count,
  totalCents,
  onViewBag,
}: {
  count: number;
  totalCents: number;
  onViewBag: () => void;
}) {
  if (count <= 0) return null;

  return (
    <div className="customer-cart-banner">
      <div className="customer-cart-banner-inner site-container !px-4 xs:!px-5 sm:!px-6 lg:!px-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{count} items in your bag</p>
          <p className="font-serif text-xl font-extrabold text-emerald-deep sm:text-2xl">{pesoFromCents(totalCents)}</p>
        </div>
        <button type="button" className="btn-primary min-h-11 shrink-0 px-6" onClick={onViewBag}>
          Review order
        </button>
      </div>
    </div>
  );
}
