// src/email.js
const brevo = require("@getbrevo/brevo");

const {
  BREVO_API_KEY,
  MAIL_FROM_EMAIL,
  MAIL_FROM_NAME,
  MAIL_ADMIN_TO,
  ADMIN_DASHBOARD_URL,
} = process.env;

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

// --------------------------------------------------
// Helpers
// --------------------------------------------------
function normalizePhoneForTel(phone) {
  if (!phone) return "";
  return String(phone).replace(/\s+/g, "");
}

function formatDateFr(dateStr) {
  if (!dateStr) return "";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// --------------------------------------------------
// sendAdminNotification
// --------------------------------------------------
async function sendAdminNotification({ type, client, date, time }) {
  if (!BREVO_API_KEY) {
    console.warn("[MAIL] API KEY manquante — envoi annulé");
    return;
  }

  const safeTime = time || "heure non renseignée";
  const formattedDate = formatDateFr(date);

  let adminUrl = ADMIN_DASHBOARD_URL || null;
  if (adminUrl && client?.id) {
    const qs = new URLSearchParams();
    qs.set("clientId", String(client.id));
    if (date) qs.set("date", date);
    adminUrl += "?" + qs.toString();
  }

  let actionLabel = "";
  if (type === "book") actionLabel = "NOUVEAU rendez-vous réservé";
  else if (type === "update") actionLabel = "Rendez-vous modifié";
  else if (type === "cancel") actionLabel = "Rendez-vous annulé";
  else actionLabel = "Mise à jour de rendez-vous";

  const firstName = client?.firstName ?? client?.first_name;
  const lastName = client?.lastName ?? client?.last_name;
  const fullName = client?.fullName ?? client?.full_name;
  const clientName = fullName || `${firstName || ""} ${lastName || ""}`.trim();

  const vehicleModel = client?.vehicleModel ?? client?.vehicle_model;
  const vehiclePlate = client?.vehiclePlate ?? client?.vehicle_plate;

  const vehicle =
    vehicleModel || vehiclePlate
      ? `${vehicleModel || ""}${vehiclePlate ? ` · ${vehiclePlate}` : ""}`
      : "Véhicule non renseigné";

  const cardCode =
    client?.cardCode ?? client?.card_code ?? client?.slug ?? "—";

  const html = `
    <h2>${actionLabel}</h2>
    <p><strong>Client :</strong> ${clientName}</p>
    <p><strong>Code carte :</strong> ${cardCode}</p>
    <p><strong>Téléphone :</strong> ${client.phone || "—"}</p>
    <p><strong>Email :</strong> ${client.email || "—"}</p>

    <p><strong>Date :</strong> ${formattedDate}</p>
    <p><strong>Heure :</strong> ${safeTime}</p>
    <p><strong>Véhicule :</strong> ${vehicle}</p>

    ${
      adminUrl
        ? `<p><a href="${adminUrl}">🔗 Ouvrir le tableau de bord admin</a></p>`
        : ""
    }

    <hr />
    <p style="font-size:12px;color:#666;">Notification automatique BlackBox · Agenda.</p>
  `;

  await apiInstance.sendTransacEmail({
    sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
    to: [{ email: MAIL_ADMIN_TO }],
    subject: `[BlackBox] ${actionLabel} — ${formattedDate} ${safeTime}`,
    htmlContent: html,
  });
}

module.exports = {
  sendAdminNotification,
};
