import { useCallback, useMemo, useState } from "react";
import { FolderTree, Pencil, Trash2 } from "lucide-react";
import { AdminQueryState, useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  deleteCategory,
  deleteCategoryAndProducts,
  loadCategories,
  loadProducts,
  newCatalogId,
  saveCategory,
  ServiceError,
} from "@/services/supabaseService";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { Button, Card, PageHeader } from "@/components/ui";
import type { ProductCategory } from "@/types";

function CategoryFormModal({
  existing,
  defaultSort,
  onClose,
  onSaved,
}: {
  existing: ProductCategory | null;
  defaultSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? defaultSort));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Name is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await saveCategory({
        id: existing?.id ?? newCatalogId("cat"),
        name: trimmed,
        sortOrder: Number(sortOrder) || 0,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save category.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown-deep/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-card border border-brown-deep/10 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
      >
        <h2 id="category-form-title" className="font-serif text-xl font-bold text-brown-deep">
          {existing ? "Edit category" : "New category"}
        </h2>
        <p className="mt-1 text-sm text-muted">Sections shown in the customer menu (lower sort = first).</p>
        <div className="mt-5 space-y-4">
          <label className="form-label">
            Name
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drinks"
              autoFocus
            />
          </label>
          <label className="form-label">
            Sort order (0 = first)
            <input
              className="input-field mt-1"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
          {err ? <p className="alert-error">{err}</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteCategoryModal({
  category,
  productCount,
  onClose,
  onDeleted,
}: {
  category: ProductCategory;
  productCount: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remove = async (cascade: boolean) => {
    setBusy(true);
    setErr(null);
    try {
      if (cascade) {
        await deleteCategoryAndProducts(category.id);
      } else {
        await deleteCategory(category.id);
      }
      onDeleted();
      onClose();
    } catch (e) {
      setErr(e instanceof ServiceError ? e.message : e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown-deep/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-card border border-brown-deep/10 bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true">
        <h2 className="font-serif text-xl font-bold text-brown-deep">Delete &quot;{category.name}&quot;?</h2>
        <p className="mt-2 text-sm text-muted">
          {productCount > 0
            ? `This category has ${productCount} product${productCount === 1 ? "" : "s"}. Delete only if empty, or remove the category and all of its products.`
            : "This category has no products and can be deleted safely."}
        </p>
        {err ? <p className="alert-error mt-4">{err}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {productCount === 0 ? (
            <Button className="bg-red-600 text-white hover:brightness-110" disabled={busy} onClick={() => void remove(false)}>
              Delete
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="text-red-700" disabled={busy} onClick={() => void remove(false)}>
                If empty only
              </Button>
              <Button className="bg-red-600 text-white hover:brightness-110" disabled={busy} onClick={() => void remove(true)}>
                Delete &amp; products
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminCategoriesPanel() {
  const load = useCallback(async () => {
    const [categories, products] = await Promise.all([loadCategories(), loadProducts()]);
    return { categories, products };
  }, []);
  const { data, loading, error, reload } = useSupabaseQuery(load, [], { requireAuth: false });
  const list = data?.categories ?? [];
  const products = data?.products ?? [];

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState<ProductCategory | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: ProductCategory) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.categories.title}
        subtitle={ADMIN_SECTIONS.categories.subtitle}
        action={
          <Button onClick={openAdd}>
            <FolderTree className="h-4 w-4" />
            Add category
          </Button>
        }
      />
      <AdminQueryState
        loading={loading}
        error={error}
        empty={!loading && !error && list.length === 0}
        emptyMessage="No categories yet"
        onRetry={() => void reload()}
      >
        <div className="admin-card-grid xl:grid-cols-3">
          {list.map((c) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <Card key={c.id} flat className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openEdit(c)}
                >
                  <p className="font-serif text-lg font-bold text-brown-deep">{c.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    Sort {c.sortOrder} · {n} product{n === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 font-mono text-[0.65rem] text-muted">{c.id}</p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="btn-ghost min-h-9 px-3"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-9 px-3 text-red-700 hover:bg-red-50"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </AdminQueryState>

      {formOpen ? (
        <CategoryFormModal
          existing={editing}
          defaultSort={list.length}
          onClose={() => setFormOpen(false)}
          onSaved={() => void reload()}
        />
      ) : null}
      {deleting ? (
        <DeleteCategoryModal
          category={deleting}
          productCount={counts.get(deleting.id) ?? 0}
          onClose={() => setDeleting(null)}
          onDeleted={() => void reload()}
        />
      ) : null}
    </div>
  );
}
