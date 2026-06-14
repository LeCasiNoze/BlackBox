const webpush = require("web-push");
const {
  listSubscriptions,
  deleteSubscriptionByEndpoint,
} = require("../db/pushSubscriptions");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:bryan-cars-admin@blackbox.app";

let configured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  } catch (error) {
    console.error("[PUSH] Configuration VAPID invalide:", error.message);
    configured = false;
  }
} else {
  console.warn("[PUSH] VAPID non configure: notifications push desactivees.");
}

function isPushConfigured() {
  return configured;
}

function getVapidPublicKey() {
  return configured ? VAPID_PUBLIC_KEY : null;
}

// Envoie une notification a tous les appareils admin abonnes.
// Les abonnements expires (404/410) sont supprimes automatiquement.
async function sendAdminPush({ title, body, url = "/admin/appointments", tag = "bbx-admin" } = {}) {
  if (!configured) {
    return { ok: false, reason: "not_configured", sent: 0 };
  }

  const subscriptions = listSubscriptions("admin");
  if (subscriptions.length === 0) {
    return { ok: true, sent: 0, reason: "no_subscription" };
  }

  const payload = JSON.stringify({
    title: title || "Bryan Cars",
    body: body || "",
    url,
    tag,
  });

  let sent = 0;

  await Promise.all(
    subscriptions.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };

      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Abonnement plus valide: on le nettoie.
          deleteSubscriptionByEndpoint(row.endpoint);
        } else {
          console.error("[PUSH] Echec d'envoi:", statusCode || error.message);
        }
      }
    }),
  );

  return { ok: true, sent };
}

module.exports = {
  isPushConfigured,
  getVapidPublicKey,
  sendAdminPush,
};
