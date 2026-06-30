import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Card, EmptyState, PageHeader, SectionLabel } from "@/components/ui";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import {
  addFavoriteEntry,
  loadCustomerPreferences,
  loadProducts,
  removeFavoriteEntry,
} from "@/services/supabaseService";
import type { CatalogProduct, FavoriteEntry, UserAccount } from "@/types";

export function CustomerFavoritesTab({ user }: { user: UserAccount }) {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [menuIds, setMenuIds] = useState<string[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [prefs, prods] = await Promise.all([
      loadCustomerPreferences(user.accountId),
      loadProducts(),
    ]);
    setFavorites(prefs.favorites);
    setMenuIds(prefs.menuFavoriteProductIds);
    setProducts(prods);
  };

  useEffect(() => {
    void reload();
  }, [user.accountId]);

  const menuFavs = products.filter((p) => menuIds.includes(p.id));

  const addPlace = async () => {
    setBusy(true);
    setErr(null);
    try {
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (!name.trim() || !address.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new Error("Fill name, address, latitude, and longitude.");
      }
      const entry: FavoriteEntry = {
        id: `fav_${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        note: note.trim() || null,
      };
      const next = await addFavoriteEntry(user.accountId, entry);
      setFavorites(next);
      setName("");
      setAddress("");
      setNote("");
      setLat("");
      setLng("");
      setShowAdd(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save place.");
    } finally {
      setBusy(false);
    }
  };

  const removePlace = async (id: string) => {
    const next = await removeFavoriteEntry(user.accountId, id);
    setFavorites(next);
  };

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Saved for you"
        title={CUSTOMER_SECTIONS.favorites.title}
        subtitle={CUSTOMER_SECTIONS.favorites.subtitle}
      />
      {err ? <p className="alert-error">{err}</p> : null}

      <section>
        <SectionLabel>Menu favorites</SectionLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {menuFavs.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                title="No menu favorites yet"
                description="Heart drinks and food on the Menu tab to save them here."
              />
            </div>
          ) : (
            menuFavs.map((p) => (
              <Card key={p.id} flat className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-foam text-xl">{p.icon}</span>
                <span className="font-semibold text-brown-deep">{p.name}</span>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>Saved places</SectionLabel>
          <Button variant="ghost" className="min-h-9 text-sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Cancel" : "Add place"}
          </Button>
        </div>
        {showAdd ? (
          <Card className="mt-3 space-y-3">
            <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-field" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <textarea className="input-field min-h-[4rem]" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input-field" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
              <input className="input-field" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
            <Button disabled={busy} onClick={() => void addPlace()}>
              Save to Supabase
            </Button>
          </Card>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {favorites.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                title="No saved places yet"
                description="Add your own saved cafés and addresses here, or heart items on the Menu tab."
                action={
                  !showAdd ? (
                    <Button variant="ghost" onClick={() => setShowAdd(true)}>
                      Add favorite place
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            favorites.map((f) => (
              <Card key={f.id} flat className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brown-deep">{f.name}</p>
                  <p className="text-sm text-muted">{f.address}</p>
                  {f.note ? <p className="mt-1 text-xs text-muted">{f.note}</p> : null}
                </div>
                <button
                  type="button"
                  aria-label="Remove"
                  className="rounded-full p-2 text-red-700 transition hover:bg-red-50"
                  onClick={() => void removePlace(f.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
