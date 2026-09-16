import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

type User = NonNullable<TrpcContext["user"]>;

function context(user: User): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const customer: User = { id: 7, openId: "customer-7", email: "customer@example.com", name: "Customer", phone: null, loginMethod: "manus", role: "user", status: "active", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin: User = { ...customer, id: 8, openId: "admin-8", role: "admin" };

describe("Winkkit order engine contracts", () => {
  it("rejects order creation for unauthenticated customers", async () => {
    const caller = appRouter.createCaller(context(null as unknown as User));
    await expect(caller.orders.create({ shopId: 1, deliveryAddress: "12 Main Street", clientRequestId: "request-unauth-1", items: [{ productId: 1, quantity: 1 }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects empty carts before any database call", async () => {
    const caller = appRouter.createCaller(context(customer));
    await expect(caller.orders.create({ shopId: 1, deliveryAddress: "12 Main Street", clientRequestId: "request-empty-1", items: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not expose operational queues to customer accounts", async () => {
    const caller = appRouter.createCaller(context(customer));
    await expect(caller.operations.queue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not expose shopkeeper product creation to customer accounts", async () => {
    const caller = appRouter.createCaller(context(customer));
    await expect(caller.shopkeeper.addProduct({ name: "Milk", categoryId: 1, priceCents: 650, unit: "litre", stock: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks pending shopkeepers from operational queues", async () => {
    const pendingShopkeeper: User = { ...customer, role: "shopkeeper", status: "pending" };
    const caller = appRouter.createCaller(context(pendingShopkeeper));
    await expect(caller.operations.queue()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin summaries through the admin procedure boundary", async () => {
    const caller = appRouter.createCaller(context(admin));
    await expect(caller.operations.adminSummary()).resolves.toMatchObject({ orders: expect.any(Number), active: expect.any(Number), grossCents: expect.any(Number), commissionCents: expect.any(Number) });
  });
});
