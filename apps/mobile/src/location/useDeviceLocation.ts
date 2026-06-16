/**
 * useDeviceLocation — requests foreground location permission and reads the
 * device's current GPS coordinates.
 *
 * Uses expo-location (already installed, config plugin in app.json).
 * No new dependencies.
 *
 * Returned shape:
 *   status: "loading"  — permission request in flight
 *          "granted"   — coords available
 *          "denied"    — user declined; coords undefined
 *          "error"     — unexpected failure; coords undefined
 *   coords: { lat, lng } | undefined
 */

import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type DeviceLocationStatus = "loading" | "granted" | "denied" | "error";

export interface DeviceLocationResult {
  status: DeviceLocationStatus;
  coords?: { lat: number; lng: number };
}

export function useDeviceLocation(): DeviceLocationResult {
  const [result, setResult] = useState<DeviceLocationResult>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (cancelled) return;

        if (status !== "granted") {
          setResult({ status: "denied" });
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        setResult({
          status: "granted",
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
      } catch {
        if (!cancelled) {
          setResult({ status: "error" });
        }
      }
    }

    void fetchLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
