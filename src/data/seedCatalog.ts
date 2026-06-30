import type { CatalogProduct, ProductCategory } from "@/types";

/** Mirrors `lib/services/menu_catalog.dart` + default categories. */
export const SEED_CATEGORIES: ProductCategory[] = [
  { id: "cat_drinks", name: "Drinks", sortOrder: 0 },
  { id: "cat_food", name: "Food", sortOrder: 1 },
  { id: "cat_pastries", name: "Pastries", sortOrder: 2 },
];

export const SEED_PRODUCTS: CatalogProduct[] = [
  {
    id: "espresso",
    categoryId: "cat_drinks",
    name: "Espresso",
    description: "Double shot, rich crema, bold finish.",
    priceCents: 320,
    icon: "☕",
  },
  {
    id: "cappuccino",
    categoryId: "cat_drinks",
    name: "Cappuccino",
    description: "Silky foam, balanced espresso, cocoa dust.",
    priceCents: 450,
    icon: "🥛",
  },
  {
    id: "latte",
    categoryId: "cat_drinks",
    name: "Vanilla Latte",
    description: "Steamed milk, house vanilla, latte art.",
    priceCents: 520,
    icon: "🍶",
  },
  {
    id: "cold_brew",
    categoryId: "cat_drinks",
    name: "Cold Brew",
    description: "Slow-steeped, smooth, served over ice.",
    priceCents: 480,
    icon: "🧊",
  },
  {
    id: "mocha",
    categoryId: "cat_drinks",
    name: "Mocha",
    description: "Dark chocolate, espresso, whipped cream.",
    priceCents: 550,
    icon: "🍫",
  },
  {
    id: "matcha",
    categoryId: "cat_drinks",
    name: "Matcha Latte",
    description: "Ceremonial-grade matcha, oat milk option.",
    priceCents: 540,
    icon: "🍵",
  },
];
