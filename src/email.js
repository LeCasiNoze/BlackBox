const {
  BREVO_API_KEY,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
  MAIL_ADMIN_TO,
  ADMIN_DASHBOARD_URL,
  CLIENT_PORTAL_BASE_URL,
} = process.env;

const { sendClientPush, sendAdminPush } = require("./services/webPush");

// Notification push couplee a un email client (deep-link vers le RDV ou le devis).
function pushClient(client, { title, body, appointmentId = null, quoteId = null } = {}) {
  if (!client?.id) return;
  let url = quoteId ? clientQuoteUrl(client, quoteId) : clientPortalUrl(client) || "/";
  if (appointmentId && !quoteId) {
    url += `${url.includes("?") ? "&" : "?"}appointmentId=${appointmentId}`;
  }
  void sendClientPush(client.id, { title, body, url }).catch(() => {});
}

// Notification push couplee a un email admin.
function pushAdmin({ title, body, url = "/admin/appointments" } = {}) {
  void sendAdminPush({ title, body, url })
    .then((result) => {
      if (result?.ok && result.sent === 0) {
        console.warn(
          "[PUSH] Notif admin non delivree : aucun appareil admin abonne en base (push_subscriptions role=admin vide).",
        );
      }
    })
    .catch(() => {});
}

function normalizePhoneForTel(phone) {
  return phone ? String(phone).replace(/\s+/g, "") : "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateFr(dateStr) {
  if (!dateStr) return "";
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatUnixDateFr(timestamp) {
  if (!timestamp) return "Non renseignee";
  const date = new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return "Non renseignee";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatUnixDateTimeFr(timestamp) {
  if (!timestamp) return "Non renseignee";
  const date = new Date(Number(timestamp) * 1000);
  if (Number.isNaN(date.getTime())) return "Non renseignee";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function formatEuros(cents) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Math.max(0, Number(cents) || 0) / 100);
}

function locationLabel(location) {
  const normalized = typeof location === "string" ? location.toLowerCase() : "";
  if (normalized === "domicile") return "A domicile";
  if (normalized === "atelier") return "A l'atelier";
  return "Non precise";
}

function adminInboxEmail() {
  return MAIL_ADMIN_TO || MAIL_FROM_EMAIL || "";
}

function normalizeAppointmentSlot(slot, time) {
  if (slot === "morning" || slot === "afternoon") {
    return slot;
  }

  if (typeof time === "string" && /^\d{2}:\d{2}$/.test(time)) {
    const hour = Number(time.slice(0, 2));
    return hour < 13 ? "morning" : "afternoon";
  }

  return "morning";
}

function appointmentSlotLabel(slot, time) {
  return normalizeAppointmentSlot(slot, time) === "morning" ? "Matin" : "Apres-midi";
}

function appointmentWindowLabel(slot, time) {
  return normalizeAppointmentSlot(slot, time) === "morning" ? "9h-12h" : "14h-18h";
}

function basePortalUrl() {
  if (CLIENT_PORTAL_BASE_URL) return CLIENT_PORTAL_BASE_URL.replace(/\/+$/, "");
  if (ADMIN_DASHBOARD_URL) {
    return ADMIN_DASHBOARD_URL.replace(/\/admin(?:\/.*)?$/i, "");
  }
  return "";
}

function clientPortalUrl(client) {
  const slug = client.slug || client.card_code || client.cardCode;
  const clientType = client.client_type || client.clientType || "bbx";
  const base = basePortalUrl();
  if (!base || !slug) return "";
  return `${base}/card/${encodeURIComponent(slug)}`;
}

// Lien profond vers le devis du client (ouvre directement le détail du devis).
function clientQuoteUrl(client, quoteId = null) {
  const portalUrl = clientPortalUrl(client);
  if (!portalUrl) return "";
  let url = `${portalUrl}?devis=1`;
  if (quoteId) {
    url += `&quoteId=${quoteId}`;
  }
  return url;
}

function adminQuoteUrl(quoteId = null) {
  const base = (ADMIN_DASHBOARD_URL || `${basePortalUrl()}/admin` || "/admin").replace(/\/+$/, "");
  return `${base}/devis${quoteId ? `?quoteId=${quoteId}` : ""}`;
}

function serviceLevelLabel(level) {
  if (level === "dirty") return "Sale";
  if (level === "correct") return "Correct";
  return "Propre";
}

function clientTermsUrl(client) {
  const portalUrl = clientPortalUrl(client);
  if (!portalUrl) return "";
  return `${portalUrl}/conditions`;
}

function absoluteUrlMaybe(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = basePortalUrl();
  if (!base) return "";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function fallbackClientName(client) {
  const composedName = [client.firstName ?? client.first_name, client.lastName ?? client.last_name]
    .filter(Boolean)
    .join(" ");

  return (client.fullName ?? client.full_name ?? composedName) || "Client";
}

function vehicleSummary(clientOrAppointment) {
  const model =
    clientOrAppointment.vehicleModel ||
    clientOrAppointment.vehicle_model ||
    clientOrAppointment.vehicleLabel ||
    clientOrAppointment.vehicle_label ||
    "";
  const plate = clientOrAppointment.vehiclePlate || clientOrAppointment.vehicle_plate || "";

  const parts = [model, plate].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Véhicule non renseigné";
}

function brandWordmark() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td align="left" style="vertical-align:middle;">
          <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1;letter-spacing:0.3em;text-transform:uppercase;font-weight:900;color:#e8c98a;">
            BRYAN CARS — BLACKBOX DETAILING
          </div>
        </td>
      </tr>
    </table>
  `;
}

function emailBadge(label, accent = "#e8c98a") {
  return `
    <div style="display:inline-block;padding:7px 15px;border-radius:999px;border:1px solid rgba(232,201,138,0.3);background:rgba(232,201,138,0.08);font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;line-height:1;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:${escapeHtml(
      accent,
    )};">
      ${escapeHtml(label)}
    </div>
  `;
}

function metricRows(metrics = []) {
  const safeMetrics = metrics.filter((metric) => metric && metric.value);
  if (safeMetrics.length === 0) return "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-bottom:16px;">
      ${safeMetrics
        .map(
          (metric) => `
            <tr>
              <td style="padding:0 0 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid rgba(232,201,138,0.25);border-radius:20px;background:linear-gradient(135deg, #161212 0%, #0d0a0a 100%);">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;line-height:1.4;letter-spacing:0.2em;text-transform:uppercase;font-weight:800;color:rgba(232,201,138,0.65);">
                        ${escapeHtml(metric.label)}
                      </div>
                      <div style="padding-top:6px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.2;font-weight:900;color:#ffffff;">
                        ${escapeHtml(metric.value)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function infoRows(rows = []) {
  const safeRows = rows.filter((row) => row && row.value);
  if (safeRows.length === 0) return "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      ${safeRows
        .map(
          (row) => `
            <tr>
              <td style="padding:0 0 12px;">
                <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,0.45);">
                  ${escapeHtml(row.label)}
                </div>
                <div style="padding-top:4px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;font-weight:600;color:#f1ede6;">
                  ${escapeHtml(row.value)}
                </div>
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function actionButtons(buttons = []) {
  const safeButtons = buttons.filter((button) => button && button.href && button.label);
  if (safeButtons.length === 0) return "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:16px;">
      ${safeButtons
        .map((button, index) => {
          const isPrimary = button.tone !== "ghost";
          const style = isPrimary
            ? "background:linear-gradient(135deg, #e8c98a 0%, #f5d796 50%, #d4a755 100%);border:1px solid #e8c98a;color:#070505;box-shadow:0 4px 20px rgba(232,201,138,0.3);"
            : "background:#120e0e;border:1px solid rgba(255,255,255,0.2);color:#ffffff;";

          return `
            <tr>
              <td style="padding:${index === 0 ? "0" : "12px 0 0"};">
                <a href="${escapeHtml(button.href)}" style="display:block;padding:16px 22px;border-radius:999px;text-align:center;text-decoration:none;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.2;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;${style}">
                  ${escapeHtml(button.label)}
                </a>
              </td>
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
}

function panelCard({ title, description = "", bodyHtml = "", accent = "#e8c98a" }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid rgba(255,255,255,0.12);border-radius:24px;background:#110e0e;margin-bottom:16px;">
      <tr>
        <td style="padding:22px 22px 20px;">
          <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.4;letter-spacing:0.2em;text-transform:uppercase;font-weight:900;color:${escapeHtml(
            accent,
          )};">
            ${escapeHtml(title)}
          </div>
          ${
            description
              ? `<div style="padding-top:8px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">${escapeHtml(
                  description,
                )}</div>`
              : ""
          }
          ${
            bodyHtml
              ? `<div style="padding-top:${description ? "16px" : "12px"};">${bodyHtml}</div>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;
}

function brandEmailShell({
  eyebrow,
  title,
  subtitle,
  bodyHtml,
  accent = "#e8c98a",
  preheader = "",
}) {
  const safePreheader = escapeHtml(preheader || subtitle || "");

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#070505;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#070505;">
      <tr>
        <td align="center" style="padding:30px 14px 40px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;max-width:620px;">
            <tr>
              <td style="padding-bottom:16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="height:4px;border-radius:999px;background:linear-gradient(90deg, #e8c98a 0%, #ffd700 50%, #99793d 100%);font-size:0;line-height:0;">
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid rgba(232,201,138,0.2);border-radius:28px;background:#0d0a0a;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.8);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:32px 30px 28px;background:
                      radial-gradient(circle at top left, rgba(232,201,138,0.18), transparent 40%),
                      radial-gradient(circle at top right, rgba(153,121,61,0.15), transparent 35%),
                      #120e0e;border-bottom:1px solid rgba(255,255,255,0.08);">
                      ${brandWordmark()}
                      <div style="padding-top:20px;">
                        ${emailBadge(eyebrow, accent)}
                      </div>
                      <div style="padding-top:20px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:32px;line-height:1.1;font-weight:900;letter-spacing:-0.02em;color:#ffffff;">
                        ${escapeHtml(title)}
                      </div>
                      <div style="padding-top:12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.68);">
                        ${escapeHtml(subtitle)}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:28px 24px 16px;">
                      ${bodyHtml}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 30px 32px;border-top:1px solid rgba(255,255,255,0.06);font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:rgba(255,255,255,0.4);text-align:center;">
                      <div style="font-weight:800;color:#e8c98a;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:4px;">
                        BRYAN CARS DETAILING · BLACKBOX
                      </div>
                      Louhans (71500), Saône-et-Loire &amp; Région. Atelier &amp; A Domicile.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function normalizeAttachmentName(name) {
  if (typeof name !== "string" || !name.trim()) {
    return "attachment.txt";
  }

  if (name.toLowerCase().endsWith(".json")) {
    return name.replace(/\.json$/i, ".txt");
  }

  return name;
}

async function sendBrevoEmail({ to, subject, html, text, attachments = [] }) {
  if (!BREVO_API_KEY) {
    console.warn("[MAIL] BREVO_API_KEY manquant, email ignore.");
    return false;
  }

  if (!MAIL_FROM_EMAIL) {
    console.warn("[MAIL] MAIL_FROM_EMAIL manquant, email ignore.");
    return false;
  }

  if (!Array.isArray(to) || to.length === 0) {
    console.warn("[MAIL] Aucun destinataire, email ignore.");
    return false;
  }

  try {
    const payload = {
      sender: {
        email: MAIL_FROM_EMAIL,
        name: MAIL_FROM_NAME || "Bryan Cars Detailing",
      },
      to,
      subject,
      htmlContent: html,
      textContent: text,
    };

    if (Array.isArray(attachments) && attachments.length > 0) {
      payload.attachment = attachments.map((attachment) => ({
        name: normalizeAttachmentName(attachment.name),
        content: attachment.contentBase64,
      }));
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || `HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("[MAIL] Erreur Brevo:", error);
    return false;
  }
}

async function sendAdminNotification({
  type,
  client,
  date,
  time,
  location,
  clientNote = null,
  clientImageCount = 0,
  appointmentId = null,
  serviceItems = [],
}) {
  const adminEmail = adminInboxEmail();
  if (!adminEmail) {
    console.warn("[MAIL] MAIL_ADMIN_TO / MAIL_FROM_EMAIL manquant, notif admin ignoree.");
    return false;
  }

  const formattedDate = formatDateFr(date);
  const safeTime = time || "heure non renseignee";
  // Deep-link vers la bonne section admin: les RDV confirmes/avis vont en
  // Livraison, les nouvelles demandes restent en Agenda.
  const adminSectionPath =
    type === "validated" || type === "review" ? "/delivery" : "/appointments";
  const adminBase = `${ADMIN_DASHBOARD_URL}${adminSectionPath}`;
  const adminUrl = appointmentId
    ? `${adminBase}?appointmentId=${appointmentId}&clientId=${client.id}`
    : `${ADMIN_DASHBOARD_URL}?clientId=${client.id}&date=${date}`;
  const fullName = fallbackClientName(client);
  const vehicle = vehicleSummary(client);

  // A domicile : l'adresse du client est mise en avant partout (push + email)
  // pour que l'admin sache immediatement ou se rendre.
  const isDomicile = String(location || "").toLowerCase() === "domicile";
  const addressSummary = [
    client.address_line1 || client.addressLine1,
    [client.postal_code || client.postalCode, client.city]
      .filter((part) => part && String(part).trim() !== "")
      .join(" "),
  ]
    .filter((part) => part && String(part).trim() !== "")
    .join(", ");
  const locationText = isDomicile
    ? `A domicile${addressSummary ? ` — ${addressSummary}` : " (adresse non renseignee)"}`
    : locationLabel(location);

  const action =
    type === "book"
      ? "Nouveau rendez-vous reserve"
      : type === "cancel"
        ? "Rendez-vous annule"
        : type === "validated"
          ? "Tarif accepte - rendez-vous valide"
          : type === "review"
            ? "Nouvel avis client"
            : type === "test"
              ? "Test email admin"
              : "Rendez-vous modifie";

  if (type !== "test") {
    pushAdmin({
      title: action,
      body: `${fullName} · ${formattedDate} ${safeTime}${
        isDomicile ? ` · ${addressSummary || "A domicile"}` : ""
      }`,
      url: adminUrl,
    });
  }

  const subject = `[Bryan Cars] ${action} - ${formattedDate} ${safeTime}`;
  const text = `
${action}

Client : ${fullName}
Telephone : ${client.phone || "-"}
Email : ${client.email || "-"}
Date : ${formattedDate}
Heure : ${safeTime}
Lieu : ${locationText}
Vehicule : ${vehicle}
Prestations : ${Array.isArray(serviceItems) && serviceItems.length > 0 ? serviceItems.map((item) => item.label).join(", ") : "-"}
Commentaire client : ${clientNote || "-"}
Photos client : ${
    clientImageCount > 0
      ? `${clientImageCount} image${clientImageCount > 1 ? "s" : ""}`
      : "-"
  }
Admin : ${adminUrl}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Notification admin",
    title: action,
    subtitle: "Un mouvement vient d'etre enregistre sur le planning Bryan Cars.",
    preheader: `${action} · ${fullName} · ${formattedDate}`,
    bodyHtml: `
      ${metricRows([
        { label: "Client", value: fullName },
        { label: "Date", value: formattedDate },
        { label: "Heure", value: safeTime },
      ])}
      ${panelCard({
        title: "Dossier",
        description: "Les informations utiles sont pretes pour traiter le dossier rapidement.",
        bodyHtml: `
          ${infoRows([
            { label: "Telephone", value: client.phone || "-" },
            { label: "Email", value: client.email || "-" },
            { label: "Lieu", value: locationText },
            ...(isDomicile
              ? [{ label: "Adresse", value: addressSummary || "Non renseignee" }]
              : []),
            { label: "Vehicule", value: vehicle },
            {
              label: "Prestations",
              value:
                Array.isArray(serviceItems) && serviceItems.length > 0
                  ? serviceItems.map((item) => item.label).join(", ")
                  : "-",
            },
            { label: "Commentaire client", value: clientNote || "-" },
            {
              label: "Photos client",
              value:
                clientImageCount > 0
                  ? `${clientImageCount} image${clientImageCount > 1 ? "s" : ""}`
                  : "-",
            },
          ])}
          ${actionButtons([
            { label: "Ouvrir le tableau de bord admin", href: adminUrl, tone: "primary" },
          ])}
        `,
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: adminEmail }],
    subject,
    html,
    text,
  });
}

async function sendAdminPartnerOrderEmail({ order, photoCount = 0 }) {
  const adminEmail = adminInboxEmail();
  if (!adminEmail || !order) return false;
  const adminUrl = `${ADMIN_DASHBOARD_URL}/preparation-vente`;
  const amount = new Intl.NumberFormat("fr-FR", { style: "currency", currency: order.currency || "EUR" }).format((order.amountCents || 0) / 100);
  const title = `Nouvelle préparation vente · ${order.forfaitLabel}`;

  pushAdmin({
    title: "Nouvelle préparation vente",
    body: `${order.customerName || "Client"} · ${order.vehicleModel || "Véhicule"} · ${amount}`,
    url: adminUrl,
  });

  const text = `${title}\n\nClient : ${order.customerName || "-"}\nTéléphone : ${order.customerPhone || "-"}\nE-mail : ${order.customerEmail || "-"}\nVéhicule : ${[order.vehicleModel, order.vehiclePlate].filter(Boolean).join(" · ") || "-"}\nForfait : ${order.forfaitLabel}\nMontant : ${amount}\nPhotos : ${photoCount}\nSource : ${order.partnerLabel || "Lien direct Bryan Cars"}\n\nAdmin : ${adminUrl}`;
  const html = brandEmailShell({
    eyebrow: "Préparation vente",
    title,
    subtitle: "Le client a préparé son dossier et va être redirigé vers le paiement SumUp.",
    preheader: `${order.customerName || "Client"} · ${order.vehicleModel || "Véhicule"}`,
    bodyHtml: panelCard({
      title: "Dossier client",
      bodyHtml: `${infoRows([
        { label: "Client", value: order.customerName || "-" },
        { label: "Téléphone", value: order.customerPhone || "-" },
        { label: "E-mail", value: order.customerEmail || "-" },
        { label: "Véhicule", value: [order.vehicleModel, order.vehiclePlate].filter(Boolean).join(" · ") || "-" },
        { label: "Forfait", value: order.forfaitLabel },
        { label: "Montant", value: amount },
        { label: "Photos", value: String(photoCount) },
        { label: "Source", value: order.partnerLabel || "Lien direct Bryan Cars" },
      ])}${actionButtons([{ label: "Ouvrir Préparation vente", href: adminUrl, tone: "primary" }])}`,
    }),
  });
  return sendBrevoEmail({ to: [{ email: adminEmail }], subject: `[Bryan Cars] ${title}`, html, text });
}

async function sendSignupVerificationCode({ email, code, fullName }) {
  if (!email || !code) return false;

  const subject = "[Bryan Cars] Votre code de validation";
  const text = `
Bonjour ${fullName || ""},

Votre code de validation Bryan Cars est : ${code}

Il est valable quelques minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Validation email",
    title: "Votre code Bryan Cars",
    subtitle: "Entrez ce code sur le site pour finaliser la creation de votre espace client.",
    preheader: `Code de validation ${code}`,
    bodyHtml: `
      ${metricRows([{ label: "Code", value: code }])}
      ${panelCard({
        title: "Creation de compte",
        description:
          "Ce code confirme que l'adresse email vous appartient. Il expire rapidement pour proteger votre acces.",
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email, name: fullName || email }],
    subject,
    html,
    text,
  });
}

