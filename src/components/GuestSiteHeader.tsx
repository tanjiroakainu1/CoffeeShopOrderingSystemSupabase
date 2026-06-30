import { Link } from "react-router-dom";
import { Download, LogIn } from "lucide-react";
import { AppBrand, appCopyrightLine } from "@/core/assets";
import { APP_DOWNLOAD } from "@/core/appDownload";
import { CafeLocation } from "@/core/cafeLocation";

export function GuestOrderCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "site-inline-cta" : "guest-cta-stack"}>
      <Link to="/sign-in" className="btn-emerald btn-lg gap-2 shadow-md sm:min-w-[11rem]">
        <LogIn className="h-4 w-4 shrink-0" />
        Sign in to order
      </Link>
      <Link to="/register" className="btn-outline-emerald btn-lg sm:min-w-[11rem]">
        Create free account
      </Link>
    </div>
  );
}

export function GuestPageFooter() {
  return (
    <footer className="guest-footer">
      <div className="guest-footer-inner">
        <p className="font-serif text-lg font-bold text-brown-deep">{AppBrand.displayName}</p>
        <p className="mt-1 text-sm text-muted">Neighborhood coffee, reservations & delivery · {CafeLocation.shortLabel}</p>
        <div className="guest-footer-links">
          <Link to="/" className="hover:text-emerald-deep">
            Home
          </Link>
          <Link to="/menu" className="hover:text-emerald-deep">
            Menu
          </Link>
          <Link to="/sign-in" className="hover:text-emerald-deep">
            Sign in
          </Link>
          <Link to="/register" className="hover:text-emerald-deep">
            Register
          </Link>
          <a
            href={APP_DOWNLOAD.apkPath}
            download={APP_DOWNLOAD.fileName}
            className="inline-flex items-center gap-1.5 hover:text-emerald-deep"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            Android app
          </a>
        </div>
        <p className="mt-6 text-xs text-muted/80">{appCopyrightLine()}</p>
      </div>
    </footer>
  );
}
