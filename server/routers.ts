import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createOrder, createProduct, createShop, deactivatePushToken, deletePrivateUserData, exportUserData, getOwnedShop, getShopById, getUserByOpenId, getUserSettings, listCategories, listOperationalOrders, listOrders, listOwnedProducts, listPendingAccounts, listPendingShops, listProducts, listShops, listUserAddresses, listUserCart, listUserNotifications, markUserNotificationsRead, registerPushToken, replaceUserCart, requestRole, saveUserAddress, setAccountStatus, setShopApproval, transitionOrder, updateOwnedProduct, updateProductStock, updateShopStatus, updateUserSettings } from "./db";
import { systemRouter } from "./_core/systemRouter";

const productInput = z.object({
  name: z.string().trim().min(1).max(180),
  description: z.string().max(2000).optional(),
  categoryId: z.number().int().positive(),
  priceCents: z.number().int().min(0),
  originalPriceCents: z.number().int().min(0).optional(),
  unit: z.string().trim().min(1).max(24).default("piece"),
  stock: z.number().int().min(0),
  sku: z.string().max(80).optional(),
  imageUrl: z.string().url().optional(),
});

function requireActiveRole(ctx: { user: NonNullable<Parameters<typeof getUserByOpenId>[0] extends never ? never : any> }, roles: Array<"shopkeeper" | "delivery" | "admin">) {
  const user = ctx.user;
  if (!roles.includes(user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "This account is not authorized for this workspace" });
  if (user.status === "suspended") throw new TRPCError({ code: "FORBIDDEN", message: "Your account is currently suspended. Please contact support." });
  if (user.status === "pending") throw new TRPCError({ code: "FORBIDDEN", message: `Your ${user.role === "shopkeeper" ? "shopkeeper" : "delivery partner"} account is awaiting approval.` });
}

