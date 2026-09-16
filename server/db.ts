import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, orderItems, orders, products, shops, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listShops(search?: string) {
  const db = await getDb(); if (!db) return [];
  const conditions = search?.trim() ? and(eq(shops.isApproved, true), or(like(shops.name, `%${search.trim()}%`), like(shops.description, `%${search.trim()}%`))) : eq(shops.isApproved, true);
  return db.select().from(shops).where(conditions).orderBy(desc(shops.updatedAt));
}

export async function listProducts(shopId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(products).where(and(eq(products.shopId, shopId), eq(products.isAvailable, true))).orderBy(products.name);
}

export async function listOrders(customerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
}

export async function listOperationalOrders(userId: number, role: "shopkeeper" | "delivery" | "admin") {
  const db = await getDb(); if (!db) return [];
  if (role === "admin") return db.select().from(orders).orderBy(desc(orders.createdAt));
  if (role === "delivery") return db.select().from(orders).where(or(eq(orders.deliveryPartnerId, userId), eq(orders.status, "ready"))).orderBy(desc(orders.createdAt));
  const ownedShops = await db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, userId));
  if (!ownedShops.length) return [];
  return db.select().from(orders).where(inArray(orders.shopId, ownedShops.map((shop) => shop.id))).orderBy(desc(orders.createdAt));
}

export async function transitionOrder(orderId: number, status: "accepted" | "preparing" | "ready" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "completed" | "cancelled", userId: number, role: "shopkeeper" | "delivery" | "admin") {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const visible = await listOperationalOrders(userId, role);
  if (!visible.some((item) => item.id === orderId)) throw new Error("Order is not available to this operator");
  const update: Partial<typeof orders.$inferInsert> = { status, updatedAt: new Date() };
  if (role === "delivery" && status === "assigned") update.deliveryPartnerId = userId;
  await db.update(orders).set(update).where(eq(orders.id, orderId));
  return { success: true, orderId, status } as const;
}

export async function createOrder(input: { customerId: number; shopId: number; addressId?: number; notes?: string; items: { productId: number; quantity: number }[] }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  if (!input.items.length) throw new Error("Order must contain at least one item");
  const result = await db.transaction(async (tx) => {
    const selected = await tx.select().from(products).where(and(eq(products.shopId, input.shopId), eq(products.isAvailable, true)));
    const byId = new Map(selected.map((product) => [product.id, product]));
    const lines = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product || product.inventoryCount < item.quantity) throw new Error("One or more products are unavailable");
      return { productId: product.id, productName: product.name, unitPriceCents: product.priceCents, quantity: item.quantity, lineTotalCents: product.priceCents * item.quantity };
    });
    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const orderNumber = `WK-${Date.now().toString(36).toUpperCase()}`;
    const commissionCents = Math.round(subtotalCents * 0.1);
    const deliveryFeeCents = 0;
    const platformFeeCents = 0;
    const totalCents = subtotalCents + deliveryFeeCents + platformFeeCents;
    const inserted = await tx.insert(orders).values({ orderNumber, customerId: input.customerId, shopId: input.shopId, addressId: input.addressId, status: "placed", paymentStatus: "pending", subtotalCents, deliveryFeeCents, platformFeeCents, commissionCents, deliveryEarningsCents: deliveryFeeCents, totalCents, notes: input.notes });
    const orderId = Number((inserted as { insertId?: number }).insertId);
    await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId })));
    for (const line of lines) await tx.update(products).set({ inventoryCount: selected.find((product) => product.id === line.productId)!.inventoryCount - line.quantity }).where(eq(products.id, line.productId));
    return { orderId, orderNumber, totalCents };
  });
  return result;
}
