import { SignJWT, importPKCS8 } from "jose";
import { ENV } from "./_core/env";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URI = "https://oauth2.googleapis.com/token";

type FcmResult = { sent: number; failed: number };

export async function getFcmAccessToken() {
  if (!ENV.firebaseProjectId || !ENV.firebaseClientEmail || !ENV.firebasePrivateKey) return null;
  const key = await importPKCS8(ENV.firebasePrivateKey, "RS256");
  const assertion = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(ENV.firebaseClientEmail)
    .setSubject(ENV.firebaseClientEmail)
    .setAudience(TOKEN_URI)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const response = await fetch(TOKEN_URI, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!response.ok) throw new Error(`Firebase OAuth failed: ${response.status}`);
  return (await response.json() as { access_token: string }).access_token;
}

export async function sendFcmNotification(tokens: string[], title: string, body: string, data: Record<string, string> = {}): Promise<FcmResult> {
  if (!tokens.length) return { sent: 0, failed: 0 };
  const accessToken = await getFcmAccessToken();
  if (!accessToken) { console.warn("[FCM] Firebase server credentials are not configured; notification stored only."); return { sent: 0, failed: tokens.length }; }
  let sent = 0;
  let failed = 0;
  for (const token of tokens) {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${ENV.firebaseProjectId}/messages:send`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: { token, notification: { title, body }, data, android: { priority: "high", notification: { channel_id: "default", sound: "default" } } } }) });
    if (response.ok) sent += 1; else { failed += 1; console.warn(`[FCM] Delivery failed with ${response.status}`); }
  }
  return { sent, failed };
}
