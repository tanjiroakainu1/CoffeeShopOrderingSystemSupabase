import { useEffect, useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { PageHeader } from "@/components/ui";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import { pesoFromCents } from "@/core/formatters";
import { useCart } from "@/context/CartContext";
import { loadCategories, loadCustomerPreferences, loadProducts, toggleMenuFavorite } from "@/services/supabaseService";
import type { CatalogProduct, ProductCategory, UserAccount } from "@/types";

export function CustomerMenuTab({ user }: { user: UserAccount }) {
  const { cart, add, remove } = useCart();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [menuFavs, setMenuFavs] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([loadCategories(), loadProducts()]);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    void loadCustomerPreferences(user.accountId).then((p) =>
      setMenuFavs(new Set(p.menuFavoriteProductIds)),
    );
  }, [user.accountId]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const categoryNameById = useMemo(
    () => new Map(sortedCategories.map((c) => [c.id, c.name])),
    [sortedCategories],
  );

  const filtered = useMemo(() => {
    const list = cat ? products.filter((p) => p.categoryId === cat) : products;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, cat]);

  const cartTotal = useMemo(
    () => Object.values(cart).reduce((s, n) => s + n, 0),
    [cart],
  );

  const activeCategoryName =
    cat === null ? "All items" : (categoryNameById.get(cat) ?? "Category");

  return (
    <div className="page-section menu-page">
      <PageHeader
        eyebrow="Order online"
        title={CUSTOMER_SECTIONS.menu.title}
        subtitle={CUSTOMER_SECTIONS.menu.subtitle}
      />

      <AppDownloadBanner variant="compact" />

      <div className="menu-layout">
        <aside className="menu-sidebar" aria-label="Menu categories">
          <p className="menu-sidebar-title">Categories</p>
          <nav className="menu-sidebar-nav">
            <button
              type="button"
              className={`menu-sidebar-link ${cat === null ? "menu-sidebar-active" : ""}`}
              onClick={() => setCat(null)}
            >
              All items
              <span className="menu-sidebar-count">{products.length}</span>
            </button>
            {sortedCategories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`menu-sidebar-link ${cat === c.id ? "menu-sidebar-active" : ""}`}
                  onClick={() => setCat(c.id)}
                >
                  {c.name}
                  <span className="menu-sidebar-count">{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="menu-main min-w-0">
          <div className="menu-toolbar">
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-extrabold text-brown-deep sm:text-2xl">{activeCategoryName}</h2>
              <p className="mt-1 text-sm text-muted">
                {loading
                  ? "Loading menu…"
                  : `${filtered.length} item${filtered.length === 1 ? "" : "s"} available`}
              </p>
            </div>
            {cartTotal > 0 ? (
              <span className="menu-bag-pill">
                <ShoppingBag className="h-4 w-4" />
                {cartTotal} in bag
              </span>
            ) : null}
          </div>

          {/* Mobile category chips */}
          <div className="chip-row mb-5 lg:hidden">
            <button
              type="button"
              className={`chip shrink-0 ${cat === null ? "chip-active" : ""}`}
              onClick={() => setCat(null)}
            >
              All
            </button>
            {sortedCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip shrink-0 ${cat === c.id ? "chip-active" : ""}`}
                onClick={() => setCat(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="catalog-card animate-pulse">
                  <div className="catalog-card-media bg-emerald-light/80" />
                  <div className="catalog-card-body space-y-3">
                    <div className="h-5 w-2/3 rounded bg-emerald-light" />
                    <div className="h-6 w-1/3 rounded bg-emerald-light" />
                    <div className="h-12 rounded bg-emerald-light/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="menu-empty">
              <p className="font-serif text-lg font-bold text-brown-deep">No items in this category</p>
              <p className="mt-2 text-sm text-muted">Try another category or check back after the admin updates the menu.</p>
              <button type="button" className="btn-outline-emerald mt-5" onClick={() => setCat(null)}>
                Show all items
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => {
                const qty = cart[p.id] ?? 0;
                const fav = menuFavs.has(p.id);
                const categoryName = categoryNameById.get(p.categoryId);
                return (
                  <article key={p.id} className="catalog-card group">
                    <div className="catalog-card-media">
                      {p.imageBase64 ? (
                        <img src={`data:image/jpeg;base64,${p.imageBase64}`} alt={p.name} loading="lazy" />
                      ) : (
                        <div className="catalog-card-emoji" aria-hidden>
                          {p.icon}
                        </div>
                      )}
                      {categoryName ? (
                        <span className="catalog-card-category">{categoryName}</span>
                      ) : null}
                      <button
                        type="button"
                        aria-label={fav ? "Remove from favorites" : "Save to favorites"}
                        onClick={async () => {
                          const next = await toggleMenuFavorite(user.accountId, p.id, !fav);
                          setMenuFavs(new Set(next));
                        }}
                        className="catalog-card-fav"
                      >
                        <Heart className={`h-4 w-4 ${fav ? "fill-orange text-orange" : "text-muted"}`} />
                      </button>
                    </div>

                    <div className="catalog-card-body">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-lg font-bold leading-snug text-brown-deep sm:text-xl">{p.name}</h3>
                      </div>
                      <p className="mt-1 font-serif text-xl font-extrabold text-emerald-deep">{pesoFromCents(p.priceCents)}</p>
                      {p.description ? (
                        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="catalog-card-footer">
                        <div className="qty-stepper" role="group" aria-label={`Quantity for ${p.name}`}>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => remove(p.id)}
                            disabled={qty === 0}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="qty-stepper-value" aria-live="polite">
                            {qty}
                          </span>
                          <button type="button" className="qty-btn qty-btn-primary" onClick={() => add(p.id)} aria-label="Increase quantity">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {qty > 0 ? (
                          <span className="catalog-card-added">Added to bag</span>
                        ) : (
                          <span className="catalog-card-hint">Tap + to add</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
