import type { ReactNode } from "react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { AppDeveloperCredit } from "@/components/AppDeveloperCredit";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { Logo } from "@/components/ui";
import { AppBrand } from "@/core/assets";

export function AuthLayout({
  title,
  subtitle,
  heroImage,
  altLink,
  children,
  footer,
  perks,
}: {
  title: string;
  subtitle?: ReactNode;
  heroImage?: string;
  altLink?: { to: string; label: string };
  children: ReactNode;
  footer?: ReactNode;
  perks?: string[];
}) {
  return (
    <PublicSiteShell shellClassName="auth-screen" altLink={altLink}>
      <div className="auth-screen-glow auth-screen-glow-yellow" />
      <div className="auth-screen-glow auth-screen-glow-emerald" />

      <div className="auth-container site-container max-w-md pt-3 xs:max-w-lg sm:max-w-2xl sm:pt-4 lg:max-w-5xl lg:pt-5 xl:max-w-6xl">
        <div className="auth-split flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
          <aside className="auth-brand-panel lg:flex lg:max-w-sm lg:flex-1 lg:flex-col lg:justify-center xl:max-w-md">
            {heroImage ? (
              <div className="auth-hero-banner lg:hidden">
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
                <div className="auth-hero-banner-overlay" />
              </div>
            ) : null}

            <div className="auth-brand-block">
              <Logo className="auth-brand-logo" />
              <p className="auth-brand-eyebrow">{AppBrand.displayName}</p>
              <h1 className="auth-brand-title">{title}</h1>
              {subtitle ? <div className="auth-brand-subtitle">{subtitle}</div> : null}

              {perks && perks.length > 0 ? (
                <ul className="auth-perk-list mt-6 hidden lg:flex">
                  {perks.map((perk) => (
                    <li key={perk} className="auth-perk-item">
                      {perk}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {heroImage ? (
              <div className="auth-hero-banner auth-hero-banner-desktop hidden lg:block">
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
                <div className="auth-hero-banner-overlay" />
              </div>
            ) : null}
          </aside>

          <div className="auth-card lg:flex lg:max-w-md lg:flex-1 lg:flex-col lg:justify-center xl:max-w-lg">
            <div className="auth-card-inner">
              <div className="auth-card-header lg:hidden">
                <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
                <div className="min-w-0">
                  <h2 className="font-serif text-xl font-extrabold text-brown-deep sm:text-2xl">{title}</h2>
                  {subtitle ? <div className="mt-1 text-sm text-muted">{subtitle}</div> : null}
                </div>
              </div>

              {children}

              <AppDownloadBanner variant="compact" className="mt-6" />

              <AppDeveloperCredit className="mt-4 text-center" compact />

              {footer ? <div className="auth-card-footer">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </PublicSiteShell>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  icon: Icon,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="auth-field" htmlFor={id}>
      <span className="auth-field-label">{label}</span>
      <span className="auth-field-control">
        {Icon ? <Icon className="auth-field-icon" aria-hidden /> : null}
        <input
          id={id}
          className={`input-field auth-field-input ${Icon ? "auth-field-input-icon" : ""}`}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
      </span>
    </label>
  );
}
