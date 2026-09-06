import * as React from "react";
import { Check, ChevronDown, Crown, LockKeyhole, Sparkles, X } from "lucide-react";

import type { ServiceCatalogItem, ServiceCategory } from "../lib/serviceCatalog";

type ServicePickerProps = {
  catalog: ServiceCatalogItem[];
  categories: ServiceCategory[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  allowFounder?: boolean;
  onFounderAction?: () => void;
  tone?: "portal" | "landing";
};

export function ServicePicker({
  catalog,
  categories,
  selectedKeys,
  onChange,
  allowFounder = false,
  onFounderAction,
  tone = "portal",
}: ServicePickerProps) {
  const orderedCategories = React.useMemo(
    () =>
      [...categories]
        .sort((left, right) => left.order - right.order)
        .filter((category) => catalog.some((service) => service.category === category.key)),
    [catalog, categories],
  );
  const [openCategory, setOpenCategory] = React.useState<string | null>(
    () => orderedCategories.find((category) => category.key === "complete")?.key || orderedCategories[0]?.key || null,
  );
  const [openSubcategory, setOpenSubcategory] = React.useState<string | null>(null);
  const selected = catalog.filter((service) => selectedKeys.includes(service.key));
  const landing = tone === "landing";

  function toggle(key: string) {
    onChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key],
    );
  }

  function renderService(service: ServiceCatalogItem, featured = false) {
    const active = selectedKeys.includes(service.key);
    return (
      <button
        className={`flex w-full items-center gap-3 text-left transition active:scale-[0.99] ${
          featured
            ? `min-h-[76px] rounded-[18px] border p-3.5 ${
                active
                  ? "border-accent/70 bg-accent/12 shadow-none"
                  : "border-white/10 bg-black/25 hover:border-accent/35 hover:bg-accent/[0.05]"
              }`
            : `rounded-xl px-3 py-3 ${active ? "bg-accent/10" : "hover:bg-white/[0.04]"}`
        }`}
        aria-pressed={active}
        key={service.key}
        onClick={() => toggle(service.key)}
        type="button"
      >
        {featured && (
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-accent/20 bg-accent/[0.07] text-accent">
            {service.imageUrl ? (
              <img alt="" className="h-full w-full object-cover" src={service.imageUrl} />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </span>
        )}
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
            active
              ? "border-accent bg-accent text-black"
              : "border-white/20 bg-black/20 text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 text-xs font-bold leading-5 text-white sm:text-sm">
          {service.label}
        </span>
      </button>
    );
  }

  return (
    <div
      className={
        landing
          ? "border border-white/15 bg-black/25 p-4 sm:p-5"
          : "rounded-[16px] border border-white/10 bg-black/20 p-4 sm:p-5"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">
            Prestations souhaitées
          </p>
          <p className="mt-1.5 text-sm font-semibold text-white">
            {selected.length > 0
              ? `${selected.length} prestation${selected.length > 1 ? "s" : ""} dans votre demande`
              : "Composez librement votre demande"}
          </p>
        </div>
        {selected.length > 0 && (
          <button
            className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45 transition hover:border-white/25 hover:text-white"
            onClick={() => onChange([])}
            type="button"
          >
            Vider
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {orderedCategories.map((category) => {
          const categoryServices = catalog.filter((service) => service.category === category.key);
          const categorySelected = categoryServices.filter((service) => selectedKeys.includes(service.key)).length;
          const founderLocked = category.key === "founder" && !allowFounder;
          const expanded = openCategory === category.key;
          const featured = category.key === "complete";
          const subcategories = Array.from(
            new Set(categoryServices.map((service) => service.subcategory)),
          );

          return (
            <section
              className={`overflow-hidden border transition ${
                featured
                  ? "rounded-[14px] border-accent/35 bg-[linear-gradient(145deg,rgba(232,201,138,0.10),rgba(255,255,255,0.025))]"
                  : expanded
                    ? "rounded-[14px] border-accent/25 bg-white/[0.035]"
                    : "rounded-[14px] border-white/10 bg-white/[0.02]"
              }`}
              key={category.key}
            >
              <button
                className={`flex w-full items-center gap-3 text-left ${featured ? "px-4 py-4" : "px-3.5 py-3.5"}`}
                onClick={() => {
                  setOpenCategory((current) => (current === category.key ? null : category.key));
                  setOpenSubcategory(null);
                }}
                type="button"
              >
                <span
                  className={`grid shrink-0 place-items-center rounded-[13px] border ${
                    featured
                      ? "h-11 w-11 border-accent/35 bg-accent/12 text-accentSoft"
                      : "h-10 w-10 border-white/10 bg-black/20 text-white/50"
                  }`}
                >
                  {founderLocked ? (
                    <LockKeyhole className="h-4 w-4" />
                  ) : category.key === "founder" ? (
                    <Crown className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-black ${featured ? "text-accentSoft" : "text-white"}`}>
                    {category.label}
                  </span>
                  <span className="mt-1 block text-[11px] text-white/42">
                    {featured
                      ? "Intérieur + extérieur · le choix le plus simple"
                      : `${categoryServices.length} prestation${categoryServices.length > 1 ? "s" : ""}`}
                  </span>
                </span>
                {categorySelected > 0 && (
                  <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-black text-accentSoft">
                    {categorySelected}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${
                    expanded ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>

              {expanded && founderLocked ? (
                <div className="border-t border-white/8 p-4">
                  <p className="text-xs leading-5 text-white/58">
                    Ces entretiens sont exclusivement réservés aux membres Fondateurs.
                  </p>
                  {onFounderAction && (
                    <button
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 text-xs font-black text-accentSoft transition hover:bg-accent/15"
                      onClick={onFounderAction}
                      type="button"
                    >
                      <Crown className="h-4 w-4" /> Devenir Fondateur — 49,90 €
                    </button>
                  )}
                </div>
              ) : expanded ? (
                <div className="border-t border-white/8 p-2.5">
                  {subcategories.length === 1 ? (
                    <div className={featured ? "grid gap-2 sm:grid-cols-2" : "space-y-1"}>
                      {categoryServices.map((service) => renderService(service, featured))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subcategories.map((subcategory) => {
                        const subgroupKey = `${category.key}:${subcategory}`;
                        const subgroupServices = categoryServices.filter(
                          (service) => service.subcategory === subcategory,
                        );
                        const subgroupSelected = subgroupServices.filter((service) =>
                          selectedKeys.includes(service.key),
                        ).length;
                        const subgroupExpanded = openSubcategory === subgroupKey;
                        return (
                          <section
                            className="overflow-hidden rounded-[15px] border border-white/10 bg-black/20"
                            key={subgroupKey}
                          >
                            <button
                              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                              onClick={() =>
                                setOpenSubcategory((current) =>
                                  current === subgroupKey ? null : subgroupKey,
                                )
                              }
                              type="button"
                            >
                              <span className="min-w-0 flex-1 text-xs font-bold text-white/78">
                                {subcategory}
                              </span>
                              {subgroupSelected > 0 && (
                                <span className="rounded-full bg-accent/12 px-2 py-1 text-[10px] font-black text-accent">
                                  {subgroupSelected}
                                </span>
                              )}
                              <ChevronDown
                                className={`h-4 w-4 text-white/35 transition-transform ${
                                  subgroupExpanded ? "rotate-180 text-accent" : ""
                                }`}
                              />
                            </button>
                            {subgroupExpanded && (
                              <div className="border-t border-white/8 p-1.5">
                                {subgroupServices.map((service) => renderService(service))}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 border-t border-white/8 pt-3">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/32">
            Votre sélection
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((service) => (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.07] px-2.5 py-1.5 text-[10px] font-semibold text-accentSoft"
                key={service.key}
                onClick={() => toggle(service.key)}
                type="button"
              >
                {service.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
