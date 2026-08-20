"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ORDER_STATUSES,
  type DeliveryLocation,
  type MenuCategory,
  type MenuItem,
  type Order,
  type OrderStatus,
  formatMoney,
  statusLabel,
} from "@/lib/food/types";
import StaffHeader from "./StaffHeader";

type MenuDraft = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
};

const emptyDraft: MenuDraft = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
};

export default function AdminClient({ userEmail }: { userEmail: string }) {
  const supabase = getSupabaseBrowserClient();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft);
  const [categoryName, setCategoryName] = useState("");
  const [categorySort, setCategorySort] = useState("50");
  const [locationName, setLocationName] = useState("");
  const [locationSort, setLocationSort] = useState("50");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!supabase) return;
    const [
      { data: categoryData },
      { data: locationData },
      { data: itemData },
      { data: orderData, error: orderError },
    ] =
      await Promise.all([
        supabase
          .from("menu_categories")
          .select("id, name, sort_order, is_active")
          .order("sort_order", { ascending: true }),
        supabase
          .from("delivery_locations")
          .select("id, name, sort_order, is_active")
          .order("sort_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select("id, category_id, name, description, price_cents, image_url, is_available")
          .order("name", { ascending: true }),
        supabase
          .from("orders")
          .select(
            "id, user_id, status, customer_name, customer_phone, delivery_location, notes, total_cents, created_at, order_items(id, order_id, menu_item_id, item_name, unit_price_cents, quantity, line_total_cents)"
          )
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
    setCategories((categoryData ?? []) as MenuCategory[]);
    setLocations((locationData ?? []) as DeliveryLocation[]);
    setItems((itemData ?? []) as MenuItem[]);
    if (orderError) {
      setError("Could not load staff orders.");
    } else {
      setOrders((orderData ?? []) as Order[]);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional admin data load
    void loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        void loadAdminData()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAdminData, supabase]);

  function editItem(item: MenuItem) {
    setDraft({
      id: item.id,
      category_id: item.category_id ?? "",
      name: item.name,
      description: item.description ?? "",
      price: (item.price_cents / 100).toFixed(2),
      image_url: item.image_url ?? "",
      is_available: item.is_available,
    });
  }

  async function saveMenuItem(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const priceCents = Math.round(Number(draft.price) * 100);
    if (!draft.name.trim() || !draft.category_id || !Number.isFinite(priceCents) || priceCents < 0) {
      setError("Menu items need a name, category, and valid price.");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      category_id: draft.category_id,
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price_cents: priceCents,
      image_url: draft.image_url.trim() || null,
      is_available: draft.is_available,
    };
    const request = draft.id
      ? supabase.from("menu_items").update(payload).eq("id", draft.id)
      : supabase.from("menu_items").insert(payload);
    const { error } = await request;
    setBusy(false);
    if (error) {
      setError("Could not save that menu item.");
      return;
    }
    setDraft(emptyDraft);
    setMessage("Menu item saved.");
    await loadAdminData();
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }
    const sortOrder = Number.parseInt(categorySort, 10);
    const { error } = await supabase.from("menu_categories").insert({
      name: categoryName.trim(),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 50,
      is_active: true,
    });
    if (error) {
      setError("Could not save that category.");
      return;
    }
    setCategoryName("");
    setCategorySort("50");
    setMessage("Category added.");
    await loadAdminData();
  }

  async function saveLocation(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (!locationName.trim()) {
      setError("Delivery location name is required.");
      return;
    }
    const sortOrder = Number.parseInt(locationSort, 10);
    const { error } = await supabase.from("delivery_locations").insert({
      name: locationName.trim(),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 50,
      is_active: true,
    });
    if (error) {
      setError("Could not save that delivery location.");
      return;
    }
    setLocationName("");
    setLocationSort("50");
    setMessage("Delivery location added.");
    await loadAdminData();
  }

  async function toggleItem(item: MenuItem) {
    if (!supabase) return;
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (error) {
      setError("Could not update availability.");
      return;
    }
    await loadAdminData();
  }

  async function toggleLocation(location: DeliveryLocation) {
    if (!supabase) return;
    const { error } = await supabase
      .from("delivery_locations")
      .update({ is_active: !location.is_active })
      .eq("id", location.id);
    if (error) {
      setError("Could not update delivery location.");
      return;
    }
    await loadAdminData();
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!supabase) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      setError("Could not update that order.");
      return;
    }
    setMessage("Order status updated.");
    await loadAdminData();
  }

  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <StaffHeader userEmail={userEmail} isAdmin subtitle="Admin menu and order board" />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 xl:grid-cols-[420px_1fr]">
        <section className="space-y-5">
          <form onSubmit={saveMenuItem} className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h1 className="text-xl font-semibold">{draft.id ? "Edit menu item" : "Add menu item"}</h1>
            <div className="mt-4 space-y-3">
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Item name" className="w-full rounded-md border border-[#e3cdb6] px-3 py-2" />
              <select value={draft.category_id} onChange={(event) => setDraft({ ...draft, category_id: event.target.value })} className="w-full rounded-md border border-[#e3cdb6] px-3 py-2">
                <option value="">Choose category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="Price, e.g. 12.90" inputMode="decimal" className="w-full rounded-md border border-[#e3cdb6] px-3 py-2" />
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" rows={3} className="w-full rounded-md border border-[#e3cdb6] px-3 py-2" />
              <input value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="Image URL" className="w-full rounded-md border border-[#e3cdb6] px-3 py-2" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.is_available} onChange={(event) => setDraft({ ...draft, is_available: event.target.checked })} />
                Available to staff
              </label>
              <div className="flex gap-2">
                <button disabled={busy} className="rounded-md bg-[#11895b] px-4 py-2 font-semibold text-white disabled:opacity-60">
                  {busy ? "Saving..." : "Save item"}
                </button>
                {draft.id && (
                  <button type="button" onClick={() => setDraft(emptyDraft)} className="rounded-md border border-[#e3cdb6] px-4 py-2 font-semibold text-[#5f4a3a]">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          <form onSubmit={saveCategory} className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Add category</h2>
            <div className="mt-3 grid grid-cols-[1fr_90px] gap-2">
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" className="rounded-md border border-[#e3cdb6] px-3 py-2" />
              <input value={categorySort} onChange={(event) => setCategorySort(event.target.value)} placeholder="Sort" inputMode="numeric" className="rounded-md border border-[#e3cdb6] px-3 py-2" />
            </div>
            <button className="mt-3 rounded-md border border-[#e3cdb6] px-4 py-2 font-semibold text-[#5f4a3a] hover:bg-[#fff1df]">
              Add category
            </button>
          </form>

          <form onSubmit={saveLocation} className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Add delivery location</h2>
            <div className="mt-3 grid grid-cols-[1fr_90px] gap-2">
              <input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="e.g. TimeTec HQ - Level 4" className="rounded-md border border-[#e3cdb6] px-3 py-2" />
              <input value={locationSort} onChange={(event) => setLocationSort(event.target.value)} placeholder="Sort" inputMode="numeric" className="rounded-md border border-[#e3cdb6] px-3 py-2" />
            </div>
            <button className="mt-3 rounded-md border border-[#e3cdb6] px-4 py-2 font-semibold text-[#5f4a3a] hover:bg-[#fff1df]">
              Add location
            </button>
          </form>

          {(message || error) && (
            <p className={`rounded-md border p-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error ?? message}
            </p>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Menu manager</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {items.map((item) => (
                <article key={item.id} className="rounded-md border border-[#ead7c2] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-[#7a6656]">{formatMoney(item.price_cents)}</p>
                      <p className="mt-1 text-sm text-[#6f5a48]">{item.description}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_available ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                      {item.is_available ? "Available" : "Hidden"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => editItem(item)} className="rounded-md border border-[#e3cdb6] px-3 py-1.5 text-sm font-semibold text-[#5f4a3a]">
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleItem(item)} className="rounded-md border border-[#e3cdb6] px-3 py-1.5 text-sm font-semibold text-[#5f4a3a]">
                      {item.is_available ? "Disable" : "Enable"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Delivery locations</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {locations.map((location) => (
                <article key={location.id} className="rounded-md border border-[#ead7c2] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{location.name}</h3>
                      <p className="text-sm text-[#7a6656]">Sort order {location.sort_order}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${location.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                      {location.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <button type="button" onClick={() => toggleLocation(location)} className="mt-3 rounded-md border border-[#e3cdb6] px-3 py-1.5 text-sm font-semibold text-[#5f4a3a]">
                    {location.is_active ? "Disable" : "Enable"}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Order board</h2>
            <div className="mt-4 space-y-4">
              {orders.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#e3cdb6] p-5 text-center text-[#7a6656]">
                  Staff orders will appear here.
                </p>
              ) : (
                orders.map((order) => (
                  <article key={order.id} className="rounded-md border border-[#ead7c2] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{order.customer_name}</h3>
                        <p className="text-sm text-[#7a6656]">
                          {order.customer_phone} - {order.delivery_location}
                        </p>
                        <p className="text-sm text-[#7a6656]">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <p className="font-semibold text-[#11895b]">{formatMoney(order.total_cents)}</p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm">
                      {(order.order_items ?? []).map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>{item.quantity} x {item.item_name}</span>
                          <span>{formatMoney(item.line_total_cents)}</span>
                        </li>
                      ))}
                    </ul>
                    {order.notes && <p className="mt-3 text-sm text-[#6f5a48]">Notes: {order.notes}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {ORDER_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStatus(order.id, status)}
                          className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                            order.status === status
                              ? "border-[#11895b] bg-[#11895b] text-white"
                              : "border-[#e3cdb6] text-[#5f4a3a] hover:bg-[#fff1df]"
                          }`}
                        >
                          {statusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
