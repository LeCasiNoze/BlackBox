const SUMUP_API_BASE_URL = "https://api.sumup.com";

function sumupConfigured() {
  return Boolean(process.env.SUMUP_API_KEY && process.env.SUMUP_MERCHANT_CODE);
}

async function sumupRequest(path, { method = "GET", body } = {}) {
  if (!sumupConfigured()) {
    throw new Error("sumup_not_configured");
  }

  const response = await fetch(`${SUMUP_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[SUMUP] ${method} ${path} -> ${response.status} ${text}`);
  }

  return response.json();
}

async function createHostedCheckout({
  checkoutReference,
  amountCents,
  currency = "EUR",
  description,
  redirectUrl,
  returnUrl,
}) {
  return sumupRequest("/v0.1/checkouts", {
    method: "POST",
    body: {
      amount: Number(amountCents) / 100,
      checkout_reference: checkoutReference,
      currency,
      description,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      redirect_url: redirectUrl,
      return_url: returnUrl,
      hosted_checkout: {
        enabled: true,
      },
    },
  });
}

async function retrieveCheckout(checkoutId) {
  return sumupRequest(`/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
  });
}

module.exports = {
  createHostedCheckout,
  retrieveCheckout,
  sumupConfigured,
};
