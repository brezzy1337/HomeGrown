/**
 * LogInScreen — placeholder log-in screen.
 * Milestone 1: no real auth. Navigates to Home on press.
 * React Native only — no DOM elements.
 */

import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "LogIn">;

export function LogInScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Log In</Text>
        <Text style={styles.body}>
          Authentication coming in a later milestone.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.buttonText}>Continue to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
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
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: "#777",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2d6a4f",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
