import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X, type LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  cta?: boolean;
};

export type SidebarVariant = "public" | "customer" | "admin";

function navIsActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SidebarNav({
  variant,
  items,
  activePath,
  onNavigate,
}: {
  variant: SidebarVariant;
  items: SidebarNavItem[];
  activePath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="app-sidebar-nav" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = navIsActive(activePath, item.to);
        const itemClass = [
          "app-sidebar-nav-item",
          variant === "admin" ? "app-sidebar-nav-item-admin" : "app-sidebar-nav-item-light",
          active ? "app-sidebar-nav-active" : "app-sidebar-nav-idle",
          item.cta && !active ? "app-sidebar-nav-cta" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={itemClass}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge != null && item.badge > 0 ? (
              <span className="app-sidebar-nav-badge">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebarShell({
  variant,
  navItems,
  activePath,
  brand,
  sidebarFooter,
  topBarTitle,
  topBarSubtitle,
  topBarActions,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
  shellClassName = "",
  mainClassName = "",
  showDesktopTopBarTitle = false,
  children,
}: {
  variant: SidebarVariant;
  navItems: SidebarNavItem[];
  activePath: string;
  brand: ReactNode;
  sidebarFooter?: ReactNode;
  topBarTitle?: ReactNode;
  topBarSubtitle?: ReactNode;
  topBarActions?: ReactNode;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
  shellClassName?: string;
  mainClassName?: string;
  /** When true, page title stays visible in the top bar on desktop (admin). */
  showDesktopTopBarTitle?: boolean;
  children: ReactNode;
}) {
  const sidebarClass =
    variant === "admin"
      ? "app-sidebar app-sidebar-admin"
      : variant === "customer"
        ? "app-sidebar app-sidebar-customer"
        : "app-sidebar app-sidebar-public";

  const topBarClass = [
    "app-shell-topbar",
    !showDesktopTopBarTitle && topBarActions ? "app-shell-topbar--actions-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`app-shell ${shellClassName}`.trim()}>
      <aside className={`${sidebarClass} hidden sidebar:flex`} aria-label="Sidebar">
        {brand}
        <SidebarNav variant={variant} items={navItems} activePath={activePath} />
        {sidebarFooter ? <div className="app-sidebar-footer">{sidebarFooter}</div> : null}
      </aside>

      <div
        className={`app-sidebar-overlay ${mobileOpen ? "app-sidebar-overlay-open" : ""}`}
        aria-hidden={!mobileOpen}
        onClick={onCloseMobile}
      />

      <aside
        className={`app-sidebar-drawer ${sidebarClass} ${mobileOpen ? "app-sidebar-drawer-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <div className="app-sidebar-drawer-head">
          {brand}
          <button
            type="button"
            className="app-sidebar-close"
            aria-label="Close navigation menu"
            onClick={onCloseMobile}
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        <SidebarNav variant={variant} items={navItems} activePath={activePath} onNavigate={onCloseMobile} />
        {sidebarFooter ? <div className="app-sidebar-footer">{sidebarFooter}</div> : null}
      </aside>

      <div className={`app-shell-main ${mainClassName}`.trim()}>
        <header className={topBarClass}>
          <div className="app-shell-topbar-inner">
            <div className="app-shell-topbar-start">
              <button
                type="button"
                className="app-sidebar-menu-btn sidebar:hidden"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileOpen}
                onClick={onToggleMobile}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" strokeWidth={2.25} />}
              </button>
              {topBarTitle || topBarSubtitle ? (
                <div
                  className={`min-w-0 ${showDesktopTopBarTitle ? "app-shell-topbar-titles-admin" : "app-shell-topbar-titles"}`}
                >
                  {topBarTitle ? (
                    <span className="block truncate font-serif text-sm font-bold text-brown-deep sm:text-base">
                      {topBarTitle}
                    </span>
                  ) : null}
                  {topBarSubtitle ? (
                    <span className="block truncate text-[0.65rem] text-muted sm:text-xs">{topBarSubtitle}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {topBarActions ? <div className="app-shell-topbar-actions">{topBarActions}</div> : null}
          </div>
        </header>
        <div className="app-shell-body">{children}</div>
      </div>
    </div>
  );
}
