// src/email.js
const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
  MAIL_ADMIN_TO,
  ADMIN_DASHBOARD_URL, // 👈 nouveau
} = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn(
    "[MAIL] SMTP_USER ou SMTP_PASS manquant — les emails ne seront pas envoyés."
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST || "smtp.gmail.com",
  port: Number(SMTP_PORT) || 465,
  secure: SMTP_SECURE !== "false", // par défaut true
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

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

  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);

  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

// --------------------------------------------------
// Notification admin
// --------------------------------------------------
async function sendAdminNotification({ type, client, date, time }) {
  if (!SMTP_USER || !SMTP_PASS || !MAIL_ADMIN_TO) {
    console.warn("[MAIL] Config incomplète, skip sendAdminNotification");
    return;
  }

  const safeTime = time || "heure non renseignée";
  const formattedDate = formatDateFr(date || "");

  // URL admin profonde : /admin?clientId=XX&date=YYYY-MM-DD
  let adminUrl = ADMIN_DASHBOARD_URL || null;
  if (adminUrl && client?.id) {
    const qs = new URLSearchParams();
    qs.set("clientId", String(client.id));
    if (date) qs.set("date", date);
    adminUrl += (adminUrl.includes("?") ? "&" : "?") + qs.toString();
  }

  let actionLabel = "";
  if (type === "book") actionLabel = "NOUVEAU rendez-vous réservé";
  else if (type === "update") actionLabel = "Rendez-vous modifié";
  else if (type === "cancel") actionLabel = "Rendez-vous annulé";
  else actionLabel = "Mise à jour de rendez-vous";

  const subject = `[BlackBox] ${actionLabel} — ${formattedDate} ${safeTime}`;

  // ✅ Gère camelCase ET snake_case
  const firstName = client?.firstName ?? client?.first_name ?? null;
  const lastName = client?.lastName ?? client?.last_name ?? null;
  const fullName = client?.fullName ?? client?.full_name ?? null;

  const clientName =
    fullName ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Client inconnu";

  const vehicleModel =
    client?.vehicleModel ?? client?.vehicle_model ?? null;
  const vehiclePlate =
    client?.vehiclePlate ?? client?.vehicle_plate ?? null;

  const vehicle =
    vehicleModel || vehiclePlate
      ? `${vehicleModel || ""}${vehiclePlate ? ` · ${vehiclePlate}` : ""}`
      : "Véhicule non renseigné";

  const cardCode =
    client?.cardCode ?? client?.card_code ?? client?.slug ?? "—";

  const rawPhone = client?.phone ?? null;
  const phoneDisplay = rawPhone || "—";
  const telHref = rawPhone ? `tel:${normalizePhoneForTel(rawPhone)}` : null;

  const email = client?.email || "—";

  const textLines = [
    actionLabel,
    "",
    `Client : ${clientName}`,
    `Code carte : ${cardCode}`,
    `Téléphone : ${phoneDisplay}`,
    `Email : ${email}`,
    "",
    `Date : ${formattedDate}`,
    `Heure : ${safeTime}`,
    `Véhicule : ${vehicle}`,
  ];

  if (adminUrl) {
    textLines.push("", `Admin : ${adminUrl}`);
  }

  const text = textLines.join("\n");

  const htmlPhone = telHref
    ? `<a href="${telHref}" style="color:#2563eb; text-decoration:none;">${phoneDisplay}</a>`
    : phoneDisplay;

  const htmlAdminLink = adminUrl
    ? `
      <p style="margin:8px 0 0 0; font-size:12px;">
        <a href="${adminUrl}" style="color:#2563eb; text-decoration:none;">
          Ouvrir le tableau de bord admin
        </a>
      </p>
    `
    : "";

  const html = `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:14px; color:#111;">
    <h2 style="margin:0 0 8px 0;">${actionLabel}</h2>
    <p style="margin:0 0 4px 0;"><strong>Client :</strong> ${clientName}</p>
    <p style="margin:0 0 4px 0;"><strong>Code carte :</strong> ${cardCode}</p>
    <p style="margin:0 0 4px 0;"><strong>Téléphone :</strong> ${htmlPhone}</p>
    <p style="margin:0 0 4px 0;"><strong>Email :</strong> ${email}</p>

    <p style="margin:12px 0 4px 0;"><strong>Date :</strong> ${formattedDate}</p>
    <p style="margin:0 0 4px 0;"><strong>Heure :</strong> ${safeTime}</p>
    <p style="margin:0 0 8px 0;"><strong>Véhicule :</strong> ${vehicle}</p>

    <hr style="border:none; border-top:1px solid #ddd; margin:12px 0;" />
    <p style="margin:0; font-size:12px; color:#666;">
      Notification automatique BlackBox · Agenda.
    </p>
    ${htmlAdminLink}
  </div>
  `;

  const from = MAIL_FROM_EMAIL || SMTP_USER;

  await transporter.sendMail({
    from: MAIL_FROM_NAME ? `"${MAIL_FROM_NAME}" <${from}>` : from,
    to: MAIL_ADMIN_TO,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendAdminNotification,
};
