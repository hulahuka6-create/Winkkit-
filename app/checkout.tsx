import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { WinkkitButton, WinkkitCard } from "@/components/winkkit";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/cart";
import { trpc } from "@/lib/trpc";

export default function CheckoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { lines, subtotalCents, clear } = useCart();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [addressLabel, setAddressLabel] = useState("Home");
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [clientRequestId] = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const savedAddresses = trpc.account.addresses.useQuery(undefined, { enabled: isAuthenticated });
  const saveAddressMutation = trpc.account.saveAddress.useMutation();
  const createOrder = trpc.orders.create.useMutation({ onSuccess: () => { clear(); router.replace("/order-success"); } });
  const disabled = !lines.length || !isAuthenticated || !address.trim() || createOrder.isPending;

  const placeOrder = async () => {
    if (!lines.length || !isAuthenticated) return;
    setError("");
    try {
      let addressId: number | undefined;
      if (saveAddress && city.trim()) {
        const saved = await saveAddressMutation.mutateAsync({ label: addressLabel.trim() || "Home", line1: address.trim(), city: city.trim(), isDefault: true });
        addressId = saved?.id;
      }
      await createOrder.mutateAsync({ shopId: lines[0].shopId, addressId, deliveryAddress: address.trim(), clientRequestId, notes: notes.trim() || undefined, items: lines.map((line) => ({ productId: line.id, quantity: line.quantity })) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not place your order. Please try again.");
    }
  };

  return <ScreenContainer className="p-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Pressable style={styles.back} onPress={() => router.back()}><IconSymbol name="chevron.left" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Back to cart</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Confirm delivery details before placing your order.</Text>{!isAuthenticated ? <WinkkitCard style={styles.notice}><IconSymbol name="shield" size={20} color={colors.warning} /><Text style={[styles.noticeText, { color: colors.foreground }]}>Sign in from Account before placing an order. Your checkout is never submitted without an authenticated customer.</Text></WinkkitCard> : null}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved addresses</Text>{savedAddresses.data?.map((saved) => <Pressable key={saved.id} onPress={() => { setAddress(saved.line1); setCity(saved.city); setAddressLabel(saved.label); }} style={[styles.savedAddress, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.savedLabel, { color: colors.foreground }]}>{saved.label}</Text><Text style={[styles.savedText, { color: colors.muted }]}>{saved.line1}, {saved.city}</Text></Pressable>)}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery address</Text><TextInput value={address} onChangeText={setAddress} placeholder="House number, street, area" placeholderTextColor={colors.muted} multiline style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><View style={styles.saveRow}><View style={styles.saveCopy}><Text style={[styles.saveTitle, { color: colors.foreground }]}>Save address online</Text><Text style={[styles.saveHint, { color: colors.muted }]}>Reuse it on your next device</Text></View><Switch value={saveAddress} onValueChange={setSaveAddress} trackColor={{ false: colors.border, true: colors.primary }} /></View>{saveAddress ? <TextInput value={addressLabel} onChangeText={setAddressLabel} placeholder="Address label, e.g. Home" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /> : null}<Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order notes <Text style={[styles.optional, { color: colors.muted }]}>(optional)</Text></Text><TextInput value={notes} onChangeText={setNotes} placeholder="Any delivery instructions" placeholderTextColor={colors.muted} multiline style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><WinkkitCard style={styles.summary}><View style={styles.row}><Text style={[styles.label, { color: colors.muted }]}>Items</Text><Text style={[styles.value, { color: colors.foreground }]}>₹{(subtotalCents / 100).toFixed(2)}</Text></View><View style={styles.row}><Text style={[styles.label, { color: colors.muted }]}>Delivery fee</Text><Text style={[styles.value, { color: colors.muted }]}>Confirmed by shop at checkout</Text></View><View style={[styles.row, styles.totalRow, { borderTopColor: colors.border }]}><Text style={[styles.totalLabel, { color: colors.foreground }]}>Estimated total</Text><Text style={[styles.total, { color: colors.foreground }]}>₹{(subtotalCents / 100).toFixed(2)}</Text></View><Text style={[styles.paymentNote, { color: colors.muted }]}>Payment status is recorded by the backend. A live payment gateway key is required before accepting real money in production.</Text></WinkkitCard>{error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}<WinkkitButton label={createOrder.isPending ? "Placing order…" : "Place order"} disabled={disabled} onPress={placeOrder} /></ScrollView></ScreenContainer>;
}

const styles: any = StyleSheet.create({ content: { paddingBottom: 36 }, back: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 18 }, backText: { fontSize: 14, fontWeight: "700" }, title: { fontSize: 28, fontWeight: "800" }, subtitle: { fontSize: 14, marginTop: 6, marginBottom: 24 }, notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 24 }, noticeText: { flex: 1, fontSize: 13, lineHeight: 19 }, sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 9, marginTop: 4 }, optional: { fontSize: 12, fontWeight: "500" }, savedAddress: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 9 }, savedLabel: { fontSize: 13, fontWeight: "800" }, savedText: { fontSize: 12, marginTop: 3 }, textArea: { minHeight: 56, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, marginBottom: 12, textAlignVertical: "top" }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 }, saveRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, saveCopy: { flex: 1 }, saveTitle: { fontSize: 14, fontWeight: "800" }, saveHint: { fontSize: 12, marginTop: 3 }, summary: { marginTop: 8, gap: 14, marginBottom: 18 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, label: { fontSize: 13, flex: 1 }, value: { fontSize: 13, fontWeight: "700", textAlign: "right", flexShrink: 1 }, totalRow: { borderTopWidth: 1, paddingTop: 14, marginTop: 2 }, totalLabel: { fontSize: 15, fontWeight: "800" }, total: { fontSize: 18, fontWeight: "800" }, paymentNote: { fontSize: 12, lineHeight: 17 }, error: { fontSize: 13, lineHeight: 18, marginBottom: 12 } });
