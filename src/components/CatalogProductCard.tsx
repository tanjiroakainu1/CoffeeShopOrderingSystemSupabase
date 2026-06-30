import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { pesoFromCents } from "@/core/formatters";
import type { CatalogProduct } from "@/types";

export function CatalogProductCard({
  product,
  categoryName,
}: {
  product: CatalogProduct;
  categoryName?: string;
}) {
  return (
    <article className="catalog-card group">
      <div className="catalog-card-media">
        {product.imageBase64 ? (
          <img src={`data:image/jpeg;base64,${product.imageBase64}`} alt={product.name} loading="lazy" />
        ) : (
          <div className="catalog-card-emoji" aria-hidden>
            {product.icon}
          </div>
        )}
        {categoryName ? (
          <span className="catalog-card-category">{categoryName}</span>
        ) : null}
      </div>

      <div className="catalog-card-body">
        <h3 className="font-serif text-lg font-bold leading-snug text-brown-deep sm:text-xl">{product.name}</h3>
        <p className="mt-2 font-serif text-xl font-extrabold text-emerald-deep">{pesoFromCents(product.priceCents)}</p>
        {product.description ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{product.description}</p>
        ) : (
          <div className="flex-1" />
        )}
        <Link to="/sign-in" className="btn-emerald mt-4 w-full gap-2 text-sm sm:mt-5">
          <ShoppingBag className="h-4 w-4 shrink-0" />
          Sign in to order
        </Link>
      </div>
    </article>
  );
}