function requireRole(ctx: { user: any }, roles: Array<"shopkeeper" | "delivery" | "admin">) {
  if (!roles.includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "This account is not authorized for this workspace" });
  if (ctx.user.status === "suspended") throw new TRPCError({ code: "FORBIDDEN", message: "Your account is currently suspended. Please contact support." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
    requestRole: protectedProcedure.input(z.object({ role: z.enum(["user", "shopkeeper", "delivery"]) })).mutation(({ ctx, input }) => requestRole(ctx.user.openId, input.role)),
  }),
  categories: router({ list: publicProcedure.query(() => listCategories()) }),
  shops: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listShops(input?.search)),
    get: publicProcedure.input(z.object({ shopId: z.number().int().positive() })).query(({ input }) => getShopById(input.shopId)),
    products: publicProcedure.input(z.object({ shopId: z.number().int().positive() })).query(({ input }) => listProducts(input.shopId)),
  }),
  orders: router({
    mine: protectedProcedure.query(({ ctx }) => listOrders(ctx.user.id)),
    create: protectedProcedure.input(z.object({ shopId: z.number().int().positive(), addressId: z.number().int().positive().optional(), deliveryAddress: z.string().trim().min(5).max(500), clientRequestId: z.string().trim().min(8).max(80), notes: z.string().max(500).optional(), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) })).min(1) })).mutation(({ ctx, input }) => {
      if (ctx.user.role !== "user") throw new TRPCError({ code: "FORBIDDEN", message: "Only customer accounts can place orders" });
      if (ctx.user.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Your account is not active" });
      return createOrder({ customerId: ctx.user.id, ...input });
    }),
  }),
  account: router({
    profile: protectedProcedure.query(({ ctx }) => getUserByOpenId(ctx.user.openId)),
    addresses: protectedProcedure.query(({ ctx }) => listUserAddresses(ctx.user.id)),
    saveAddress: protectedProcedure.input(z.object({ label: z.string().trim().min(1).max(40), line1: z.string().trim().min(3).max(255), city: z.string().trim().min(2).max(120), postalCode: z.string().trim().max(20).optional(), latitude: z.string().max(32).optional(), longitude: z.string().max(32).optional(), isDefault: z.boolean().optional() })).mutation(({ ctx, input }) => saveUserAddress(ctx.user.id, input)),
    cloudCart: protectedProcedure.query(({ ctx }) => listUserCart(ctx.user.id)),
    saveCloudCart: protectedProcedure.input(z.object({ items: z.array(z.object({ productId: z.number().int().positive(), shopId: z.number().int().positive(), quantity: z.number().int().min(0).max(99) })).max(100) })).mutation(({ ctx, input }) => replaceUserCart(ctx.user.id, input.items)),
    settings: protectedProcedure.query(({ ctx }) => getUserSettings(ctx.user.id)),
    updateSettings: protectedProcedure.input(z.object({ orderUpdates: z.boolean().optional(), promotionalNotifications: z.boolean().optional() })).mutation(({ ctx, input }) => updateUserSettings(ctx.user.id, input)),
    notifications: protectedProcedure.query(({ ctx }) => listUserNotifications(ctx.user.id)),
    markNotificationsRead: protectedProcedure.mutation(({ ctx }) => markUserNotificationsRead(ctx.user.id)),
    registerPushToken: protectedProcedure.input(z.object({ token: z.string().trim().min(20).max(4096), platform: z.literal("android") })).mutation(({ ctx, input }) => registerPushToken(ctx.user.id, input.token, input.platform)),
    deactivatePushToken: protectedProcedure.input(z.object({ token: z.string().trim().min(20).max(4096) })).mutation(({ ctx, input }) => deactivatePushToken(ctx.user.id, input.token)),
    exportData: protectedProcedure.query(({ ctx }) => exportUserData(ctx.user.id)),
    deletePrivateData: protectedProcedure.input(z.object({ confirmation: z.literal("DELETE MY DATA") })).mutation(({ ctx }) => deletePrivateUserData(ctx.user.id)),
  }),
  shopkeeper: router({
    shop: protectedProcedure.query(({ ctx }) => { requireRole(ctx, ["shopkeeper"]); return getOwnedShop(ctx.user.id); }),
    createShop: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(180), address: z.string().trim().min(1).max(255), description: z.string().max(2000).optional(), categoryId: z.number().int().positive().optional(), openingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), deliveryRadiusKm: z.number().int().min(1).max(100).optional(), minimumOrderCents: z.number().int().min(0).optional() })).mutation(({ ctx, input }) => { requireRole(ctx, ["shopkeeper"]); return createShop(ctx.user.id, input); }),
    updateStatus: protectedProcedure.input(z.object({ isOpen: z.boolean().optional(), isTemporarilyUnavailable: z.boolean().optional() })).mutation(({ ctx, input }) => { requireActiveRole(ctx, ["shopkeeper"]); return updateShopStatus(ctx.user.id, input); }),
    products: protectedProcedure.query(({ ctx }) => { requireActiveRole(ctx, ["shopkeeper"]); return listOwnedProducts(ctx.user.id); }),
    addProduct: protectedProcedure.input(productInput).mutation(({ ctx, input }) => { requireActiveRole(ctx, ["shopkeeper"]); return createProduct(ctx.user.id, input); }),
    updateProduct: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(180).optional(), description: z.string().max(2000).optional(), categoryId: z.number().int().positive().optional(), priceCents: z.number().int().min(0).optional(), originalPriceCents: z.number().int().min(0).optional(), unit: z.string().trim().min(1).max(24).optional(), sku: z.string().max(80).optional(), imageUrl: z.string().url().optional(), isAvailable: z.boolean().optional(), isActive: z.boolean().optional() })).mutation(({ ctx, input }) => { requireActiveRole(ctx, ["shopkeeper"]); const { id, ...changes } = input; return updateOwnedProduct(ctx.user.id, id, changes); }),
    updateStock: protectedProcedure.input(z.object({ id: z.number().int().positive(), stock: z.number().int().min(0) })).mutation(({ ctx, input }) => { requireActiveRole(ctx, ["shopkeeper"]); return updateProductStock(ctx.user.id, input.id, input.stock); }),
  }),
  operations: router({
    queue: protectedProcedure.query(({ ctx }) => { requireActiveRole(ctx, ["shopkeeper", "delivery", "admin"]); return listOperationalOrders(ctx.user.id, ctx.user.role as "shopkeeper" | "delivery" | "admin"); }),
    transition: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(["accepted", "preparing", "ready", "assigned", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"]) })).mutation(({ ctx, input }) => { requireActiveRole(ctx, ["shopkeeper", "delivery", "admin"]); return transitionOrder(input.orderId, input.status, ctx.user.id, ctx.user.role as "shopkeeper" | "delivery" | "admin"); }),
    adminSummary: adminProcedure.query(async () => { const data = await listOperationalOrders(0, "admin"); return { orders: data.length, active: data.filter((order) => !["completed", "cancelled", "refunded"].includes(order.status)).length, grossCents: data.reduce((sum: number, order) => sum + order.totalCents, 0), commissionCents: data.reduce((sum: number, order) => sum + order.commissionCents, 0) }; }),
  }),
  admin: router({
    pendingAccounts: adminProcedure.query(() => listPendingAccounts()),
    setAccountStatus: adminProcedure.input(z.object({ userId: z.number().int().positive(), status: z.enum(["active", "suspended", "pending"]) })).mutation(({ input }) => setAccountStatus(input.userId, input.status)),
    pendingShops: adminProcedure.query(() => listPendingShops()),
    setShopApproval: adminProcedure.input(z.object({ shopId: z.number().int().positive(), isApproved: z.boolean() })).mutation(({ input }) => setShopApproval(input.shopId, input.isApproved)),
  }),
});

export type AppRouter = typeof appRouter;
