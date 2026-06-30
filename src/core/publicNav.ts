import type { LucideIcon } from "lucide-react";
import { Home, LogIn, UserPlus, UtensilsCrossed } from "lucide-react";

export type PublicNavId = "home" | "menu" | "signin" | "register";

export const PUBLIC_NAV: Record<
  PublicNavId,
  { label: string; path: string; icon: LucideIcon; cta?: boolean }
> = {
  home: { label: "Home", path: "/", icon: Home },
  menu: { label: "Menu", path: "/menu", icon: UtensilsCrossed },
  signin: { label: "Sign in", path: "/sign-in", icon: LogIn },
  register: { label: "Create account", path: "/register", icon: UserPlus, cta: true },
};

export const PUBLIC_NAV_ORDER: PublicNavId[] = ["home", "menu", "signin", "register"];

export function isPublicNavActive(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}
