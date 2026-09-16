import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const bundleId = "com.winkkit.app";
const scheme = "winkkit";

const config: ExpoConfig = {
  name: "Winkkit",
  slug: "winkkit",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/winkkit-icon.png",
  scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#F7F9FC",
      foregroundImage: "./assets/images/winkkit-icon.png",
      monochromeImage: "./assets/images/winkkit-icon.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    permissions: ["POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/winkkit-icon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      { icon: "./assets/images/winkkit-icon.png", color: "#3157D5" },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/winkkit-icon.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#F7F9FC",
        dark: { backgroundColor: "#0F1733" },
      },
    ],
    [
      "expo-build-properties",
      { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
};

export default config;
