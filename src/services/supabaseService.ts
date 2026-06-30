import { ensureSupabaseSession, getSupabase } from "@/lib/supabase/client";
import {
  categoryFromRow,
  favoritesFromJson,
  favoritesToJson,
  orderFromRow,
  orderToRow,
  pinFromJson,
  seatFromRow,
  productFromRow,
  recoveryFromRow,
  recoveryToInsert,
} from "@/lib/supabase/maps";
import type {
  AccountRecoveryRequest,
  CatalogProduct,
  FavoriteEntry,
  OrderRecord,
  OrderStatus,
  PinnedLocation,
  ProductCategory,
  SeatInventory,
  UserRole,
} from "@/types";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "@/data/seedCatalog";
import { REPORT_DEFAULT_DAYS } from "@/core/reportDashboard";

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export interface ProfileRow {
  authUserId: string;
  accountId: string;
  email: string;
  role: UserRole;
  displayName: string;
  birthdayIso?: string | null;
  sex?: string | null;
}

function requireSb() {
  const sb = getSupabase();
  if (!sb) throw new ServiceError("Supabase required");
  return sb;
}

async function upsertCustomerPreferences(
  accountId: string,
  pin: PinnedLocation | null,
  favorites: FavoriteEntry[],
): Promise<void> {
  const sb = requireSb();
  const { error } = await sb.from("customer_preferences").upsert({
    account_id: accountId,
    pin: pin ? { label: pin.label, latitude: pin.latitude, longitude: pin.longitude } : null,
    favorites: favoritesToJson(favorites),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function ensureCatalogSeeded(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return;
  const { data: existing } = await sb.from("product_categories").select("id").limit(1).maybeSingle();
  if (existing) return;
  for (const c of SEED_CATEGORIES) {
    await saveCategory(c);
  }
  for (const p of SEED_PRODUCTS) {
    await saveProduct(p);
  }
}

export async function loadPublicCatalog(): Promise<{
  categories: ProductCategory[];
  products: CatalogProduct[];
}> {
  const sb = getSupabase();
  if (!sb) {
    return { categories: [...SEED_CATEGORIES], products: [...SEED_PRODUCTS] };
  }
  const [catRes, prodRes] = await Promise.all([
    sb.from("product_categories").select("*").order("sort_order"),
    sb.from("catalog_products").select("*"),
  ]);
  if (catRes.error) throw catRes.error;
  if (prodRes.error) throw prodRes.error;
  return {
    categories: (catRes.data ?? []).map((r) => categoryFromRow(r as Record<string, unknown>)),
    products: (prodRes.data ?? []).map((r) => productFromRow(r as Record<string, unknown>)),
  };
}

export async function loadCategories(): Promise<ProductCategory[]> {
  await ensureCatalogSeeded();
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("product_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => categoryFromRow(r as Record<string, unknown>));
}

export async function loadProducts(): Promise<CatalogProduct[]> {
  await ensureCatalogSeeded();
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("catalog_products").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => productFromRow(r as Record<string, unknown>));
}

export function newCatalogId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * (1 << 20))}`;
}

export async function saveCategory(c: ProductCategory): Promise<void> {
  const sb = requireSb();
  await ensureSupabaseSession();
  const { error } = await sb.from("product_categories").upsert({
    id: c.id,
    name: c.name,
    sort_order: c.sortOrder,
  });
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new ServiceError("Supabase required");
  const products = await loadProducts();
  if (products.some((p) => p.categoryId === id)) {
    throw new ServiceError("Remove or reassign products in this category first.");
  }
  const { error } = await sb.from("product_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCategoryAndProducts(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new ServiceError("Supabase required");
  const { error: prodErr } = await sb.from("catalog_products").delete().eq("category_id", id);
  if (prodErr) throw prodErr;
  const { error: catErr } = await sb.from("product_categories").delete().eq("id", id);
  if (catErr) throw catErr;
}

export async function saveProduct(p: CatalogProduct): Promise<void> {
  const sb = requireSb();
  await ensureSupabaseSession();
  const { error } = await sb.from("catalog_products").upsert({
    id: p.id,
    category_id: p.categoryId,
    name: p.name,
    description: p.description,
    price_cents: p.priceCents,
    icon: p.icon,
    image_base64: p.imageBase64,
  });
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = requireSb();
  await ensureSupabaseSession();
  const { error } = await sb.from("catalog_products").delete().eq("id", id);
  if (error) throw error;
}

export function seatLabelSnapshot(seat: SeatInventory): string {
  return `Seat ${seat.seatNumber} · fits ${seat.capacity}`;
}

export async function loadSeats(): Promise<SeatInventory[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("seat_inventory")
    .select("*")
    .order("sort_order")
    .order("seat_number");
  if (error) throw error;
  return (data ?? []).map((r) => seatFromRow(r as Record<string, unknown>));
}

export async function saveSeat(seat: SeatInventory): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb.from("seat_inventory").upsert({
    id: seat.id,
    seat_number: seat.seatNumber,
    description: seat.description,
    capacity: seat.capacity,
    zone: seat.zone ?? null,
    sort_order: seat.sortOrder,
    is_active: seat.isActive,
  });
  if (error) throw error;
}

export async function deleteSeat(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new ServiceError("Supabase required");
  const orders = await loadOrders();
  const blocking = orders.some(
    (o) =>
      o.tableId === id &&
      o.fulfillmentType === "reservation" &&
      o.status !== "cancelled" &&
      o.status !== "completed",
  );
  if (blocking) {
    throw new ServiceError("This seat has active reservations. Cancel or complete them first.");
  }
  const { error } = await sb.from("seat_inventory").delete().eq("id", id);
  if (error) throw error;
}

export function newSeatId(): string {
  return newCatalogId("seat");
}

export async function loadBookedSeatIds(dateIso: string, timeSlot: string): Promise<Set<string>> {
  const orders = await loadOrders();
  return new Set(
    orders
      .filter(
        (o) =>
          o.fulfillmentType === "reservation" &&
          o.walkInDateIso === dateIso &&
          o.walkInTimeSlot === timeSlot &&
          o.tableId &&
          o.status !== "cancelled" &&
          o.status !== "completed",
      )
      .map((o) => o.tableId!),
  );
}

export async function loadAvailableSeats(
  dateIso: string,
  timeSlot: string,
  partySize: number,
): Promise<SeatInventory[]> {
  const [seats, booked] = await Promise.all([
    loadSeats(),
    loadBookedSeatIds(dateIso, timeSlot),
  ]);
  return seats.filter(
    (s) => s.isActive && s.capacity >= partySize && !booked.has(s.id),
  );
}

const ORDER_LIST_COLUMNS =
  "order_id,customer_account_id,customer_email,customer_display_name,customer_auth_user_id,lines,created_at,status,special_request_note,prep_time_minutes,seat_label,fulfillment_type,table_id,table_label_snapshot,walk_in_date_iso,walk_in_time_slot,party_size,delivery_address,delivery_phone,delivery_instructions,payment_method,payment_status";

export async function loadOrders(options?: { includeProofs?: boolean }): Promise<OrderRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];
  await ensureSupabaseSession();
  const selectCols = options?.includeProofs
    ? "*"
    : ORDER_LIST_COLUMNS;
  const { data, error } = await sb
    .from("orders")
    .select(selectCols)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return rows.map((r) => orderFromRow(r));
}

export async function loadOrderProofs(orderId: string): Promise<{
  gcashCustomerProofBase64: string | null;
  gcashAdminAttachmentBase64: string | null;
}> {
  const sb = getSupabase();
  if (!sb) return { gcashCustomerProofBase64: null, gcashAdminAttachmentBase64: null };
  await ensureSupabaseSession();
  const { data, error } = await sb
    .from("orders")
    .select("gcash_customer_proof_base64,gcash_admin_attachment_base64")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    gcashCustomerProofBase64: (row.gcash_customer_proof_base64 as string) ?? null,
    gcashAdminAttachmentBase64: (row.gcash_admin_attachment_base64 as string) ?? null,
  };
}

export async function submitOrder(order: OrderRecord): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb.from("orders").insert(orderToRow(order));
  if (error) throw error;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb.from("orders").update({ status }).eq("order_id", orderId);
  if (error) throw error;
}

export async function updateOrderFulfillment(
  orderId: string,
  prepTimeMinutes: number,
  seatLabel?: string,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb
    .from("orders")
    .update({ prep_time_minutes: prepTimeMinutes, seat_label: seatLabel ?? null })
    .eq("order_id", orderId);
  if (error) throw error;
}

export async function updateOrderPayment(
  orderId: string,
  paymentStatus: "pending" | "confirmed",
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb
    .from("orders")
    .update({ payment_status: paymentStatus, payment_method: "gcash" })
    .eq("order_id", orderId);
  if (error) throw error;
}

export async function updateOrderGcashAdminAttachment(
  orderId: string,
  gcashAdminAttachmentBase64: string | null,
): Promise<void> {
  const sb = requireSb();
  const { error } = await sb
    .from("orders")
    .update({ gcash_admin_attachment_base64: gcashAdminAttachmentBase64 })
    .eq("order_id", orderId);
  if (error) throw error;
}

export async function customerSubmitGcashProof(orderId: string, proofBase64: string): Promise<void> {
  const sb = requireSb();
  const { error } = await sb.rpc("customer_set_gcash_proof", {
    p_order_id: orderId,
    p_proof: proofBase64,
  });
  if (error) throw error;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const sb = requireSb();
  const { error } = await sb.from("orders").delete().eq("order_id", orderId);
  if (error) throw error;
}

export async function loadProfiles(): Promise<ProfileRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  await ensureSupabaseSession();
  const { data, error } = await sb.from("profiles").select("*").order("email");
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      authUserId: row.id as string,
      accountId: row.account_id as string,
      email: row.email as string,
      role: row.role as UserRole,
      displayName: (row.display_name as string) ?? "",
      birthdayIso: (row.birthday_iso as string) ?? null,
      sex: (row.sex as string) ?? null,
    };
  });
}

export async function loadRecoveryRequests(): Promise<AccountRecoveryRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  await ensureSupabaseSession();
  const { data, error } = await sb
    .from("account_recovery_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => recoveryFromRow(r as Record<string, unknown>));
}

export async function loadCafePaymentSettings(): Promise<{
  gcashQrBase64?: string | null;
}> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data } = await sb
    .from("cafe_payment_settings")
    .select("gcash_qr_image_base64")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return {};
  const row = data as Record<string, unknown>;
  return {
    gcashQrBase64: (row.gcash_qr_image_base64 as string) ?? null,
  };
}

export async function saveCafePaymentSettings(input: {
  gcashQrBase64?: string | null;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  const { error } = await sb.from("cafe_payment_settings").upsert({
    id: 1,
    gcash_qr_image_base64: input.gcashQrBase64,
  });
  if (error) throw error;
}

export async function loadCustomerPreferences(accountId: string): Promise<{
  pin: import("@/types").PinnedLocation | null;
  favorites: import("@/types").FavoriteEntry[];
  menuFavoriteProductIds: string[];
}> {
  const sb = getSupabase();
  if (!sb) return { pin: null, favorites: [], menuFavoriteProductIds: [] };
  const { data: pref } = await sb
    .from("customer_preferences")
    .select("pin, favorites")
    .eq("account_id", accountId)
    .maybeSingle();
  const { data: menuFav } = await sb
    .from("customer_menu_favorites")
    .select("catalog_product_id")
    .eq("account_id", accountId);
  const row = (pref ?? {}) as Record<string, unknown>;
  return {
    pin: pinFromJson(row.pin),
    favorites: favoritesFromJson(row.favorites),
    menuFavoriteProductIds: (menuFav ?? []).map(
      (r) => (r as Record<string, unknown>).catalog_product_id as string,
    ),
  };
}

export async function savePinnedLocation(accountId: string, pin: PinnedLocation | null): Promise<void> {
  const prefs = await loadCustomerPreferences(accountId);
  await upsertCustomerPreferences(accountId, pin, prefs.favorites);
}

export async function saveFavoriteEntries(accountId: string, favorites: FavoriteEntry[]): Promise<void> {
  const prefs = await loadCustomerPreferences(accountId);
  await upsertCustomerPreferences(accountId, prefs.pin, favorites);
}

export async function addFavoriteEntry(accountId: string, entry: FavoriteEntry): Promise<FavoriteEntry[]> {
  const prefs = await loadCustomerPreferences(accountId);
  const next = [...prefs.favorites.filter((f) => f.id !== entry.id), entry];
  await upsertCustomerPreferences(accountId, prefs.pin, next);
  return next;
}

export async function removeFavoriteEntry(accountId: string, entryId: string): Promise<FavoriteEntry[]> {
  const prefs = await loadCustomerPreferences(accountId);
  const next = prefs.favorites.filter((f) => f.id !== entryId);
  await upsertCustomerPreferences(accountId, prefs.pin, next);
  return next;
}

export async function loadRecoveryForEmail(email: string): Promise<AccountRecoveryRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const norm = email.trim().toLowerCase();
  const { data, error } = await sb.rpc("recovery_list_for_email", { p_email: norm });
  if (error) throw error;
  const list = Array.isArray(data) ? data : [];
  return list.map((r) => recoveryFromRow(r as Record<string, unknown>));
}

export async function submitRecoveryRequest(input: {
  email: string;
  description: string;
  imageBase64?: string | null;
}): Promise<AccountRecoveryRequest> {
  const sb = requireSb();
  const norm = input.email.trim().toLowerCase();
  if (!norm) throw new ServiceError("Email is required.");
  if (!input.description.trim()) throw new ServiceError("Please describe why you need access.");

  const { data: profile } = await sb
    .from("profiles")
    .select("account_id")
    .eq("email", norm)
    .eq("role", "customer")
    .maybeSingle();
  if (!profile) {
    throw new ServiceError("No customer account found for this email.");
  }

  const existing = await loadRecoveryForEmail(norm);
  for (const r of existing) {
    if (r.status === "pending") {
      throw new ServiceError("You already have a pending request.");
    }
    if (r.status === "approved" && !r.passwordResetCompletedAt) {
      throw new ServiceError("Your recovery was approved. Set a new password to finish.");
    }
  }

  const id = `rec_${Date.now()}`;
  const { error } = await sb
    .from("account_recovery_requests")
    .insert(
      recoveryToInsert({
        id,
        email: norm,
        description: input.description.trim(),
        imageBase64: input.imageBase64,
      }),
    );
  if (error) throw error;
  const { data, error: readErr } = await sb
    .from("account_recovery_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !data) throw readErr ?? new ServiceError("Request not found.");
  return recoveryFromRow(data as Record<string, unknown>);
}

export async function approveRecoveryRequest(id: string, adminNote?: string): Promise<void> {
  const sb = requireSb();
  await ensureSupabaseSession();
  const { data: row, error: readErr } = await sb
    .from("account_recovery_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!row) throw new ServiceError("Request not found.");
  if ((row as { status: string }).status !== "pending") {
    throw new ServiceError("Only pending requests can be approved.");
  }

  const note = adminNote?.trim();
  const { data: updated, error } = await sb
    .from("account_recovery_requests")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      admin_note: note || null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ServiceError("Could not approve request.");
}

export async function rejectRecoveryRequest(id: string, adminNote?: string): Promise<void> {
  const sb = requireSb();
  await ensureSupabaseSession();
  const { data: row, error: readErr } = await sb
    .from("account_recovery_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!row) throw new ServiceError("Request not found.");
  if ((row as { status: string }).status !== "pending") {
    throw new ServiceError("Only pending requests can be rejected.");
  }

  const note = adminNote?.trim();
  const { data: updated, error } = await sb
    .from("account_recovery_requests")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      admin_note: note || null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated) throw new ServiceError("Could not reject request.");
}

export async function completeRecoveryPasswordReset(email: string, newPassword: string): Promise<void> {
  const sb = requireSb();
  const norm = email.trim().toLowerCase();
  if (newPassword.length < 6) throw new ServiceError("Password must be at least 6 characters.");
  const list = await loadRecoveryForEmail(norm);
  const approved = list
    .filter((r) => r.status === "approved" && !r.passwordResetCompletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (approved.length === 0) {
    throw new ServiceError("No approved recovery is waiting for a new password.");
  }
  const target = approved[0]!;
  const { error } = await sb.rpc("customer_recovery_set_password", {
    p_request_id: target.id,
    p_email: norm,
    p_password: newPassword,
  });
  if (error) throw error;
}

export async function toggleMenuFavorite(
  accountId: string,
  productId: string,
  favorite: boolean,
): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  if (favorite) {
    const { error } = await sb.from("customer_menu_favorites").upsert({
      account_id: accountId,
      catalog_product_id: productId,
    });
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("customer_menu_favorites")
      .delete()
      .eq("account_id", accountId)
      .eq("catalog_product_id", productId);
    if (error) throw error;
  }
  const prefs = await loadCustomerPreferences(accountId);
  return prefs.menuFavoriteProductIds;
}

export async function loadAdminReportDashboard(days = REPORT_DEFAULT_DAYS): Promise<unknown> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase required");
  await ensureSupabaseSession();
  const { data, error } = await sb.rpc("admin_report_dashboard", { p_days: days });
  if (error) throw error;
  return data;
}
