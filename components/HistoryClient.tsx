"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type Order,
  type Profile,
  formatMoney,
  statusLabel,
} from "@/lib/food/types";
import StaffHeader from "./StaffHeader";

export default function HistoryClient({
  userId,
  userEmail,
  profile,
}: {
  userId: string;
  userEmail: string;
  profile: Profile;
}) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, user_id, status, customer_name, customer_phone, delivery_location, notes, total_cents, created_at, order_items(id, order_id, menu_item_id, item_name, unit_price_cents, quantity, line_total_cents)"
      )
      .order("created_at", { ascending: false })
      .limit(30);
    setLoading(false);
    if (error) {
      setError("Could not load order history.");
      return;
    }
    setOrders((data ?? []) as Order[]);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional history load
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`history-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        () => void loadOrders()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadOrders, supabase, userId]);

  function reorder(order: Order) {
    window.localStorage.setItem(
      "timetec-reorder",
      JSON.stringify({
        items: (order.order_items ?? []).map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
        })),
        delivery_location: order.delivery_location,
        notes: order.notes,
      })
    );
    router.push("/app");
  }

  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status));

  return (
    <div className="min-h-screen bg-[#fff8ef] text-[#2d2018]">
      <StaffHeader
        userEmail={userEmail}
        isAdmin={profile.role === "admin"}
        subtitle={`${activeOrders.length} active order${activeOrders.length === 1 ? "" : "s"}`}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-lg border border-[#ead7c2] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#11895b]">
            Order history
          </p>
          <h1 className="mt-2 text-3xl font-bold">Track and reorder meals</h1>
          <p className="mt-2 text-[#6f5a48]">
            Follow live status updates and repeat previous office delivery orders.
          </p>
        </section>

        {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {loading ? (
            <p className="text-[#6f5a48]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#e3cdb6] bg-white p-8 text-center text-[#7a6656] lg:col-span-2">
              Your previous orders will appear here.
            </p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-[#ead7c2] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{statusLabel(order.status)}</p>
                    <p className="text-sm text-[#7a6656]">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-[#6f5a48]">{order.delivery_location}</p>
                  </div>
                  <span className="rounded-full bg-[#fff1df] px-3 py-1 text-xs font-semibold text-[#8a4f17]">
                    {formatMoney(order.total_cents)}
                  </span>
                </div>

                <ul className="mt-4 space-y-1 text-sm">
                  {(order.order_items ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span>{item.quantity} x {item.item_name}</span>
                      <span>{formatMoney(item.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>

                {order.notes && <p className="mt-3 text-sm text-[#6f5a48]">Notes: {order.notes}</p>}

                <button
                  type="button"
                  onClick={() => reorder(order)}
                  className="mt-4 rounded-md border border-[#e3cdb6] px-3 py-1.5 text-sm font-semibold text-[#5f4a3a] hover:bg-[#fff1df]"
                >
                  Reorder
                </button>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
