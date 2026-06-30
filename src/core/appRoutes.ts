export type AdminSection = "dashboard" | "orders" | "reports" | "products" | "categories" | "seats" | "users" | "recovery" | "gcash";

export type CustomerSection = "home" | "menu" | "bag" | "favorites" | "profile" | "account";

export const ADMIN_SECTIONS: Record<
  AdminSection,
  { navLabel: string; title: string; subtitle: string; path: string }
> = {
  dashboard: {
    navLabel: "Dashboard",
    title: "Admin dashboard",
    subtitle: "Shop overview — revenue, orders, and quick actions",
    path: "/admin/dashboard",
  },
  orders: {
    navLabel: "Orders",
    title: "Order management",
    subtitle: "Kitchen lifecycle, GCash verification, and fulfillment",
    path: "/admin/orders",
  },
  reports: {
    navLabel: "Reports",
    title: "Reports & analytics",
    subtitle: "Revenue, order mix, and top products — synced with Flutter admin",
    path: "/admin/reports",
  },
  products: {
    navLabel: "Products",
    title: "Product management",
    subtitle: "Menu catalog synced with mobile",
    path: "/admin/products",
  },
  categories: {
    navLabel: "Categories",
    title: "Category management",
    subtitle: "Menu sections synced with Flutter · sort order controls display sequence",
    path: "/admin/categories",
  },
  seats: {
    navLabel: "Seats",
    title: "Seat management",
    subtitle: "Reservable seats for dine-in — synced with Flutter admin & customer checkout",
    path: "/admin/seats",
  },
  users: {
    navLabel: "Users",
    title: "User management",
    subtitle: "Add, edit, change password, and delete accounts — synced with Flutter admin",
    path: "/admin/users",
  },
  recovery: {
    navLabel: "Recovery",
    title: "Account recovery",
    subtitle: "Approve to let the customer set a new password, or reject with an optional note",
    path: "/admin/recovery",
  },
  gcash: {
    navLabel: "GCash QR",
    title: "GCash QR settings",
    subtitle: "Shop payment settings shared with mobile",
    path: "/admin/gcash",
  },
};

export const CUSTOMER_SECTIONS: Record<
  CustomerSection,
  { navLabel: string; title: string; subtitle: string; path: string }
> = {
  home: {
    navLabel: "Home",
    title: "Home",
    subtitle: "Browse the menu, build your bag, and check out with GCash",
    path: "/app/home",
  },
  menu: {
    navLabel: "Menu",
    title: "Menu",
    subtitle: "Pick your items, adjust quantities, and review everything in your bag before checkout",
    path: "/app/menu",
  },
  bag: {
    navLabel: "Bag",
    title: "Your bag",
    subtitle: "Review items and complete checkout",
    path: "/app/bag",
  },
  favorites: {
    navLabel: "Favorites",
    title: "Favorites",
    subtitle: "Menu hearts and saved places synced with Supabase",
    path: "/app/favorites",
  },
  profile: {
    navLabel: "Profile",
    title: "Profile",
    subtitle: "Your registered account details from Supabase",
    path: "/app/profile",
  },
  account: {
    navLabel: "Settings",
    title: "Settings",
    subtitle: "Profile shortcut, promos, and sign out",
    path: "/app/account",
  },
};

export function adminSectionFromPath(pathname: string): AdminSection | null {
  const normalized = pathname.replace(/\/$/, "") || "/admin";
  if (normalized === "/admin") return "dashboard";
  const segment = normalized.replace(/^\/admin\/?/, "").split("/")[0];
  if (segment && segment in ADMIN_SECTIONS) return segment as AdminSection;
  return null;
}

export function customerSectionFromPath(pathname: string): CustomerSection | null {
  const normalized = pathname.replace(/\/$/, "") || "/app";
  if (normalized === "/app") return "home";
  const segment = normalized.replace(/^\/app\/?/, "").split("/")[0];
  if (segment && segment in CUSTOMER_SECTIONS) return segment as CustomerSection;
  return null;
}

export function adminPathForSection(section: AdminSection): string {
  return ADMIN_SECTIONS[section].path;
}

export function customerPathForSection(section: CustomerSection): string {
  return CUSTOMER_SECTIONS[section].path;
}

export const ADMIN_NAV_ORDER: AdminSection[] = [
  "dashboard",
  "orders",
  "products",
  "categories",
  "seats",
  "users",
  "recovery",
  "gcash",
  "reports",
];

export const CUSTOMER_NAV_ORDER: CustomerSection[] = [
  "home",
  "menu",
  "bag",
  "favorites",
  "profile",
  "account",
];

/** Legacy lookup for path → section (exact match). */
export function adminSectionMeta(section: AdminSection) {
  return ADMIN_SECTIONS[section];
}

export function customerSectionMeta(section: CustomerSection) {
  return CUSTOMER_SECTIONS[section];
}
