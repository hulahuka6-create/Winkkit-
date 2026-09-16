import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitCard, WinkkitEmptyState } from "@/components/winkkit";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState(params.category ?? "");
  const shops = trpc.shops.list.useQuery(query ? { search: query } : undefined, { staleTime: 15_000 });
  return <ScreenContainer className="p-5"><View style={styles.header}><Text style={[styles.title, { color: colors.foreground }]}>Search</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Find trusted local shops and products.</Text></View><View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="magnifyingglass" size={20} color={colors.muted} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search shops" placeholderTextColor={colors.muted} returnKeyType="search" style={[styles.input, { color: colors.foreground }]} /></View>{shops.isLoading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View> : <FlatList data={shops.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<WinkkitEmptyState title="No matching shops yet" message="Try another search or check back as new Winkkit partners are approved." />} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: "/shop/[id]", params: { id: String(item.id) } })} style={({ pressed }) => [pressed && { opacity: 0.8 }]}><WinkkitCard style={styles.card}><View style={[styles.mark, { backgroundColor: `${colors.primary}12` }]}><Text style={[styles.markText, { color: colors.primary }]}>{item.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.info}><Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>{item.description || item.address}</Text></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></WinkkitCard></Pressable>} />}</ScreenContainer>;
}

const styles: any = StyleSheet.create({ header: { marginBottom: 20 }, title: { fontSize: 28, fontWeight: "800" }, subtitle: { fontSize: 14, marginTop: 6 }, inputWrap: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9 }, input: { flex: 1, fontSize: 15 }, list: { paddingTop: 18, paddingBottom: 32, gap: 11 }, card: { flexDirection: "row", alignItems: "center", gap: 12 }, mark: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" }, markText: { fontSize: 20, fontWeight: "800" }, info: { flex: 1, minWidth: 0 }, name: { fontSize: 16, fontWeight: "800", marginBottom: 5 }, description: { fontSize: 13, lineHeight: 18 }, loading: { paddingVertical: 42, alignItems: "center" } });
