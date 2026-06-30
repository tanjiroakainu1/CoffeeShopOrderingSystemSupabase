import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import type { OrderStatus } from "@/types";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "sidebar" | "toolbar";
  children: ReactNode;
}) {
  const base =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
        ? "btn-ghost"
        : variant === "sidebar"
          ? "btn-sidebar"
          : variant === "toolbar"
            ? "btn-toolbar"
            : "btn-primary bg-red-600 text-white hover:brightness-110";
  return (
    <button className={`${base} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  flat = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  flat?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${flat ? "card-flat" : "card-surface"} p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

import { AppBrand } from "@/core/assets";

export function Logo({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <img
      src="/logo123.jpeg"
      alt={`${AppBrand.displayName} logo`}
      className={`rounded-2xl object-contain shadow-sm ${className}`}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-cream via-emerald-light to-yellow-light/50 px-6">
      <div className="rounded-full bg-crema/35 p-5 shadow-card ring-4 ring-white/60">
        <Logo className="h-16 w-16" />
      </div>
      <h1 className="mt-7 font-serif text-2xl font-bold text-brown-deep">{AppBrand.displayName}</h1>
      <p className="mt-2 text-muted">Loading your experience…</p>
      <div className="mt-8 h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-deep/20 border-t-yellow" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="site-page-head mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? <span className="guest-eyebrow">{eyebrow}</span> : null}
        <h1 className={`site-page-title ${eyebrow ? "mt-2" : ""}`}>{title}</h1>
        {subtitle ? <p className="site-page-lead">{subtitle}</p> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-label">{children}</p>;
}

export function StatusBadge({
  status,
  label,
}: {
  status: OrderStatus | string;
  label?: string;
}) {
  const s = String(status).toLowerCase();
  const tone =
    s === "pending"
      ? "status-pending"
      : s === "preparing"
        ? "status-preparing"
        : s === "ready"
          ? "status-ready"
          : s === "completed"
            ? "status-completed"
            : s === "cancelled"
              ? "status-cancelled"
              : s === "confirmed"
                ? "status-ready"
                : s === "approved"
                  ? "status-ready"
                  : s === "rejected"
                    ? "status-cancelled"
                    : "status-pending";
  return (
    <span className={`status-badge ${tone}`}>
      {label ? `${label} · ` : ""}
      {s}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="font-serif text-lg font-bold text-brown-deep">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
