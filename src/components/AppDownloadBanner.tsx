import { Download, Smartphone } from "lucide-react";
import { APP_DOWNLOAD } from "@/core/appDownload";
import { AppBrand } from "@/core/assets";

type AppDownloadBannerProps = {
  variant?: "card" | "compact" | "inline";
  className?: string;
};

export function AppDownloadBanner({ variant = "card", className = "" }: AppDownloadBannerProps) {
  const link = (
    <a
      href={APP_DOWNLOAD.apkPath}
      download={APP_DOWNLOAD.fileName}
      className={
        variant === "compact"
          ? "btn-emerald shrink-0 gap-2 text-sm"
          : variant === "inline"
            ? "btn-outline-emerald gap-2 text-sm"
            : "btn-emerald mt-4 gap-2 sm:mt-0"
      }
    >
      <Download className="h-4 w-4 shrink-0" />
      Download APK
    </a>
  );

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-col gap-3 rounded-card border border-emerald-deep/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-light text-emerald-deep">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-brown-deep">Get the Android app</p>
            <p className="mt-0.5 text-sm text-muted">
              {AppBrand.displayName} v{APP_DOWNLOAD.version} · by {AppBrand.developerName}
            </p>
          </div>
        </div>
        {link}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <p className="text-sm text-muted">
          Prefer mobile? Install <strong className="font-semibold text-brown-deep">{APP_DOWNLOAD.label}</strong>.
        </p>
        {link}
      </div>
    );
  }

  return (
    <section
      className={`app-download-banner ${className}`}
      aria-label="Download mobile app"
    >
      <div className="app-download-banner-icon">
        <Smartphone className="h-6 w-6" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">Mobile app</p>
        <h2 className="mt-1 font-serif text-xl font-extrabold text-white sm:text-2xl">
          Take {AppBrand.displayName} with you
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90">
          Download our Android app for the same menu, bag, GCash checkout, and order tracking — by{" "}
          {AppBrand.developerName}.
        </p>
      </div>
      {link}
    </section>
  );
}
