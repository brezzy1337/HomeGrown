/**
 * ListingCard — shared produce listing card used by HomeScreen and SearchScreen.
 *
 * Shows: name, category, price/unit, distance, store name, and an Add/Sold-out
 * button with brief "Added" feedback. Handles the single-store cart prompt
 * (Alert) when the user taps Add on a listing from a different store.
 *
 * React Native only — no DOM elements.
 */

import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NearbyListing } from "@homegrown/shared";
import { useCart } from "../cart/CartContext";
import { capitalise } from "../utils/text";
import { formatCents } from "../utils/money";

type Props = {
  item: NearbyListing;
};

export function ListingCard({ item }: Props) {
  const [justAdded, setJustAdded] = useState(false);
  const { addItem, clearCart } = useCart();

  function handleAdd() {
    const result = addItem(item);
    if (result.ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } else if (result.reason === "different-store") {
      Alert.alert(
        "Start a new cart?",
        `Your cart has items from ${result.cartStoreName}. Starting a new cart will remove them.\n\nSwitch to ${item.storeName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Start new cart",
            style: "destructive",
            onPress: () => {
              clearCart();
              const retry = addItem(item);
              if (retry.ok) {
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1500);
              }
            },
          },
        ],
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.distance}>{item.distanceKm.toFixed(1)} km</Text>
      </View>
      <Text style={styles.price}>
        ${formatCents(item.priceCents)} / {item.unit}
      </Text>
      <Text style={styles.meta}>
        {capitalise(item.category)} · {item.storeName}
      </Text>
      <Pressable
        style={[styles.addButton, justAdded ? styles.addButtonAdded : null]}
        onPress={handleAdd}
        disabled={item.quantity === 0}
      >
        <Text style={styles.addButtonText}>
          {item.quantity === 0 ? "Sold out" : justAdded ? "Added" : "Add"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  distance: {
    fontSize: 13,
    color: "#2d6a4f",
    fontWeight: "500",
    marginLeft: 8,
  },
  price: {
    fontSize: 15,
    color: "#2d6a4f",
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#888",
  },
  addButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#2d6a4f",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonAdded: {
    backgroundColor: "#52b788",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
