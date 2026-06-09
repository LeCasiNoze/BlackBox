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

function brandEmailShell({ eyebrow, title, subtitle, bodyHtml, accent = "#f7b955" }) {
  return `
  <div style="margin:0;background:#05070b;padding:32px 18px;font-family:Manrope,Segoe UI,sans-serif;color:#edf2ff;">
    <div style="max-width:720px;margin:0 auto;background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(14,16,22,0.94);border:1px solid rgba(255,255,255,0.09);border-radius:28px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,0.38);">
      <div style="padding:32px 32px 18px;background:
        radial-gradient(circle at 0% 0%, rgba(247,185,85,0.22), transparent 36%),
        radial-gradient(circle at 100% 0%, rgba(44,162,255,0.14), transparent 30%),
        linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0));">
        <div style="display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${accent};">
          ${eyebrow}
        </div>
        <h1 style="margin:20px 0 0;font-size:34px;line-height:1.05;color:#ffffff;font-family:Syne,Segoe UI,sans-serif;">
          ${title}
        </h1>
        <p style="margin:14px 0 0;max-width:560px;font-size:15px;line-height:1.7;color:#a8b3c7;">
          ${subtitle}
        </p>
      </div>
      <div style="padding:24px 32px 34px;">
        ${bodyHtml}
      </div>
    </div>
  </div>
  `;
}

function metricCard(label, value) {
  return `
  <div style="flex:1;min-width:180px;padding:18px 18px;border:1px solid rgba(255,255,255,0.09);border-radius:22px;background:rgba(255,255,255,0.03);">
    <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.42);font-weight:700;">${label}</div>
    <div style="margin-top:10px;font-size:20px;line-height:1.3;color:#ffffff;font-weight:700;">${value}</div>
  </div>
  `;
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
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: MAIL_FROM_EMAIL,
          name: MAIL_FROM_NAME || "Bryan Cars Detailing",
        },
        to,
        subject,
        htmlContent: html,
        textContent: text,
        attachment: attachments.map((attachment) => ({
          name: attachment.name,
          content: attachment.contentBase64,
        })),
      }),
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

