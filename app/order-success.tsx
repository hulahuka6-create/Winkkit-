import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitButton } from "@/components/winkkit";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function OrderSuccessScreen() {
  const colors = useColors();
  const router = useRouter();
  return <ScreenContainer className="p-5"><View style={styles.content}><View style={[styles.mark, { backgroundColor: `${colors.success}16` }]}><IconSymbol name="checkmark" size={38} color={colors.success} /></View><Text style={[styles.title, { color: colors.foreground }]}>Order received</Text><Text style={[styles.message, { color: colors.muted }]}>Your order is now with the shop. You can follow each status update from Orders once the shop accepts it.</Text><WinkkitButton label="View my orders" onPress={() => router.replace("/orders")} /><Pressable onPress={() => router.replace("/")} style={styles.home}><Text style={[styles.homeText, { color: colors.primary }]}>Continue browsing</Text></Pressable></View></ScreenContainer>;
}

const styles: any = StyleSheet.create({ content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }, mark: { width: 82, height: 82, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 24 }, title: { fontSize: 28, fontWeight: "800", textAlign: "center" }, message: { fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 10, marginBottom: 26 }, home: { paddingVertical: 16 }, homeText: { fontSize: 14, fontWeight: "800" } });
