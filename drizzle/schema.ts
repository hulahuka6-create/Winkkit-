import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "shopkeeper", "delivery", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "pending", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 40 }).notNull(),
  line1: varchar("line1", { length: 255 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }),
  latitude: varchar("latitude", { length: 32 }),
  longitude: varchar("longitude", { length: 32 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  shopId: int("shopId").notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProductUnique: uniqueIndex("cartItems_user_product_unique").on(table.userId, table.productId),
}));

export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  orderUpdates: boolean("orderUpdates").default(true).notNull(),
  promotionalNotifications: boolean("promotionalNotifications").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  kind: varchar("kind", { length: 40 }).default("general").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  icon: varchar("icon", { length: 60 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const shops = mysqlTable("shops", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  address: varchar("address", { length: 255 }).notNull(),
  isOpen: boolean("isOpen").default(false).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  deliveryFeeCents: int("deliveryFeeCents").default(0).notNull(),
  estimatedMinutes: int("estimatedMinutes").default(45).notNull(),
  isTemporarilyUnavailable: boolean("isTemporarilyUnavailable").default(false).notNull(),
  openingTime: varchar("openingTime", { length: 5 }),
  closingTime: varchar("closingTime", { length: 5 }),
  deliveryRadiusKm: int("deliveryRadiusKm").default(5).notNull(),
  minimumOrderCents: int("minimumOrderCents").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  shopId: int("shopId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  priceCents: int("priceCents").notNull(),
  originalPriceCents: int("originalPriceCents"),
  unit: varchar("unit", { length: 24 }).default("piece").notNull(),
  sku: varchar("sku", { length: 80 }),
  inventoryCount: int("inventoryCount").default(0).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  shopId: int("shopId").notNull(),
  deliveryPartnerId: int("deliveryPartnerId"),
  addressId: int("addressId"),
  deliveryAddress: text("deliveryAddress"),
  clientRequestId: varchar("clientRequestId", { length: 80 }).unique(),
  status: mysqlEnum("status", ["pending_payment", "placed", "accepted", "preparing", "ready", "assigned", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled", "refunded"]).default("pending_payment").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  subtotalCents: int("subtotalCents").notNull(),
  deliveryFeeCents: int("deliveryFeeCents").default(0).notNull(),
  platformFeeCents: int("platformFeeCents").default(0).notNull(),
  commissionCents: int("commissionCents").default(0).notNull(),
  deliveryEarningsCents: int("deliveryEarningsCents").default(0).notNull(),
  totalCents: int("totalCents").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  unit: varchar("unit", { length: 24 }).default("piece").notNull(),
  quantity: int("quantity").notNull(),
  lineTotalCents: int("lineTotalCents").notNull(),
});

export const settlementEntries = mysqlTable("settlementEntries", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  shopId: int("shopId").notNull(),
  deliveryPartnerId: int("deliveryPartnerId"),
  shopAmountCents: int("shopAmountCents").notNull(),
  deliveryAmountCents: int("deliveryAmountCents").notNull(),
  commissionCents: int("commissionCents").notNull(),
  status: mysqlEnum("status", ["pending", "ready", "paid"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  commissionBps: int("commissionBps").default(1000).notNull(),
  platformFeeCents: int("platformFeeCents").default(0).notNull(),
  defaultDeliveryFeeCents: int("defaultDeliveryFeeCents").default(0).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
