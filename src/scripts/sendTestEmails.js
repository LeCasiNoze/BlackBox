const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

function requiredEnvKeys() {
  return [
    "BREVO_API_KEY",
    "MAIL_FROM_EMAIL",
    "MAIL_ADMIN_TO",
    "ADMIN_DASHBOARD_URL",
  ];
}

function getMissingEnvKeys() {
  return requiredEnvKeys().filter((key) => !process.env[key]);
}

function buildTestClient(email, overrides = {}) {
  return {
    id: 9999,
    slug: "bbx-001",
    card_code: "BBX-001",
    first_name: "Lucas",
    last_name: "Paget",
    full_name: "Lucas Paget",
    email,
    phone: "+33 6 00 00 00 00",
    client_type: "bbx",
    is_founder: 0,
    founder_media_url: null,
    vehicle_model: "BMW M3",
    vehicle_plate: "AB-123-CD",
    formula_name: "Formule 10 nettoyages",
    formula_total: 10,
    formula_remaining: 9,
    formula_purchased_at: 1780963200,
    formula_expires_at: 1812499200,
    terms_accepted_at: 1781010600,
    bc_points: 1200,
    ...overrides,
  };
}

async function run() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.error("Usage: npm run mail:test -- <adresse-email>");
    process.exitCode = 1;
    return;
  }

  process.env.MAIL_ADMIN_TO = targetEmail;
  if (!process.env.CLIENT_PORTAL_BASE_URL) {
    process.env.CLIENT_PORTAL_BASE_URL = "https://blackboxbc.com";
  }

  const {
    sendAdminDataExportEmail,
    sendAdminNotification,
    sendAdminRewardRedemption,
    sendClientAppointmentStatusEmail,
    sendClientFormulaRecap,
    sendClientWelcomeEmail,
  } = require("../email");

  const missingKeys = getMissingEnvKeys();
  if (missingKeys.length > 0) {
    console.error(`Variables manquantes: ${missingKeys.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const baseClient = buildTestClient(targetEmail);
  const founderClient = buildTestClient(targetEmail, {
    is_founder: 1,
    formula_name: "Formule Fondateur",
  });

  const exportBuffer = Buffer.from(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "mail-test-script",
        note: "Ceci est un export de demonstration pour verifier le rendu email.",
      },
      null,
      2,
    ),
    "utf8",
  );

  const tests = [
    {
      label: "welcome-standard",
      run: () => sendClientWelcomeEmail(baseClient),
    },
    {
      label: "welcome-founder",
      run: () => sendClientWelcomeEmail(founderClient),
    },
    {
      label: "formula-recap",
      run: () => sendClientFormulaRecap(baseClient),
    },
    {
      label: "admin-notification-book",
      run: () =>
        sendAdminNotification({
          type: "book",
          client: baseClient,
          date: "2026-06-18",
          time: "10:00",
          location: "atelier",
        }),
    },
    {
      label: "admin-notification-update",
      run: () =>
        sendAdminNotification({
          type: "update",
          client: baseClient,
          date: "2026-06-18",
          time: "14:30",
          location: "domicile",
        }),
    },
    {
      label: "admin-notification-cancel",
      run: () =>
        sendAdminNotification({
          type: "cancel",
          client: baseClient,
          date: "2026-06-19",
          time: "09:00",
          location: "atelier",
        }),
    },
    {
      label: "client-appointment-confirmed",
      run: () =>
        sendClientAppointmentStatusEmail({
          client: baseClient,
          appointment: {
            date: "2026-06-20",
            slot: "morning",
            time: "09:30",
            location: "atelier",
            vehicle_model: "BMW M3",
            vehicle_plate: "AB-123-CD",
          },
          eventType: "confirmed",
        }),
    },
    {
      label: "client-appointment-done",
      run: () =>
        sendClientAppointmentStatusEmail({
          client: baseClient,
          appointment: {
            date: "2026-06-20",
            slot: "afternoon",
            time: "15:00",
            location: "domicile",
            vehicle_model: "BMW M3",
            vehicle_plate: "AB-123-CD",
          },
          eventType: "done",
        }),
    },
    {
      label: "reward-redemption",
      run: () =>
        sendAdminRewardRedemption({
          client: baseClient,
          reward: {
            label: "Traitement hydrophobe vitres longue duree",
            pointsCost: 300,
          },
        }),
    },
    {
      label: "data-export",
      run: () =>
        sendAdminDataExportEmail({
          fileName: "bryan-cars-export-test.json",
          buffer: exportBuffer,
          triggerType: "manual",
        }),
    },
  ];

  let failures = 0;

  for (const test of tests) {
    try {
      const result = await test.run();
      if (result) {
        console.log(`OK ${test.label}`);
      } else {
        failures += 1;
        console.log(`FAIL ${test.label}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`ERROR ${test.label}:`, error.message || error);
    }
  }

  if (failures > 0) {
    console.error(`Termine avec ${failures} echec(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Tous les emails de test ont ete tentes vers ${targetEmail}.`);
}

run();
