const {
  BREVO_API_KEY,
  MAIL_FROM_NAME,
  MAIL_FROM_EMAIL,
  MAIL_ADMIN_TO,
  ADMIN_DASHBOARD_URL,
  CLIENT_PORTAL_BASE_URL,
} = process.env;

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

function locationLabel(location) {
  const normalized = typeof location === "string" ? location.toLowerCase() : "";
  if (normalized === "domicile") return "A domicile";
  if (normalized === "atelier") return "Au studio";
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
  if (clientType === "data") return "";

  const base = basePortalUrl();
  if (!base || !slug) return "";
  return `${base}/card/${encodeURIComponent(slug)}`;
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
  return parts.length > 0 ? parts.join(" / ") : "Vehicule non renseigne";
}

function brandWordmark() {
  return `
    <div style="font-size:11px;line-height:1;letter-spacing:0.28em;text-transform:uppercase;font-weight:800;color:#f5f7fb;">
      BRYAN CARS DETAILING
    </div>
  `;
}

function emailBadge(label, accent = "#f7b955") {
  return `
    <div style="display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04);font-size:11px;line-height:1;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${escapeHtml(
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      ${safeMetrics
        .map(
          (metric) => `
            <tr>
              <td style="padding:0 0 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid rgba(255,255,255,0.1);border-radius:22px;background:#141922;">
                  <tr>
                    <td style="padding:18px 18px 16px;">
                      <div style="font-size:11px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,0.42);">
                        ${escapeHtml(metric.label)}
                      </div>
                      <div style="padding-top:9px;font-size:20px;line-height:1.35;font-weight:800;color:#ffffff;">
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
              <td style="padding:0 0 10px;">
                <div style="font-size:12px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,0.36);">
                  ${escapeHtml(row.label)}
                </div>
                <div style="padding-top:5px;font-size:15px;line-height:1.7;color:#d9e1f0;">
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      ${safeButtons
        .map((button, index) => {
          const isPrimary = button.tone !== "ghost";
          const style = isPrimary
            ? "background:#f7b955;border:1px solid #f7b955;color:#120b02;"
            : "background:#121720;border:1px solid rgba(255,255,255,0.14);color:#edf2ff;";

          return `
            <tr>
              <td style="padding:${index === 0 ? "0" : "10px 0 0"};">
                <a href="${escapeHtml(button.href)}" style="display:block;padding:14px 18px;border-radius:999px;text-align:center;text-decoration:none;font-size:14px;line-height:1.2;font-weight:800;${style}">
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

function panelCard({ title, description = "", bodyHtml = "", accent = "#f7b955" }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid rgba(255,255,255,0.1);border-radius:24px;background:#121720;">
      <tr>
        <td style="padding:22px 22px 20px;">
          <div style="font-size:12px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;font-weight:800;color:${escapeHtml(
            accent,
          )};">
            ${escapeHtml(title)}
          </div>
          ${
            description
              ? `<div style="padding-top:10px;font-size:15px;line-height:1.7;color:#b5bfd2;">${escapeHtml(
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
  accent = "#f7b955",
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
  <body style="margin:0;padding:0;background:#07090d;font-family:Segoe UI,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#07090d;">
      <tr>
        <td align="center" style="padding:20px 12px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;max-width:680px;">
            <tr>
              <td style="padding-bottom:14px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="height:4px;border-radius:999px;background:linear-gradient(90deg,#f7b955 0%,#ff7a18 44%,#2ca2ff 100%);font-size:0;line-height:0;">
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid rgba(255,255,255,0.1);border-radius:30px;background:#0f131b;overflow:hidden;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:30px 28px 24px;background:
                      radial-gradient(circle at top left, rgba(247,185,85,0.2), transparent 34%),
                      radial-gradient(circle at top right, rgba(44,162,255,0.15), transparent 28%),
                      #11161f;">
                      ${brandWordmark()}
                      <div style="padding-top:18px;">
                        ${emailBadge(eyebrow, accent)}
                      </div>
                      <div style="padding-top:18px;font-size:34px;line-height:1.08;font-weight:800;color:#ffffff;">
                        ${escapeHtml(title)}
                      </div>
                      <div style="padding-top:12px;font-size:15px;line-height:1.75;color:#b4bfd4;">
                        ${escapeHtml(subtitle)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 20px 10px;">
                      ${bodyHtml}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 28px 28px;font-size:12px;line-height:1.7;color:#7f8aa0;">
                      Bryan Cars Detailing · Louhans · Atelier ou domicile sur rendez-vous.
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

async function sendAdminNotification({ type, client, date, time, location, clientNote = null }) {
  const adminEmail = adminInboxEmail();
  if (!adminEmail) {
    console.warn("[MAIL] MAIL_ADMIN_TO / MAIL_FROM_EMAIL manquant, notif admin ignoree.");
    return false;
  }

  const formattedDate = formatDateFr(date);
  const safeTime = time || "heure non renseignee";
  const adminUrl = `${ADMIN_DASHBOARD_URL}?clientId=${client.id}&date=${date}`;
  const fullName = fallbackClientName(client);
  const vehicle = vehicleSummary(client);

  const action =
    type === "book"
      ? "Nouveau rendez-vous reserve"
      : type === "cancel"
        ? "Rendez-vous annule"
        : type === "test"
          ? "Test email admin"
          : "Rendez-vous modifie";

  const subject = `[Bryan Cars] ${action} - ${formattedDate} ${safeTime}`;
  const text = `
${action}

Client : ${fullName}
Telephone : ${client.phone || "-"}
Email : ${client.email || "-"}
Date : ${formattedDate}
Heure : ${safeTime}
Lieu : ${locationLabel(location)}
Vehicule : ${vehicle}
Commentaire client : ${clientNote || "-"}
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
            { label: "Lieu", value: locationLabel(location) },
            { label: "Vehicule", value: vehicle },
            { label: "Commentaire client", value: clientNote || "-" },
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
  const purchasedAt = formatUnixDateFr(client.formula_purchased_at ?? client.formulaPurchasedAt);
  const expiresAt = formatUnixDateFr(client.formula_expires_at ?? client.formulaExpiresAt);
  const acceptedAt = formatUnixDateTimeFr(
    client.terms_accepted_at ?? client.termsAcceptedAt,
  );
  const formulaLabel = client.formula_name || client.formulaName || "Formule detailing";
  const credits = `${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
    client.formula_total ?? client.formulaTotal ?? 0
  }`;

  const subject = `[Bryan Cars] Votre formule ${formulaLabel}`;
  const text = `
Bonjour ${fullName},

Votre formule Bryan Cars est activee.

Formule : ${formulaLabel}
Credits : ${credits}
Date d'achat : ${purchasedAt}
Date d'expiration : ${expiresAt}
Conditions acceptees le : ${acceptedAt}
Espace client : ${portalUrl || "Lien indisponible"}
Conditions et reglement : ${termsUrl || portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Recapitulatif formule",
    title: `Votre formule ${formulaLabel}`,
    subtitle: "Voici un recapitulatif propre de votre formule, de vos credits et de sa validite.",
    preheader: `Formule ${formulaLabel} · ${credits} credits restants`,
    bodyHtml: `
      ${metricRows([
        { label: "Formule", value: formulaLabel },
        { label: "Credits restants", value: credits },
        { label: "Expiration", value: expiresAt },
      ])}
      ${panelCard({
        title: "Validite et acces",
        description: "Tout est centralise ici pour garder votre suivi clair en quelques secondes.",
        bodyHtml: `
          ${infoRows([
            { label: "Date d'achat", value: purchasedAt },
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
  const formulaLabel = client.formula_name || client.formulaName || "Formule detailing";
  const purchasedAt = formatUnixDateFr(client.formula_purchased_at ?? client.formulaPurchasedAt);
  const expiresAt = formatUnixDateFr(client.formula_expires_at ?? client.formulaExpiresAt);
  const founderImage = absoluteUrlMaybe(client.founder_media_url || client.founderMediaUrl);
  const credits = `${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
    client.formula_total ?? client.formulaTotal ?? 0
  }`;

  const title = founder
    ? "Bienvenue dans l'espace Fondateur Bryan Cars"
    : "Bienvenue chez Bryan Cars Detailing";
  const subtitle = founder
    ? "Votre acces fondateur est pret avec une experience premium dediee."
    : "Votre acces client est pret pour suivre credits, rendez-vous, photos et retours de prestation.";
  const subject = founder
    ? "[Bryan Cars] Bienvenue Fondateur"
    : "[Bryan Cars] Bienvenue dans votre espace client";

  const text = `
Bonjour ${fullName},

${title}

Formule : ${formulaLabel}
Credits : ${credits}
Date d'achat : ${purchasedAt}
Date d'expiration : ${expiresAt}
Lien d'acces : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: founder ? "Membre fondateur" : "Bienvenue",
    title,
    subtitle,
    accent: founder ? "#ffe08a" : "#f7b955",
    preheader: `${title} · ${formulaLabel}`,
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
        { label: "Formule", value: formulaLabel },
        { label: "Credits", value: credits },
        { label: "Expiration", value: expiresAt },
      ])}
      ${panelCard({
        title: "Votre acces est pret",
        description:
          "Vous pouvez maintenant consulter votre carte, vos passages, vos photos et vos prochains creneaux depuis votre espace Bryan Cars.",
        bodyHtml: `
          ${infoRows([{ label: "Date d'achat", value: purchasedAt }])}
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

  const title = isDone
    ? "Votre prestation est terminee"
    : "Votre rendez-vous est confirme";
  const subtitle = isDone
    ? "Votre passage est maintenant cloture. Vous pouvez consulter vos photos, votre suivi et laisser votre avis."
    : "Votre creneau vient d'etre valide par l'equipe Bryan Cars. Tout est pret pour votre passage.";
  const subject = isDone
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
${isDone ? "BC'Coins gagnes : 100 points" : ""}
Espace client : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: isDone ? "Prestation cloturee" : "Rendez-vous confirme",
    title,
    subtitle,
    accent: isDone ? "#2ca2ff" : "#f7b955",
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
            isDone ? { label: "BC'Coins gagnes", value: "100 points" } : null,
          ])}
          ${actionButtons([
            portalUrl
              ? {
                  label: isDone ? "Voir mon suivi et laisser mon avis" : "Ouvrir mon espace client",
                  href: portalUrl,
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
              ? { label: "Ouvrir mon espace client", href: portalUrl, tone: "primary" }
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

async function sendAdminRewardRedemption({ client, reward }) {
  if (!MAIL_ADMIN_TO) {
    console.warn("[MAIL] MAIL_ADMIN_TO manquant, redemption ignoree.");
    return false;
  }

  const fullName = fallbackClientName(client);
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

module.exports = {
  normalizePhoneForTel,
  sendAdminDataExportEmail,
  sendAdminAppointmentReminderEmail,
  sendAdminNotification,
  sendAdminRewardRedemption,
  sendClientAppointmentReminderEmail,
  sendClientAppointmentStatusEmail,
  sendClientFormulaRecap,
  sendClientWelcomeEmail,
};
