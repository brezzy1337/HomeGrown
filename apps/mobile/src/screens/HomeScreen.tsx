/**
 * HomeScreen — main authenticated screen.
 * Calls trpc.health.ping.useQuery() to prove the typed end-to-end chain.
 * If the server's AppRouter or HealthResponse shape changes, TypeScript
 * will catch it here at compile time.
 *
 * React Native only — no DOM elements.
 */

import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { trpc } from "../api/trpc";

export function HomeScreen() {
  const { data, isLoading, error } = trpc.health.ping.useQuery();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>HomeGrown</Text>

        <View style={styles.statusCard}>
          <Text style={styles.cardLabel}>API Status</Text>

          {isLoading && <ActivityIndicator size="small" color="#2d6a4f" />}

          {error && (
            <Text style={styles.errorText}>
              Could not reach server: {error.message}
            </Text>
          )}

          {data && (
            <>
              <Text style={styles.statusValue}>
                Status: <Text style={styles.statusOk}>{data.status}</Text>
              </Text>
              <Text style={styles.statusValue}>
                Service: {data.service}
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f9f7",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d6a4f",
    marginBottom: 32,
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 15,
    color: "#333",
  },
  statusOk: {
    color: "#2d6a4f",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: "#c0392b",
  },
});
