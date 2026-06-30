export const AppAssets = {
  logo: "/logo123.jpeg",
  promo1: "/images1/1.jpeg",
  promo2: "/images1/2.jpeg",
} as const;

export const AppBrand = {
  displayName: import.meta.env.VITE_APP_NAME?.trim() || "CoffeeShop",
  androidLabel: import.meta.env.VITE_APP_ANDROID_LABEL?.trim() || "CoffeeShop",
  developerName: import.meta.env.VITE_APP_DEVELOPER_NAME?.trim() || "Raminder Jangao",
} as const;

export function appCopyrightLine(year = new Date().getFullYear()) {
  return `© ${year} ${AppBrand.displayName} · Developed by ${AppBrand.developerName}`;
}
