const fs = require("fs");
const path = require("path");

const { db, nowUnix } = require("../db");
const { EXPORTS_DIR, UPLOADS_DIR, ensureDir } = require("../config/storage");

function formatExportTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function listFilesRecursively(rootDir, currentDir = rootDir) {
  if (!fs.existsSync(currentDir)) {
    return [];
  }

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(rootDir, absolute));
      continue;
    }

    const stat = fs.statSync(absolute);
    files.push({
      relativePath: path.relative(rootDir, absolute).replace(/\\/g, "/"),
      absolutePath: absolute,
      size: stat.size,
      modifiedAt: Math.floor(stat.mtimeMs / 1000),
    });
  }

  return files;
}

function collectTable(tableName, orderBy = "id ASC") {
  return db.prepare(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`).all();
}

function buildExportPayload() {
  return {
    exportedAt: nowUnix(),
    version: 2,
    tables: {
      clients: collectTable("clients"),
      vehicles: collectTable("vehicles"),
      appointments: collectTable("appointments"),
      appointmentPhotos: collectTable("appointment_photos"),
      rewardRedemptions: collectTable("reward_redemptions"),
      exportJobs: collectTable("export_jobs", "created_at DESC"),
    },
    uploads: listFilesRecursively(UPLOADS_DIR),
  };
}

function logExportJob({ triggerType, fileName, filePath, emailSent = false }) {
  db.prepare(
    `
    INSERT INTO export_jobs (
      trigger_type,
      file_name,
      file_path,
      email_sent,
      created_at
    ) VALUES (?, ?, ?, ?, ?)
  `
  ).run(triggerType, fileName, filePath, emailSent ? 1 : 0, nowUnix());
}

function markExportJobEmailSent(filePath) {
  db.prepare(
    `
    UPDATE export_jobs
    SET email_sent = 1
    WHERE file_path = ?
  `,
  ).run(filePath);
}

function createDataExportFile(triggerType = "manual", emailSent = false) {
  ensureDir(EXPORTS_DIR);

  const payload = buildExportPayload();
  const fileName = `bryan-cars-export-${formatExportTimestamp()}.json`;
  const filePath = path.join(EXPORTS_DIR, fileName);
  const content = JSON.stringify(payload, null, 2);

  fs.writeFileSync(filePath, content, "utf8");
  logExportJob({ triggerType, fileName, filePath, emailSent });

  return {
    fileName,
    filePath,
    buffer: Buffer.from(content, "utf8"),
  };
}

module.exports = {
  buildExportPayload,
  createDataExportFile,
  markExportJobEmailSent,
};
