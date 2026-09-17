import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

export function PushRegistration() {
  const { isAuthenticated } = useAuth();
  const registerToken = trpc.account.registerPushToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    registerForPushNotificationsAsync()
      .then((token) => {
        if (!cancelled && token) registerToken.mutate({ token, platform: "android" });
      })
      .catch((error) => console.warn("[Push] Registration failed", error));
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return null;
}
