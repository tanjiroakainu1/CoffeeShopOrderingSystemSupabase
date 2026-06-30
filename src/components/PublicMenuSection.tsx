import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import { CatalogProductCard } from "@/components/CatalogProductCard";
import { EmptyState, SectionLabel } from "@/components/ui";
import { GuestOrderCta } from "@/components/GuestSiteHeader";
import { loadPublicCatalog } from "@/services/supabaseService";
import type { CatalogProduct, ProductCategory } from "@/types";

export function PublicMenuSection({ preview = false }: { preview?: boolean }) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadPublicCatalog();
      setCategories(data.categories);
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load menu.");
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const categoryNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const filtered = useMemo(() => {
    const list = cat ? products.filter((p) => p.categoryId === cat) : products;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, cat]);

  const previewProducts = useMemo(() => filtered.slice(0, preview ? 8 : filtered.length), [filtered, preview]);

  const groupedByCategory = useMemo(() => {
    if (cat || preview) return null;
    return sortedCategories
      .map((c) => ({
        category: c,
        items: products.filter((p) => p.categoryId === c.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [sortedCategories, products, cat, preview]);

  const categoryButtons = (
    <>
      <button
        type="button"
        className={`chip shrink-0 lg:w-full lg:justify-start ${cat === null ? "chip-active menu-sidebar-active" : "menu-sidebar-link !rounded-xl !border-transparent !bg-transparent !shadow-none"}`}
        onClick={() => setCat(null)}
      >
        All items
      </button>
      {sortedCategories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`chip shrink-0 lg:w-full lg:justify-start ${cat === c.id ? "chip-active menu-sidebar-active" : "menu-sidebar-link !rounded-xl !border-transparent !bg-transparent !shadow-none"}`}
          onClick={() => setCat(c.id)}
        >
          {c.name}
        </button>
      ))}
    </>
  );

  const productGrid = (items: CatalogProduct[]) => (
    <div className="product-grid">
      {items.map((p) => (
        <CatalogProductCard key={p.id} product={p} categoryName={categoryNames.get(p.categoryId)} />
      ))}
    </div>
  );

  return (
    <section id="menu" className="scroll-mt-28">
      <div className="section-head">
        <div className="min-w-0">
          <SectionLabel>{preview ? "Featured menu" : "Full menu"}</SectionLabel>
          <h2 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-tight text-brown-deep">
            {preview ? "Popular picks" : "Our menu"}
          </h2>
          <p className="mt-1.5 text-sm text-muted sm:text-base">
            {loading
              ? "Loading categories & products…"
              : `${categories.length} categor${categories.length === 1 ? "y" : "ies"} · ${products.length} item${products.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
          {preview ? (
            <Link to="/menu" className="btn-outline-emerald min-h-11 gap-2 px-4">
              View full menu
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <button type="button" className="btn-toolbar min-h-11 w-full sm:w-auto" disabled={loading} onClick={() => void reload()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: preview ? 4 : 8 }).map((_, i) => (
            <div key={i} className="catalog-card animate-pulse">
              <div className="catalog-card-media bg-emerald-light" />
              <div className="catalog-card-body space-y-3">
                <div className="h-5 w-2/3 rounded bg-emerald-light" />
                <div className="h-6 w-1/3 rounded bg-yellow-light" />
                <div className="h-10 rounded-xl bg-emerald-light/80" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Menu unavailable"
          description={error}
          action={
            <button type="button" className="btn-primary" onClick={() => void reload()}>
              Try again
            </button>
          }
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="An admin can add items in the console — they appear here instantly for guests and customers."
          action={<GuestOrderCta compact />}
        />
      ) : (
        <div className={preview ? "" : "menu-layout"}>
          {!preview && categories.length > 0 ? (
            <aside className="menu-sidebar hidden lg:block">
              <p className="menu-sidebar-title">Categories</p>
              <div className="flex flex-col gap-1">{categoryButtons}</div>
            </aside>
          ) : null}

          <div className="min-w-0">
            {!preview && categories.length > 0 ? (
              <div className="chip-row mb-6 lg:hidden">{categoryButtons}</div>
            ) : null}
            {preview ? (
              <>
                {productGrid(previewProducts)}
                <div className="mt-8 text-center">
                  <Link to="/menu" className="btn-emerald btn-lg inline-flex gap-2">
                    See all {products.length} items
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : cat ? (
              productGrid(filtered)
            ) : (
              <div className="space-y-10 sm:space-y-12 lg:space-y-14">
                {groupedByCategory?.map(({ category, items }) => (
                  <div key={category.id} id={`cat-${category.id}`}>
                    <div className="guest-category-heading">
                      <div className="min-w-0">
                        <h3 className="font-serif text-xl font-bold text-brown-deep sm:text-2xl">{category.name}</h3>
                        <p className="mt-0.5 text-sm text-muted">
                          {items.length} item{items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5">{productGrid(items)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
