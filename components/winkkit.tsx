import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";
import { useColors } from "@/hooks/use-colors";

export function WinkkitButton({ label, variant = "primary", ...props }: PressableProps & { label: string; variant?: "primary" | "secondary" | "ghost" }) {
  const colors = useColors();
  return <Pressable {...props} style={({ pressed }) => [styles.button, { backgroundColor: variant === "primary" ? colors.primary : variant === "secondary" ? colors.surface : "transparent", borderColor: variant === "secondary" ? colors.border : "transparent", opacity: pressed ? 0.82 : 1 }]}>
    <Text style={[styles.buttonLabel, { color: variant === "primary" ? "#FFFFFF" : colors.primary }]}>{label}</Text>
  </Pressable>;
}

export function WinkkitCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

export function WinkkitBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "aqua" }) {
  const colors = useColors();
  const color = tone === "success" ? colors.success : tone === "warning" ? colors.warning : tone === "aqua" ? colors.aqua : colors.muted;
  return <View style={[styles.badge, { backgroundColor: `${color}18` }]}><Text style={[styles.badgeLabel, { color }]}>{label}</Text></View>;
}

export function WinkkitEmptyState({ title, message, action, onAction }: { title: string; message: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyMark, { backgroundColor: `${colors.primary}12` }]}><Text style={[styles.emptyMarkText, { color: colors.primary }]}>W</Text></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyMessage, { color: colors.muted }]}>{message}</Text>{action && onAction ? <WinkkitButton label={action} onPress={onAction} /> : null}</View>;
}

export const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  buttonLabel: { fontSize: 15, fontWeight: "700" },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, shadowColor: "#111A3A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeLabel: { fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", paddingHorizontal: 28, paddingVertical: 44 },
  emptyMark: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyMarkText: { fontSize: 28, fontWeight: "800" },
  emptyTitle: { fontSize: 19, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  emptyMessage: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20 },
});
