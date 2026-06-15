/**
 * Root stack param list — single source of truth for screen names and params.
 * Import this type in every screen that calls useNavigation() or useRoute().
 */

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Hero: undefined;
  LogIn: undefined;
  SignUp: undefined;
  Home: undefined;
};

export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
