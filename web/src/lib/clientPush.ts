// Helpers Web Push pour le portail client.
// L'abonnement est lie au slug du client (cookie de session non requis).

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type ClientPushResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "not_configured" | "error" };

export function clientPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function clientPushPermission(): NotificationPermission | "unsupported" {
  if (!clientPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function enableClientPush(slug: string): Promise<ClientPushResult> {
  if (!clientPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  // 1) Cle publique VAPID cote serveur.
  let publicKey = "";
  try {
    const keyResp = await fetch(`/api/client/${encodeURIComponent(slug)}/push/public-key`);
    const keyJson = await keyResp.json().catch(() => ({}));
    if (!keyResp.ok || !keyJson.ok || !keyJson.configured || !keyJson.publicKey) {
      return { ok: false, reason: "not_configured" };
    }
    publicKey = keyJson.publicKey as string;
  } catch {
    return { ok: false, reason: "error" };
  }

  // 2) Autorisation navigateur.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  // 3) Abonnement push + envoi au serveur.
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const resp = await fetch(`/api/client/${encodeURIComponent(slug)}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || !json.ok) {
      return { ok: false, reason: "error" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
