import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitBadge, WinkkitCard, WinkkitEmptyState } from "@/components/winkkit";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function OrdersScreen() {
  const colors = useColors();
  const { isAuthenticated, loading } = useAuth();
  const orders = trpc.orders.mine.useQuery(undefined, { enabled: isAuthenticated, staleTime: 10_000 });
  if (loading || (isAuthenticated && orders.isLoading)) return <ScreenContainer><View style={styles.loading}><ActivityIndicator color={colors.primary} /></View></ScreenContainer>;
  if (!isAuthenticated) return <ScreenContainer><WinkkitEmptyState title="Sign in to see your orders" message="Your order history and live delivery updates are protected by your Winkkit account." /></ScreenContainer>;
  return <ScreenContainer className="p-5"><Text style={[styles.title, { color: colors.foreground }]}>Your orders</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Track every order from placement to completion.</Text><FlatList data={orders.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<WinkkitEmptyState title="No orders yet" message="Your completed and active orders will appear here." />} renderItem={({ item }) => <WinkkitCard style={styles.card}><View style={styles.row}><View><Text style={[styles.number, { color: colors.foreground }]}>{item.orderNumber}</Text><Text style={[styles.date, { color: colors.muted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text></View><WinkkitBadge label={item.status.replaceAll("_", " ")} tone={item.status === "completed" ? "success" : "aqua"} /></View><View style={[styles.totalRow, { borderTopColor: colors.border }]}><Text style={[styles.label, { color: colors.muted }]}>Total</Text><Text style={[styles.total, { color: colors.foreground }]}>₹{(item.totalCents / 100).toFixed(2)}</Text></View></WinkkitCard>} /></ScreenContainer>;
}

const styles: any = StyleSheet.create({ title: { fontSize: 28, fontWeight: "800" }, subtitle: { fontSize: 14, marginTop: 6 }, list: { paddingTop: 22, paddingBottom: 32, gap: 12 }, card: { gap: 16 }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }, number: { fontSize: 15, fontWeight: "800" }, date: { fontSize: 12, marginTop: 5 }, totalRow: { borderTopWidth: 1, paddingTop: 13, flexDirection: "row", justifyContent: "space-between" }, label: { fontSize: 13 }, total: { fontSize: 15, fontWeight: "800" }, loading: { paddingVertical: 60, alignItems: "center" } });
