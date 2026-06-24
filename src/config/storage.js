const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..", "..");
const DEFAULT_DATA_DIR = path.join(PROJECT_ROOT, "data");

const DATA_DIR = path.resolve(process.env.DATA_DIR || DEFAULT_DATA_DIR);
const DB_FILE = path.resolve(process.env.DB_FILE || path.join(DATA_DIR, "blackbox.db"));
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(DATA_DIR, "uploads"));
const APPOINTMENTS_UPLOAD_DIR = path.join(UPLOADS_DIR, "appointments");
const QUOTES_UPLOAD_DIR = path.join(UPLOADS_DIR, "quotes");
const FOUNDERS_UPLOAD_DIR = path.join(UPLOADS_DIR, "founders");
const EXPORTS_DIR = path.join(DATA_DIR, "exports");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  PROJECT_ROOT,
  DATA_DIR,
  DB_FILE,
  UPLOADS_DIR,
  APPOINTMENTS_UPLOAD_DIR,
  QUOTES_UPLOAD_DIR,
  FOUNDERS_UPLOAD_DIR,
  EXPORTS_DIR,
  ensureDir,
};
