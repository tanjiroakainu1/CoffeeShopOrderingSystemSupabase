import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { AdminQueryState } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/context/AuthContext";
import { ensureSupabaseSession } from "@/lib/supabase/client";
import {
  deleteProduct,
  loadCategories,
  loadProducts,
  newCatalogId,
  saveProduct,
  ServiceError,
} from "@/services/supabaseService";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { Button, Card, PageHeader, SectionLabel } from "@/components/ui";
import { base64ImageDataUrl, fileToBase64, pesoFromCents } from "@/core/formatters";
import type { CatalogProduct, ProductCategory } from "@/types";

const MAX_PRODUCT_IMAGE_BYTES = 320 * 1024;

function ProductFormModal({
  existing,
  categories,
  onClose,
  onSaved,
}: {
  existing: CatalogProduct | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [pricePhp, setPricePhp] = useState(
    existing != null ? (existing.priceCents / 100).toFixed(2) : "",
  );
  const [icon, setIcon] = useState(existing?.icon ?? "☕");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");
  const [imageBase64, setImageBase64] = useState<string | null | undefined>(existing?.imageBase64);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Choose a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setErr(`Image too large (max ${MAX_PRODUCT_IMAGE_BYTES / 1024} KB).`);
      return;
    }
    setErr(null);
    setImageBase64(await fileToBase64(file));
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Name is required.");
      return;
    }
    if (!categoryId) {
      setErr("Create a category first.");
      return;
    }
    const price = Number.parseFloat(pricePhp.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) {
      setErr("Enter a valid price.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await ensureSupabaseSession();
      await saveProduct({
        id: existing?.id ?? newCatalogId("prd"),
        categoryId,
        name: trimmed,
        description: description.trim(),
        priceCents: Math.round(price * 100),
        icon: icon.trim() || "☕",
        imageBase64: imageBase64 ?? null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save product.");
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = base64ImageDataUrl(imageBase64 ?? null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown-deep/40 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card border border-brown-deep/10 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
      >
        <h2 id="product-form-title" className="font-serif text-xl font-bold text-brown-deep">
          {existing ? "Edit product" : "New product"}
        </h2>
        <p className="mt-1 text-sm text-muted">Synced with the mobile admin menu.</p>
        <div className="mt-5 space-y-4">
          <div>
            <SectionLabel>Photo</SectionLabel>
            <div className="mt-2 flex items-start gap-3 rounded-xl border border-brown-deep/10 bg-[#FAF7F4] p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foam text-3xl">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  icon || "☕"
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label className="btn-toolbar cursor-pointer justify-center">
                  <Upload className="h-4 w-4" />
                  Choose image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    className="hidden"
                    onChange={(e) => void pickImage(e.target.files?.[0])}
                  />
                </label>
                <Button variant="ghost" disabled={!imageBase64} onClick={() => setImageBase64(null)}>
                  Remove photo
                </Button>
                <p className="text-xs text-muted">JPG / PNG / WebP · up to {MAX_PRODUCT_IMAGE_BYTES / 1024} KB</p>
              </div>
            </div>
          </div>
          <label className="form-label">
            Category
            <select
              className="input-field mt-1"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Name
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vanilla Latte"
              autoFocus
            />
          </label>
          <label className="form-label">
            Description
            <textarea
              className="input-field mt-1 min-h-[4rem]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short menu description"
            />
          </label>
          <label className="form-label">
            Price (PHP)
            <input
              className="input-field mt-1"
              value={pricePhp}
              onChange={(e) => setPricePhp(e.target.value)}
              inputMode="decimal"
              placeholder="4.50"
            />
          </label>
          <label className="form-label">
            Emoji fallback
            <input
              className="input-field mt-1"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
              placeholder="☕"
            />
          </label>
          {err ? <p className="alert-error">{err}</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminProductsPanel() {
  const { authReady } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState<CatalogProduct | "new" | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureSupabaseSession();
      const [p, c] = await Promise.all([loadProducts(), loadCategories()]);
      setProducts([...p].sort((a, b) => a.name.localeCompare(b.name)));
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    void reload();
  }, [authReady, reload]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const remove = async (p: CatalogProduct) => {
    if (!window.confirm(`Remove "${p.name}" from the menu?`)) return;
    setActionMsg(null);
    try {
      await ensureSupabaseSession();
      await deleteProduct(p.id);
      setActionMsg(`Removed ${p.name}.`);
      await reload();
    } catch (e) {
      setActionMsg(e instanceof ServiceError || e instanceof Error ? e.message : "Could not delete product.");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.products.title}
        subtitle={ADMIN_SECTIONS.products.subtitle}
        action={
          <Button
            disabled={categories.length === 0}
            onClick={() => {
              if (categories.length === 0) {
                setActionMsg("Create a category first.");
                return;
              }
              setFormProduct("new");
            }}
          >
            Add product
          </Button>
        }
      />
      {actionMsg ? (
        <p className={`mb-4 ${actionMsg.startsWith("Removed") ? "alert-success" : "alert-error"}`}>{actionMsg}</p>
      ) : null}
      <AdminQueryState
        loading={!authReady || loading}
        error={error}
        empty={!loading && !error && products.length === 0}
        emptyMessage="No products in catalog — add one above."
        onRetry={() => void reload()}
      >
        <div className="admin-card-grid xl:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foam text-2xl">
                  {p.imageBase64 && base64ImageDataUrl(p.imageBase64) ? (
                    <img src={base64ImageDataUrl(p.imageBase64)!} alt="" className="h-full w-full object-cover" />
                  ) : (
                    p.icon
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-brown-deep">{p.name}</p>
                  <p className="text-xs text-muted">
                    {categoryName(p.categoryId)} · {pesoFromCents(p.priceCents)}
                  </p>
                </div>
              </div>
              {p.description ? <p className="line-clamp-2 text-sm text-muted">{p.description}</p> : null}
              <div className="mt-auto flex gap-2">
                <Button variant="toolbar" className="flex-1" onClick={() => setFormProduct(p)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="ghost" className="text-red-700" onClick={() => void remove(p)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </AdminQueryState>
      {formProduct ? (
        <ProductFormModal
          existing={formProduct === "new" ? null : formProduct}
          categories={categories}
          onClose={() => setFormProduct(null)}
          onSaved={() => {
            setActionMsg(formProduct === "new" ? "Product added." : "Product saved.");
            void reload();
          }}
        />
      ) : null}
    </div>
  );
}
