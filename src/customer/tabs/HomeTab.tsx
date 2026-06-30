import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Heart, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { AppAssets, AppBrand } from "@/core/assets";
import { CafeLocation } from "@/core/cafeLocation";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import { pesoFromCents } from "@/core/formatters";
import { promoSlides } from "@/data/homeSpotlightCafes";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { AppDeveloperCredit } from "@/components/AppDeveloperCredit";
import { Button, PageHeader } from "@/components/ui";
import { loadProducts } from "@/services/supabaseService";
import type { CatalogProduct } from "@/types";

export function CustomerHomeTab({
  onBrowseMenu,
  onOpenBag,
  onOpenFavorites,
  pin,
}: {
  onBrowseMenu: () => void;
  onOpenBag: () => void;
  onOpenFavorites: () => void;
  pin?: import("@/types").PinnedLocation | null;
}) {
  const [page, setPage] = useState(0);
  const [featured, setFeatured] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    void loadProducts().then((items) => setFeatured(items.slice(0, 6)));
  }, []);

  const slide = promoSlides[page];

  return (
    <div className="page-section">
      <PageHeader
        eyebrow={AppBrand.displayName}
        title={CUSTOMER_SECTIONS.home.title}
        subtitle={CUSTOMER_SECTIONS.home.subtitle}
      />

      <AppDownloadBanner variant="compact" />

      <div className="quick-action-grid">
        <button type="button" className="quick-action-card" onClick={onBrowseMenu}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow/35 text-emerald-deep">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-brown-deep">Browse menu</p>
            <p className="mt-1 text-sm text-muted">Add drinks, food & pastries</p>
          </div>
        </button>
        <button type="button" className="quick-action-card" onClick={onOpenBag}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-light text-emerald-deep">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-brown-deep">Your bag</p>
            <p className="mt-1 text-sm text-muted">Review items & check out</p>
          </div>
        </button>
        <button type="button" className="quick-action-card" onClick={onOpenFavorites}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange/25 text-brown-deep">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-brown-deep">Favorites</p>
            <p className="mt-1 text-sm text-muted">Saved menu items & places</p>
          </div>
        </button>
      </div>

      <div className="relative overflow-hidden rounded-hero border border-emerald-deep/10 bg-white shadow-card">
        <button type="button" className="relative block w-full text-left" onClick={onBrowseMenu}>
          <img src={slide.imageUrl} alt="" className="h-56 w-full object-cover sm:h-72 lg:h-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep/75 via-emerald-deep/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 lg:max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Today&apos;s promo</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">{slide.headline}</h2>
            <p className="mt-2 text-sm text-white/90 sm:text-base">{slide.subline}</p>
            <span className="mt-5 inline-flex w-fit rounded-full bg-yellow px-5 py-2 font-serif text-sm font-black text-brown-deep shadow-lg">
              {slide.badge}
            </span>
          </div>
        </button>
        <button
          type="button"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow disabled:opacity-40"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow disabled:opacity-40"
          disabled={page >= promoSlides.length - 1}
          onClick={() => setPage((p) => Math.min(promoSlides.length - 1, p + 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {featured.length > 0 ? (
        <section>
          <div className="section-head !border-0 !pb-0">
            <div>
              <h3 className="font-serif text-2xl font-extrabold text-brown-deep">Featured items</h3>
              <p className="mt-1 text-sm text-muted">Popular picks from our menu</p>
            </div>
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={onBrowseMenu}>
              View all
            </Button>
          </div>
          <div className="product-grid mt-5">
            {featured.map((p) => (
              <button
                key={p.id}
                type="button"
                className="catalog-card group text-left"
                onClick={onBrowseMenu}
              >
                <div className="catalog-card-media">
                  {p.imageBase64 ? (
                    <img src={`data:image/jpeg;base64,${p.imageBase64}`} alt={p.name} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">{p.icon}</div>
                  )}
                </div>
                <div className="catalog-card-body">
                  <h4 className="font-serif text-lg font-bold text-brown-deep">{p.name}</h4>
                  <p className="mt-1 font-serif text-lg font-extrabold text-emerald-deep">{pesoFromCents(p.priceCents)}</p>
                  {p.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="store-info-bar">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Your area</p>
          <p className="mt-1 flex items-start gap-2 font-semibold text-brown-deep">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
            {pin?.label ?? CafeLocation.shortLabel}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Store hours</p>
          <p className="mt-1 flex items-center gap-2 font-semibold text-brown-deep">
            <Clock className="h-4 w-4 text-emerald" />
            Daily · 7:00 AM – 9:00 PM
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Need help?</p>
          <p className="mt-1 text-sm text-muted">GCash checkout · Reservation or delivery in your bag.</p>
        </div>
      </section>

      <div className="rounded-hero border border-emerald-deep/10 bg-white p-6 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="min-w-0">
          <h3 className="font-serif text-2xl font-extrabold text-brown-deep">Ready to order?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Open the full menu to customize your bag and check out when you&apos;re ready.
          </p>
        </div>
        <Button className="mt-4 w-full shrink-0 sm:mt-0 sm:w-auto sm:min-w-[12rem]" onClick={onBrowseMenu}>
          Open menu
        </Button>
      </div>

      <div className="hidden overflow-hidden rounded-hero lg:block">
        <img src={AppAssets.promo2} alt="" className="h-48 w-full object-cover" />
      </div>

      <AppDeveloperCredit className="pt-2 text-center" />
    </div>
  );
}
