import type { HomeSpotlightCafe } from "@/types";
import { AppAssets } from "@/core/assets";
import { CafeLocation } from "@/core/cafeLocation";

/** Mirrors `lib/customer/home_spotlight_cafes.dart` */
export const kHomeSpotlightCafes: HomeSpotlightCafe[] = [
  {
    id: "roast_bean",
    name: CafeLocation.venueName,
    rating: 4.5,
    reviewCount: 100,
    distanceKm: 0.5,
    priceHintPesos: 1000,
    address: "Maginhawa Street, Teachers Village",
    openNow: true,
    imageUrl: AppAssets.promo1,
  },
  {
    id: "daily_grind",
    name: "The Daily Grind Café",
    rating: 4.3,
    reviewCount: 86,
    distanceKm: 0.9,
    priceHintPesos: 850,
    address: "Katipunan Avenue, Loyola Heights",
    openNow: true,
    imageUrl: AppAssets.promo2,
  },
  {
    id: "la_vie",
    name: "Café La Vie",
    rating: 4.6,
    reviewCount: 64,
    distanceKm: 1.2,
    priceHintPesos: 1200,
    address: "Eastwood City, Libis",
    openNow: true,
    imageUrl: AppAssets.promo1,
  },
  {
    id: "brewed",
    name: "Brewed Awakening Café",
    rating: 4.1,
    reviewCount: 52,
    distanceKm: 1.8,
    priceHintPesos: 650,
    address: "Tomas Morato Avenue, Diliman",
    openNow: false,
    imageUrl: AppAssets.promo2,
  },
  {
    id: "roast_rest",
    name: "Roast & Rest Café",
    rating: 4.4,
    reviewCount: 71,
    distanceKm: 2.1,
    priceHintPesos: 950,
    address: "Maginhawa Street, Sikatuna Village",
    openNow: true,
    imageUrl: AppAssets.promo1,
  },
];

export const promoSlides = [
  {
    imageUrl: AppAssets.promo1,
    headline: CafeLocation.venueName,
    subline: "Visit us for a cup",
    badge: "50% OFF",
  },
  {
    imageUrl: AppAssets.promo1,
    headline: "Café Quezon City",
    subline: "Good coffee · great food · cozy spot",
    badge: "Up to 20% OFF",
  },
  {
    imageUrl: AppAssets.promo2,
    headline: "Neighborhood deals",
    subline: "Discover offers from local cafés",
    badge: "See offers",
  },
];
