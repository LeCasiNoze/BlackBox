import * as React from "react";
import { Link, useParams } from "react-router-dom";

type InvoiceCompany = {
  name: string;
  legalForm: string;
  address: string;
  city: string;
  siret: string;
  vatNote: string;
  email: string;
  phone: string;
};

type InvoiceData = {
  number: string;
  issuedAt: number | null;
  label: string;
  credits: number;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  company: InvoiceCompany;
  client: {
    company: string | null;
    name: string;
    email: string;
    address: string;
    city: string;
    cardCode: string;
  };
};

function formatEuro(cents: number): string {
  return `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDate(ts: number | null): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function InvoicePage() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const [invoice, setInvoice] = React.useState<InvoiceData | null>(null);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(
          `/api/client/${encodeURIComponent(slug || "")}/invoices/${encodeURIComponent(orderId || "")}`,
        );
        const json = await response.json();
        if (!active) return;
        if (response.ok && json.ok) setInvoice(json.invoice as InvoiceData);
        else setError(true);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [slug, orderId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-neutral-100 p-6 text-neutral-700">Chargement de la facture...</div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-dvh bg-neutral-100 p-6 text-neutral-700">
        <p>Facture introuvable.</p>
        <Link className="mt-3 inline-block text-blue-700 underline" to={`/card/${slug}`}>
          Retour a mon espace
        </Link>
      </div>
    );
  }

  const company = invoice.company;
  const hasCompany = company.name || company.siret || company.address;

  return (
    <div className="min-h-dvh bg-neutral-200 px-3 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <Link className="rounded-full border border-neutral-400 px-4 py-2 text-sm font-semibold text-neutral-700" to={`/card/${slug}`}>
            ← Retour
          </Link>
          <button
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-bold text-white"
            onClick={() => window.print()}
            type="button"
          >
            Imprimer / Enregistrer en PDF
          </button>
        </div>

        <div className="rounded-lg bg-white p-8 text-neutral-800 shadow-lg print:rounded-none print:shadow-none md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <img
                alt="Bryan Cars"
                className="mb-3 h-14 w-14 rounded-xl object-cover ring-1 ring-neutral-200"
                src="/app-icon-192.png"
              />
              <p className="text-lg font-bold text-neutral-900">
                {company.name || "Bryan Cars"}
              </p>
              {company.legalForm && <p className="text-sm text-neutral-600">{company.legalForm}</p>}
              {company.address && <p className="mt-1 text-sm text-neutral-600">{company.address}</p>}
              {company.city && <p className="text-sm text-neutral-600">{company.city}</p>}
              {company.siret && <p className="mt-1 text-sm text-neutral-600">SIRET : {company.siret}</p>}
              {company.email && <p className="text-sm text-neutral-600">{company.email}</p>}
              {company.phone && <p className="text-sm text-neutral-600">{company.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold tracking-tight text-neutral-900">FACTURE</p>
              <p className="mt-1 text-sm text-neutral-600">N° {invoice.number}</p>
              <p className="text-sm text-neutral-600">Date : {formatDate(invoice.issuedAt)}</p>
            </div>
          </div>

          <div className="mt-8 rounded-md bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Facturé à</p>
            {invoice.client.company && (
              <p className="mt-1 font-bold text-neutral-900">{invoice.client.company}</p>
            )}
            <p
              className={
                invoice.client.company
                  ? "text-sm text-neutral-700"
                  : "mt-1 font-semibold text-neutral-900"
              }
            >
              {invoice.client.name}
            </p>
            {invoice.client.address && (
              <p className="text-sm text-neutral-600">{invoice.client.address}</p>
            )}
            {invoice.client.city && <p className="text-sm text-neutral-600">{invoice.client.city}</p>}
            {invoice.client.email && <p className="text-sm text-neutral-600">{invoice.client.email}</p>}
            {invoice.client.cardCode && (
              <p className="mt-1 text-xs text-neutral-500">Réf. client : {invoice.client.cardCode}</p>
            )}
          </div>

          <table className="mt-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-300 text-left text-neutral-500">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-center">Quantité</th>
                <th className="py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="py-3 text-neutral-800">{invoice.label}</td>
                <td className="py-3 text-center text-neutral-700">
                  {invoice.credits > 0 ? invoice.credits : "-"}
                </td>
                <td className="py-3 text-right text-neutral-800">{formatEuro(invoice.amountCents)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between border-t-2 border-neutral-300 pt-2 text-base font-bold text-neutral-900">
                <span>Total payé</span>
                <span>{formatEuro(invoice.amountCents)}</span>
              </div>
              <p className="text-right text-xs text-neutral-500">Réglé par {invoice.paymentMethod}</p>
            </div>
          </div>

          <div className="mt-10 border-t border-neutral-200 pt-4 text-xs leading-5 text-neutral-500">
            {company.vatNote && <p>{company.vatNote}</p>}
            <p>Facture acquittée. Merci de votre confiance.</p>
            {!hasCompany && (
              <p className="mt-2 text-amber-600">
                (Mentions société à compléter par l'administrateur.)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
