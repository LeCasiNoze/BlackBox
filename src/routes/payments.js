const express = require("express");

const { getClientById } = require("../db/clients");
const {
  getTopupOrderByCheckoutId,
  processPaidTopupOrder,
  syncTopupOrderFromCheckout,
} = require("../db/topup_orders");
const { sendClientFormulaRecap } = require("../email");
const { retrieveCheckout } = require("../services/sumup");

const router = express.Router();

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

router.post("/sumup/webhook", async (req, res) => {
  const eventType = req.body?.event_type;
  const checkoutId = req.body?.id;

  if (eventType !== "CHECKOUT_STATUS_CHANGED" || !checkoutId) {
    return res.status(204).end();
  }

  try {
    const checkout = await retrieveCheckout(checkoutId);
    const order = getTopupOrderByCheckoutId(checkout.id);

    if (!order) {
      return res.status(204).end();
    }

    syncTopupOrderFromCheckout(order.id, checkout);

    if (checkout.status === "PAID") {
      const result = processPaidTopupOrder(order.id, checkout);
      await maybeSendTopupRecap(result?.client, result?.applied);
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

module.exports = router;
