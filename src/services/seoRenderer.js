const fs = require("fs");
const path = require("path");

const SITE_URL = "https://blackboxbc.com";

const publicPages = {
  "/": {
    title: "Detailing auto à Louhans | Bryan Cars Detailing",
    description:
      "Detailing et nettoyage automobile à Louhans : intérieur, extérieur, polissage et protection. Demandez votre devis personnalisé chez Bryan Cars.",
  },
  "/nettoyage-voiture-louhans": {
    title: "Nettoyage voiture à Louhans | Bryan Cars Detailing",
    description:
      "Nettoyage intérieur et extérieur, polissage et protection automobile à Louhans. Recevez un devis personnalisé chez Bryan Cars Detailing.",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: "Nettoyage et detailing automobile à Louhans",
          provider: { "@type": "AutoWash", name: "Bryan Cars Detailing", url: SITE_URL },
          areaServed: ["Louhans", "Bresse bourguignonne", "Saône-et-Loire"],
          serviceType: [
            "Nettoyage intérieur automobile",
            "Nettoyage extérieur automobile",
            "Polissage automobile",
            "Protection carrosserie",
          ],
          url: `${SITE_URL}/nettoyage-voiture-louhans`,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "Nettoyage voiture à Louhans",
              item: `${SITE_URL}/nettoyage-voiture-louhans`,
            },
          ],
        },
      ],
    },
  },
  "/preparation-vente": {
    title: "Préparation esthétique avant vente | Bryan Cars Louhans",
    description:
      "Préparez votre véhicule avant sa vente à Louhans : nettoyage, présentation, polissage et formules dédiées avec paiement en ligne.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Préparation esthétique automobile avant vente",
      provider: { "@type": "AutoWash", name: "Bryan Cars Detailing", url: SITE_URL },
      areaServed: "Louhans et Saône-et-Loire",
      url: `${SITE_URL}/preparation-vente`,
    },
  },
};

const legalPages = {
  "/mentions-legales": "Mentions légales | Bryan Cars Detailing",
  "/confidentialite": "Politique de confidentialité | Bryan Cars Detailing",
  "/cookies": "Gestion des cookies | Bryan Cars Detailing",
  "/conditions": "Conditions générales | Bryan Cars Detailing",
};

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function isPrivatePath(requestPath) {
  return (
    /^\/(admin|card|forfait|demo)(\/|$)/.test(requestPath) ||
    requestPath === "/landing-test" ||
    requestPath.startsWith("/preparation-vente/")
  );
}

function pageMetadata(requestPath) {
  if (publicPages[requestPath]) {
    return {
      ...publicPages[requestPath],
      canonical: `${SITE_URL}${requestPath === "/" ? "/" : requestPath}`,
      robots: "index, follow",
    };
  }
  if (legalPages[requestPath]) {
    return {
      title: legalPages[requestPath],
      description: "Informations légales et conditions applicables au site Bryan Cars Detailing.",
      canonical: `${SITE_URL}${requestPath}`,
      robots: "noindex, follow",
      stripStructuredData: true,
    };
  }
  if (isPrivatePath(requestPath)) {
    return {
      title: "Espace sécurisé | Bryan Cars Detailing",
      description: "Espace privé Bryan Cars Detailing.",
      canonical: null,
      robots: "noindex, nofollow, noarchive",
      stripStructuredData: true,
    };
  }
  return {
    title: "Page introuvable | Bryan Cars Detailing",
    description: "La page demandée est introuvable.",
    canonical: null,
    robots: "noindex, nofollow",
    stripStructuredData: true,
  };
}

function renderSeoHtml(distDir, requestPath) {
  const indexPath = path.join(distDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const metadata = pageMetadata(requestPath);

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${metadata.title}</title>`);
  html = replaceTag(
    html,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${metadata.description}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${metadata.robots}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${metadata.title}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${metadata.description}" />`,
  );

  if (metadata.canonical) {
    html = replaceTag(
      html,
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${metadata.canonical}" />`,
    );
    html = replaceTag(
      html,
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${metadata.canonical}" />`,
    );
  } else {
    html = html.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/i, "");
    html = html.replace(/\s*<meta\s+property=["']og:url["'][^>]*>/i, "");
  }

  if (metadata.stripStructuredData) {
    html = html.replace(/\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  } else if (metadata.structuredData) {
    const json = JSON.stringify(metadata.structuredData).replace(/</g, "\\u003c");
    html = html.replace(
      "</head>",
      `    <script type="application/ld+json">${json}</script>\n  </head>`,
    );
  }

  return html;
}

function sendSeoHtml(res, distDir, requestPath) {
  try {
    res.type("html").send(renderSeoHtml(distDir, requestPath));
  } catch (error) {
    console.error("[SEO] impossible de servir le HTML:", error);
    res.status(500).type("text").send("Application indisponible");
  }
}

module.exports = { renderSeoHtml, sendSeoHtml };
