import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS !== "android") return null;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Winkkit alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3157D5",
  });

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const token = await Notifications.getDevicePushTokenAsync();
  return typeof token.data === "string" ? token.data : null;
}
