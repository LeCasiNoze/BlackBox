const express = require("express");

const {
  getTopupOrderByCheckoutId,
  processPaidTopupOrder,
  syncTopupOrderFromCheckout,
} = require("../db/topup_orders");
const {
  attachPartnerCheckoutSession,
  getPartnerOrderByCheckoutId,
  getPartnerOrderByCheckoutReference,
  mapPartnerOrderRow,
  syncPartnerOrderFromCheckout,
} = require("../db/partner_orders");
const { getPartnerForfait } = require("../config/partnerForfaits");
const { sendClientFormulaRecap } = require("../email");
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

async function maybeSendTopupRecap(client, applied) {
  if (!applied || !client?.email) {
    return;
  }

  try {
    await sendClientFormulaRecap(client);
  } catch (error) {
    console.error("[TOPUP] recap client apres paiement:", error);
  }
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
    paidAt: order.paidAt,
    tagline: forfait ? forfait.tagline : null,
    features: forfait ? forfait.features : [],
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

    // 1) Recharges credits (clients bbx/data/fondateurs).
    const topupOrder = getTopupOrderByCheckoutId(checkout.id);
    if (topupOrder) {
      syncTopupOrderFromCheckout(topupOrder.id, checkout);
      if (checkout.status === "PAID") {
        const result = processPaidTopupOrder(topupOrder.id, checkout);
        await maybeSendTopupRecap(result?.client, result?.applied);
      }
      return res.status(204).end();
    }

    // 2) Forfaits partenaire (liens generes par un compte pro).
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
