"use client";

import { useState } from "react";
import { brand } from "@/lib/config/brand";
import type { Item } from "./ItemsClient";
import { validateItem } from "./ItemForm";

export default function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: Item;
  onUpdate: (id: string, title: string, body: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const invalid = validateItem(title, body);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError(null);
    const saveError = await onUpdate(item.id, title.trim(), body.trim());
    setBusy(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-xl border border-gray-300 p-4">
        <div>
          <label htmlFor={`title-${item.id}`} className="block text-sm font-medium">
            Title
          </label>
          <input
            id={`title-${item.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>
        <div>
          <label htmlFor={`body-${item.id}`} className="block text-sm font-medium">
            Note
          </label>
          <textarea
            id={`body-${item.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setTitle(item.title);
              setBody(item.body ?? "");
              setError(null);
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* User text is rendered as plain text (React escapes it) — data, not markup. */}
          <h2 className="break-words font-semibold">{item.title}</h2>
          {item.body && (
            <p className="mt-1 break-words whitespace-pre-wrap text-sm text-gray-600">
              {item.body}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          {confirmingDelete ? (
            <>
              <button
                onClick={() => onDelete(item.id)}
                className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white"
              >
                Really delete?
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700"
              >
                Keep
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                title="Delete item"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
