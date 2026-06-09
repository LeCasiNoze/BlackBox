const fs = require("fs");
const path = require("path");

const { FOUNDERS_UPLOAD_DIR, ensureDir } = require("../config/storage");
const {
  createClient,
  resetAllClientsAndRelatedData,
  updateClientTermsAcceptance,
} = require("../db/clients");

const CANDIDATE_SOURCE_IMAGES = [
  "D:\\A6C6DAC8-5CB3-4981-8038-817FCD880268.png",
  path.join(__dirname, "..", "..", "web", "public", "founder-seed.png"),
];

function toDateInput(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function maybeCopyFounderImage() {
  const source =
    process.env.FOUNDER_IMAGE_SOURCE ||
    CANDIDATE_SOURCE_IMAGES.find((candidate) => fs.existsSync(candidate));
  if (!source || !fs.existsSync(source)) {
    console.warn(`[seed:founder] image source not found: ${source}`);
    return null;
  }

  ensureDir(FOUNDERS_UPLOAD_DIR);
  const ext = path.extname(source) || ".png";
  const fileName = `founder-seed${ext.toLowerCase()}`;
  const target = path.join(FOUNDERS_UPLOAD_DIR, fileName);
  fs.copyFileSync(source, target);
  return `/uploads/founders/${fileName}`;
}

function main() {
  const founderMediaUrl = maybeCopyFounderImage();
  resetAllClientsAndRelatedData();

  const now = Date.now();
  const inOneYear = new Date(now);
  inOneYear.setFullYear(inOneYear.getFullYear() + 1);

  const founder = createClient({
    firstName: "Client",
    lastName: "Fondateur",
    email: "",
    phone: "",
    clientType: "bbx",
    isFounder: true,
    founderMediaUrl,
    vehicleLabel: "Vehicule fondateur",
    vehicleModel: "BMW M3",
    vehiclePlate: "FO-001-BC",
    formulaName: "Formule 10 nettoyages",
    formulaTotal: 10,
    formulaRemaining: 10,
    formulaPurchasedAt: toDateInput(now),
    formulaExpiresAt: toDateInput(inOneYear.getTime()),
    notes: "Compte fondateur seed sans envoi de mail.",
  });

  updateClientTermsAcceptance(founder.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: founder.id,
        slug: founder.slug,
        cardCode: founder.card_code,
        founderMediaUrl,
      },
      null,
      2,
    ),
  );
}

main();
