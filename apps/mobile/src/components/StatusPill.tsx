/**
 * StatusPill — shared order-status badge used by OrdersScreen and StoreOrdersScreen.
 *
 * Renders a small coloured pill for a given OrderStatus.
 * Unknown/future statuses fall back to a neutral grey pill.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OrderStatus } from "@homegrown/shared";
import { capitalise } from "../utils/text";

// ---------------------------------------------------------------------------
// Status config — single source of truth for pill colours across the app
// ---------------------------------------------------------------------------

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending_payment: { label: "Finalizing", bg: "#fff8e1", text: "#92400e" },
  paid:            { label: "Paid",       bg: "#e8f5e9", text: "#2d6a4f" },
  fulfilled:       { label: "Fulfilled",  bg: "#e0f2f1", text: "#00695c" },
  cancelled:       { label: "Cancelled",  bg: "#fce4ec", text: "#b71c1c" },
  refunded:        { label: "Refunded",   bg: "#f3e5f5", text: "#6a1b9a" },
  disputed:        { label: "Disputed",   bg: "#fff3e0", text: "#e65100" },
};

// ---------------------------------------------------------------------------
// StatusPill component
// ---------------------------------------------------------------------------

export function StatusPill({ status }: { status: OrderStatus }) {
  const config =
    STATUS_CONFIG[status] ?? { label: capitalise(status), bg: "#e5e7eb", text: "#374151" };
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <Text style={[styles.pillText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
