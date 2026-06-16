// src/services/imageProcessing.js
// Allege les images uploadees (photos de prestation) : rotation EXIF,
// redimension max 1600px (cote le plus long) et conversion WebP qualite 80.
// En cas d'echec (format illisible, sharp indisponible), on garde le fichier
// d'origine pour ne jamais perdre l'upload.
const fs = require("fs");
const path = require("path");

let sharp = null;
try {
  sharp = require("sharp");
} catch (_error) {
  sharp = null;
}

const MAX_SIDE = 1600;
const WEBP_QUALITY = 80;

/**
 * Optimise une image deja ecrite sur le disque par multer.
 * @param {string} uploadDir  dossier ou se trouve le fichier
 * @param {string} originalFilename  nom du fichier ecrit par multer
 * @returns {Promise<string>} le nom du fichier a stocker (webp optimise, ou
 *   l'original si la conversion a echoue).
 */
async function optimizeUploadedImage(uploadDir, originalFilename) {
  if (!sharp || !originalFilename) {
    return originalFilename;
  }

  const srcPath = path.join(uploadDir, originalFilename);
  const base = path.parse(originalFilename).name;
  const outName = `${base}.webp`;
  const outPath = path.join(uploadDir, outName);
  const samePath = path.resolve(outPath) === path.resolve(srcPath);
  const writePath = samePath ? path.join(uploadDir, `${base}.opt.webp`) : outPath;

  try {
    await sharp(srcPath)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(writePath);

    if (samePath) {
      fs.renameSync(writePath, outPath);
    } else if (outName !== originalFilename) {
      try {
        fs.unlinkSync(srcPath);
      } catch (_error) {
        /* l'original a pu deja disparaitre */
      }
    }
    return outName;
  } catch (error) {
    console.error("[img] optimizeUploadedImage:", error?.message || error);
    try {
      if (fs.existsSync(writePath) && writePath !== srcPath) {
        fs.unlinkSync(writePath);
      }
    } catch (_error) {
      /* rien */
    }
    return originalFilename;
  }
}

module.exports = { optimizeUploadedImage };
