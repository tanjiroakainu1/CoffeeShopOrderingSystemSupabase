import { Link } from "react-router-dom";
import { GuestOrderCta, GuestPageFooter } from "@/components/GuestSiteHeader";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { PublicMenuSection } from "@/components/PublicMenuSection";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { PageHeader } from "@/components/ui";
import { AppBrand } from "@/core/assets";

export function PublicMenuPage() {
  return (
    <PublicSiteShell shellClassName="guest-page">
      <main className="guest-main">
        <PageHeader
          eyebrow="Order online"
          title={`${AppBrand.displayName} menu`}
          subtitle="Browse every category and item from our live catalog. Sign in when you're ready to add items to your bag and check out."
          action={<GuestOrderCta compact />}
        />
        <p className="mt-4 text-sm text-muted">
          Browsing as a guest?{" "}
          <Link to="/" className="font-semibold text-emerald hover:text-emerald-deep">
            Back to home
          </Link>
        </p>

        <div className="mt-6">
          <AppDownloadBanner variant="compact" />
        </div>

        <div className="mt-8 sm:mt-10">
          <PublicMenuSection />
        </div>
      </main>

      <GuestPageFooter />
    </PublicSiteShell>
  );
}
