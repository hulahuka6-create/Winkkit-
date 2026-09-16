import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitBadge, WinkkitCard, WinkkitEmptyState } from "@/components/winkkit";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const nextStatuses = {
  shopkeeper: { placed: "accepted", accepted: "preparing", preparing: "ready" },
  delivery: { ready: "assigned", assigned: "picked_up", picked_up: "out_for_delivery", out_for_delivery: "delivered" },
  admin: { placed: "accepted", accepted: "preparing", preparing: "ready", ready: "assigned", assigned: "picked_up", picked_up: "out_for_delivery", out_for_delivery: "delivered", delivered: "completed" },
} as const;

export default function OperationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const profile = trpc.account.profile.useQuery(undefined, { enabled: isAuthenticated });
  const role = profile.data?.role;
  const queue = trpc.operations.queue.useQuery(undefined, { enabled: role === "shopkeeper" || role === "delivery" || role === "admin", refetchInterval: 10_000 });
  const summary = trpc.operations.adminSummary.useQuery(undefined, { enabled: role === "admin", refetchInterval: 10_000 });
  const transition = trpc.operations.transition.useMutation({ onSuccess: () => { queue.refetch(); summary.refetch(); } });

  if (!isAuthenticated || profile.isLoading) return <ScreenContainer><View style={styles.loading}><ActivityIndicator color={colors.primary} /></View></ScreenContainer>;
  if (!role || role === "user") return <ScreenContainer><WinkkitEmptyState title="Operator access required" message="This workspace is only available to approved shopkeepers, delivery partners, and Winkkit administrators." /></ScreenContainer>;
  const title = role === "shopkeeper" ? "Shop operations" : role === "delivery" ? "Delivery operations" : "Winkkit control";
  return <ScreenContainer className="p-5"><View style={styles.header}><View><Text style={[styles.title, { color: colors.foreground }]}>{title}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Protected workspace · updates refresh automatically</Text></View><Pressable onPress={() => router.back()}><IconSymbol name="close" size={21} color={colors.muted} /></Pressable></View>{role === "admin" && summary.data ? <View style={styles.metrics}><Metric label="Orders" value={String(summary.data.orders)} /><Metric label="Active" value={String(summary.data.active)} /><Metric label="Gross" value={`₹${(summary.data.grossCents / 100).toFixed(0)}`} /><Metric label="Commission" value={`₹${(summary.data.commissionCents / 100).toFixed(0)}`} /></View> : null}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>{role === "delivery" ? "Available deliveries" : "Order queue"}</Text><FlatList data={queue.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={queue.isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <WinkkitEmptyState title="Queue is clear" message="New orders will appear here when the backend assigns work to your role." />} renderItem={({ item }) => { const next = (nextStatuses[role] as Record<string, string | undefined>)[item.status]; return <WinkkitCard style={styles.card}><View style={styles.row}><View><Text style={[styles.order, { color: colors.foreground }]}>{item.orderNumber}</Text><Text style={[styles.date, { color: colors.muted }]}>{new Date(item.createdAt).toLocaleString()}</Text></View><WinkkitBadge label={item.status.replaceAll("_", " ")} tone="aqua" /></View><View style={styles.bottom}><Text style={[styles.total, { color: colors.foreground }]}>₹{(item.totalCents / 100).toFixed(2)}</Text>{next ? <Pressable disabled={transition.isPending} onPress={() => transition.mutate({ orderId: item.id, status: next as "accepted" | "preparing" | "ready" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "completed" | "cancelled" })} style={[styles.action, { backgroundColor: colors.primary }]}><Text style={styles.actionText}>{next.replaceAll("_", " ")}</Text><IconSymbol name="arrow.right" size={15} color="#FFFFFF" /></Pressable> : <WinkkitBadge label="Complete" tone="success" />}</View></WinkkitCard>; }} /></ScreenContainer>;
}

function Metric({ label, value }: { label: string; value: string }) { const colors = useColors(); return <WinkkitCard style={styles.metric}><Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text></WinkkitCard>; }

const styles: any = StyleSheet.create({ loading: { paddingVertical: 60, alignItems: "center" }, header: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 24 }, title: { fontSize: 26, fontWeight: "800" }, subtitle: { fontSize: 12, marginTop: 5 }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }, metric: { width: "47%", padding: 13 }, metricValue: { fontSize: 21, fontWeight: "800" }, metricLabel: { fontSize: 12, marginTop: 4 }, sectionTitle: { fontSize: 19, fontWeight: "800", marginBottom: 12 }, list: { paddingBottom: 32, gap: 12 }, card: { gap: 16 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, order: { fontSize: 15, fontWeight: "800" }, date: { fontSize: 11, marginTop: 4 }, bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, total: { fontSize: 16, fontWeight: "800" }, action: { borderRadius: 11, minHeight: 38, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 }, actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", textTransform: "capitalize" } });
