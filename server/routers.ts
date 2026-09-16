import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getUserByOpenId, listOrders, listProducts, listShops, createOrder } from "./db";
import { listOperationalOrders, transitionOrder } from "./db";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  shops: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listShops(input?.search)),
    products: publicProcedure.input(z.object({ shopId: z.number().int().positive() })).query(({ input }) => listProducts(input.shopId)),
  }),
  orders: router({
    mine: protectedProcedure.query(({ ctx }) => listOrders(ctx.user.id)),
    create: protectedProcedure.input(z.object({ shopId: z.number().int().positive(), addressId: z.number().int().positive().optional(), notes: z.string().max(500).optional(), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) })).min(1) })).mutation(({ ctx, input }) => createOrder({ customerId: ctx.user.id, ...input })),
  }),
  account: router({
    profile: protectedProcedure.query(async ({ ctx }) => getUserByOpenId(ctx.user.openId)),
  }),
  operations: router({
    queue: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role === "user") throw new TRPCError({ code: "FORBIDDEN", message: "Operator access required" });
      return listOperationalOrders(ctx.user.id, ctx.user.role);
    }),
    transition: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(["accepted", "preparing", "ready", "assigned", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"]) })).mutation(({ ctx, input }) => {
      if (ctx.user.role === "user") throw new TRPCError({ code: "FORBIDDEN", message: "Operator access required" });
      return transitionOrder(input.orderId, input.status, ctx.user.id, ctx.user.role);
    }),
    adminSummary: adminProcedure.query(async () => {
      const data = await listOperationalOrders(0, "admin");
      return { orders: data.length, active: data.filter((order) => !["completed", "cancelled", "refunded"].includes(order.status)).length, grossCents: data.reduce((sum: number, order) => sum + order.totalCents, 0), commissionCents: data.reduce((sum: number, order) => sum + order.commissionCents, 0) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
