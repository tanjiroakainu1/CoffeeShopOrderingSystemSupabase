import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { AppSidebarShell } from "@/components/AppSidebarShell";
import { Logo } from "@/components/ui";
import { AppBrand } from "@/core/assets";
import { APP_DOWNLOAD } from "@/core/appDownload";
import { CafeLocation } from "@/core/cafeLocation";
import { PUBLIC_NAV, PUBLIC_NAV_ORDER } from "@/core/publicNav";

export function PublicSiteShell({
  children,
  shellClassName = "",
  mainClassName = "",
  altLink,
}: {
  children: ReactNode;
  shellClassName?: string;
  mainClassName?: string;
  altLink?: { to: string; label: string };
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navItems = PUBLIC_NAV_ORDER.map((id) => {
    const meta = PUBLIC_NAV[id];
    return {
      id,
      to: meta.path,
      label: meta.label,
      icon: meta.icon,
      cta: meta.cta,
    };
  });

  const brand = (
    <Link to="/" className="app-sidebar-brand" onClick={() => setMobileOpen(false)}>
      <Logo className="h-10 w-10 shrink-0 ring-2 ring-emerald-deep/10" />
      <div className="min-w-0">
        <p className="truncate font-serif text-base font-bold text-brown-deep">{AppBrand.displayName}</p>
        <p className="truncate text-[0.65rem] text-muted">{CafeLocation.shortLabel.split(",")[0]}</p>
      </div>
    </Link>
  );

  const sidebarFooter = (
    <a
      href={APP_DOWNLOAD.apkPath}
      download={APP_DOWNLOAD.fileName}
      className="app-sidebar-footer-btn"
      onClick={() => setMobileOpen(false)}
    >
      <Download className="h-4 w-4 shrink-0" />
      Download Android app
    </a>
  );

  return (
    <AppSidebarShell
      variant="public"
      navItems={navItems}
      activePath={pathname}
      brand={brand}
      sidebarFooter={sidebarFooter}
      mobileOpen={mobileOpen}
      onToggleMobile={() => setMobileOpen((o) => !o)}
      onCloseMobile={() => setMobileOpen(false)}
      shellClassName={shellClassName}
      mainClassName={mainClassName}
      topBarActions={
        altLink ? (
          <Link to={altLink.to} className="site-header-btn-outline sidebar:hidden">
            {altLink.label}
          </Link>
        ) : null
      }
    >
      {children}
    </AppSidebarShell>
  );
}
