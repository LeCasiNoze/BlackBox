import * as React from "react";
import {
  ArrowRight,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

type SalesForfait = {
  key: string;
  label: string;
  priceCents: number;
  currency: string;
  startingAt?: boolean;
  tagline: string;
  features: string[];
};

type SalesPageData = {
  ok: boolean;
  paymentsReady: boolean;
  partner: { label: string } | null;
  forfaits: SalesForfait[];
};

type ImageDraft = { id: string; file: File; url: string };

function formatMoney(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function SalesPrepPage() {
  const { token = "" } = useParams();
  const [data, setData] = React.useState<SalesPageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fatalError, setFatalError] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState("");
  const [form, setForm] = React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleDetails: "",
  });
  const [images, setImages] = React.useState<ImageDraft[]>([]);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    let active = true;
    const endpoint = token
      ? `/api/client/public/partner-sales/${encodeURIComponent(token)}`
      : "/api/client/public/partner-sales";
    void fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) throw new Error("not_found");
        return (await response.json()) as SalesPageData;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setFatalError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const selected = data?.forfaits.find((forfait) => forfait.key === selectedKey) ?? null;

  function chooseForfait(key: string) {
    setSelectedKey(key);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, 8 - images.length));
    setImages((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter((item) => item.id !== id);
    });
  }

  async function submit() {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload = new FormData();
      payload.set("forfaitKey", selected.key);
      Object.entries(form).forEach(([key, value]) => payload.set(key, value));
      payload.set("acceptedTerms", String(acceptedTerms));
      images.forEach((image) => payload.append("images", image.file));

      const response = await fetch(
        token
          ? `/api/client/public/partner-sales/${encodeURIComponent(token)}/orders`
          : "/api/client/public/partner-sales/orders",
        { method: "POST", body: payload },
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.ok) {
        if (json.error === "too_many_requests") throw new Error("Trop de tentatives. Réessayez dans une heure.");
        if (json.error === "image_too_large") throw new Error("Une photo est trop lourde (10 Mo maximum).");
        throw new Error("Vérifiez vos coordonnées, le véhicule et ajoutez au moins une photo.");
      }

      if (!json.paymentsReady) {
        window.location.href = json.paymentPath as string;
        return;
      }
      const checkoutResponse = await fetch(json.checkoutPath as string, { method: "POST" });
      const checkout = await checkoutResponse.json().catch(() => ({}));
      if (checkout.ok && checkout.hostedCheckoutUrl) {
        window.location.href = checkout.hostedCheckoutUrl as string;
        return;
      }
      window.location.href = json.paymentPath as string;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de préparer le paiement.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#050505] text-white/70"><Loader2 className="h-7 w-7 animate-spin text-[#e8c98a]" /></main>;
  }
  if (fatalError || !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-center">
        <div><CarFront className="mx-auto h-12 w-12 text-[#e8c98a]" /><h1 className="mt-5 text-2xl font-black text-white">Page indisponible</h1><p className="mt-2 text-sm text-white/55">Le lien utilisé n&apos;est plus disponible. Contactez Bryan Cars pour obtenir le bon accès.</p><Link className="mt-6 inline-flex text-sm font-bold text-[#e8c98a]" to="/">Découvrir Bryan Cars</Link></div>
      </main>
    );
  }

  const valid = Boolean(
    selected &&
      form.customerName.trim() &&
      form.customerEmail.includes("@") &&
      form.customerPhone.replace(/\D/g, "").length >= 8 &&
      form.vehicleModel.trim() &&
      images.length > 0 &&
      acceptedTerms,
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="relative overflow-hidden border-b border-[#e8c98a]/18 bg-[radial-gradient(circle_at_78%_5%,rgba(232,201,138,0.17),transparent_32%),linear-gradient(150deg,#050505,#101010)] px-4 pb-14 pt-8 sm:px-6 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4"><img alt="Bryan Cars Detailing" className="h-12 w-auto" src="/bryan-cars-logo.png" /><span className="rounded-full border border-[#e8c98a]/30 bg-[#e8c98a]/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#f4dca0]">{data.partner ? `via ${data.partner.label}` : "Accès direct"}</span></div>
          <div className="mt-14 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e8c98a]">Préparation esthétique automobile</p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-7xl">Préparez votre véhicule<br /><span className="text-[#e8c98a]">pour vendre mieux</span></h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">Choisissez la préparation adaptée, transmettez les informations du véhicule et payez en ligne. Bryan Cars vous contacte ensuite pour finaliser l&apos;intervention.</p>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-white/55 sm:text-xs">{[[Camera,"Photos"],[Phone,"Contact rapide"],[ShieldCheck,"Paiement sécurisé"]].map(([Icon,label]) => { const ItemIcon = Icon as typeof Camera; return <div className="border border-white/10 bg-white/[0.035] p-3" key={String(label)}><ItemIcon className="mx-auto mb-2 h-4 w-4 text-[#e8c98a]" />{String(label)}</div>; })}</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#e8c98a]">01 — Choisissez</p><h2 className="mt-2 text-3xl font-black uppercase">Votre préparation</h2></div><p className="max-w-md text-sm leading-6 text-white/50">Des forfaits pensés pour rendre un véhicule plus attractif dès les photos et les premières visites.</p></div>
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {data.forfaits.map((forfait, index) => {
              const active = selectedKey === forfait.key;
              return (
                <button className={`group relative overflow-hidden border p-5 text-left transition sm:p-6 ${active ? "border-[#e8c98a] bg-[#e8c98a]/10 shadow-[0_20px_70px_rgba(232,201,138,.12)]" : "border-white/10 bg-[#0d0d0d] hover:border-[#e8c98a]/45"}`} key={forfait.key} onClick={() => chooseForfait(forfait.key)} type="button">
                  <div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center border text-lg font-black ${active ? "border-[#e8c98a] bg-[#e8c98a] text-black" : "border-[#e8c98a]/28 text-[#e8c98a]"}`}>{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black uppercase text-white">{forfait.label}</h3><p className="mt-1 text-xs leading-5 text-white/50">{forfait.tagline}</p></div><p className="shrink-0 text-right text-2xl font-black text-[#e8c98a]">{forfait.startingAt && <span className="block text-[9px] uppercase tracking-wider text-white/45">À partir de</span>}{formatMoney(forfait.priceCents, forfait.currency)}</p></div><ul className="mt-4 grid gap-1.5 sm:grid-cols-2">{forfait.features.map((feature) => <li className="flex items-start gap-2 text-xs text-white/65" key={feature}><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e8c98a]" />{feature}</li>)}</ul></div></div>
                  {active && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-[#e8c98a] text-black"><CheckCircle2 className="h-4 w-4" /></span>}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-white/38">Les forfaits à partir de 349 € et 599 € sont encaissés à leur prix de base. Si l&apos;état du véhicule nécessite un complément, il vous sera proposé et devra être accepté séparément.</p>
        </section>

        <section className="scroll-mt-6 border border-white/12 bg-[#0b0b0b] p-5 sm:p-8" ref={formRef}>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e8c98a]">02 — Renseignez</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black uppercase sm:text-3xl">Le véhicule et vos coordonnées</h2><p className="mt-2 text-sm text-white/50">Déjà client Bryan Cars ? Utilisez simplement la même adresse e-mail.</p></div>{selected && <span className="border border-[#e8c98a]/30 bg-[#e8c98a]/8 px-3 py-2 text-xs font-bold text-[#f4dca0]">{selected.label} · {formatMoney(selected.priceCents)}</span>}</div>
          {!selected ? <button className="mt-7 flex w-full items-center justify-center gap-2 border border-[#e8c98a]/30 bg-[#e8c98a]/8 px-5 py-5 text-sm font-bold text-[#e8c98a]" onClick={() => window.scrollTo({ top: 420, behavior: "smooth" })} type="button"><Sparkles className="h-4 w-4" />Choisissez d&apos;abord un forfait</button> : (
            <div className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[["customerName","Nom et prénom *","Jean Dupont","text"],["customerEmail","E-mail *","jean@email.com","email"],["customerPhone","Téléphone *","06 12 34 56 78","tel"],["vehicleModel","Véhicule *","Peugeot 3008 GT","text"],["vehiclePlate","Immatriculation","AB-123-CD","text"]].map(([key,label,placeholder,type]) => <label className={key === "vehiclePlate" ? "sm:col-span-2" : ""} key={key}><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</span><input className="mt-2 w-full border border-white/12 bg-black/45 px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#e8c98a]" onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} type={type} value={form[key as keyof typeof form]} /></label>)}
                <label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">État du véhicule / précision utile</span><textarea className="mt-2 min-h-28 w-full resize-y border border-white/12 bg-black/45 px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#e8c98a]" maxLength={600} onChange={(event) => setForm((current) => ({ ...current, vehicleDetails: event.target.value }))} placeholder="Ex. taches sur la banquette, rayures légères côté conducteur..." value={form.vehicleDetails} /></label>
              </div>
              <div><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Photos du véhicule *</p><p className="mt-1 text-xs text-white/45">Au moins une photo, jusqu&apos;à 8.</p></div><span className="text-xs font-bold text-[#e8c98a]">{images.length}/8</span></div><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">{images.map((image) => <div className="relative aspect-square overflow-hidden border border-white/12" key={image.id}><img alt="Aperçu du véhicule" className="h-full w-full object-cover" src={image.url} /><button aria-label="Retirer la photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/80" onClick={() => removeImage(image.id)} type="button"><X className="h-3.5 w-3.5" /></button></div>)}{images.length < 8 && <label className="grid aspect-square cursor-pointer place-items-center border border-dashed border-[#e8c98a]/40 bg-[#e8c98a]/5 text-[#e8c98a] hover:bg-[#e8c98a]/10"><span className="text-center"><Camera className="mx-auto h-5 w-5" /><span className="mt-1 block text-[8px] font-black uppercase">Ajouter</span></span><input accept="image/*" className="hidden" multiple onChange={selectImages} type="file" /></label>}</div></div>
              <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-white/62"><input checked={acceptedTerms} className="mt-0.5 h-4 w-4 accent-[#e8c98a]" onChange={(event) => setAcceptedTerms(event.target.checked)} type="checkbox" /><span>J&apos;accepte les <Link className="text-[#e8c98a] underline" target="_blank" to="/conditions">conditions générales</Link> et la <Link className="text-[#e8c98a] underline" target="_blank" to="/confidentialite">politique de confidentialité</Link>.</span></label>
              {error && <p className="border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}
              <button className="flex w-full items-center justify-center gap-2 bg-[#e8c98a] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-[#f4dca0] disabled:cursor-not-allowed disabled:opacity-40" disabled={!valid || busy} onClick={() => void submit()} type="button">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}{busy ? "Préparation du paiement..." : `Payer ${formatMoney(selected.priceCents)}`} {!busy && <ArrowRight className="h-5 w-5" />}</button>
              <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/35"><ShieldCheck className="h-3.5 w-3.5" />Paiement sécurisé par SumUp · vos informations sont transmises à Bryan Cars</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
