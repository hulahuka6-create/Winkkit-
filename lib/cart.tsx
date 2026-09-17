import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export type CartProduct = {
  id: number;
  shopId: number;
  shopName: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
};

type CartLine = CartProduct & { quantity: number };
type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  syncing: boolean;
  add: (product: CartProduct) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "winkkit.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

type CloudCartItem = { productId: number; shopId: number; quantity: number };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const lastSynced = useRef("");
  const cloudCart = trpc.account.cloudCart.useQuery(undefined, { enabled: isAuthenticated });
  const saveCloudCart = trpc.account.saveCloudCart.useMutation();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) { try { setLines(JSON.parse(value) as CartLine[]); } catch { setLines([]); } }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || cloudLoaded || !cloudCart.data) return;
    setLines((current) => {
      const localById = new Map(current.map((line) => [line.id, line]));
      for (const remote of cloudCart.data) {
        const local = localById.get(remote.productId);
        if (local) localById.set(remote.productId, { ...local, quantity: Math.max(local.quantity, remote.quantity) });
      }
      return [...localById.values()];
    });
    setCloudLoaded(true);
  }, [cloudCart.data, cloudLoaded, hydrated, isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [hydrated, lines]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !cloudLoaded) return;
    const payload: CloudCartItem[] = lines.map((line) => ({ productId: line.id, shopId: line.shopId, quantity: line.quantity }));
    const signature = JSON.stringify(payload);
    if (signature === lastSynced.current) return;
    const timer = setTimeout(async () => {
      setSyncing(true);
      try { await saveCloudCart.mutateAsync({ items: payload }); lastSynced.current = signature; } catch { /* local cart remains available offline */ } finally { setSyncing(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [cloudLoaded, hydrated, isAuthenticated, lines, saveCloudCart]);

  useEffect(() => {
    if (!isAuthenticated) { setCloudLoaded(false); lastSynced.current = ""; }
  }, [isAuthenticated]);

  const add = useCallback((product: CartProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) return current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { ...product, quantity: 1 }];
    });
  }, []);
  const decrement = useCallback((productId: number) => setLines((current) => current.flatMap((line) => line.id !== productId ? [line] : line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : [])), []);
  const remove = useCallback((productId: number) => setLines((current) => current.filter((line) => line.id !== productId)), []);
  const clear = useCallback(() => setLines([]), []);
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotalCents = useMemo(() => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0), [lines]);

  return <CartContext.Provider value={{ lines, itemCount, subtotalCents, syncing, add, decrement, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