async function sendAdminNotification({ type, client, date, time, location }) {
  if (!MAIL_ADMIN_TO) {
    console.warn("[MAIL] MAIL_ADMIN_TO manquant, notif admin ignoree.");
    return false;
  }

  const formattedDate = formatDateFr(date);
  const safeTime = time || "heure non renseignee";
  const adminUrl = `${ADMIN_DASHBOARD_URL}?clientId=${client.id}&date=${date}`;
  const fullName = fallbackClientName(client);
  const vehicle =
    client.vehicleModel || client.vehiclePlate || client.vehicle_model || client.vehicle_plate
      ? `${client.vehicleModel || client.vehicle_model || ""}${
          client.vehiclePlate || client.vehicle_plate
            ? ` · ${client.vehiclePlate || client.vehicle_plate}`
            : ""
        }`
      : "Vehicule non renseigne";

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
Admin : ${adminUrl}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Notification admin",
    title: action,
    subtitle: "Un mouvement vient d'etre enregistre sur le planning Bryan Cars.",
    bodyHtml: `
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${metricCard("Client", fullName)}
        ${metricCard("Date", formattedDate)}
        ${metricCard("Heure", safeTime)}
      </div>
      <div style="margin-top:18px;padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);">
        <p style="margin:0 0 10px;color:#ffffff;font-size:15px;font-weight:700;">Dossier</p>
        <p style="margin:0 0 8px;color:#a8b3c7;font-size:14px;line-height:1.6;"><strong>Telephone :</strong> ${client.phone || "-"}</p>
        <p style="margin:0 0 8px;color:#a8b3c7;font-size:14px;line-height:1.6;"><strong>Email :</strong> ${client.email || "-"}</p>
        <p style="margin:0 0 8px;color:#a8b3c7;font-size:14px;line-height:1.6;"><strong>Lieu :</strong> ${locationLabel(location)}</p>
        <p style="margin:0 0 14px;color:#a8b3c7;font-size:14px;line-height:1.6;"><strong>Vehicule :</strong> ${vehicle}</p>
        <a href="${adminUrl}" style="display:inline-block;padding:13px 18px;border-radius:999px;background:linear-gradient(135deg,#f7b955,#ff7a18);color:#120b02;text-decoration:none;font-size:14px;font-weight:800;">
          Ouvrir le tableau de bord admin
        </a>
      </div>
    `,
  });

  return sendBrevoEmail({
    to: [{ email: MAIL_ADMIN_TO }],
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

  const subject = `[Bryan Cars] Votre formule ${formulaLabel}`;
  const text = `
Bonjour ${fullName},

Votre formule Bryan Cars est activee.

Formule : ${formulaLabel}
Credits : ${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
    client.formula_total ?? client.formulaTotal ?? 0
  }
Date d'achat : ${purchasedAt}
Date d'expiration : ${expiresAt}
Conditions acceptees le : ${acceptedAt}
Espace client : ${portalUrl || "Lien indisponible"}
Conditions et reglement : ${termsUrl || portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: "Recapitulatif formule",
    title: `Votre formule ${formulaLabel}`,
    subtitle: "Voici votre recapitulatif de formule, de credits et de validite Bryan Cars.",
    bodyHtml: `
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${metricCard("Credits", `${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
          client.formula_total ?? client.formulaTotal ?? 0
        }`)}
        ${metricCard("Date d'achat", purchasedAt)}
        ${metricCard("Expiration", expiresAt)}
      </div>
      <div style="margin-top:18px;padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);">
        <p style="margin:0 0 8px;color:#ffffff;font-size:15px;font-weight:700;">Conditions & acces</p>
        <p style="margin:0 0 10px;color:#a8b3c7;font-size:14px;line-height:1.7;">Conditions acceptees le ${acceptedAt}.</p>
        ${
          portalUrl
            ? `<a href="${portalUrl}" style="display:inline-block;margin-right:10px;padding:13px 18px;border-radius:999px;background:linear-gradient(135deg,#f7b955,#ff7a18);color:#120b02;text-decoration:none;font-size:14px;font-weight:800;">Ouvrir mon espace client</a>`
            : ""
        }
        ${
          termsUrl
            ? `<a href="${termsUrl}" style="display:inline-block;padding:13px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:#edf2ff;text-decoration:none;font-size:14px;font-weight:700;">Relire les conditions</a>`
            : ""
        }
      </div>
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

  const title = founder
    ? "Bienvenue dans l'espace Fondateur Bryan Cars"
    : "Bienvenue chez Bryan Cars Detailing";
  const subtitle = founder
    ? "Votre acces fondateur est pret avec une experience premium dediee."
    : "Votre acces client est pret pour suivre vos credits, vos rendez-vous et vos retours de prestation.";
  const subject = founder
    ? "[Bryan Cars] Bienvenue Fondateur"
    : "[Bryan Cars] Bienvenue dans votre espace client";

  const text = `
Bonjour ${fullName},

${title}

Formule : ${formulaLabel}
Credits : ${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
    client.formula_total ?? client.formulaTotal ?? 0
  }
Date d'achat : ${purchasedAt}
Date d'expiration : ${expiresAt}
Lien d'acces : ${portalUrl || "Lien indisponible"}
  `.trim();

  const html = brandEmailShell({
    eyebrow: founder ? "Membre fondateur" : "Bienvenue",
    title,
    subtitle,
    accent: founder ? "#ffe08a" : "#f7b955",
    bodyHtml: `
      ${
        founderImage
          ? `<div style="margin-bottom:18px;overflow:hidden;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);">
              <img alt="Bryan Cars" src="${founderImage}" style="display:block;width:100%;max-height:280px;object-fit:cover;" />
            </div>`
          : ""
      }
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${metricCard("Formule", formulaLabel)}
        ${metricCard("Credits", `${client.formula_remaining ?? client.formulaRemaining ?? 0} / ${
          client.formula_total ?? client.formulaTotal ?? 0
        }`)}
        ${metricCard("Expiration", expiresAt)}
      </div>
      <div style="margin-top:18px;padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);">
        <p style="margin:0 0 14px;color:#a8b3c7;font-size:14px;line-height:1.7;">
          Votre compte est pret. Vous pourrez suivre vos passages, vos photos, vos avis et votre formule directement depuis votre espace Bryan Cars.
        </p>
        ${
          portalUrl
            ? `<a href="${portalUrl}" style="display:inline-block;padding:13px 18px;border-radius:999px;background:linear-gradient(135deg,#f7b955,#ff7a18);color:#120b02;text-decoration:none;font-size:14px;font-weight:800;">
                Ouvrir mon espace
              </a>`
            : ""
        }
      </div>
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
    subtitle: "Un client vient de demander un cadeau ou un avantage via la boutique BC'Coins.",
    bodyHtml: `
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${metricCard("Client", fullName)}
        ${metricCard("Reward", reward.label)}
        ${metricCard("Points", String(reward.pointsCost))}
      </div>
      <div style="margin-top:18px;padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);">
        <p style="margin:0 0 8px;color:#a8b3c7;font-size:14px;line-height:1.7;"><strong>Telephone :</strong> ${client.phone || "-"}</p>
        <p style="margin:0;color:#a8b3c7;font-size:14px;line-height:1.7;"><strong>Email :</strong> ${client.email || "-"}</p>
      </div>
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
  const subject = `[Bryan Cars] ${label} des donnees`;
  const html = brandEmailShell({
    eyebrow: "Sauvegarde",
    title: label,
    subtitle: "Vous trouverez en piece jointe le dernier export JSON complet des donnees Bryan Cars.",
    bodyHtml: `
      <div style="padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:24px;background:rgba(255,255,255,0.03);">
        <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;">Fichier joint</p>
        <p style="margin:10px 0 0;color:#a8b3c7;font-size:14px;line-height:1.7;">${fileName}</p>
      </div>
    `,
  });

  return sendBrevoEmail({
    to: [{ email: MAIL_ADMIN_TO }],
    subject,
    html,
    text: `${label}\n\nFichier joint : ${fileName}`,
    attachments: [
      {
        name: fileName,
        contentBase64: buffer.toString("base64"),
      },
    ],
  });
}

module.exports = {
  normalizePhoneForTel,
  sendAdminDataExportEmail,
  sendAdminNotification,
  sendAdminRewardRedemption,
  sendClientFormulaRecap,
  sendClientWelcomeEmail,
};
