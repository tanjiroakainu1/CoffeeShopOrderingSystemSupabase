import { useEffect, useMemo, useState } from "react";
import { Button, Card, EmptyState, Logo, PageHeader, SectionLabel, StatusBadge } from "@/components/ui";
import { CUSTOMER_SECTIONS } from "@/core/appRoutes";
import {
  dateIso,
  dateUsShortFromIso,
  isReservationDateValid,
  newOrderId,
  orderDisplayCode,
  orderTotalCents,
  pesoFromCents,
  todayLocal,
  visitTimeSlotsHourly,
  base64ImageDataUrl,
  fileToBase64,
} from "@/core/formatters";
import { AppBrand } from "@/core/assets";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  loadAvailableSeats,
  loadCafePaymentSettings,
  loadOrders,
  loadProducts,
  seatLabelSnapshot,
  submitOrder,
} from "@/services/supabaseService";
import type { CatalogProduct, OrderRecord, SeatInventory } from "@/types";
import { getSupabase } from "@/lib/supabase/client";

export function CustomerBagTab({ onGoMenu }: { onGoMenu: () => void }) {
  const { user } = useAuth();
  const { cart, add, remove, clear, count } = useCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [fulfillment, setFulfillment] = useState<"reservation" | "delivery">("reservation");
  const [resDate, setResDate] = useState(() => dateIso(todayLocal()));
  const [timeSlot, setTimeSlot] = useState("9:00 AM");
  const [partySize, setPartySize] = useState(1);
  const [availableSeats, setAvailableSeats] = useState<SeatInventory[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [gcash, setGcash] = useState<{ qr?: string | null }>({});

  const reload = async () => {
    const [p, o, pay] = await Promise.all([
      loadProducts(),
      loadOrders(),
      loadCafePaymentSettings(),
    ]);
    setProducts(p);
    setOrders(o.filter((x) => x.customerAccountId === user?.accountId));
    setGcash({ qr: pay.gcashQrBase64 });
  };

  useEffect(() => {
    void reload();
  }, [user?.accountId]);

  useEffect(() => {
    if (fulfillment !== "reservation" || !resDate || !timeSlot || partySize < 1) {
      setAvailableSeats([]);
      setSelectedSeatId(null);
      return;
    }
    setSeatsLoading(true);
    void loadAvailableSeats(resDate, timeSlot, partySize)
      .then((seats) => {
        setAvailableSeats(seats);
        setSelectedSeatId((prev) => (prev && seats.some((s) => s.id === prev) ? prev : seats[0]?.id ?? null));
      })
      .finally(() => setSeatsLoading(false));
  }, [fulfillment, resDate, timeSlot, partySize]);

  const selectedSeat = useMemo(
    () => availableSeats.find((s) => s.id === selectedSeatId) ?? null,
    [availableSeats, selectedSeatId],
  );

  const entries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ product: products.find((p) => p.id === id), q }))
        .filter((e) => e.product),
    [cart, products],
  );

  const total = useMemo(
    () =>
      orderTotalCents(
        entries.map((e) => ({
          quantity: e.q,
          unitPriceCents: e.product!.priceCents,
        })),
      ),
    [entries],
  );

  const checkout = async () => {
    if (!user || entries.length === 0) return;
    if (fulfillment === "reservation") {
      const d = new Date(`${resDate}T12:00:00`);
      if (!isReservationDateValid(d)) {
        setMsg("Visit date cannot be in the past.");
        return;
      }
      if (!timeSlot) {
        setMsg("Choose a visit time.");
        return;
      }
      if (!selectedSeat) {
        setMsg("Choose a seat that fits your party size.");
        return;
      }
    } else if (!address.trim() || phone.trim().length < 8) {
      setMsg("Enter delivery address and a valid phone.");
      return;
    }
    if (!proof) {
      setMsg("Attach your GCash payment receipt.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const sb = getSupabase();
      const order: OrderRecord = {
        orderId: newOrderId(),
        customerAccountId: user.accountId,
        customerEmail: user.email,
        customerDisplayName: user.displayName.trim(),
        customerAuthUserId: sb ? (await sb.auth.getUser()).data.user?.id : null,
        lines: entries.map((e) => ({
          name: e.product!.name,
          quantity: e.q,
          unitPriceCents: e.product!.priceCents,
        })),
        createdAt: new Date().toISOString(),
        status: "pending",
        specialRequestNote: note.trim() || null,
        fulfillmentType: fulfillment,
        walkInDateIso: fulfillment === "reservation" ? resDate : null,
        walkInTimeSlot: fulfillment === "reservation" ? timeSlot : null,
        partySize: fulfillment === "reservation" ? partySize : null,
        tableId: fulfillment === "reservation" ? selectedSeat!.id : null,
        tableLabelSnapshot: fulfillment === "reservation" ? seatLabelSnapshot(selectedSeat!) : null,
        deliveryAddress: fulfillment === "delivery" ? address.trim() : null,
        deliveryPhone: fulfillment === "delivery" ? phone.trim() : null,
        deliveryInstructions: fulfillment === "delivery" ? deliveryInstructions.trim() || null : null,
        paymentMethod: "gcash",
        paymentStatus: "pending",
        gcashCustomerProofBase64: proof,
      };
      await submitOrder(order);
      clear();
      setProof(null);
      setNote("");
      setMsg("Order placed · " + pesoFromCents(total));
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not place order.");
    } finally {
      setBusy(false);
    }
  };

  const slots = visitTimeSlotsHourly();

  return (
    <div className="page-section">
      {orders.length > 0 ? (
        <section>
          <PageHeader eyebrow="Track orders" title="Order status" subtitle="Your recent orders from Supabase" />
          <div className="grid gap-3 sm:grid-cols-2">
            {orders.slice(0, 5).map((o) => (
              <Card key={o.orderId} flat className="relative">
                <div className="flex gap-3">
                  <Logo className="h-14 w-14 shrink-0 rounded-xl border border-brown-deep/10 bg-white p-1" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{AppBrand.displayName}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs font-semibold text-muted">Order #{orderDisplayCode(o.orderId)}</p>
                    <p className="mt-1 text-sm capitalize text-muted">{o.fulfillmentType}</p>
                    {o.tableLabelSnapshot ? (
                      <p className="mt-1 text-sm font-semibold text-brown-deep">{o.tableLabelSnapshot}</p>
                    ) : null}
                    {o.walkInDateIso ? (
                      <p className="mt-1 text-sm font-bold text-orange">
                        Reserved {dateUsShortFromIso(o.walkInDateIso)}
                        {o.walkInTimeSlot ? ` · ${o.walkInTimeSlot}` : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          description="Browse the menu and add your favorite drinks."
          action={<Button onClick={onGoMenu}>Browse menu</Button>}
        />
      ) : (
        <>
          <PageHeader
            eyebrow="Checkout"
            title={CUSTOMER_SECTIONS.bag.title}
            subtitle={`${count} item${count === 1 ? "" : "s"} · ${pesoFromCents(total)}`}
          />
          <div className="space-y-3">
            {entries.map(({ product, q }) => (
              <Card key={product!.id} flat className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-brown-deep">{product!.name}</p>
                  <p className="text-sm font-semibold text-orange">{pesoFromCents(product!.priceCents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="qty-btn" onClick={() => remove(product!.id)}>
                    −
                  </button>
                  <span className="min-w-[1.75rem] text-center font-bold">{q}</span>
                  <button type="button" className="qty-btn" onClick={() => add(product!.id)}>
                    +
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="space-y-5">
            <div>
              <SectionLabel>Fulfillment</SectionLabel>
              <p className="mt-1 font-serif text-lg font-bold text-brown-deep">How we&apos;ll serve you</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["reservation", "delivery"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip ${fulfillment === f ? "chip-active" : ""}`}
                  onClick={() => setFulfillment(f)}
                >
                  {f === "reservation" ? "Reservation" : "Delivery"}
                </button>
              ))}
            </div>
            {fulfillment === "reservation" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="form-label">
                  Date
                  <input
                    type="date"
                    className="input-field mt-1"
                    min={dateIso(todayLocal())}
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                  />
                </label>
                <label className="form-label">
                  Time
                  <select
                    className="input-field mt-1"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  >
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label sm:col-span-2">
                  Party size
                  <input
                    type="number"
                    min={1}
                    className="input-field mt-1"
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <div className="sm:col-span-2">
                  <SectionLabel>Choose your seat</SectionLabel>
                  <p className="mt-1 text-sm text-muted">
                    Seats shown fit at least {partySize} guest{partySize === 1 ? "" : "s"} and are open for your date & time.
                  </p>
                  {seatsLoading ? (
                    <p className="mt-3 text-sm text-muted">Loading seats…</p>
                  ) : availableSeats.length === 0 ? (
                    <p className="alert-error mt-3 text-sm">No seats available for this party size and time slot.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {availableSeats.map((seat) => {
                        const active = selectedSeatId === seat.id;
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            className={`rounded-card border p-4 text-left transition ${active ? "border-yellow/60 bg-yellow/20 shadow-sm" : "border-emerald-deep/10 bg-white hover:border-yellow/40"}`}
                            onClick={() => setSelectedSeatId(seat.id)}
                          >
                            <p className="font-serif text-lg font-bold text-brown-deep">Seat {seat.seatNumber}</p>
                            <p className="mt-1 text-sm font-semibold text-emerald">Fits up to {seat.capacity} people</p>
                            {seat.zone ? <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-muted">{seat.zone}</p> : null}
                            {seat.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{seat.description}</p> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  className="input-field"
                  placeholder="Delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <textarea
                  className="input-field min-h-[4rem]"
                  placeholder="Delivery instructions (optional)"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                />
              </div>
            )}
            <label className="form-label">
              Special requests
              <textarea
                className="input-field mt-1 min-h-[5rem]"
                placeholder="Optional notes for the kitchen"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="order-panel-section space-y-3">
              <SectionLabel>GCash payment</SectionLabel>
              {gcash.qr && base64ImageDataUrl(gcash.qr) ? (
                <div className="flex justify-center rounded-xl bg-white p-3">
                  <img src={base64ImageDataUrl(gcash.qr)!} alt="GCash QR" className="max-h-44 rounded-lg" />
                </div>
              ) : (
                <p className="text-sm text-muted">Shop QR not configured yet.</p>
              )}
              <label className="form-label">
                Upload receipt
                <input
                  type="file"
                  accept="image/*"
                  className="file-input-wrap"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setProof(await fileToBase64(f));
                  }}
                />
              </label>
            </div>
            {msg ? (
              <p className={msg.startsWith("Order placed") ? "alert-success" : "alert-error"}>{msg}</p>
            ) : null}
            <Button className="w-full" disabled={busy} onClick={() => void checkout()}>
              {busy ? "Placing…" : `Place order · ${pesoFromCents(total)}`}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
