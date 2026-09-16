import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 } }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color }) => <IconSymbol name="magnifyingglass" size={23} color={color} /> }} />
    <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color }) => <IconSymbol name="clock.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="cart" options={{ title: "Cart", tabBarBadge: itemCount > 0 ? itemCount : undefined, tabBarIcon: ({ color }) => <IconSymbol name="bag.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <IconSymbol name="person.fill" size={23} color={color} /> }} />
  </Tabs>;
}
