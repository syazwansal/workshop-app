export const ORDER_STATUSES = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

export type MenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
};

export type DeliveryLocation = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  notes: string | null;
  total_cents: number;
  created_at: string;
  order_items?: OrderItem[];
};

export type CartLine = {
  item: MenuItem;
  quantity: number;
};

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(cents / 100);
}

export function statusLabel(status: OrderStatus): string {
  return {
    received: "Received",
    preparing: "Preparing",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }[status];
}
