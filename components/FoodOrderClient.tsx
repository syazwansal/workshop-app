"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import StaffHeader from "./StaffHeader";
import {
  type CartLine,
  type DeliveryLocation,
  type MenuCategory,
  type MenuItem,
  type Profile,
  formatMoney,
} from "@/lib/food/types";

const fallbackLocations = [
  "TimeTec HQ - Level 1 Pantry",
  "TimeTec HQ - Level 2 Office",
  "TimeTec HQ - Level 3 Meeting Area",
];

function initialProfile(userId: string, userEmail: string): Profile {
  return {
    id: userId,
    email: userEmail,
    full_name: "",
    phone: "",
    role: "customer",
  };
}

function FoodImage({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);

  if (!item.image_url || failed) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center bg-[linear-gradient(135deg,#f6e2c8,#fff8ef_48%,#dff3e8)] px-6 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#11895b]">
            Lunch Noi?
          </p>
          <p className="mt-2 text-lg font-bold text-[#4a3528]">{item.name}</p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain img gives reliable onError fallback for admin-managed URLs.
    <img
      src={item.image_url}
      alt={item.name}
      onError={() => setFailed(true)}
      className="aspect-[16/9] w-full object-cover"
    />
  );
}

export default function FoodOrderClient({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile>(initialProfile(userId, userEmail));
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = cartLines.reduce(
    (total, line) => total + line.item.price_cents * line.quantity,
    0
  );

  const loadEverything = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [
      { data: profileData },
      { data: categoryData },
      { data: itemData },
      { data: locationData },
    ] =
      await Promise.all([
        supabase.from("profiles").select("id, email, full_name, phone, role").eq("id", userId).maybeSingle(),
        supabase
          .from("menu_categories")
          .select("id, name, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select("id, category_id, name, description, price_cents, image_url, is_available")
          .eq("is_available", true)
          .order("name", { ascending: true }),
        supabase
          .from("delivery_locations")
          .select("id, name, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      const fallback = initialProfile(userId, userEmail);
      await supabase.from("profiles").insert({ id: userId, email: userEmail });
      setProfile(fallback);
    }

    setCategories((categoryData ?? []) as MenuCategory[]);
    setMenuItems((itemData ?? []) as MenuItem[]);
    const nextLocations = (locationData ?? []) as DeliveryLocation[];
    setLocations(nextLocations);
    setDeliveryLocation((current) => current || nextLocations[0]?.name || fallbackLocations[0]);
    setLoading(false);
  }, [supabase, userEmail, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load
    void loadEverything();
  }, [loadEverything]);

  useEffect(() => {
    if (menuItems.length === 0 || typeof window === "undefined") return;
    const pending = window.localStorage.getItem("timetec-reorder");
    if (!pending) return;

    try {
      const saved = JSON.parse(pending) as {
        items: { menu_item_id: string | null; quantity: number }[];
        delivery_location?: string;
        notes?: string | null;
      };
      const nextCart: Record<string, CartLine> = {};
      for (const savedItem of saved.items) {
        if (!savedItem.menu_item_id) continue;
        const menuItem = menuItems.find((item) => item.id === savedItem.menu_item_id);
        if (menuItem) {
          nextCart[menuItem.id] = { item: menuItem, quantity: savedItem.quantity };
        }
      }
      if (Object.keys(nextCart).length > 0) {
        setCart(nextCart);
        setDeliveryLocation(saved.delivery_location || fallbackLocations[0]);
        setNotes(saved.notes ?? "");
        setMessage("Previous order added to your cart.");
      }
    } finally {
      window.localStorage.removeItem("timetec-reorder");
    }
  }, [menuItems]);

  function changeQuantity(item: MenuItem, delta: number) {
    setCart((current) => {
      const existing = current[item.id]?.quantity ?? 0;
      const nextQuantity = existing + delta;
      const next = { ...current };
      if (nextQuantity <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = { item, quantity: nextQuantity };
      }
      return next;
    });
  }

  async function checkout() {
    if (!supabase) return;
    const fullName = profile.full_name?.trim();
    const phone = profile.phone?.trim();
    const location = deliveryLocation.trim();
    if (!fullName || !phone || !location) {
      setError("Complete your profile name and phone, then add an office delivery location.");
      return;
    }
    if (cartLines.length === 0) {
      setError("Add at least one menu item to your cart.");
      return;
    }

    setCheckingOut(true);
    setError(null);
    setMessage(null);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: fullName,
        customer_phone: phone,
        delivery_location: location,
        notes: notes.trim() || null,
        total_cents: cartTotal,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setCheckingOut(false);
      setError("Could not place the order. Please try again.");
      return;
    }

    const orderItems = cartLines.map((line) => ({
      order_id: order.id,
      menu_item_id: line.item.id,
      item_name: line.item.name,
      unit_price_cents: line.item.price_cents,
      quantity: line.quantity,
      line_total_cents: line.item.price_cents * line.quantity,
    }));
    const { error: itemError } = await supabase.from("order_items").insert(orderItems);
    setCheckingOut(false);
    if (itemError) {
      setError("The order was created, but items could not be attached. Contact admin.");
      return;
    }

    setCart({});
    setNotes("");
    setMessage("Order placed. Open History to track its status.");
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <StaffHeader userEmail={userEmail} isAdmin={profile.role === "admin"} />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-8">
          <div className="rounded-lg border border-[#ead7c2] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#11895b]">
              Staff menu
            </p>
            <h1 className="mt-2 text-3xl font-bold">Order for office delivery</h1>
            <p className="mt-2 text-[#6f5a48]">
              Pick your meal, add your desk or pantry location, and watch the order status.
            </p>
            <Link
              href="/history"
              className="mt-5 inline-block rounded-md border border-[#e3cdb6] px-4 py-2 text-sm font-semibold text-[#5f4a3a] hover:bg-[#fff1df]"
            >
              View order history
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-[#6f5a48]">Loading menu...</p>
          ) : (
            <div className="mt-6 space-y-8">
              {categories.map((category) => {
                const items = menuItems.filter((item) => item.category_id === category.id);
                if (items.length === 0) return null;
                return (
                  <section key={category.id}>
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {items.map((item) => {
                        const quantity = cart[item.id]?.quantity ?? 0;
                        return (
                          <article key={item.id} className="overflow-hidden rounded-lg border border-[#ead7c2] bg-white shadow-sm">
                            <FoodImage item={item} />
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold">{item.name}</h3>
                                  <p className="mt-1 text-sm leading-6 text-[#6f5a48]">{item.description}</p>
                                </div>
                                <p className="shrink-0 font-semibold text-[#11895b]">
                                  {formatMoney(item.price_cents)}
                                </p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex h-10 items-center rounded-md border border-[#e3cdb6]">
                                  <button type="button" onClick={() => changeQuantity(item, -1)} className="h-10 w-10 text-lg text-[#5f4a3a]" aria-label={`Remove ${item.name}`}>
                                    -
                                  </button>
                                  <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                                  <button type="button" onClick={() => changeQuantity(item, 1)} className="h-10 w-10 text-lg text-[#5f4a3a]" aria-label={`Add ${item.name}`}>
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </section>

        <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Cart</h2>
            {(!profile.full_name || !profile.phone) && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Profile needed before checkout</p>
                <Link href="/profile" className="mt-1 inline-block underline">
                  Add name and phone
                </Link>
              </div>
            )}
            <div className="mt-3 space-y-3">
              {cartLines.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#e3cdb6] p-4 text-center text-sm text-[#7a6656]">
                  Add menu items to start an order.
                </p>
              ) : (
                cartLines.map((line) => (
                  <div key={line.item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{line.item.name}</p>
                      <p className="text-[#7a6656]">
                        {line.quantity} x {formatMoney(line.item.price_cents)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatMoney(line.quantity * line.item.price_cents)}</p>
                  </div>
                ))
              )}
              <label className="block text-sm font-medium" htmlFor="delivery-location">
                Office delivery location
              </label>
              <select
                id="delivery-location"
                value={deliveryLocation}
                onChange={(event) => setDeliveryLocation(event.target.value)}
                className="w-full rounded-md border border-[#e3cdb6] px-3 py-2"
              >
                {(locations.length > 0 ? locations.map((location) => location.name) : fallbackLocations).map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-medium" htmlFor="order-notes">
                Notes
              </label>
              <textarea id="order-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-md border border-[#e3cdb6] px-3 py-2" />
              <div className="flex items-center justify-between border-t border-[#ead7c2] pt-3 font-semibold">
                <span>Total</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
              <button type="button" onClick={checkout} disabled={checkingOut} className="w-full rounded-md bg-[#11895b] px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                {checkingOut ? "Placing order..." : "Place order"}
              </button>
            </div>
          </section>

          {(message || error) && (
            <p className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error ?? message}
            </p>
          )}
        </aside>

      </main>
    </div>
  );
}
