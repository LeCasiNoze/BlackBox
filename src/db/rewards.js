const { db, nowUnix } = require("./index");

const BC_REWARDS = [
  {
    key: "hydrophobic-glass",
    label: "Traitement hydrophobe vitres longue duree",
    pointsCost: 300,
  },
  {
    key: "microfiber-premium",
    label: "Microfibre premium Bryan Cars",
    pointsCost: 500,
  },
  {
    key: "nfc-keychain",
    label: "Porte-cles NFC Bryan Cars",
    pointsCost: 500,
  },
  {
    key: "hydrophobic-bodywork",
    label: "Traitement hydrophobe carrosserie",
    pointsCost: 700,
  },
  {
    key: "natural-wax",
    label: "Cire naturelle premium haute brillance + protection UV",
    pointsCost: 1000,
  },
  {
    key: "detailing-upgrade",
    label: "Upgrade Detailing offert sur le prochain rendez-vous",
    pointsCost: 1500,
  },
  {
    key: "gift-card-100",
    label: "Bon d'achat Bryan Cars 100 EUR",
    pointsCost: 2000,
  },
  {
    key: "maintenance-polish",
    label: "Lustrage d'entretien offert",
    pointsCost: 3000,
  },
  {
    key: "premium-reward",
    label: "Recompense exceptionnelle premium",
    pointsCost: 5000,
  },
];

function getRewardDefinition(rewardKey) {
  return BC_REWARDS.find((reward) => reward.key === rewardKey) || null;
}

function listRewardRedemptionsByClient(clientId) {
  return db
    .prepare(
      `
      SELECT *
      FROM reward_redemptions
      WHERE client_id = ?
      ORDER BY created_at DESC, id DESC
    `
    )
    .all(clientId);
}

function createRewardRedemption(clientId, reward) {
  const now = nowUnix();
  const info = db
    .prepare(
      `
      INSERT INTO reward_redemptions (
        client_id,
        reward_key,
        reward_label,
        points_cost,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'requested', ?, ?)
    `
    )
    .run(clientId, reward.key, reward.label, reward.pointsCost, now, now);

  return db
    .prepare(
      `
      SELECT *
      FROM reward_redemptions
      WHERE id = ?
    `
    )
    .get(info.lastInsertRowid);
}

function changeClientPoints(clientId, delta) {
  const client = db.prepare(`SELECT bc_points FROM clients WHERE id = ?`).get(clientId);
  if (!client) return null;

  const nextPoints = Number(client.bc_points || 0) + Number(delta || 0);
  if (nextPoints < 0) {
    return null;
  }

  db.prepare(
    `
    UPDATE clients
    SET bc_points = ?,
        updated_at = ?
    WHERE id = ?
  `
  ).run(nextPoints, nowUnix(), clientId);

  return nextPoints;
}

function awardPointsForAppointment(clientId, appointmentId, points = 100) {
  const appointment = db
    .prepare(`SELECT bc_points_awarded FROM appointments WHERE id = ? LIMIT 1`)
    .get(appointmentId);

  if (!appointment || appointment.bc_points_awarded) {
    return false;
  }

  const nextPoints = changeClientPoints(clientId, points);
  if (nextPoints == null) {
    return false;
  }

  db.prepare(
    `
    UPDATE appointments
    SET bc_points_awarded = 1,
        updated_at = ?
    WHERE id = ?
  `
  ).run(nowUnix(), appointmentId);

  return true;
}

function revokePointsForAppointment(clientId, appointmentId, points = 100) {
  const appointment = db
    .prepare(`SELECT bc_points_awarded FROM appointments WHERE id = ? LIMIT 1`)
    .get(appointmentId);

  if (!appointment || !appointment.bc_points_awarded) {
    return false;
  }

  const nextPoints = changeClientPoints(clientId, -Math.abs(points));
  if (nextPoints == null) {
    return false;
  }

  db.prepare(
    `
    UPDATE appointments
    SET bc_points_awarded = 0,
        updated_at = ?
    WHERE id = ?
  `,
  ).run(nowUnix(), appointmentId);

  return true;
}

module.exports = {
  BC_REWARDS,
  awardPointsForAppointment,
  changeClientPoints,
  createRewardRedemption,
  getRewardDefinition,
  listRewardRedemptionsByClient,
  revokePointsForAppointment,
};
