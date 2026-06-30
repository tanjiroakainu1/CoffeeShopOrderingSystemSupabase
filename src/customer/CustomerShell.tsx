import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  CustomerCartBanner,
  CustomerSiteLayout,
  type CustomerTab,
} from "@/components/CustomerSidebar";
import { CUSTOMER_SECTIONS, customerSectionFromPath } from "@/core/appRoutes";
import { orderTotalCents } from "@/core/formatters";
import { useCart } from "@/context/CartContext";
import { loadCustomerPreferences, loadProducts } from "@/services/supabaseService";
import type { PinnedLocation, UserAccount } from "@/types";
import { CustomerHomeTab } from "@/customer/tabs/HomeTab";
import { CustomerMenuTab } from "@/customer/tabs/MenuTab";
import { CustomerBagTab } from "@/customer/tabs/BagTab";
import { CustomerAccountTab } from "@/customer/tabs/AccountTab";
import { CustomerFavoritesTab } from "@/customer/tabs/FavoritesTab";
import { CustomerProfileTab } from "@/customer/tabs/ProfileTab";

export function CustomerShell({
  user,
  onSignOut,
}: {
  user: UserAccount;
  onSignOut: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const section = customerSectionFromPath(location.pathname);
  const [menuKey, setMenuKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const { cart, count } = useCart();
  const [products, setProducts] = useState<{ id: string; priceCents: number }[]>([]);

  const reloadPrefs = useCallback(() => {
    void loadCustomerPreferences(user.accountId).then((p) => setPin(p.pin));
  }, [user.accountId]);

  useEffect(() => {
    reloadPrefs();
    void loadProducts().then(setProducts);
  }, [reloadPrefs]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cartTotal = useMemo(() => {
    const lines = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = products.find((x) => x.id === id);
        return p ? { quantity: q, unitPriceCents: p.priceCents } : null;
      })
      .filter(Boolean) as { quantity: number; unitPriceCents: number }[];
    return orderTotalCents(lines);
  }, [cart, products]);

  const goMenu = useCallback(() => navigate(CUSTOMER_SECTIONS.menu.path), [navigate]);
  const goBag = useCallback(() => navigate(CUSTOMER_SECTIONS.bag.path), [navigate]);
  const goSection = useCallback(
    (tab: CustomerTab) => navigate(CUSTOMER_SECTIONS[tab].path),
    [navigate],
  );

  if (location.pathname === "/app" || location.pathname === "/app/") {
    return <Navigate to={CUSTOMER_SECTIONS.home.path} replace />;
  }

  if (section === null) {
    return <Navigate to={CUSTOMER_SECTIONS.home.path} replace />;
  }

  return (
    <CustomerSiteLayout
      user={user}
      current={section}
      cartCount={count}
      cartTotalCents={cartTotal}
      mobileOpen={mobileNavOpen}
      onToggleMobile={() => setMobileNavOpen((o) => !o)}
      onCloseMobile={() => setMobileNavOpen(false)}
      onSignOut={() => void onSignOut()}
      onViewBag={goBag}
      showMenuRefresh={section === "menu"}
      onRefreshMenu={() => setMenuKey((k) => k + 1)}
    >
      {section === "menu" ? (
        <CustomerCartBanner count={count} totalCents={cartTotal} onViewBag={goBag} />
      ) : null}

      <main className="customer-content">
        {section === "home" ? (
          <CustomerHomeTab pin={pin} onBrowseMenu={goMenu} onOpenBag={goBag} onOpenFavorites={() => goSection("favorites")} />
        ) : null}
        {section === "menu" ? <CustomerMenuTab key={menuKey} user={user} /> : null}
        {section === "bag" ? <CustomerBagTab onGoMenu={goMenu} /> : null}
        {section === "favorites" ? <CustomerFavoritesTab user={user} /> : null}
        {section === "profile" ? <CustomerProfileTab user={user} /> : null}
        {section === "account" ? (
          <CustomerAccountTab
            user={user}
            onBrowseMenu={goMenu}
            onOpenProfile={() => goSection("profile")}
          />
        ) : null}
      </main>
    </CustomerSiteLayout>
  );
}
