import { and, desc, eq, gte, inArray, isNull, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, categories, orderItems, orders, platformSettings, products, shops, users } from "../drizzle/schema";
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

export async function requestRole(openId: string, role: "user" | "shopkeeper" | "delivery") {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(users).set({ role, status: role === "user" ? "active" : "pending", updatedAt: new Date() }).where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

export async function listPendingAccounts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, createdAt: users.createdAt }).from(users).where(eq(users.status, "pending")).orderBy(desc(users.createdAt));
}

export async function setAccountStatus(userId: number, status: "active" | "suspended" | "pending") {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
  return (await db.select({ id: users.id, role: users.role, status: users.status }).from(users).where(eq(users.id, userId)).limit(1))[0];
}

export async function listPendingShops() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(shops).where(eq(shops.isApproved, false)).orderBy(desc(shops.createdAt));
}

export async function setShopApproval(shopId: number, isApproved: boolean) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(shops).set({ isApproved, updatedAt: new Date() }).where(eq(shops.id, shopId));
  return (await db.select().from(shops).where(eq(shops.id, shopId)).limit(1))[0];
}

export async function listCategories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name);
}

export async function getOwnedShop(ownerId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(shops).where(eq(shops.ownerId, ownerId)).orderBy(desc(shops.updatedAt)).limit(1);
  return rows[0];
}

