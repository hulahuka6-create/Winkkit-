import { describe, expect, it } from "vitest";
import { getFcmAccessToken } from "../server/fcm";

describe("Firebase Admin credentials", () => {
  it.skipIf(process.env.FIREBASE_TEST_LIVE !== "1")("mints an FCM OAuth access token", async () => {
    const token = await getFcmAccessToken();
    expect(token).toEqual(expect.any(String));
    expect(token?.length).toBeGreaterThan(20);
  }, 20_000);
});
