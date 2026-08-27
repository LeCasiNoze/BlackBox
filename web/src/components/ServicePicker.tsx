import * as React from "react";
import { Check, ChevronDown, Sparkles, X } from "lucide-react";

import type { ServiceCatalogItem, ServiceCategory } from "../lib/serviceCatalog";

type ServicePickerProps = {
  catalog: ServiceCatalogItem[];
  categories: ServiceCategory[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  allowFounder?: boolean;
  tone?: "portal" | "landing";
};

export function ServicePicker({
  catalog,
  categories,
  selectedKeys,
  onChange,
  allowFounder = false,
  tone = "portal",
}: ServicePickerProps) {
  const available = React.useMemo(
    () => catalog.filter((service) => allowFounder || !service.founderOnly),
    [allowFounder, catalog],
  );
  const availableCategories = React.useMemo(
    () =>
      categories.filter((category) =>
        available.some((service) => service.category === category.key),
      ),
    [available, categories],
  );
  const [activeCategory, setActiveCategory] = React.useState(
    () => availableCategories[0]?.key || "complete",
  );
  const selected = available.filter((service) => selectedKeys.includes(service.key));
  const popular = available.filter((service) => service.popular).slice(0, 6);
  const categoryItems = available.filter((service) => service.category === activeCategory);
  const subcategories = Array.from(new Set(categoryItems.map((service) => service.subcategory)));
  const landing = tone === "landing";

  function toggle(key: string) {
    onChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key],
    );
  }

  return (
    <div className={landing ? "border border-white/15 bg-black/25 p-4 sm:p-5" : "rounded-2xl border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e8c98a]">
            Votre panier
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {selected.length > 0
              ? `${selected.length} prestation${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}`
              : "Choisissez au moins une prestation"}
          </p>
        </div>
        {selected.length > 0 && (
          <button className="text-xs font-semibold text-white/45 hover:text-white" onClick={() => onChange([])} type="button">
            Vider
          </button>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
          <Sparkles className="h-3.5 w-3.5 text-[#e8c98a]" /> Les plus demandées
        </p>
        <div className="flex flex-wrap gap-2">
          {popular.map((service) => {
            const active = selectedKeys.includes(service.key);
            return (
              <button
                className={`rounded-full border px-3 py-2 text-left text-[11px] font-semibold transition ${active ? "border-[#e8c98a] bg-[#e8c98a] text-black" : "border-white/12 bg-white/[0.035] text-white/72 hover:border-[#e8c98a]/45"}`}
                key={service.key}
                onClick={() => toggle(service.key)}
                type="button"
              >
                {active && <Check className="mr-1 inline h-3 w-3" />}
                {service.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {availableCategories.map((category) => (
          <button
            className={`shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${activeCategory === category.key ? "border-[#e8c98a]/70 bg-[#e8c98a]/12 text-[#f4dca0]" : "border-white/10 bg-white/[0.025] text-white/45"}`}
            key={category.key}
            onClick={() => setActiveCategory(category.key)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {subcategories.map((subcategory) => {
          const services = categoryItems.filter((service) => service.subcategory === subcategory);
          const picked = services.filter((service) => selectedKeys.includes(service.key)).length;
          return (
            <details className="group rounded-xl border border-white/10 bg-white/[0.025]" key={subcategory} open={picked > 0 || subcategories.length === 1}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-xs font-semibold text-white/78">
                <span>{subcategory}</span>
                <span className="flex items-center gap-2 text-[10px] text-white/35">
                  {picked > 0 && <span className="rounded-full bg-[#e8c98a]/15 px-2 py-1 text-[#e8c98a]">{picked}</span>}
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </span>
              </summary>
              <div className="border-t border-white/8 p-2">
                {services.map((service) => {
                  const active = selectedKeys.includes(service.key);
                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${active ? "bg-[#e8c98a]/10 text-white" : "text-white/62 hover:bg-white/[0.04] hover:text-white"}`}
                      key={service.key}
                      onClick={() => toggle(service.key)}
                      type="button"
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active ? "border-[#e8c98a] bg-[#e8c98a] text-black" : "border-white/20 text-transparent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{service.label}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/8 pt-3">
          {selected.map((service) => (
            <button className="inline-flex items-center gap-1 rounded-full border border-[#e8c98a]/25 bg-[#e8c98a]/8 px-2.5 py-1.5 text-[10px] font-semibold text-[#f4dca0]" key={service.key} onClick={() => toggle(service.key)} type="button">
              {service.label}<X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