export async function createShop(ownerId: number, input: { name: string; address: string; description?: string; categoryId?: number; openingTime?: string; closingTime?: string; deliveryRadiusKm?: number; minimumOrderCents?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  if (!input.name.trim() || !input.address.trim()) throw new Error("Shop name and address are required");
  const existing = await getOwnedShop(ownerId); if (existing) return existing;
  const inserted = await db.insert(shops).values({ ownerId, name: input.name.trim(), address: input.address.trim(), description: input.description?.trim(), categoryId: input.categoryId, openingTime: input.openingTime, closingTime: input.closingTime, deliveryRadiusKm: input.deliveryRadiusKm ?? 5, minimumOrderCents: input.minimumOrderCents ?? 0, isApproved: false, isOpen: false });
  return (await db.select().from(shops).where(eq(shops.id, Number((inserted as { insertId?: number }).insertId))).limit(1))[0];
}

export async function updateShopStatus(ownerId: number, input: { isOpen?: boolean; isTemporarilyUnavailable?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const shop = await getOwnedShop(ownerId); if (!shop) throw new Error("Shop not found");
  await db.update(shops).set({ ...input, updatedAt: new Date() }).where(and(eq(shops.id, shop.id), eq(shops.ownerId, ownerId)));
  return (await db.select().from(shops).where(eq(shops.id, shop.id)).limit(1))[0];
}

export async function listShops(search?: string) {
  const db = await getDb(); if (!db) return [];
  const conditions = search?.trim() ? and(eq(shops.isApproved, true), or(like(shops.name, `%${search.trim()}%`), like(shops.description, `%${search.trim()}%`))) : eq(shops.isApproved, true);
  return db.select().from(shops).where(conditions).orderBy(desc(shops.updatedAt));
}

export async function getShopById(shopId: number) {
  const db = await getDb(); if (!db) return undefined;
  return (await db.select().from(shops).where(and(eq(shops.id, shopId), eq(shops.isApproved, true))).limit(1))[0];
}

export async function listProducts(shopId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(products).where(and(eq(products.shopId, shopId), eq(products.isActive, true))).orderBy(products.name);
}

export async function listOwnedProducts(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  const shop = await getOwnedShop(ownerId); if (!shop) return [];
  return db.select().from(products).where(eq(products.shopId, shop.id)).orderBy(desc(products.updatedAt));
}

export async function createProduct(ownerId: number, input: { name: string; description?: string; categoryId?: number; priceCents: number; originalPriceCents?: number; unit: string; stock: number; sku?: string; imageUrl?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const shop = await getOwnedShop(ownerId); if (!shop) throw new Error("Create your shop before adding products");
  if (!input.name.trim() || input.priceCents < 0 || input.stock < 0) throw new Error("Product name, price, and stock are required");
  if (input.originalPriceCents !== undefined && input.originalPriceCents < input.priceCents) throw new Error("Original price cannot be lower than sale price");
  const inserted = await db.insert(products).values({ shopId: shop.id, categoryId: input.categoryId, name: input.name.trim(), description: input.description?.trim(), priceCents: input.priceCents, originalPriceCents: input.originalPriceCents, unit: input.unit, inventoryCount: input.stock, sku: input.sku?.trim(), imageUrl: input.imageUrl, isAvailable: input.stock > 0, isActive: true });
  return (await db.select().from(products).where(eq(products.id, Number((inserted as { insertId?: number }).insertId))).limit(1))[0];
}

export async function updateOwnedProduct(ownerId: number, productId: number, input: Partial<{ name: string; description: string; categoryId: number; priceCents: number; originalPriceCents: number; unit: string; sku: string; imageUrl: string; isAvailable: boolean; isActive: boolean }>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const shop = await getOwnedShop(ownerId); if (!shop) throw new Error("Shop not found");
  const current = await db.select().from(products).where(and(eq(products.id, productId), eq(products.shopId, shop.id))).limit(1);
  if (!current[0]) throw new Error("Product not found");
  if (input.priceCents !== undefined && input.priceCents < 0) throw new Error("Price cannot be negative");
  await db.update(products).set({ ...input, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.shopId, shop.id)));
  return (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
}

export async function updateProductStock(ownerId: number, productId: number, stock: number) {
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a non-negative whole number");
  const shop = await getOwnedShop(ownerId); if (!shop) throw new Error("Shop not found");
  const db = await getDb(); if (!db) throw new Error("Database not available");
  await db.update(products).set({ inventoryCount: stock, isAvailable: stock > 0, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.shopId, shop.id)));
  return (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
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
  const current = visible.find((item) => item.id === orderId);
  if (!current) throw new Error("Order is not available to this operator");
  const allowed: Record<string, string[]> = { placed: ["accepted", "cancelled"], accepted: ["preparing", "cancelled"], preparing: ["ready", "cancelled"], ready: ["assigned", "cancelled"], assigned: ["picked_up"], picked_up: ["out_for_delivery"], out_for_delivery: ["delivered"], delivered: ["completed"] };
  if (role !== "admin" && !allowed[current.status]?.includes(status)) throw new Error("This order cannot move to that status yet");
  const update: Partial<typeof orders.$inferInsert> = { status, updatedAt: new Date() };
  if (role === "delivery" && status === "assigned") {
    update.deliveryPartnerId = userId;
    const claimed = await db.update(orders).set(update).where(and(eq(orders.id, orderId), eq(orders.status, "ready"), isNull(orders.deliveryPartnerId)));
    if (!(claimed as { affectedRows?: number }).affectedRows) throw new Error("Delivery request was already claimed");
  } else {
    await db.update(orders).set(update).where(eq(orders.id, orderId));
  }
  return { success: true, orderId, status } as const;
}

export async function createOrder(input: { customerId: number; shopId: number; addressId?: number; deliveryAddress: string; clientRequestId: string; notes?: string; items: { productId: number; quantity: number }[] }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  if (!input.items.length) throw new Error("Order must contain at least one item");
  const result = await db.transaction(async (tx) => {
    const existing = (await tx.select({ orderId: orders.id, orderNumber: orders.orderNumber, totalCents: orders.totalCents }).from(orders).where(and(eq(orders.customerId, input.customerId), eq(orders.clientRequestId, input.clientRequestId))).limit(1))[0];
    if (existing) return existing;
    const shop = (await tx.select().from(shops).where(and(eq(shops.id, input.shopId), eq(shops.isApproved, true))).limit(1))[0];
    if (!shop || !shop.isOpen || shop.isTemporarilyUnavailable) throw new Error("This shop is currently closed");
    const settings = (await tx.select().from(platformSettings).limit(1))[0];
    const selected = await tx.select().from(products).where(and(eq(products.shopId, input.shopId), eq(products.isActive, true), eq(products.isAvailable, true)));
    const byId = new Map(selected.map((product) => [product.id, product]));
    const lines = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product || product.inventoryCount < item.quantity) throw new Error("One or more products are unavailable");
      return { productId: product.id, productName: product.name, unit: product.unit, unitPriceCents: product.priceCents, quantity: item.quantity, lineTotalCents: product.priceCents * item.quantity };
    });
    if (lines.reduce((sum, line) => sum + line.lineTotalCents, 0) < shop.minimumOrderCents) throw new Error("This order is below the shop minimum");
    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const orderNumber = `WK-${Date.now().toString(36).toUpperCase()}`;
    const commissionCents = Math.round(subtotalCents * (settings?.commissionBps ?? 1000) / 10000);
    const deliveryFeeCents = shop.deliveryFeeCents || settings?.defaultDeliveryFeeCents || 0;
    const platformFeeCents = settings?.platformFeeCents || 0;
    const totalCents = subtotalCents + deliveryFeeCents + platformFeeCents;
    const inserted = await tx.insert(orders).values({ orderNumber, customerId: input.customerId, shopId: input.shopId, addressId: input.addressId, deliveryAddress: input.deliveryAddress.trim(), clientRequestId: input.clientRequestId, status: "placed", paymentStatus: "pending", subtotalCents, deliveryFeeCents, platformFeeCents, commissionCents, deliveryEarningsCents: deliveryFeeCents, totalCents, notes: input.notes });
    const orderId = Number((inserted as { insertId?: number }).insertId);
    await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId })));
    for (const line of lines) {
      const current = selected.find((product) => product.id === line.productId)!;
      const nextStock = current.inventoryCount - line.quantity;
      const changed = await tx.update(products).set({ inventoryCount: nextStock, isAvailable: nextStock > 0 }).where(and(eq(products.id, line.productId), gte(products.inventoryCount, line.quantity), eq(products.isActive, true), eq(products.isAvailable, true)));
      if (!(changed as { affectedRows?: number }).affectedRows) throw new Error("Inventory changed. Please review your cart and try again.");
    }
    return { orderId, orderNumber, totalCents };
  });
  return result;
}
