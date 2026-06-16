/**
 * CartContext — in-memory single-store cart for buyers.
 *
 * Rules:
 *   - In-memory only; no persistence (explicit product decision).
 *   - Single-store invariant: addItem rejects listings from a different store
 *     and returns { ok: false, reason: "different-store" } so the caller can
 *     prompt the user to start a new cart. The context never shows its own Alert.
 *   - Money is always integer cents; no floats.
 *   - Available quantity (from NearbyListing.quantity) is the stock cap for setQuantity.
 *
 * Exported: CartProvider, useCart.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { NearbyListing } from "@homegrown/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartLineItem = {
  listingId: string;
  name: string;
  priceCents: number;
  unit: string;
  storeId: string;
  storeName: string;
  quantity: number;
  /** Available stock cap from the listing at the time it was added. */
  available: number;
};

export type AddItemResult =
  | { ok: true }
  | { ok: false; reason: "different-store"; cartStoreName: string };

export type CartContextValue = {
  items: CartLineItem[];
  storeId: string | null;
  storeName: string | null;
  /** Sum of all line item quantities. */
  itemCount: number;
  /** Sum of priceCents × quantity across all items (integer cents). */
  subtotalCents: number;
  /**
   * Add a listing to the cart. If the cart is non-empty and the listing belongs
   * to a different store, returns { ok: false, reason: "different-store" }.
   * Otherwise increments quantity if the item is already in the cart, up to
   * Math.min(available, 1000).
   */
  addItem: (listing: NearbyListing) => AddItemResult;
  /**
   * Set the quantity of an item. Clamped to [1, min(available, 1000)].
   * No-op if the listing is not in the cart.
   */
  setQuantity: (listingId: string, qty: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);

  const addItem = useCallback((listing: NearbyListing): AddItemResult => {
    // Single-store invariant check
    const currentStoreId = items.length > 0 ? items[0]!.storeId : null;
    if (currentStoreId !== null && currentStoreId !== listing.storeId) {
      return {
        ok: false,
        reason: "different-store",
        cartStoreName: items[0]!.storeName,
      };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === listing.id);
      if (existing) {
        // Increment quantity, clamped to min(available, 1000)
        const cap = Math.min(listing.quantity, 1000);
        return prev.map((i) =>
          i.listingId === listing.id
            ? { ...i, quantity: Math.min(i.quantity + 1, cap) }
            : i,
        );
      }
      // New item — quantity starts at 1
      const cap = Math.min(listing.quantity, 1000);
      const newItem: CartLineItem = {
        listingId: listing.id,
        name: listing.name,
        priceCents: listing.priceCents,
        unit: listing.unit,
        storeId: listing.storeId,
        storeName: listing.storeName,
        quantity: Math.min(1, cap),
        available: listing.quantity,
      };
      return [...prev, newItem];
    });

    return { ok: true };
  }, [items]);

  const setQuantity = useCallback((listingId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.listingId !== listingId) return i;
        const cap = Math.min(i.available, 1000);
        return { ...i, quantity: Math.max(1, Math.min(qty, cap)) };
      }),
    );
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const storeId = items.length > 0 ? items[0]!.storeId : null;
  const storeName = items.length > 0 ? items[0]!.storeName : null;
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      storeId,
      storeName,
      itemCount,
      subtotalCents,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, storeId, storeName, itemCount, subtotalCents, addItem, setQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
