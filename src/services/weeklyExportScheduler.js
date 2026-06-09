const { db } = require("../db");
const { createDataExportFile, markExportJobEmailSent } = require("./dataExport");
const { sendAdminDataExportEmail } = require("../email");

const PARIS_TIMEZONE = "Europe/Paris";
const CHECK_INTERVAL_MS = 60 * 1000;

let schedulerStarted = false;
let running = false;

function parisParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    weekday: parts.weekday,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function timestampToParisDate(timestamp) {
  if (!timestamp) return null;
  return parisParts(new Date(Number(timestamp) * 1000)).isoDate;
}

function lastWeeklyExportDate() {
  const row = db
    .prepare(
      `
      SELECT created_at
      FROM export_jobs
      WHERE trigger_type = 'weekly'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    )
    .get();

  return timestampToParisDate(row?.created_at || null);
}

async function maybeRunWeeklyExport() {
  if (running) {
    return;
  }

  const now = parisParts();
  const isSunday = now.weekday.toLowerCase().startsWith("sun");
  const withinWindow = now.hour === 10 && now.minute < 10;

  if (!isSunday || !withinWindow) {
    return;
  }

  if (lastWeeklyExportDate() === now.isoDate) {
    return;
  }

  running = true;
  try {
    const exportFile = createDataExportFile("weekly");
    const emailSent = await sendAdminDataExportEmail({
      fileName: exportFile.fileName,
      buffer: exportFile.buffer,
      triggerType: "weekly",
    });

    if (emailSent) {
      markExportJobEmailSent(exportFile.filePath);
    }
  } catch (error) {
    console.error("[weeklyExportScheduler] erreur:", error);
  } finally {
    running = false;
  }
}

function startWeeklyExportScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  void maybeRunWeeklyExport();
  setInterval(() => {
    void maybeRunWeeklyExport();
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  startWeeklyExportScheduler,
};
