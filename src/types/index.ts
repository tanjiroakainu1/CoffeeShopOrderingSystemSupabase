export type UserRole = "admin" | "customer";

export interface UserAccount {
  accountId: string;
  email: string;
  role: UserRole;
  displayName: string;
  birthdayIso?: string | null;
  sex?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SeatInventory {
  id: string;
  seatNumber: string;
  description: string;
  capacity: number;
  zone?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  icon: string;
  imageBase64?: string | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderFulfillmentType = "reservation" | "delivery";

export type OrderPaymentStatus = "pending" | "confirmed";

export type PaymentMethod = "gcash";

export interface OrderLine {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface OrderRecord {
  orderId: string;
  customerAccountId: string;
  customerEmail: string;
  customerDisplayName: string;
  customerAuthUserId?: string | null;
  lines: OrderLine[];
  createdAt: string;
  status: OrderStatus;
  specialRequestNote?: string | null;
  prepTimeMinutes?: number | null;
  seatLabel?: string | null;
  fulfillmentType: OrderFulfillmentType;
  tableId?: string | null;
  tableLabelSnapshot?: string | null;
  walkInDateIso?: string | null;
  walkInTimeSlot?: string | null;
  partySize?: number | null;
  deliveryAddress?: string | null;
  deliveryPhone?: string | null;
  deliveryInstructions?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: OrderPaymentStatus | null;
  gcashCustomerProofBase64?: string | null;
  gcashAdminAttachmentBase64?: string | null;
}

export interface CafePaymentSettings {
  gcashQrBase64?: string | null;
  gcashAccountName?: string | null;
  gcashAccountNumber?: string | null;
}

export interface PinnedLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export interface FavoriteEntry {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  note?: string | null;
}

export interface AccountRecoveryRequest {
  id: string;
  email: string;
  description: string;
  imageBase64?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string | null;
  passwordResetCompletedAt?: string | null;
  adminNote?: string | null;
}

export interface HomeSpotlightCafe {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceHintPesos: number;
  address: string;
  openNow: boolean;
  imageUrl: string;
}
