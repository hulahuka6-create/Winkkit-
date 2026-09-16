import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
  add: (product: CartProduct) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "winkkit.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try { setLines(JSON.parse(value) as CartLine[]); } catch { setLines([]); }
    });
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }, [lines]);

  const add = useCallback((product: CartProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) return current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { ...product, quantity: 1 }];
    });
  }, []);

  const decrement = useCallback((productId: number) => {
    setLines((current) => current.flatMap((line) => line.id !== productId ? [line] : line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : []));
  }, []);

  const remove = useCallback((productId: number) => setLines((current) => current.filter((line) => line.id !== productId)), []);
  const clear = useCallback(() => setLines([]), []);
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotalCents = useMemo(() => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0), [lines]);

  return <CartContext.Provider value={{ lines, itemCount, subtotalCents, add, decrement, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
