import { useEffect, useState } from "react";
import { SectionLabel, StatusBadge, Button } from "@/components/ui";
import { ImageLightbox } from "@/components/ImageLightbox";
import { pesoFromCents, orderDisplayCode, base64ImageDataUrl, fileToBase64 } from "@/core/formatters";
import { loadOrderProofs } from "@/services/supabaseService";
import type { OrderRecord, OrderStatus } from "@/types";

type ProofLightbox = { src: string; alt: string; title: string };

const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

function OrderProofImages({
  orderId,
  paymentMethod,
  refreshKey = 0,
}: {
  orderId: string;
  paymentMethod: OrderRecord["paymentMethod"];
  refreshKey?: number;
}) {
  const [proofs, setProofs] = useState<{
    gcashCustomerProofBase64: string | null;
    gcashAdminAttachmentBase64: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<ProofLightbox | null>(null);

  const isGcash = paymentMethod === "gcash";

  const loadProofs = () => {
    setLoading(true);
    setError(null);
    void loadOrderProofs(orderId)
      .then(setProofs)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load receipt."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setProofs(null);
    if (isGcash) {
      loadProofs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when order or parent reloads
  }, [orderId, isGcash, refreshKey]);

  if (!isGcash) {
    return null;
  }

  if (!proofs) {
    return (
      <button type="button" className="chip w-full justify-center xs:w-auto" disabled={loading} onClick={loadProofs}>
        {loading ? "Loading receipt…" : "View GCash receipt"}
      </button>
    );
  }

  const customerUrl = base64ImageDataUrl(proofs.gcashCustomerProofBase64);
  const adminUrl = base64ImageDataUrl(proofs.gcashAdminAttachmentBase64);

  const open = (src: string, alt: string, title: string) => setLightbox({ src, alt, title });

  return (
    <>
      {error ? <p className="alert-error text-xs">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        {customerUrl ? (
          <button
            type="button"
            className="group w-full max-w-[12rem] overflow-hidden rounded-lg border border-brown-deep/10 shadow-sm transition hover:border-emerald-deep/40 hover:shadow-md xs:w-auto"
            onClick={() => open(customerUrl, "Customer GCash receipt", "Customer payment receipt")}
          >
            <img src={customerUrl} alt="Customer proof" className="max-h-28 w-full object-contain" />
            <span className="block bg-[#FAF7F4] px-2 py-1 text-[0.65rem] font-semibold text-muted group-hover:text-emerald-deep">
              Tap to view receipt
            </span>
          </button>
        ) : null}
        {adminUrl ? (
          <button
            type="button"
            className="group w-full max-w-[12rem] overflow-hidden rounded-lg border border-brown-deep/10 shadow-sm transition hover:border-emerald-deep/40 hover:shadow-md xs:w-auto"
            onClick={() => open(adminUrl, "Café attachment", "Café attachment")}
          >
            <img src={adminUrl} alt="Admin attachment" className="max-h-28 w-full object-contain" />
            <span className="block bg-[#FAF7F4] px-2 py-1 text-[0.65rem] font-semibold text-muted group-hover:text-emerald-deep">
              Tap to view attachment
            </span>
          </button>
        ) : null}
        {!customerUrl && !adminUrl ? (
          <p className="text-xs text-muted">No GCash images attached yet.</p>
        ) : null}
      </div>
      {lightbox ? (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} title={lightbox.title} onClose={() => setLightbox(null)} />
      ) : null}
    </>
  );
}

export function AdminOrderCard({
  order: o,
  prepMin,
  seat,
  proofRefreshKey = 0,
  onPrepMinChange,
  onSeatChange,
  onSavePrep,
  onStatus,
  onConfirmGcash,
  onAttachReceipt,
  onDelete,
}: {
  order: OrderRecord;
  prepMin: string;
  seat: string;
  proofRefreshKey?: number;
  onPrepMinChange: (v: string) => void;
  onSeatChange: (v: string) => void;
  onSavePrep: () => void;
  onStatus: (s: OrderStatus) => void;
  onConfirmGcash: () => void;
  onAttachReceipt: (b64: string) => void;
  onDelete: () => void;
}) {
  const total = o.lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
  const isGcash = o.paymentMethod === "gcash";

  return (
    <article className="order-panel">
      <div className="order-panel-header">
        <div className="order-panel-header-main">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-brown-deep sm:text-xl">
              #{orderDisplayCode(o.orderId)}
            </h3>
            <StatusBadge status={o.status} label="Order" />
          </div>
          <p className="break-all text-sm text-muted">{o.customerEmail}</p>
          <p className="text-xs capitalize text-muted">
            {o.fulfillmentType}
            {o.walkInDateIso ? ` · ${o.walkInDateIso}` : ""}
            {o.walkInTimeSlot ? ` · ${o.walkInTimeSlot}` : ""}
          </p>
          {o.deliveryInstructions ? (
            <p className="text-xs text-muted">Note: {o.deliveryInstructions}</p>
          ) : null}
        </div>
        <p className="order-panel-total">{pesoFromCents(total)}</p>
      </div>

      <div className="order-panel-section">
        <SectionLabel>Items</SectionLabel>
        <ul className="mt-2 space-y-1.5 text-sm">
          {o.lines.map((l, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                ×{l.quantity} {l.name}
              </span>
              <span className="shrink-0 font-semibold text-muted">{pesoFromCents(l.quantity * l.unitPriceCents)}</span>
            </li>
          ))}
        </ul>
      </div>

      {isGcash ? (
        <div className="order-panel-section space-y-3">
          <SectionLabel>Payment · GCash</SectionLabel>
          {o.paymentStatus ? (
            <p className="text-xs text-muted">
              Payment status{" "}
              <StatusBadge status={o.paymentStatus} />
            </p>
          ) : null}
          <OrderProofImages orderId={o.orderId} paymentMethod={o.paymentMethod} refreshKey={proofRefreshKey} />
          <div className="order-gcash-actions">
            <button type="button" className="chip chip-success justify-center xs:justify-start" onClick={onConfirmGcash}>
              Confirm GCash
            </button>
            <label className="chip cursor-pointer justify-center xs:justify-start">
              Attach receipt
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  onAttachReceipt(await fileToBase64(f));
                }}
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="order-panel-section">
        <SectionLabel>Kitchen</SectionLabel>
        <div className="order-kitchen-fields mt-2">
          <label className="text-xs font-semibold text-muted">
            Prep (min)
            <input
              className="input-field mt-1 w-full min-w-0 sm:w-20"
              type="number"
              value={prepMin}
              onChange={(e) => onPrepMinChange(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Seat
            <input
              className="input-field mt-1 w-full min-w-0 sm:w-20"
              value={seat}
              onChange={(e) => onSeatChange(e.target.value)}
            />
          </label>
          <Button variant="ghost" className="col-span-2 min-h-10 w-full text-sm sm:col-span-1 sm:w-auto" onClick={onSavePrep}>
            Save prep
          </Button>
        </div>
        <div className="order-status-row mt-3">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip capitalize ${o.status === s ? "chip-active" : ""}`}
              onClick={() => onStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex justify-stretch border-t border-brown-deep/10 pt-3 sm:justify-end">
        <button type="button" className="chip chip-danger w-full justify-center sm:w-auto" onClick={onDelete}>
          Delete order
        </button>
      </div>
    </article>
  );
}
