import { useCallback, useState } from "react";
import { Armchair, Pencil, Trash2 } from "lucide-react";
import { AdminQueryState, useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import {
  deleteSeat,
  loadOrders,
  loadSeats,
  newSeatId,
  saveSeat,
  ServiceError,
} from "@/services/supabaseService";
import { ADMIN_SECTIONS } from "@/core/appRoutes";
import { Button, Card, PageHeader } from "@/components/ui";
import type { SeatInventory } from "@/types";

function SeatFormModal({
  existing,
  defaultSort,
  onClose,
  onSaved,
}: {
  existing: SeatInventory | null;
  defaultSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [seatNumber, setSeatNumber] = useState(existing?.seatNumber ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 2));
  const [zone, setZone] = useState(existing?.zone ?? "");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? defaultSort));
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    const num = seatNumber.trim();
    if (!num) {
      setErr("Seat number is required.");
      return;
    }
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) {
      setErr("Capacity must be at least 1.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await saveSeat({
        id: existing?.id ?? newSeatId(),
        seatNumber: num,
        description: description.trim(),
        capacity: cap,
        zone: zone.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save seat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown-deep/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-card border border-brown-deep/10 bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true">
        <h2 className="font-serif text-xl font-bold text-brown-deep">{existing ? "Edit seat" : "New seat"}</h2>
        <p className="mt-1 text-sm text-muted">Customers pick a seat when reserving — capacity must fit party size.</p>
        <div className="mt-5 space-y-4">
          <label className="form-label">
            Seat number
            <input className="input-field mt-1" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} placeholder="e.g. 3" autoFocus />
          </label>
          <label className="form-label">
            Description
            <textarea className="input-field mt-1 min-h-[4.5rem]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Window booth, patio table…" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-label">
              Fits (people)
              <input className="input-field mt-1" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
            <label className="form-label">
              Zone (optional)
              <input className="input-field mt-1" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Indoor, Patio…" />
            </label>
          </div>
          <label className="form-label">
            Sort order
            <input className="input-field mt-1" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-brown-deep">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active — show in customer seat picker
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

export function AdminSeatsPanel() {
  const load = useCallback(async () => {
    const [seats, orders] = await Promise.all([loadSeats(), loadOrders()]);
    return { seats, orders };
  }, []);
  const { data, loading, error, reload } = useSupabaseQuery(load, [], { requireAuth: false });
  const list = data?.seats ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeatInventory | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (seat: SeatInventory) => {
    setEditing(seat);
    setFormOpen(true);
  };

  const remove = async (seat: SeatInventory) => {
    setDeleteErr(null);
    try {
      await deleteSeat(seat.id);
      void reload();
    } catch (e) {
      setDeleteErr(e instanceof ServiceError ? e.message : e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={ADMIN_SECTIONS.seats.title}
        subtitle={ADMIN_SECTIONS.seats.subtitle}
        action={
          <Button onClick={openAdd}>
            <Armchair className="h-4 w-4" />
            Add seat
          </Button>
        }
      />
      {deleteErr ? <p className="alert-error mb-4">{deleteErr}</p> : null}
      <AdminQueryState
        loading={loading}
        error={error}
        empty={!loading && !error && list.length === 0}
        emptyMessage="No seats yet — add tables for reservation checkout"
        onRetry={() => void reload()}
      >
        <div className="admin-card-grid xl:grid-cols-3">
          {list.map((seat) => (
            <Card key={seat.id} flat className={`flex flex-wrap items-start gap-3 ${!seat.isActive ? "opacity-60" : ""}`}>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openEdit(seat)}>
                <p className="font-serif text-lg font-bold text-brown-deep">
                  Seat {seat.seatNumber}
                  {!seat.isActive ? <span className="ml-2 text-xs font-sans text-muted">(inactive)</span> : null}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald">Fits {seat.capacity} guest{seat.capacity === 1 ? "" : "s"}</p>
                {seat.zone ? <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-muted">{seat.zone}</p> : null}
                {seat.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{seat.description}</p> : null}
                <p className="mt-2 font-mono text-[0.65rem] text-muted">{seat.id}</p>
              </button>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="btn-ghost min-h-9 px-3" aria-label={`Edit seat ${seat.seatNumber}`} onClick={() => openEdit(seat)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="btn-ghost min-h-9 px-3 text-red-700 hover:bg-red-50"
                  aria-label={`Delete seat ${seat.seatNumber}`}
                  onClick={() => void remove(seat)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </AdminQueryState>

      {formOpen ? (
        <SeatFormModal existing={editing} defaultSort={list.length} onClose={() => setFormOpen(false)} onSaved={() => void reload()} />
      ) : null}
    </div>
  );
}
