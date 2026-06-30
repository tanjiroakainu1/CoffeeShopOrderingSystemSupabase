import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { AppAssets } from "@/core/assets";
import { Button, Card, PageHeader, SectionLabel } from "@/components/ui";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import type { UserAccount } from "@/types";

export function CustomerAccountTab({
  user,
  onBrowseMenu,
  onOpenProfile,
}: {
  user: UserAccount;
  onBrowseMenu: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="page-section">
      <PageHeader eyebrow="Your account" title={CUSTOMER_SECTIONS.account.title} subtitle={CUSTOMER_SECTIONS.account.subtitle} />

      <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" onClick={onOpenProfile}>
        <SectionLabel>Profile</SectionLabel>
        <p className="mt-1 font-bold text-brown-deep">{user.displayName.trim() || user.email}</p>
        <p className="text-sm text-muted">View & edit your registered Supabase profile →</p>
      </Card>

      <AppDownloadBanner variant="compact" />

      <Card className="cursor-pointer overflow-hidden border-yellow-400/50 bg-gradient-to-br from-yellow/20 via-cream to-white transition hover:-translate-y-0.5 hover:shadow-lg" onClick={onBrowseMenu}>
        <div className="flex flex-col gap-4 xs:flex-row">
          <img src={AppAssets.promo1} alt="" className="h-32 w-full shrink-0 rounded-xl object-cover xs:h-24 xs:w-24" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-brown-deep/70">Live café promos</p>
            <p className="font-serif text-lg font-extrabold">Your neighborhood deals</p>
            <p className="mt-1 text-xs text-muted">Order from the menu — savings at checkout.</p>
            <Button className="mt-3 min-h-10 px-4 text-sm">Shop specials →</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
