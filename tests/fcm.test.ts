import { describe, expect, it } from "vitest";
import { sendFcmNotification } from "../server/fcm";

describe("Firebase Cloud Messaging", () => {
  it("does not make a network request when there are no device tokens", async () => {
    await expect(sendFcmNotification([], "Order", "Ready")).resolves.toEqual({ sent: 0, failed: 0 });
  });
});
