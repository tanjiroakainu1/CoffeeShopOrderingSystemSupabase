import type {
  AccountRecoveryRequest,
  CatalogProduct,
  FavoriteEntry,
  OrderFulfillmentType,
  OrderLine,
  OrderPaymentStatus,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
  PinnedLocation,
  ProductCategory,
  SeatInventory,
  UserAccount,
  UserRole,
} from "@/types";

function uuidToString(v: unknown): string | null {
  if (v == null) return null;
  return String(v);
}

export function userFromProfile(row: Record<string, unknown>): UserAccount {
  return {
    accountId: row.account_id as string,
    email: row.email as string,
    role: row.role as UserRole,
    displayName: (row.display_name as string) ?? "",
    birthdayIso: (row.birthday_iso as string) ?? null,
    sex: (row.sex as string) ?? null,
    createdAt: (row.created_at as string) ?? null,
    updatedAt: (row.updated_at as string) ?? null,
  };
}

export function categoryFromRow(row: Record<string, unknown>): ProductCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function seatFromRow(row: Record<string, unknown>): SeatInventory {
  return {
    id: row.id as string,
    seatNumber: row.seat_number as string,
    description: (row.description as string) ?? "",
    capacity: Number(row.capacity ?? 1),
    zone: (row.zone as string) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  };
}

export function productFromRow(row: Record<string, unknown>): CatalogProduct {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    priceCents: Number(row.price_cents),
    icon: (row.icon as string) ?? "☕",
    imageBase64: (row.image_base64 as string) ?? null,
  };
}

export function orderFromRow(row: Record<string, unknown>): OrderRecord {
  const linesRaw = row.lines;
  const lines: OrderLine[] = [];
  if (Array.isArray(linesRaw)) {
    for (const e of linesRaw) {
      const j = e as Record<string, unknown>;
      lines.push({
        name: j.name as string,
        quantity: Number(j.quantity),
        unitPriceCents: Number(j.unitPriceCents),
      });
    }
  }
  return {
    orderId: row.order_id as string,
    customerAccountId: row.customer_account_id as string,
    customerEmail: row.customer_email as string,
    customerDisplayName: (row.customer_display_name as string) ?? "",
    customerAuthUserId: uuidToString(row.customer_auth_user_id),
    lines,
    createdAt: row.created_at as string,
    status: row.status as OrderStatus,
    specialRequestNote: (row.special_request_note as string) ?? null,
    prepTimeMinutes: row.prep_time_minutes != null ? Number(row.prep_time_minutes) : null,
    seatLabel: (row.seat_label as string) ?? null,
    fulfillmentType: (row.fulfillment_type as OrderFulfillmentType) ?? "reservation",
    tableId: (row.table_id as string) ?? null,
    tableLabelSnapshot: (row.table_label_snapshot as string) ?? null,
    walkInDateIso: (row.walk_in_date_iso as string) ?? null,
    walkInTimeSlot: (row.walk_in_time_slot as string) ?? null,
    partySize: row.party_size != null ? Number(row.party_size) : null,
    deliveryAddress: (row.delivery_address as string) ?? null,
    deliveryPhone: (row.delivery_phone as string) ?? null,
    deliveryInstructions: (row.delivery_instructions as string) ?? null,
    paymentMethod: (row.payment_method as PaymentMethod) ?? null,
    paymentStatus: (row.payment_status as OrderPaymentStatus) ?? null,
    gcashCustomerProofBase64: (row.gcash_customer_proof_base64 as string) ?? null,
    gcashAdminAttachmentBase64: (row.gcash_admin_attachment_base64 as string) ?? null,
  };
}

export function orderToRow(o: OrderRecord): Record<string, unknown> {
  return {
    order_id: o.orderId,
    customer_account_id: o.customerAccountId,
    customer_email: o.customerEmail,
    customer_display_name: o.customerDisplayName,
    customer_auth_user_id: o.customerAuthUserId,
    lines: o.lines,
    created_at: o.createdAt,
    status: o.status,
    special_request_note: o.specialRequestNote,
    prep_time_minutes: o.prepTimeMinutes,
    seat_label: o.seatLabel,
    fulfillment_type: o.fulfillmentType,
    table_id: o.tableId,
    table_label_snapshot: o.tableLabelSnapshot,
    walk_in_date_iso: o.walkInDateIso,
    walk_in_time_slot: o.walkInTimeSlot,
    party_size: o.partySize,
    delivery_address: o.deliveryAddress,
    delivery_phone: o.deliveryPhone,
    delivery_instructions: o.deliveryInstructions,
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    gcash_customer_proof_base64: o.gcashCustomerProofBase64,
    gcash_admin_attachment_base64: o.gcashAdminAttachmentBase64,
  };
}

export function recoveryFromRow(row: Record<string, unknown>): AccountRecoveryRequest {
  return {
    id: row.id as string,
    email: row.email as string,
    description: (row.description as string) ?? "",
    imageBase64: (row.image_base64 as string) ?? null,
    status: row.status as AccountRecoveryRequest["status"],
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
    passwordResetCompletedAt: (row.password_reset_completed_at as string) ?? null,
    adminNote: (row.admin_note as string) ?? null,
  };
}

export function pinFromJson(raw: unknown): PinnedLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  return {
    label: j.label as string,
    latitude: Number(j.latitude),
    longitude: Number(j.longitude),
  };
}

export function favoritesFromJson(raw: unknown): FavoriteEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    const j = e as Record<string, unknown>;
    return {
      id: j.id as string,
      name: j.name as string,
      address: (j.addressLine as string) ?? (j.address as string) ?? "",
      latitude: Number(j.latitude),
      longitude: Number(j.longitude),
      note: (j.description as string) ?? null,
    };
  });
}

export function favoritesToJson(list: FavoriteEntry[]): Record<string, unknown>[] {
  return list.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.note ?? "",
    addressLine: f.address,
    latitude: f.latitude,
    longitude: f.longitude,
  }));
}

export function recoveryToInsert(input: {
  id: string;
  email: string;
  description: string;
  imageBase64?: string | null;
}): Record<string, unknown> {
  return {
    id: input.id,
    email: input.email,
    description: input.description,
    image_base64: input.imageBase64 ?? null,
    status: "pending",
    created_at: new Date().toISOString(),
  };
}
