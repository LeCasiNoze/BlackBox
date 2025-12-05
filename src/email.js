const axios = require("axios");

const {
  BREVO_API_KEY,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
  MAIL_ADMIN_TO,
  ADMIN_DASHBOARD_URL,
} = process.env;

// --------------------------------------------------
// Helpers
// --------------------------------------------------
function normalizePhoneForTel(phone) {
  return phone ? String(phone).replace(/\s+/g, "") : "";
}

function formatDateFr(dateStr) {
  if (!dateStr) return "";
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;

  const d = new Date(Date.UTC(m[1], m[2] - 1, m[3]));
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

console.log("[MAIL DEBUG] FROM =", MAIL_FROM_EMAIL);
console.log("[MAIL DEBUG] TO   =", MAIL_ADMIN_TO);
console.log("[MAIL DEBUG] HAS_KEY =", !!BREVO_API_KEY);

// --------------------------------------------------
// Send email through Brevo API
// --------------------------------------------------
async function sendBrevoEmail({ subject, html, text }) {
  if (!BREVO_API_KEY) {
    console.warn("[MAIL] BREVO_API_KEY manquant, email ignoré.");
    return;
  }

  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          email: MAIL_FROM_EMAIL,
          name: MAIL_FROM_NAME || "BlackBox",
        },
        to: [
          { email: MAIL_ADMIN_TO }
        ],
        subject,
        htmlContent: html,
        textContent: text,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("[MAIL] Email Brevo OK", res.data);
  } catch (err) {
    console.error("[MAIL] Erreur Brevo:", err.response?.data || err);
  }
}

// --------------------------------------------------
// Notification admin
// --------------------------------------------------
async function sendAdminNotification({ type, client, date, time }) {
  const formattedDate = formatDateFr(date);
  const safeTime = time || "heure non renseignée";

  const adminUrl = `${ADMIN_DASHBOARD_URL}?clientId=${client.id}&date=${date}`;

  const firstName = client.firstName ?? client.first_name;
  const lastName = client.lastName ?? client.last_name;
  const fullName =
    client.fullName ??
    client.full_name ??
    [firstName, lastName].filter(Boolean).join(" ");

  const vehicle =
    client.vehicleModel || client.vehiclePlate
      ? `${client.vehicleModel || ""}${client.vehiclePlate ? ` · ${client.vehiclePlate}` : ""}`
      : "Véhicule non renseigné";

  const action = type === "book"
    ? "NOUVEAU rendez-vous réservé"
    : type === "cancel"
    ? "Rendez-vous annulé"
    : "Rendez-vous modifié";

  const subject = `[BlackBox] ${action} — ${formattedDate} ${safeTime}`;

  const text = `
${action}

Client : ${fullName}
Téléphone : ${client.phone || "—"}
Email : ${client.email || "—"}

Date : ${formattedDate}
Heure : ${safeTime}
Véhicule : ${vehicle}

Admin : ${adminUrl}
  `.trim();

  const html = `
  <h2>${action}</h2>
  <p><strong>Client :</strong> ${fullName}</p>
  <p><strong>Téléphone :</strong> ${client.phone || "—"}</p>
  <p><strong>Email :</strong> ${client.email || "—"}</p>

  <p><strong>Date :</strong> ${formattedDate}</p>
  <p><strong>Heure :</strong> ${safeTime}</p>
  <p><strong>Véhicule :</strong> ${vehicle}</p>

  <p style="margin-top:10px;">
    <a href="${adminUrl}" style="color:#2563eb; text-decoration:none;">
      Ouvrir le tableau de bord admin
    </a>
  </p>
  `;

  await sendBrevoEmail({ subject, html, text });
}

module.exports = { sendAdminNotification };
