/**
 * App.tsx — root component.
 *
 * Sets up:
 *   - QueryClientProvider (TanStack Query v5)
 *   - trpc.Provider (tRPC React Query bridge)
 *   - React Navigation native-stack with placeholder screens
 *
 * Secrets policy: EXPO_PUBLIC_API_URL is read from the environment (set in
 * .env locally; never commit a filled-in .env). No secret keys here.
 */

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { trpc, API_URL } from "./src/api/trpc";
import { HeroScreen } from "./src/screens/HeroScreen";
import { LogInScreen } from "./src/screens/LogInScreen";
import { SignUpScreen } from "./src/screens/SignUpScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Hero">
            <Stack.Screen
              name="Hero"
              component={HeroScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LogIn"
              component={LogInScreen}
              options={{ title: "Log In" }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: "Sign Up" }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Home", headerBackVisible: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
