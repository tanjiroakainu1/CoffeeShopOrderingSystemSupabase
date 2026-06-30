import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, Truck } from "lucide-react";
import { GuestOrderCta, GuestPageFooter } from "@/components/GuestSiteHeader";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { PublicMenuSection } from "@/components/PublicMenuSection";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { AppAssets, AppBrand } from "@/core/assets";
import { CafeLocation } from "@/core/cafeLocation";
import { isSupabaseConfigured } from "@/core/env";

const highlights = [
  { icon: Sparkles, title: "Fresh daily menu", desc: "Drinks, food & pastries from our live catalog" },
  { icon: Calendar, title: "Reserve a table", desc: "Pick date & time when you check out" },
  { icon: Truck, title: "Delivery available", desc: "Address + GCash receipt upload" },
] as const;

export function GuestHomePage() {
  return (
    <PublicSiteShell shellClassName="guest-page">
      <main className="guest-main">
        <section className="guest-hero">
          <div className="guest-hero-grid">
            <div className="guest-hero-copy">
              <span className="guest-eyebrow">{CafeLocation.regionEyebrow}</span>
              <h1 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-[1.06] text-brown-deep">
                Order from {AppBrand.displayName}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted lg:text-lg">
                Browse our full menu online, build your bag, pay with GCash, and track every order — the same
                experience as our mobile app, on the web.
              </p>

              {!isSupabaseConfigured() ? (
                <p className="alert-error mt-4 text-left text-xs sm:text-sm">
                  Supabase env missing — demo menu shown. Add keys to <code className="font-mono">react-web/.env</code>.
                </p>
              ) : null}

              <div className="mt-6 sm:mt-8">
                <GuestOrderCta />
              </div>

              <p className="mt-5 text-sm text-muted">
                Already have an account?{" "}
                <Link to="/sign-in" className="font-semibold text-emerald underline-offset-2 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="guest-hero-visual">
              <img src={AppAssets.promo1} alt="" className="h-full w-full object-cover" />
              <div className="guest-hero-visual-overlay" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">Today&apos;s special</p>
                <p className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Neighborhood deals</p>
                <p className="mt-2 max-w-sm text-sm text-white/90">Sign in to apply promos at checkout.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <AppDownloadBanner />
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="guest-perk-grid">
            {highlights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="guest-perk-card">
                <div className="guest-perk-icon">
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <p className="mt-3 font-bold text-brown-deep">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            ))}
            <div className="guest-perk-card">
              <div className="guest-perk-icon">
                <MapPin className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <p className="mt-3 font-bold text-brown-deep">Visit us</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{CafeLocation.visitUsLine}</p>
            </div>
          </div>
        </section>

        <div className="mt-12 sm:mt-16 lg:mt-20">
          <PublicMenuSection preview />
        </div>

        <section className="guest-cta-banner mt-12 sm:mt-16 lg:mt-20">
          <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-bold">Ready to order?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/90 sm:text-base">
            Create an account or sign in to add items, choose reservation or delivery, and upload your GCash
            receipt.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:mt-8">
            <Link to="/register" className="btn-primary btn-lg min-w-[11rem] shadow-lg">
              Create account
            </Link>
            <Link to="/menu" className="guest-cta-banner-secondary btn-lg inline-flex min-w-[11rem] items-center justify-center gap-2">
              View full menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="store-info-bar mt-10 sm:mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Hours</p>
            <p className="mt-1 flex items-center gap-2 font-semibold text-brown-deep">
              <Clock className="h-4 w-4 text-emerald" />
              Daily · 7:00 AM – 9:00 PM
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Location</p>
            <p className="mt-1 flex items-start gap-2 font-semibold text-brown-deep">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
              {CafeLocation.shortLabel}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Payment</p>
            <p className="mt-1 font-semibold text-brown-deep">GCash · Pay at checkout</p>
          </div>
        </section>
      </main>

      <GuestPageFooter />
    </PublicSiteShell>
  );
}
