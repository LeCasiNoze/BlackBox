import * as React from "react";
import { Link } from "react-router-dom";
import { TERMS_SECTIONS, TERMS_HIGHLIGHTS, TERMS_UPDATED_LABEL } from "../lib/terms";

type Company = {
  name: string;
  legalForm: string;
  address: string;
  city: string;
  siret: string;
  vatNote: string;
  email: string;
  phone: string;
  publisher: string;
  rcs: string;
};

export type LegalDoc = "mentions" | "confidentialite" | "cookies" | "conditions";

const NAV: Array<{ doc: LegalDoc; to: string; label: string }> = [
  { doc: "mentions", to: "/mentions-legales", label: "Mentions légales" },
  { doc: "confidentialite", to: "/confidentialite", label: "Confidentialité" },
  { doc: "cookies", to: "/cookies", label: "Cookies" },
  { doc: "conditions", to: "/conditions", label: "Conditions d'utilisation" },
];

const TITLES: Record<LegalDoc, string> = {
  mentions: "Mentions légales",
  confidentialite: "Politique de confidentialité",
  cookies: "Politique de cookies",
  conditions: "Conditions d'utilisation",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-7 text-white/65">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-white/45">{label} : </span>
      {value}
    </p>
  );
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const [company, setCompany] = React.useState<Company | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/legal-info")
      .then((r) => r.json())
      .then((j) => {
        if (active && j?.ok) setCompany(j.company as Company);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const c = company;
  const brand = c?.name || "Bryan Cars";
  const contactEmail = c?.email || "";
  const publisher = c?.publisher || "";

  return (
    <div className="min-h-dvh bg-[#05070b] px-4 py-10 text-white/80">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="text-sm text-white/55 transition hover:text-white"
            to="/"
          >
            ← Retour à l'accueil
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">{brand}</p>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white md:text-3xl">{TITLES[doc]}</h1>

        <nav className="mt-4 flex flex-wrap gap-2">
          {NAV.map((item) => (
            <Link
              className={
                item.doc === doc
                  ? "rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                  : "rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white"
              }
              key={item.doc}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-7">
          {doc === "mentions" && (
            <>
              <Section title="Éditeur du site">
                <Row label="Raison sociale" value={brand} />
                <Row label="Forme juridique" value={c?.legalForm || "Entreprise individuelle"} />
                <Row label="Adresse" value={[c?.address, c?.city].filter(Boolean).join(", ")} />
                <Row label="SIRET" value={c?.siret} />
                <Row label="Immatriculation" value={c?.rcs} />
                <Row label="TVA" value={c?.vatNote} />
                <Row
                  label="Contact"
                  value={
                    <>
                      {contactEmail && (
                        <a className="text-accent" href={`mailto:${contactEmail}`}>
                          {contactEmail}
                        </a>
                      )}
                      {contactEmail && c?.phone ? " · " : ""}
                      {c?.phone}
                    </>
                  }
                />
                <Row
                  label="Directeur de la publication"
                  value={publisher || brand}
                />
              </Section>

              <Section title="Hébergement">
                <p>
                  Le site est hébergé par Render Services, Inc., 525 Brannan Street,
                  Suite 300, San Francisco, CA 94107, États-Unis —{" "}
                  <a
                    className="text-accent"
                    href="https://render.com"
                    rel="noreferrer"
                    target="_blank"
                  >
                    render.com
                  </a>
                  .
                </p>
              </Section>

              <Section title="Propriété intellectuelle">
                <p>
                  L'ensemble des contenus de ce site (textes, visuels, logo, photos de
                  prestation) est la propriété de {brand} ou de ses partenaires. Toute
                  reproduction sans autorisation est interdite.
                </p>
              </Section>

              <Section title="Données personnelles">
                <p>
                  Le traitement de vos données personnelles est décrit dans notre{" "}
                  <Link className="text-accent" to="/confidentialite">
                    politique de confidentialité
                  </Link>
                  . L'usage des cookies est détaillé dans la{" "}
                  <Link className="text-accent" to="/cookies">
                    politique de cookies
                  </Link>
                  .
                </p>
              </Section>
            </>
          )}

          {doc === "confidentialite" && (
            <>
              <Section title="Responsable du traitement">
                <p>
                  {brand}
                  {c?.address ? `, ${[c.address, c.city].filter(Boolean).join(", ")}` : ""}. Pour
                  toute question relative à vos données :{" "}
                  {contactEmail ? (
                    <a className="text-accent" href={`mailto:${contactEmail}`}>
                      {contactEmail}
                    </a>
                  ) : (
                    "contact indiqué dans les mentions légales"
                  )}
                  .
                </p>
              </Section>

              <Section title="Données collectées">
                <p>Dans le cadre de la gestion de votre compte et de nos prestations :</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Identité : nom, prénom, éventuellement société.</li>
                  <li>Coordonnées : e-mail, téléphone, adresse.</li>
                  <li>Véhicule : modèle, plaque, informations utiles à la prestation.</li>
                  <li>
                    Rendez-vous et prestations : réservations, photos, notes, avis, historique.
                  </li>
                  <li>
                    Paiement : géré par notre prestataire SumUp. Nous ne stockons aucune
                    donnée bancaire.
                  </li>
                  <li>Notifications : abonnement (facultatif) aux notifications push.</li>
                </ul>
              </Section>

              <Section title="Finalités et base légale">
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Gestion du compte, des rendez-vous, devis et prestations —{" "}
                    <em>exécution du contrat</em>.
                  </li>
                  <li>
                    Facturation et comptabilité — <em>obligation légale</em>.
                  </li>
                  <li>
                    E-mails et notifications liés au service — <em>exécution du contrat</em> /{" "}
                    <em>consentement</em> pour les notifications push.
                  </li>
                  <li>
                    Amélioration du service et statistiques internes — <em>intérêt légitime</em>.
                  </li>
                </ul>
              </Section>

              <Section title="Destinataires et sous-traitants">
                <p>
                  Vos données ne sont jamais vendues. Elles peuvent être traitées par nos
                  sous-traitants techniques, uniquement pour les besoins du service :
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>SumUp — paiement en ligne sécurisé.</li>
                  <li>Brevo — envoi des e-mails transactionnels.</li>
                  <li>Render — hébergement de l'application.</li>
                </ul>
                <p>
                  L'hébergement est assuré sur des serveurs situés aux États-Unis. Ce transfert
                  hors Union européenne est encadré par des garanties appropriées (clauses
                  contractuelles types de la Commission européenne).
                </p>
              </Section>

              <Section title="Durées de conservation">
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    Compte et données client : pendant la durée de la relation, puis jusqu'à 3
                    ans après le dernier contact, avant suppression ou anonymisation.
                  </li>
                  <li>
                    Factures et pièces comptables : 10 ans, conformément aux obligations légales.
                  </li>
                </ul>
              </Section>

              <Section title="Vos droits">
                <p>
                  Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
                  d'effacement, de limitation, d'opposition et de portabilité de vos données.
                  Vous pouvez les exercer en écrivant à{" "}
                  {contactEmail ? (
                    <a className="text-accent" href={`mailto:${contactEmail}`}>
                      {contactEmail}
                    </a>
                  ) : (
                    "l'adresse indiquée dans les mentions légales"
                  )}
                  .
                </p>
                <p>
                  Vous pouvez également introduire une réclamation auprès de la CNIL —{" "}
                  <a
                    className="text-accent"
                    href="https://www.cnil.fr"
                    rel="noreferrer"
                    target="_blank"
                  >
                    www.cnil.fr
                  </a>
                  .
                </p>
              </Section>

              <Section title="Sécurité">
                <p>
                  Nous mettons en œuvre des mesures techniques et organisationnelles adaptées
                  pour protéger vos données contre tout accès, perte ou divulgation non
                  autorisés (accès administrateur protégé, connexions chiffrées).
                </p>
              </Section>
            </>
          )}

          {doc === "cookies" && (
            <>
              <Section title="Cookies strictement nécessaires">
                <p>
                  Ce site utilise uniquement des cookies et technologies de stockage
                  strictement nécessaires à son bon fonctionnement :
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    un cookie de session pour maintenir la connexion à l'espace
                    administrateur ;
                  </li>
                  <li>
                    un stockage local technique pour mémoriser certaines préférences
                    d'affichage (par exemple l'affichage d'un bandeau de notifications).
                  </li>
                </ul>
              </Section>

              <Section title="Aucun traceur">
                <p>
                  Nous n'utilisons <strong>aucun</strong> cookie de mesure d'audience, de
                  publicité ou de traçage tiers. Conformément aux recommandations de la CNIL,
                  ces cookies strictement nécessaires ne requièrent pas votre consentement :
                  aucune bannière de consentement n'est donc nécessaire.
                </p>
              </Section>

              <Section title="Paiement">
                <p>
                  Les paiements sont réalisés sur les pages sécurisées de notre prestataire
                  SumUp. Les éventuels cookies déposés à cette occasion relèvent de la politique
                  de confidentialité de SumUp.
                </p>
              </Section>

              <Section title="Gestion">
                <p>
                  Vous pouvez à tout moment configurer votre navigateur pour bloquer ou
                  supprimer les cookies. Le blocage des cookies strictement nécessaires peut
                  toutefois empêcher le bon fonctionnement de certaines fonctionnalités.
                </p>
              </Section>
            </>
          )}

          {doc === "conditions" && (
            <>
              <p className="text-xs text-white/40">Dernière mise à jour : {TERMS_UPDATED_LABEL}</p>
              <Section title="En bref">
                <ul className="ml-4 list-disc space-y-1">
                  {TERMS_HIGHLIGHTS.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Section>
              {TERMS_SECTIONS.map((s) => (
                <Section key={s.title} title={s.title}>
                  {s.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </Section>
              ))}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          {brand} — Document mis à disposition à titre d'information.
        </p>
      </div>
    </div>
  );
}
