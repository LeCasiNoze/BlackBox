const express = require("express");

const {
  getTopupOrderByCheckoutId,
  syncTopupOrderFromCheckout,
} = require("../db/topup_orders");
const {
  attachPartnerCheckoutSession,
  getPartnerOrderByCheckoutId,
  getPartnerOrderByCheckoutReference,
  mapPartnerOrderRow,
  syncPartnerOrderFromCheckout,
} = require("../db/partner_orders");
const {
  getAppointmentPaymentOrderByCheckoutId,
  processPaidAppointmentOrder,
  syncAppointmentPaymentOrder,
} = require("../db/appointment_payment_orders");
const {
  getQuoteRequestByCheckoutId,
  syncQuotePaymentFromCheckout,
} = require("../db/quoteRequests");
const { finalizeReferralBenefitsForPaidQuote } = require("../db/referrals");
const { getPartnerForfait } = require("../config/partnerForfaits");
const {
  sendAdminNotification,
  sendClientAppointmentStatusEmail,
  sendQuotePaidNotifications,
  sendReferralRewardAvailableNotification,
} = require("../email");
const { getClientById } = require("../db/clients");
const { createHostedCheckout, retrieveCheckout, sumupConfigured } = require("../services/sumup");

const router = express.Router();

function publicBaseUrl(req) {
  const explicit = process.env.CLIENT_PORTAL_BASE_URL;
  if (typeof explicit === "string" && explicit.trim() !== "") {
    return explicit.trim().replace(/\/+$/, "");
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol || "https";
  return `${proto}://${req.get("host")}`;
}

// Vue publique d'une commande forfait (lien client final): aucune donnee
// sensible, juste de quoi afficher la page de paiement et son statut.
function partnerOrderPublicView(order, forfait) {
  return {
    reference: order.checkoutReference,
    forfaitKey: order.forfaitKey,
    forfaitLabel: order.forfaitLabel,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    partnerLabel: order.partnerLabel,
    vehicleModel: order.vehicleModel,
    vehiclePlate: order.vehiclePlate,
    paidAt: order.paidAt,
    tagline: forfait ? forfait.tagline : null,
    features: forfait ? forfait.features : [],
    startingAt: forfait ? forfait.startingAt === true : false,
  };
}

router.post("/sumup/webhook", async (req, res) => {
  const eventType = req.body?.event_type;
  const checkoutId = req.body?.id;

  if (eventType !== "CHECKOUT_STATUS_CHANGED" || !checkoutId) {
    return res.status(204).end();
  }

  try {
    const checkout = await retrieveCheckout(checkoutId);

    // 1) Paiement d'un devis BBX/Fondateur. La planification vient ensuite.
    const quote = getQuoteRequestByCheckoutId(checkout.id);
    if (quote) {
      const result = syncQuotePaymentFromCheckout(quote.id, checkout);
      if (result.amountMismatch) {
        console.error(`[SUMUP] quote webhook amount mismatch (quoteId=${quote.id})`);
        return res.status(204).end();
      }
      if (result.becamePaid && result.quote) {
        const referralResult = finalizeReferralBenefitsForPaidQuote(result.quote.id);
        if (referralResult?.rewardCreated && referralResult.referrerClientId) {
          const referrer = getClientById(referralResult.referrerClientId);
          if (referrer) await sendReferralRewardAvailableNotification({ client: referrer });
        }
        const client = getClientById(result.quote.clientId);
        if (client) {
          await sendQuotePaidNotifications({ client, quote: result.quote });
        }
      }
      return res.status(204).end();
    }

    // 2) Paiement historique d'un rendez-vous déjà créé.
    const appointmentOrder = getAppointmentPaymentOrderByCheckoutId(checkout.id);
    if (appointmentOrder) {
      syncAppointmentPaymentOrder(appointmentOrder.id, checkout);
      if (checkout.status === "PAID") {
        const result = processPaidAppointmentOrder(appointmentOrder.id, checkout);
        if (result?.applied && result.appointment) {
          const client = getClientById(result.appointment.client_id);
          if (client) {
            await Promise.allSettled([
              sendClientAppointmentStatusEmail({
                client,
                appointment: result.appointment,
                eventType: "confirmed",
              }),
              sendAdminNotification({
                type: "validated",
                client,
                date: result.appointment.date,
                time: result.appointment.time,
                location: result.appointment.location,
                clientNote: `Paiement SumUp reçu : ${(appointmentOrder.amount_cents / 100).toFixed(2)} EUR`,
                appointmentId: result.appointment.id,
              }),
            ]);
          }
        }
      }
      return res.status(204).end();
    }

    // 3) Anciennes recharges : on conserve uniquement le suivi du paiement.
    // Les crédits ont été retirés du produit et ne sont plus attribués.
    const topupOrder = getTopupOrderByCheckoutId(checkout.id);
    if (topupOrder) {
      syncTopupOrderFromCheckout(topupOrder.id, checkout);
      return res.status(204).end();
    }

    // 4) Forfaits publics / partenaire.
    const partnerOrder = getPartnerOrderByCheckoutId(checkout.id);
    if (partnerOrder) {
      syncPartnerOrderFromCheckout(partnerOrder.id, checkout);
      return res.status(204).end();
    }

    return res.status(204).end();
  } catch (error) {
    console.error("[SUMUP] webhook:", error);
    return res.status(500).json({ ok: false });
  }
});

router.get("/sumup/health", (_req, res) => {
  return res.json({ ok: true, service: "sumup" });
});

// --- Forfaits partenaire: parcours public du client final -------------------
// Page du lien recu de l'agence. `?sync=1` (ou retour `?paid=1`) force une
// verification du statut aupres de SumUp sans attendre le webhook.
router.get("/forfait/:reference", async (req, res) => {
  const row = getPartnerOrderByCheckoutReference(req.params.reference);
  if (!row) {
    return res.status(404).json({ ok: false, error: "order_not_found" });
  }

  let order = mapPartnerOrderRow(row);

  const wantSync = req.query.sync === "1" || req.query.paid === "1";
  if (wantSync && order.status === "pending" && order.checkoutId && sumupConfigured()) {
    try {
      const checkout = await retrieveCheckout(order.checkoutId);
      const updated = syncPartnerOrderFromCheckout(order.id, checkout);
      if (updated) {
        order = mapPartnerOrderRow(updated);
      }
    } catch (error) {
      // best-effort: on retourne le statut connu
    }
  }

  return res.json({
    ok: true,
    paymentsReady: sumupConfigured(),
    order: partnerOrderPublicView(order, getPartnerForfait(order.forfaitKey)),
  });
});

router.post("/forfait/:reference/checkout", async (req, res) => {
  if (!sumupConfigured()) {
    return res.status(503).json({ ok: false, error: "sumup_not_ready" });
  }

  const row = getPartnerOrderByCheckoutReference(req.params.reference);
  if (!row) {
    return res.status(404).json({ ok: false, error: "order_not_found" });
  }

  let order = mapPartnerOrderRow(row);

  if (order.status === "paid") {
    return res.json({
      ok: true,
      alreadyPaid: true,
      order: partnerOrderPublicView(order, getPartnerForfait(order.forfaitKey)),
    });
  }

  // Reutilise un checkout SumUp encore valide plutot que d'en recreer un.
  if (order.checkoutId && order.hostedCheckoutUrl) {
    try {
      const existing = await retrieveCheckout(order.checkoutId);
      if (existing && existing.status === "PENDING" && existing.hosted_checkout_url) {
        syncPartnerOrderFromCheckout(order.id, existing);
        return res.json({ ok: true, hostedCheckoutUrl: existing.hosted_checkout_url });
      }
    } catch (error) {
      // checkout introuvable/expire: on en cree un nouveau ci-dessous
    }
  }

  const baseUrl = publicBaseUrl(req);
  const redirectUrl = `${baseUrl}/forfait/${encodeURIComponent(order.checkoutReference)}?paid=1`;
  const returnUrl = `${baseUrl}/api/payments/sumup/webhook`;
  // Reference SumUp toujours unique (le mapping retour se fait via checkout.id),
  // pour eviter tout conflit de reference en cas de nouvelle tentative.
  const sumupReference = `${order.checkoutReference}-${Date.now().toString(36)}`.slice(0, 90);

  try {
    const checkout = await createHostedCheckout({
      checkoutReference: sumupReference,
      amountCents: order.amountCents,
      currency: order.currency,
      description: order.partnerLabel
        ? `${order.forfaitLabel} - ${order.partnerLabel}`
        : order.forfaitLabel,
      redirectUrl,
      returnUrl,
    });

    attachPartnerCheckoutSession(order.id, {
      checkoutId: checkout.id,
      hostedCheckoutUrl: checkout.hosted_checkout_url,
      sumupStatus: checkout.status || "PENDING",
      payload: checkout,
    });

    return res.json({ ok: true, hostedCheckoutUrl: checkout.hosted_checkout_url });
  } catch (error) {
    console.error("[SUMUP] create forfait checkout:", error);
    return res.status(502).json({ ok: false, error: "sumup_checkout_failed" });
  }
});

module.exports = router;