async function sendClientPhotosRequestedEmail({ client, appointment, message }) {
  if (!client?.email || !appointment) return false;

  const portalUrl = clientPortalUrl(client);
  const fullName = fallbackClientName(client);
  const formattedDate = formatDateFr(appointment.date);

  pushClient(client, {
    title: "Photos demandees",
    body: `Ajoutez des photos de votre vehicule pour valider le tarif du ${formattedDate}.`,
    appointmentId: appointment.id,
  });

  const subject = `[Bryan Cars] Photos demandees pour votre rendez-vous`;
  const text = `
Bonjour ${fullName},

L'equipe Bryan Cars a besoin de photos de votre vehicule pour valider le tarif du rendez-vous du ${formattedDate}.

Message : ${message || "-"}
Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Action requise",
    title: "Ajoutez des photos du vehicule",
    subtitle:
      "L'admin souhaite verifier l'etat du vehicule avant de confirmer le rendez-vous.",
    preheader: `Photos demandees · ${formattedDate}`,
    bodyHtml: `
      ${panelCard({
        title: "Demande admin",
        description: message || "Ajoutez quelques photos claires du vehicule depuis votre espace client.",
        bodyHtml: actionButtons([
          portalUrl
            ? {
                label: "Ouvrir mon rendez-vous",
                href: clientAppointmentUrl(client, appointment.id),
                tone: "primary",
              }
            : null,
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

async function sendClientPriceApprovalEmail({ client, appointment }) {
  if (!client?.email || !appointment) return false;

  const portalUrl = clientPortalUrl(client);
  const fullName = fallbackClientName(client);
  const formattedDate = formatDateFr(appointment.date);
  const standardPriceCents = Number(appointment.standard_price_cents || 0);
  const approvedPriceCents = Number(appointment.approved_price_cents || 0);
  const proposedPrice = formatEuros(approvedPriceCents);
  const priceComment = appointment.price_comment || appointment.priceComment || null;
  let serviceItems = [];
  try {
    serviceItems = JSON.parse(appointment.service_items_json || "[]");
  } catch (_error) {
    serviceItems = [];
  }
  const quoteExpiry = appointment.quote_expires_at
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(appointment.quote_expires_at * 1000))
    : null;

  pushClient(client, {
    title: "Votre rendez-vous est prêt à être payé",
    body: `Tarif proposé : ${proposedPrice} pour le ${formattedDate}.${
      priceComment ? ` ${priceComment}` : ""
    }`,
    appointmentId: appointment.id,
  });

  const subject = `[Bryan Cars] Validation tarif rendez-vous`;
  const text = `
Bonjour ${fullName},

Votre rendez-vous du ${formattedDate} est prêt à être finalisé.

${serviceItems.length > 0 ? `Prestations : ${serviceItems.map((item) => item.label).join(", ")}\n` : standardPriceCents > 0 ? `Tarif indicatif : ${formatEuros(standardPriceCents)}\n` : ""}Montant à payer : ${proposedPrice}${quoteExpiry ? `\nDevis et créneau réservés jusqu'au ${quoteExpiry}.` : ""}${
    priceComment ? `\nNote de l'admin : ${priceComment}` : ""
  }

Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Validation tarif",
    title: "Finalisez votre rendez-vous",
    subtitle:
      "Le tarif a été validé par l'atelier. Réglez-le en ligne pour confirmer définitivement le rendez-vous.",
    preheader: `${proposedPrice} · ${formattedDate}`,
    bodyHtml: `
      ${metricRows([
        { label: serviceItems.length > 0 ? "Prestations" : "Tarif indicatif", value: serviceItems.length > 0 ? `${serviceItems.length} sélectionnée${serviceItems.length > 1 ? "s" : ""}` : formatEuros(standardPriceCents) },
        { label: "Montant à payer", value: proposedPrice },
      ])}
      ${quoteExpiry ? `<p style="margin:12px 0 0;font-size:13px;line-height:20px;color:#fcd34d;">Devis et créneau réservés jusqu'au ${escapeHtml(quoteExpiry)}.</p>` : ""}
      ${
        priceComment
          ? panelCard({
              title: "Note de l'admin",
              description: "Justification du tarif propose pour ce rendez-vous.",
              bodyHtml: `<p style="margin:0;font-size:14px;line-height:22px;color:#cbd5f5;">${escapeHtml(
                priceComment,
              )}</p>`,
            })
          : ""
      }
      ${actionButtons([
        portalUrl
          ? {
              label: `Finaliser et payer ${proposedPrice}`,
              href: clientAppointmentUrl(client, appointment.id),
              tone: "primary",
            }
          : null,
      ])}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Devis : notification admin à la réception d'une nouvelle demande.
async function sendAdminQuoteRequestEmail({
  client,
  description = null,
  photoCount = 0,
  quoteId = null,
  vehicle: vehicleOverride = null,
  serviceItems = [],
  vehicleConditionScore = null,
}) {
  const fullName = fallbackClientName(client);
  const vehicle = vehicleOverride || vehicleSummary(client);
  const services = Array.isArray(serviceItems)
    ? serviceItems.map((service) => service?.label).filter(Boolean)
    : [];
  const adminUrl = adminQuoteUrl(quoteId);

  pushAdmin({
    title: "Nouvelle demande de devis",
    body: `${fullName}${vehicle ? ` · ${vehicle}` : ""}`,
    url: adminUrl,
  });

  const adminEmail = adminInboxEmail();
  if (!adminEmail) {
    console.warn("[MAIL] MAIL_ADMIN_TO / MAIL_FROM_EMAIL manquant, notif devis admin ignoree.");
    return false;
  }

  const subject = `[Bryan Cars] Nouvelle demande de devis - ${fullName}`;
  const text = `
Nouvelle demande de devis

Client : ${fullName}
Telephone : ${client.phone || "-"}
Vehicule : ${vehicle}
Etat annonce : ${Number.isInteger(vehicleConditionScore) ? `${vehicleConditionScore}/10` : "-"}
Photos : ${photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : "-"}
Prestations : ${services.length > 0 ? services.join(", ") : "-"}
Description : ${description || "-"}

Repondre : ${adminUrl}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Demande de devis",
    title: "Nouvelle demande de devis",
    subtitle: "Un client souhaite recevoir un tarif personnalise pour son vehicule.",
    preheader: `Devis · ${fullName}`,
    bodyHtml: `
      ${metricRows([
        { label: "Client", value: fullName },
        {
          label: "Photos",
          value: photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : "-",
        },
      ])}
      ${panelCard({
        title: "Demande",
        description: "Definissez le montant en euros depuis votre tableau de bord.",
        bodyHtml: `
          ${infoRows([
            { label: "Telephone", value: client.phone || "-" },
            { label: "Vehicule", value: vehicle },
            {
              label: "Etat annonce",
              value: Number.isInteger(vehicleConditionScore) ? `${vehicleConditionScore}/10` : "-",
            },
            { label: "Prestations", value: services.length > 0 ? services.join(", ") : "-" },
            { label: "Description", value: description || "-" },
          ])}
          ${actionButtons([{ label: "Chiffrer ce devis", href: adminUrl, tone: "primary" }])}
        `,
      })}
    `,
  });

  return sendBrevoEmail({ to: [{ email: adminEmail }], subject, html, text });
}

// Devis : notification client quand l'admin a fixe le montant exact.
async function sendClientQuoteAnsweredEmail({
  client,
  quoteId = null,
  estimatedPriceCents,
  amountDueCents = estimatedPriceCents,
  discountPercent = 0,
  discountCents = 0,
  adminComment = null,
}) {
  const basePrice = formatEuros(estimatedPriceCents);
  const price = formatEuros(amountDueCents);
  const hasDiscount = Number(discountCents) > 0;
  const fullName = fallbackClientName(client);
  const targetUrl = clientQuoteUrl(client, quoteId);

  pushClient(client, {
    title: "Votre devis est prêt",
    body: hasDiscount
      ? `Votre remise de ${discountPercent} % est appliquée : ${price} à régler.`
      : `Montant proposé : ${price} pour votre véhicule.`,
    quoteId,
  });

  if (!client?.email) return false;

  const subject = `[Bryan Cars] Votre devis est prêt`;
  const text = `
Bonjour ${fullName},

Votre demande de devis a reçu une réponse.

${hasDiscount ? `Montant initial : ${basePrice}\nRemise parrainage (${discountPercent} %) : -${formatEuros(discountCents)}\n` : ""}Montant à régler : ${price}${adminComment ? `\nNote de l'admin : ${adminComment}` : ""}

Consultez votre devis, puis payez-le ou refusez-le depuis votre espace : ${targetUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Votre devis",
    title: "Devis prêt",
    subtitle: "Voici le montant personnalise propose pour votre véhicule.",
    preheader: `${price} · devis disponible`,
    bodyHtml: `
      ${metricRows(hasDiscount
        ? [
            { label: "Montant initial", value: basePrice },
            { label: `Remise parrainage (${discountPercent} %)`, value: `-${formatEuros(discountCents)}` },
            { label: "Montant à régler", value: price },
          ]
        : [{ label: "Montant à régler", value: price }])}
      ${
        adminComment
          ? panelCard({
              title: "Note de Bryan Cars",
              description: "Précisions sur le devis de votre véhicule :",
              bodyHtml: `<p style="margin:0;font-size:14px;line-height:22px;color:#f1ede6;font-family:'Segoe UI',sans-serif;">${escapeHtml(
                adminComment,
              )}</p>`,
            })
          : ""
      }
      ${actionButtons([
        targetUrl ? { label: "Voir mon devis", href: targetUrl, tone: "primary" } : null,
      ])}
    `,
  });

  return sendBrevoEmail({ to: [{ email: client.email, name: fullName }], subject, html, text });
}

function refusalReasonLabel(reason) {
  const labels = {
    trop_cher: "Tarif trop élevé / hors budget",
    delai_incompatible: "Délai ou disponibilité incompatible",
    autre_prestataire: "Choix d'un autre prestataire",
    changement_avis: "Changement d'avis",
    autre: "Autre raison",
  };
  return labels[reason] || reason || "Non précisé";
}

async function sendAdminQuoteRefusedEmail({ client, quote }) {
  const reason = refusalReasonLabel(quote?.refusalReason);
  const adminUrl = adminQuoteUrl(quote?.id);
  pushAdmin({
    title: "Devis refusé",
    body: `${fallbackClientName(client)} · ${reason}`,
    url: `/admin/devis?quoteId=${quote?.id || ""}`,
  });

  const adminEmail = adminInboxEmail();
  if (!adminEmail) return false;
  const text = `Devis refusé par ${fallbackClientName(client)}.\n\nMotif : ${reason}${quote?.refusalComment ? `\nCommentaire : ${quote.refusalComment}` : ""}\n\nAdmin : ${adminUrl}`;
  const html = brandEmailShell({
    eyebrow: "Décision client",
    title: "Un devis a été refusé",
    subtitle: `${escapeHtml(fallbackClientName(client))} a décliné la proposition.`,
    preheader: reason,
    bodyHtml: `${metricRows([{ label: "Motif", value: reason }])}${
      quote?.refusalComment
        ? panelCard({ title: "Commentaire", description: quote.refusalComment })
        : ""
    }${actionButtons([{ label: "Ouvrir le devis", href: adminUrl, tone: "primary" }])}`,
  });
  return sendBrevoEmail({
    to: [{ email: adminEmail }],
    subject: `[Bryan Cars] Devis refusé par ${fallbackClientName(client)}`,
    html,
    text,
  });
}

async function sendQuotePaidNotifications({ client, quote }) {
  const amount = formatEuros(quote?.amountDueCents || quote?.estimatedPriceCents || 0);
  const fullName = fallbackClientName(client);
  const clientUrl = clientQuoteUrl(client, quote?.id);
  const adminUrl = adminQuoteUrl(quote?.id);

  pushClient(client, {
    title: "Paiement reçu",
    body: `${amount} reçu. Choisissez maintenant votre disponibilité.`,
    quoteId: quote?.id,
  });
  pushAdmin({
    title: "Devis payé",
    body: `${fullName} · ${amount} · en attente de planification`,
    url: `/admin/devis?quoteId=${quote?.id || ""}`,
  });

  const sends = [];
  if (client?.email) {
    sends.push(
      sendBrevoEmail({
        to: [{ email: client.email, name: fullName }],
        subject: `[Bryan Cars] Paiement reçu — choisissez votre créneau`,
        text: `Bonjour ${fullName},\n\nVotre paiement de ${amount} a bien été reçu. Vous pouvez maintenant choisir votre jour, votre demi-journée, votre heure et le lieu de l'intervention : ${clientUrl || "Lien indisponible"}`,
        html: brandEmailShell({
          eyebrow: "Paiement confirmé",
          title: "Choisissez votre disponibilité",
          subtitle: `Votre devis de ${amount} est payé. Il ne reste plus qu'à planifier l'intervention.`,
          preheader: `${amount} reçu`,
          bodyHtml: `${metricRows([{ label: "Montant payé", value: amount }])}${actionButtons([
            clientUrl ? { label: "Choisir mon créneau", href: clientUrl, tone: "primary" } : null,
          ])}`,
        }),
      }),
    );
  }
  const adminEmail = adminInboxEmail();
  if (adminEmail) {
    sends.push(
      sendBrevoEmail({
        to: [{ email: adminEmail }],
        subject: `[Bryan Cars] Devis payé par ${fullName}`,
        text: `${fullName} a payé son devis de ${amount}. Le client doit maintenant choisir son créneau.\n\nAdmin : ${adminUrl}`,
        html: brandEmailShell({
          eyebrow: "Devis payé",
          title: "Paiement reçu",
          subtitle: `${escapeHtml(fullName)} peut maintenant planifier son intervention.`,
          preheader: `${amount} reçu`,
          bodyHtml: `${metricRows([
            { label: "Client", value: fullName },
            { label: "Montant", value: amount },
          ])}${actionButtons([{ label: "Ouvrir le devis", href: adminUrl, tone: "primary" }])}`,
        }),
      }),
    );
  }
  return Promise.allSettled(sends);
}

async function sendReferralRewardAvailableNotification({ client }) {
  if (!client?.id) return false;
  const portalUrl = clientPortalUrl(client);
  const targetUrl = portalUrl
    ? `${portalUrl}${portalUrl.includes("?") ? "&" : "?"}view=account`
    : null;
  const fullName = fallbackClientName(client);

  pushClient(client, {
    title: "Votre remise de parrainage est prête",
    body: "Votre invité a réglé son devis : 10 % seront déduits de votre prochain devis.",
  });

  if (!client.email) return true;
  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject: "[Bryan Cars] Votre remise de parrainage de 10 % est disponible",
    text: `Bonjour ${fullName},\n\nVotre invité a réglé son devis. Votre remise de 10 % sera automatiquement appliquée à votre prochain devis Bryan Cars.${targetUrl ? `\n\nVoir mon compte : ${targetUrl}` : ""}`,
    html: brandEmailShell({
      eyebrow: "Parrainage validé",
      title: "10 % sur votre prochain devis",
      subtitle: "Votre invité a payé son devis : votre récompense est maintenant disponible.",
      preheader: "Votre remise Bryan Cars est prête",
      bodyHtml: `${metricRows([{ label: "Votre récompense", value: "-10 %" }])}${actionButtons([
        targetUrl ? { label: "Voir mon compte", href: targetUrl, tone: "primary" } : null,
      ])}`,
    }),
  });
}

async function sendClientQuoteReminderEmail({ client, quote, isSecondReminder = false }) {
  const estimatedPriceCents = Number(quote?.amountDueCents || quote?.estimatedPriceCents) || 0;
  const legacyCredits = Number(quote?.estimatedCredits) || 0;
  const quoteValue = estimatedPriceCents > 0
    ? formatEuros(estimatedPriceCents)
    : `${legacyCredits} crédit${legacyCredits > 1 ? "s" : ""} (devis historique)`;
  const fullName = fallbackClientName(client);
  const targetUrl = clientQuoteUrl(client, quote?.id);

  const titleText = isSecondReminder
    ? "Dernier rappel : Votre devis Bryan Cars"
    : "Rappel : Votre devis Bryan Cars vous attend";

  pushClient(client, {
    title: titleText,
    body: `Montant : ${quoteValue}. Payez ou refusez directement depuis votre espace.`,
    quoteId: quote?.id,
  });

  if (!client?.email) return false;

  const subject = isSecondReminder
    ? `[Bryan Cars] Dernière relance pour votre devis (${quoteValue})`
    : `[Bryan Cars] Rappel de votre devis pour votre véhicule`;

  const text = `
Bonjour ${fullName},

${isSecondReminder ? "Ceci est une dernière relance concernant" : "Nous vous rappelons que"} votre devis de ${quoteValue} pour votre véhicule est toujours en attente de votre décision.

Vous pouvez payer ou refuser ce devis directement depuis votre espace : ${targetUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: isSecondReminder ? "Dernier rappel devis" : "Rappel devis",
    title: isSecondReminder ? "Dernière relance pour votre devis" : "Votre devis en attente",
    subtitle: isSecondReminder
      ? "Votre devis attend votre décision. Souhaitez-vous le payer ou le décliner ?"
      : "Votre devis sur-mesure pour votre véhicule est disponible. Vous pouvez le payer ou le refuser en un clic.",
    preheader: `Devis ${quoteValue}`,
    bodyHtml: `
      ${metricRows([
        { label: "Montant", value: quoteValue },
      ])}
      ${actionButtons([
        targetUrl ? { label: "Consulter mon devis", href: targetUrl, tone: "primary" } : null,
      ])}
    `,
  });

  return sendBrevoEmail({ to: [{ email: client.email, name: fullName }], subject, html, text });
}

async function sendAdminAppointmentReminderEmail({ appointment, client }) {
  const adminEmail = adminInboxEmail();
  if (!adminEmail || !appointment || !client) {
    return false;
  }

  const fullName = fallbackClientName(client);
  const formattedDate = formatDateFr(appointment.date);
  const safeTime = appointment.time || "heure non renseignee";
  const slotLabel = appointmentSlotLabel(appointment.slot, appointment.time);
  const slotWindow = appointmentWindowLabel(appointment.slot, appointment.time);
  const vehicle = vehicleSummary(appointment);
  const place = locationLabel(appointment.location);
  const clientNote = appointment.client_note || appointment.clientNote || null;
  const adminUrl = `${ADMIN_DASHBOARD_URL}?clientId=${client.id}&appointmentId=${appointment.id}`;

  pushAdmin({
    title: "Rappel: rendez-vous demain",
    body: `${fullName} · ${formattedDate} ${safeTime} · ${vehicle}`,
    url: adminUrl,
  });

  const subject = `[Bryan Cars] Rappel demain - ${safeTime} - ${fullName}`;
  const text = `
Rappel rendez-vous demain

Client : ${fullName}
Date : ${formattedDate}
Creneau : ${slotLabel} ${slotWindow}
Heure : ${safeTime}
Lieu : ${place}
Vehicule : ${vehicle}
Telephone : ${client.phone || "-"}
Email : ${client.email || "-"}
Commentaire client : ${clientNote || "-"}
Admin : ${adminUrl}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Rappel admin J-1",
    title: "Demain, un rendez-vous vous attend",
    subtitle:
      "Voici le rappel complet du prochain passage pour garder le planning sous controle sans rien oublier.",
    preheader: `Demain ${safeTime} · ${fullName} · ${vehicle}`,
    bodyHtml: `
      ${metricRows([
        { label: "Client", value: fullName },
        { label: "Heure", value: safeTime },
        { label: "Creneau", value: `${slotLabel} ${slotWindow}` },
      ])}
      ${panelCard({
        title: "Resume du dossier",
        description: "Toutes les infos utiles du rendez-vous de demain au meme endroit.",
        bodyHtml: `
          ${infoRows([
            { label: "Date", value: formattedDate },
            { label: "Lieu", value: place },
            { label: "Vehicule", value: vehicle },
            { label: "Telephone", value: client.phone || "-" },
            { label: "Email", value: client.email || "-" },
            { label: "Commentaire client", value: clientNote || "-" },
          ])}
          ${actionButtons([
            { label: "Ouvrir le rendez-vous dans l'admin", href: adminUrl, tone: "primary" },
          ])}
        `,
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: adminEmail }],
    subject,
    html,
    text,
  });
}

async function sendClientFormulaRecap(client) {
  if (!client?.email) {
    console.warn("[MAIL] Email client absent, recap formule ignore.");
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const termsUrl = clientTermsUrl(client);
  const acceptedAt = formatUnixDateTimeFr(
    client.terms_accepted_at ?? client.termsAcceptedAt,
  );

  pushClient(client, {
    title: "Votre espace est a jour",
    body: "Retrouvez vos rendez-vous, paiements et avantages Bryan Cars.",
  });

  const subject = "[Bryan Cars] Votre espace client";
  const text = `
Bonjour ${fullName},

Votre espace Bryan Cars est actif.

Conditions acceptees le : ${acceptedAt}
Espace client : ${portalUrl || "Lien indisponible"}
Conditions et reglement : ${termsUrl || portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Espace client",
    title: "Votre espace Bryan Cars",
    subtitle: "Vos rendez-vous, paiements, photos et avantages sont centralises ici.",
    preheader: "Votre espace client est actif",
    bodyHtml: `
      ${metricRows([
        { label: "Statut", value: "Acces actif" },
        { label: "Conditions", value: acceptedAt },
      ])}
      ${panelCard({
        title: "Validite et acces",
        description: "Tout est centralise ici pour garder votre suivi clair en quelques secondes.",
        bodyHtml: `
          ${infoRows([
            { label: "Conditions acceptees le", value: acceptedAt },
            { label: "Espace client", value: portalUrl || "Lien indisponible" },
          ])}
          ${actionButtons([
            portalUrl ? { label: "Ouvrir mon espace client", href: portalUrl, tone: "primary" } : null,
            termsUrl ? { label: "Relire les conditions", href: termsUrl, tone: "ghost" } : null,
          ])}
        `,
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

async function sendClientWelcomeEmail(client) {
  if (!client?.email) {
    console.warn("[MAIL] Email client absent, welcome ignore.");
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const founder = !!(client.is_founder || client.isFounder);
  const founderImage = absoluteUrlMaybe(client.founder_media_url || client.founderMediaUrl);

  pushClient(client, {
    title: "Bienvenue chez Bryan Cars",
    body: "Votre espace client est pret. Activez les notifications pour suivre vos rendez-vous.",
  });

  const title = founder
    ? "Bienvenue dans l'espace Fondateur Bryan Cars"
    : "Bienvenue chez Bryan Cars Detailing";
  const subtitle = founder
    ? "Votre acces fondateur est pret avec une experience premium dediee."
    : "Votre acces client est pret pour suivre vos rendez-vous, paiements, photos et avantages.";
  const subject = founder
    ? "[Bryan Cars] Bienvenue Fondateur"
    : "[Bryan Cars] Bienvenue dans votre espace client";

  const text = `
Bonjour ${fullName},

${title}

Lien d'acces : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: founder ? "Membre fondateur" : "Bienvenue",
    title,
    subtitle,
    accent: founder ? "#ffe08a" : "#f7b955",
    preheader: title,
    bodyHtml: `
      ${
        founderImage
          ? panelCard({
              title: founder ? "Signature fondateur" : "Univers Bryan Cars",
              bodyHtml: `
                <img alt="Bryan Cars" src="${escapeHtml(
                  founderImage,
                )}" style="display:block;width:100%;height:auto;border:1px solid rgba(255,255,255,0.08);border-radius:20px;" />
              `,
              accent: founder ? "#ffe08a" : "#f7b955",
            })
          : ""
      }
      ${metricRows([
        { label: "Espace", value: founder ? "Fondateur" : "Client" },
        { label: "Statut", value: "Acces actif" },
      ])}
      ${panelCard({
        title: "Votre acces est pret",
        description:
          "Vous pouvez maintenant consulter votre carte, vos passages, vos photos et vos prochains creneaux depuis votre espace Bryan Cars.",
        bodyHtml: `
          ${actionButtons([
            portalUrl ? { label: "Ouvrir mon espace", href: portalUrl, tone: "primary" } : null,
          ])}
        `,
        accent: founder ? "#ffe08a" : "#f7b955",
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

async function sendClientAppointmentStatusEmail({ client, appointment, eventType }) {
  if (!client?.email || !appointment) {
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const formattedDate = formatDateFr(appointment.date);
  const safeTime = appointment.time || "heure non renseignee";
  const slot = appointmentSlotLabel(appointment.slot, appointment.time);
  const windowLabel = appointmentWindowLabel(appointment.slot, appointment.time);
  const vehicle = vehicleSummary(appointment);
  const place = locationLabel(appointment.location);
  const isDone = eventType === "done";
  const isReverted = eventType === "reverted";
  // BC'Coins credites a la cloture selon le montant reellement paye.
  const earnedBc = Math.max(0, Number(appointment.bc_points_granted || 0));

  pushClient(client, {
    title: isReverted
      ? "Rendez-vous a revalider"
      : isDone
        ? "Prestation terminee"
        : "Rendez-vous confirme",
    body: isReverted
      ? `Votre rendez-vous du ${formattedDate} est repasse en attente: le tarif doit etre revalide.`
      : isDone
        ? `Votre passage du ${formattedDate} est cloture. Consultez vos photos et laissez un avis.`
        : `Votre rendez-vous du ${formattedDate} (${slot}) est confirme.`,
    appointmentId: appointment.id,
  });

  const title = isReverted
    ? "Votre rendez-vous est repasse en attente"
    : isDone
      ? "Votre prestation est terminee"
      : "Votre rendez-vous est confirme";
  const subtitle = isReverted
    ? "L'equipe Bryan Cars doit revalider le tarif de ce rendez-vous. Aucun nouveau paiement n'est demande tant que le tarif n'est pas pret."
    : isDone
      ? "Votre passage est maintenant cloture. Vous pouvez consulter vos photos, votre suivi et laisser votre avis."
      : "Votre creneau vient d'etre valide par l'equipe Bryan Cars. Tout est pret pour votre passage.";
  const subject = isReverted
    ? `[Bryan Cars] Rendez-vous a revalider - ${formattedDate}`
    : isDone
      ? `[Bryan Cars] Prestation terminee - ${formattedDate}`
      : `[Bryan Cars] Rendez-vous confirme - ${formattedDate}`;

  const text = `
Bonjour ${fullName},

${title}

Date : ${formattedDate}
Creneau : ${slot} ${windowLabel}
Heure : ${safeTime}
Lieu : ${place}
Vehicule : ${vehicle}
${earnedBc > 0 ? `BC'Coins gagnes : ${earnedBc} BC` : ""}
Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: isReverted ? "Tarif a revalider" : isDone ? "Prestation cloturee" : "Rendez-vous confirme",
    title,
    subtitle,
    accent: isReverted ? "#f7b955" : isDone ? "#2ca2ff" : "#f7b955",
    preheader: `${title} · ${formattedDate} · ${slot}`,
    bodyHtml: `
      ${metricRows([
        { label: "Date", value: formattedDate },
        { label: "Creneau", value: `${slot} ${windowLabel}` },
        { label: "Heure", value: safeTime },
      ])}
      ${panelCard({
        title: isDone ? "Suivi de prestation" : "Resume du passage",
        description: isDone
          ? "Votre dossier est pret dans votre espace client avec les photos publiees, le suivi et votre zone d'avis."
          : "Retrouvez ci-dessous le recapitulatif utile de votre prochain passage.",
        bodyHtml: `
          ${infoRows([
            { label: "Lieu", value: place },
            { label: "Vehicule", value: vehicle },
            earnedBc > 0 ? { label: "BC'Coins gagnes", value: `${earnedBc} BC` } : null,
          ])}
          ${actionButtons([
            portalUrl
              ? {
                  label: isDone ? "Voir mon suivi et laisser mon avis" : "Ouvrir mon rendez-vous",
                  href: clientAppointmentUrl(client, appointment.id),
                  tone: "primary",
                }
              : null,
          ])}
        `,
        accent: isDone ? "#2ca2ff" : "#f7b955",
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

async function sendClientAppointmentReminderEmail({ client, appointment }) {
  if (!client?.email || !appointment) {
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const formattedDate = formatDateFr(appointment.date);
  const safeTime = appointment.time || "heure non renseignee";
  const slot = appointmentSlotLabel(appointment.slot, appointment.time);
  const windowLabel = appointmentWindowLabel(appointment.slot, appointment.time);
  const vehicle = vehicleSummary(appointment);
  const place = locationLabel(appointment.location);

  pushClient(client, {
    title: "Rappel: rendez-vous demain",
    body: `Demain ${formattedDate} - ${slot} (${safeTime}) - ${place}.`,
    appointmentId: appointment.id,
  });

  const subject = `[Bryan Cars] Rappel de rendez-vous demain - ${formattedDate}`;
  const text = `
Bonjour ${fullName},

Rappel de votre rendez-vous demain.

Date : ${formattedDate}
Creneau : ${slot} ${windowLabel}
Heure : ${safeTime}
Lieu : ${place}
Vehicule : ${vehicle}
Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Rappel client J-1",
    title: "Votre rendez-vous est demain",
    subtitle:
      "Un rappel simple et clair pour garder en tete votre prochain passage Bryan Cars.",
    preheader: `Demain ${safeTime} · ${slot} · ${vehicle}`,
    bodyHtml: `
      ${metricRows([
        { label: "Date", value: formattedDate },
        { label: "Heure", value: safeTime },
        { label: "Lieu", value: place },
      ])}
      ${panelCard({
        title: "Resume du rendez-vous",
        description: "Retrouvez votre creneau, votre vehicule et votre acces client juste ici.",
        bodyHtml: `
          ${infoRows([
            { label: "Creneau", value: `${slot} ${windowLabel}` },
            { label: "Vehicule", value: vehicle },
          ])}
          ${actionButtons([
            portalUrl
              ? {
                  label: "Ouvrir mon rendez-vous",
                  href: clientAppointmentUrl(client, appointment.id),
                  tone: "primary",
                }
              : null,
          ])}
        `,
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Relance d'inactivite: "ca fait X semaines depuis ton dernier detailing".
// Push best-effort vers la reservation + email mis en forme.
async function sendClientInactivityReminderEmail({ client, weeksSince }) {
  if (!client?.email) {
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const bookingUrl = portalUrl ? `${portalUrl}?view=booking` : "";
  const weeks = Math.max(1, Math.round(Number(weeksSince) || 8));

  try {
    await sendClientPush(client.id, {
      title: "On s'occupe de ta voiture ?",
      body: `Ca fait ${weeks} semaines depuis ton dernier detailing. Reserve ton prochain creneau en quelques secondes.`,
      url: bookingUrl || "/",
    });
  } catch (_error) {
    // push best-effort
  }

  const subject = `[Bryan Cars] Ta voiture merite un nouveau detailing`;
  const text = `
Bonjour ${fullName},

Ca fait environ ${weeks} semaines depuis ton dernier passage chez Bryan Cars.
Quand tu veux, reserve ton prochain detailing depuis ton espace client.

Reserver : ${bookingUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "On pense a toi",
    title: "Ta voiture merite un nouveau detailing",
    subtitle: `Ca fait environ ${weeks} semaines depuis ton dernier passage. On te garde un creneau quand tu veux.`,
    preheader: `${weeks} semaines depuis ton dernier detailing`,
    bodyHtml: `
      ${panelCard({
        title: "Reprends rendez-vous",
        description: "Choisis un creneau en quelques secondes depuis ton espace client.",
        bodyHtml: actionButtons([
          bookingUrl ? { label: "Reserver mon detailing", href: bookingUrl, tone: "primary" } : null,
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Liste d'attente: un creneau s'est libere -> on previent les inscrits.
async function sendWaitlistSlotFreedEmail({ client, date, slot }) {
  if (!client?.email) {
    return false;
  }

  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const bookingUrl = portalUrl ? `${portalUrl}?view=booking` : "";
  const formattedDate = formatDateFr(date);
  const windowLabel = appointmentWindowLabel(slot);
  const slotName = normalizeAppointmentSlot(slot) === "afternoon" ? "apres-midi" : "matin";

  try {
    await sendClientPush(client.id, {
      title: "Un creneau s'est libere !",
      body: `Le ${slotName} du ${formattedDate} (${windowLabel}) est de nouveau disponible. Premier arrive, premier servi !`,
      url: bookingUrl || "/",
    });
  } catch (_error) {
    // push best-effort
  }

  const subject = `[Bryan Cars] Un creneau s'est libere le ${formattedDate}`;
  const text = `
Bonjour ${fullName},

Bonne nouvelle : le creneau du ${formattedDate} (${slotName}, ${windowLabel}) pour lequel
tu etais en liste d'attente vient de se liberer.

Premier arrive, premier servi : reserve vite depuis ton espace client.
Reserver : ${bookingUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Liste d'attente",
    title: "Un creneau s'est libere !",
    subtitle: `Le ${slotName} du ${formattedDate} (${windowLabel}) est de nouveau disponible.`,
    preheader: `Creneau libre · ${formattedDate} · ${slotName}`,
    bodyHtml: `
      ${panelCard({
        title: "Premier arrive, premier servi",
        description:
          "Plusieurs personnes sont prevenues en meme temps : reserve vite pour securiser ce creneau.",
        bodyHtml: actionButtons([
          bookingUrl ? { label: "Reserver ce creneau", href: bookingUrl, tone: "primary" } : null,
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Demande d'avis ~72h apres une prestation effectuee. Redirige directement
// vers la fiche du RDV, section avis (?appointmentId=N&review=1).
async function sendClientReviewRequestEmail({ client, appointment }) {
  if (!client?.email || !appointment) {
    return false;
  }
  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const formattedDate = formatDateFr(appointment.date);
  const reviewUrl = portalUrl ? `${portalUrl}?appointmentId=${appointment.id}&review=1` : "";

  try {
    await sendClientPush(client.id, {
      title: "Ton avis nous interesse",
      body: `Comment s'est passe ton detailing du ${formattedDate} ? Laisse une note en 10 secondes.`,
      url: reviewUrl || "/",
    });
  } catch (_error) {
    // push best-effort
  }

  const subject = `[Bryan Cars] Ton avis sur ton detailing du ${formattedDate}`;
  const text = `
Bonjour ${fullName},

Comment s'est passe ton detailing du ${formattedDate} ?
Laisse-nous une note (et un petit mot si tu veux), ca nous aide enormement.

Laisser mon avis : ${reviewUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Ton avis",
    title: "Comment s'est passe ton detailing ?",
    subtitle: `Ton retour sur le passage du ${formattedDate} nous aide a nous ameliorer.`,
    preheader: "Laisse ta note en 10 secondes",
    bodyHtml: `
      ${panelCard({
        title: "Note ta prestation",
        description: "Une note (et un mot si tu veux), directement sur ta fiche de rendez-vous.",
        bodyHtml: actionButtons([
          reviewUrl ? { label: "Laisser mon avis", href: reviewUrl, tone: "primary" } : null,
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Recap annuel "Ton annee Bryan Cars".
async function sendClientYearRecapEmail({ client, recap }) {
  if (!client?.email) {
    return false;
  }
  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const bookingUrl = portalUrl ? `${portalUrl}?view=booking` : "";
  const year = recap?.year || new Date().getFullYear();

  const subject = `[Bryan Cars] Ton annee ${year} en un coup d'oeil`;
  const text = `
Bonjour ${fullName},

Ton annee ${year} chez Bryan Cars :
- ${recap.visits} prestation(s) realisee(s)
- ${formatEuros(recap.amountPaidCents)} regles en ligne
- ${recap.bcEarned} BC'Coins gagnes

Merci pour ta confiance ! Reserve ton prochain detailing : ${bookingUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: `Recap ${year}`,
    title: `Ton annee ${year} chez Bryan Cars`,
    subtitle: "Merci pour ta confiance cette annee. Voici ton recap perso.",
    preheader: `${recap.visits} prestations · ${recap.bcEarned} BC'Coins`,
    bodyHtml: `
      ${metricRows([
        { label: "Prestations", value: String(recap.visits) },
        { label: "Paiements", value: formatEuros(recap.amountPaidCents) },
        { label: "BC'Coins gagnes", value: String(recap.bcEarned) },
      ])}
      ${panelCard({
        title: "Et l'annee prochaine ?",
        description:
          "On garde ta voiture impeccable. Reserve ton prochain detailing quand tu veux.",
        bodyHtml: actionButtons([
          bookingUrl ? { label: "Reserver mon detailing", href: bookingUrl, tone: "primary" } : null,
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

// Email groupe libre (composer admin): titre + corps (paragraphes) + bouton.
async function sendBroadcastEmail({ client, subject, title, body, buttonLabel, buttonUrl }) {
  if (!client?.email) {
    return false;
  }
  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const btnUrl = buttonUrl ? absoluteUrlMaybe(buttonUrl) : portalUrl || "";
  const paragraphs = String(body || "")
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== "")
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#cbd5f5;">${escapeHtml(
          p,
        ).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  const html = brandEmailShell({
    eyebrow: "Bryan Cars",
    title: title || "Bryan Cars",
    subtitle: "",
    preheader: title || subject || "Bryan Cars",
    bodyHtml: `
      ${panelCard({
        title: title || "Information",
        description: "",
        bodyHtml:
          paragraphs +
          (buttonLabel && btnUrl
            ? actionButtons([{ label: buttonLabel, href: btnUrl, tone: "primary" }])
            : ""),
      })}
    `,
  });

  const text = `${title ? `${title}\n\n` : ""}${body || ""}${
    buttonLabel && btnUrl ? `\n\n${buttonLabel} : ${btnUrl}` : ""
  }`.trim();

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject: subject || `[Bryan Cars] ${title || "Information"}`,
    html,
    text,
  });
}

// Annonce d'evenement (lancement / fin) a l'audience concernee.
async function sendEventAnnouncementEmail({ client, event, kind }) {
  if (!client?.email) {
    return false;
  }
  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const launch = kind !== "end";
  const prize = event.prize_text || event.prizeText || "";
  const subject = launch
    ? `[Bryan Cars] Nouvel evenement : ${event.title}`
    : `[Bryan Cars] Evenement termine : ${event.title}`;
  const title = launch ? event.title : `${event.title} — termine`;
  const subtitle = launch
    ? event.description || "Un nouvel evenement vient de commencer !"
    : "Merci a tous les participants !";

  const html = brandEmailShell({
    eyebrow: launch ? "Nouvel evenement" : "Evenement termine",
    title,
    subtitle,
    preheader: launch ? `A gagner : ${prize || "des recompenses"}` : "Resultats de l'evenement",
    bodyHtml: `
      ${panelCard({
        title: launch ? "Participe des maintenant" : "C'est termine",
        description: launch && prize ? `A gagner : ${prize}` : "",
        bodyHtml: actionButtons([
          portalUrl
            ? {
                label: launch ? "Voir l'evenement" : "Ouvrir mon espace",
                href: portalUrl,
                tone: "primary",
              }
            : null,
        ]),
      })}
    `,
  });

  const text = `${title}\n\n${subtitle}${
    launch && prize ? `\n\nA gagner : ${prize}` : ""
  }\n\n${portalUrl || ""}`.trim();

  return sendBrevoEmail({
    to: [{ email: client.email, name: fullName }],
    subject,
    html,
    text,
  });
}

async function sendAdminRewardRedemption({ client, reward }) {
  if (!MAIL_ADMIN_TO) {
    console.warn("[MAIL] MAIL_ADMIN_TO manquant, redemption ignoree.");
    return false;
  }

  const fullName = fallbackClientName(client);

  pushAdmin({
    title: "Demande BC'Coins",
    body: `${fullName} · ${reward.label} (${reward.pointsCost} pts)`,
    url: `${ADMIN_DASHBOARD_URL || "/admin"}?clientId=${client.id}`,
  });

  const subject = `[Bryan Cars] Nouvelle redemption BC'Coins - ${fullName}`;
  const text = `
Nouvelle redemption BC'Coins

Client : ${fullName}
Telephone : ${client.phone || "-"}
Email : ${client.email || "-"}
Reward : ${reward.label}
Points : ${reward.pointsCost}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "BC'Coins",
    title: "Nouvelle redemption client",
    subtitle: "Un client vient de demander un cadeau ou un avantage depuis la boutique BC'Coins.",
    preheader: `${fullName} · ${reward.label}`,
    bodyHtml: `
      ${metricRows([
        { label: "Client", value: fullName },
        { label: "Reward", value: reward.label },
        { label: "Points", value: String(reward.pointsCost) },
      ])}
      ${panelCard({
        title: "Coordonnees",
        description: "Utilisez ces informations pour traiter la demande rapidement.",
        bodyHtml: infoRows([
          { label: "Telephone", value: client.phone || "-" },
          { label: "Email", value: client.email || "-" },
        ]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: MAIL_ADMIN_TO }],
    subject,
    html,
    text,
  });
}

async function sendAdminDataExportEmail({ fileName, buffer, triggerType = "weekly" }) {
  if (!MAIL_ADMIN_TO) {
    console.warn("[MAIL] MAIL_ADMIN_TO manquant, export ignore.");
    return false;
  }

  const label = triggerType === "weekly" ? "Export hebdomadaire" : "Export manuel";
  const normalizedFileName = normalizeAttachmentName(fileName);
  const subject = `[Bryan Cars] ${label} des donnees`;

  const html = brandEmailShell({
    eyebrow: "Sauvegarde",
    title: label,
    subtitle: "Le dernier export complet des donnees Bryan Cars est pret en piece jointe.",
    preheader: `${label} ${normalizedFileName}`,
    bodyHtml: `
      ${panelCard({
        title: "Fichier joint",
        description: "Conservez ce fichier pour votre sauvegarde ou votre archivage manuel.",
        bodyHtml: infoRows([{ label: "Nom du fichier", value: normalizedFileName }]),
      })}
    `,
  });

  return sendBrevoEmail({
    to: [{ email: MAIL_ADMIN_TO }],
    subject,
    html,
    text: `${label}\n\nFichier joint : ${normalizedFileName}`,
    attachments: [
      {
        name: normalizedFileName,
        contentBase64: buffer.toString("base64"),
      },
    ],
  });
}

async function sendEventWinnerEmail({ client, event }) {
  if (!event) return false;
  const fullName = fallbackClientName(client);
  const portalUrl = clientPortalUrl(client);
  const prize = event.prize_text || event.prizeText || "votre lot";
  const eventTitle = event.title || "Jeu concours";

  // Notification push (best-effort).
  pushClient(client, {
    title: "Felicitations, vous avez gagne !",
    body: `${eventTitle} : vous remportez ${prize}.`,
  });

  if (!client?.email) return false;

  const subject = "[Bryan Cars] Vous avez gagne !";
  const text = `
Bonjour ${fullName},

Bonne nouvelle : vous avez ete tire au sort pour l'evenement "${eventTitle}".
Votre lot : ${prize}.

Nous vous recontactons rapidement pour la remise.
Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Tirage au sort",
    title: "Felicitations, vous avez gagne !",
    subtitle: `Vous etes le gagnant de "${escapeHtml(eventTitle)}".`,
    preheader: `Vous remportez ${prize}`,
    bodyHtml: `
      ${panelCard({
        title: "Votre lot",
        description: "Bryan Cars vous recontacte pour la remise.",
        bodyHtml: `<p style="margin:0;font-size:16px;line-height:24px;color:#e8c98a;font-weight:700;">${escapeHtml(
          prize,
        )}</p>`,
      })}
      ${actionButtons([
        portalUrl ? { label: "Ouvrir mon espace", href: portalUrl, tone: "primary" } : null,
      ])}
    `,
  });

  return sendBrevoEmail({ to: [{ email: client.email, name: fullName }], subject, text, html });
}

module.exports = {
  normalizePhoneForTel,
  sendEventWinnerEmail,
  sendAdminDataExportEmail,
  sendAdminAppointmentReminderEmail,
  sendAdminNotification,
  sendAdminPartnerOrderEmail,
  sendAdminQuoteRequestEmail,
  sendClientQuoteAnsweredEmail,
  sendClientQuoteReminderEmail,
  sendAdminQuoteRefusedEmail,
  sendQuotePaidNotifications,
  sendReferralRewardAvailableNotification,
  sendAdminRewardRedemption,
  sendClientPhotosRequestedEmail,
  sendClientPriceApprovalEmail,
  sendClientAppointmentReminderEmail,
  sendClientInactivityReminderEmail,
  sendBroadcastEmail,
  sendClientReviewRequestEmail,
  sendClientYearRecapEmail,
  sendEventAnnouncementEmail,
  sendWaitlistSlotFreedEmail,
  sendClientAppointmentStatusEmail,
  sendClientFormulaRecap,
  sendSignupVerificationCode,
  sendClientWelcomeEmail,
};
