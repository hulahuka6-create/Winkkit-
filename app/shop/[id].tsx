import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitButton, WinkkitCard, WinkkitEmptyState } from "@/components/winkkit";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart";
import { trpc } from "@/lib/trpc";

export default function ShopScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
  const products = trpc.shops.products.useQuery({ shopId }, { enabled: Number.isFinite(shopId) });
  const { add, itemCount } = useCart();
  return <ScreenContainer>
    <FlatList data={products.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<View><Pressable style={styles.back} onPress={() => router.back()}><IconSymbol name="chevron.left" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Back</Text></Pressable><View style={[styles.hero, { backgroundColor: `${colors.primary}10` }]}><View style={[styles.mark, { backgroundColor: colors.primary }]}><Text style={styles.markText}>W</Text></View><Text style={[styles.title, { color: colors.foreground }]}>Shop catalogue</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Products and prices are loaded from the approved shop catalogue.</Text></View><View style={styles.sectionRow}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available products</Text>{itemCount > 0 ? <Pressable onPress={() => router.push("/cart")}><Text style={[styles.cartLink, { color: colors.primary }]}>{itemCount} in cart</Text></Pressable> : null}</View></View>} ListEmptyComponent={products.isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <WinkkitEmptyState title="No products listed yet" message="This shop has not published available products. Check back soon." />} renderItem={({ item }) => <WinkkitCard style={styles.product}><View style={[styles.productMark, { backgroundColor: `${colors.aqua}18` }]}><IconSymbol name="storefront" size={21} color={colors.aqua} /></View><View style={styles.productInfo}><Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text><Text style={[styles.productDescription, { color: colors.muted }]} numberOfLines={2}>{item.description || "Product details provided by the shop."}</Text><Text style={[styles.price, { color: colors.foreground }]}>₹{(item.priceCents / 100).toFixed(2)}</Text></View><WinkkitButton label="Add" onPress={() => add({ id: item.id, shopId: item.shopId, shopName: "Winkkit shop", name: item.name, description: item.description, priceCents: item.priceCents, imageUrl: item.imageUrl })} /></WinkkitCard>} />
  </ScreenContainer>;
}

const styles: any = StyleSheet.create({ content: { padding: 20, paddingBottom: 34 }, back: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 18 }, backText: { fontSize: 14, fontWeight: "700" }, hero: { borderRadius: 22, padding: 20, marginBottom: 26 }, mark: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 18 }, markText: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" }, title: { fontSize: 24, fontWeight: "800", marginBottom: 7 }, subtitle: { fontSize: 14, lineHeight: 21 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, sectionTitle: { fontSize: 19, fontWeight: "800" }, cartLink: { fontSize: 13, fontWeight: "800" }, product: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 11 }, productMark: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, productInfo: { flex: 1, minWidth: 0 }, productName: { fontSize: 15, fontWeight: "800", marginBottom: 4 }, productDescription: { fontSize: 12, lineHeight: 17, marginBottom: 7 }, price: { fontSize: 15, fontWeight: "800" }, loading: { paddingVertical: 42, alignItems: "center" } });
