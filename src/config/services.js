const SERVICE_CATEGORIES = [
  { key: "complete", label: "Complet & Detailing", order: 1 },
  { key: "exterior", label: "Extérieur", order: 2 },
  { key: "interior", label: "Intérieur", order: 3 },
  { key: "founder", label: "Entretien régulier — Fondateurs", order: 4 },
];

const SERVICE_CATALOG = [
  { key: "complete-basic", category: "complete", subcategory: "Formules complètes", label: "Nettoyage Complet Basique — Intérieur & Extérieur", popular: true },
  { key: "complete-deep", category: "complete", subcategory: "Formules complètes", label: "Nettoyage Complet Approfondi + Sellerie — Intérieur & Extérieur", popular: true },
  { key: "detailing-pack", category: "complete", subcategory: "Formules complètes", label: "Pack Detailing — Finition Supérieure", popular: true },
  { key: "exterior-complete", category: "exterior", subcategory: "Nettoyage extérieur", label: "Nettoyage Extérieur Complet", popular: true },
  { key: "body-decontamination", category: "exterior", subcategory: "Nettoyage extérieur", label: "Décontamination Carrosserie" },
  { key: "engine-bay-hand", category: "exterior", subcategory: "Nettoyage extérieur", label: "Nettoyage Compartiment Moteur à la Main" },
  { key: "soft-top-hydrophobic", category: "exterior", subcategory: "Nettoyage extérieur", label: "Nettoyage Capote & Protection Hydrophobe" },
  { key: "headlight-restoration", category: "exterior", subcategory: "Rénovation & polissage", label: "Rénovation des Optiques", popular: true },
  { key: "exterior-plastics", category: "exterior", subcategory: "Rénovation & polissage", label: "Rénovation & Protection des Plastiques Extérieurs" },
  { key: "polish-stage-1", category: "exterior", subcategory: "Rénovation & polissage", label: "Polissage Stage 1 — Correction légère", popular: true },
  { key: "polish-stage-2", category: "exterior", subcategory: "Rénovation & polissage", label: "Polissage Stage 2 — Correction intermédiaire" },
  { key: "polish-stage-3", category: "exterior", subcategory: "Rénovation & polissage", label: "Polissage Stage 3 — Correction intensive" },
  { key: "body-wax", category: "exterior", subcategory: "Protections & vitrages", label: "Protection Cire Carrosserie" },
  { key: "body-ceramic", category: "exterior", subcategory: "Protections & vitrages", label: "Protection Céramique Carrosserie", popular: true },
  { key: "wheel-ceramic", category: "exterior", subcategory: "Protections & vitrages", label: "Protection Céramique Jantes" },
  { key: "tire-ceramic", category: "exterior", subcategory: "Protections & vitrages", label: "Protection Céramique Flancs de Pneus" },
  { key: "windscreen-hydrophobic", category: "exterior", subcategory: "Protections & vitrages", label: "Traitement Hydrophobe Pare-Brise Longue Durée" },
  { key: "interior-glass-antifog", category: "exterior", subcategory: "Protections & vitrages", label: "Traitement Anti-Buée Vitres Intérieures" },
  { key: "interior-basic", category: "interior", subcategory: "Nettoyage intérieur", label: "Nettoyage Intérieur Basique", popular: true },
  { key: "interior-deep", category: "interior", subcategory: "Nettoyage intérieur", label: "Nettoyage Intérieur Approfondi", popular: true },
  { key: "fabric-extraction", category: "interior", subcategory: "Nettoyage intérieur", label: "Injection / Extraction Sièges Tissu", popular: true },
  { key: "leather-care", category: "interior", subcategory: "Nettoyage intérieur", label: "Nettoyage & Entretien Cuir" },
  { key: "alcantara-cleaning", category: "interior", subcategory: "Nettoyage intérieur", label: "Nettoyage Alcantara" },
  { key: "headliner-cleaning", category: "interior", subcategory: "Nettoyage intérieur", label: "Nettoyage Ciel de Toit" },
  { key: "odor-treatment", category: "interior", subcategory: "Traitements habitacle", label: "Traitement Professionnel des Odeurs", popular: true },
  { key: "fungicide-disinfection", category: "interior", subcategory: "Traitements habitacle", label: "Traitement Fongicide & Désinfectant Habitacle" },
  { key: "screens-glossy-surfaces", category: "interior", subcategory: "Traitements habitacle", label: "Rénovation Écrans & Surfaces Intérieures Brillantes" },
  { key: "fabric-waterproofing", category: "interior", subcategory: "Protections intérieures", label: "Protection Imperméabilisante Tissus" },
  { key: "leather-ceramic", category: "interior", subcategory: "Protections intérieures", label: "Protection Céramique Cuir" },
  { key: "alcantara-waterproofing", category: "interior", subcategory: "Protections intérieures", label: "Protection Imperméabilisante Alcantara" },
  { key: "founder-interior", category: "founder", subcategory: "Entretien Fondateur", label: "Entretien Intérieur", founderOnly: true },
  { key: "founder-exterior", category: "founder", subcategory: "Entretien Fondateur", label: "Entretien Extérieur", founderOnly: true },
  { key: "founder-complete", category: "founder", subcategory: "Entretien Fondateur", label: "Entretien Complet — Intérieur & Extérieur", founderOnly: true },
].map((service) => ({
  ...service,
  founderOnly: service.founderOnly === true,
  popular: service.popular === true,
  imageUrl: null,
}));

function getServicesByKeys(keys) {
  const requested = new Set(Array.isArray(keys) ? keys : []);
  return SERVICE_CATALOG.filter((service) => requested.has(service.key));
}

module.exports = {
  SERVICE_CATEGORIES,
  SERVICE_CATALOG,
  getServicesByKeys,
};
