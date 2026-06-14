const { db, nowUnix } = require("./index");
const { DEFERRED_BC_PER_CREDIT } = require("../config/bcoins");

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

// RDV effectue (fondateur uniquement): libere 20 BC par credit consomme, pris
// dans le pool differe (bc_pending). Remplace l'ancien bonus fixe de 100 BC.
function awardPointsForAppointment(clientId, appointmentId) {
  return db.transaction((ownerId, apptId) => {
    const appointment = db
      .prepare(
        `SELECT bc_points_awarded, credits_charged, client_id FROM appointments WHERE id = ? LIMIT 1`,
      )
      .get(apptId);
    if (!appointment || appointment.bc_points_awarded) {
      return false;
    }

    const client = db
      .prepare(`SELECT is_founder, bc_points, bc_pending FROM clients WHERE id = ? LIMIT 1`)
      .get(ownerId);
    if (!client || !client.is_founder) {
      // Pas de BC pour les non-fondateurs: on marque traite sans rien crediter.
      db.prepare(`UPDATE appointments SET bc_points_awarded = 1, bc_points_granted = 0, updated_at = ? WHERE id = ?`).run(
        nowUnix(),
        apptId,
      );
      return false;
    }

    const consumed = Math.max(0, Number(appointment.credits_charged || 0));
    const pending = Math.max(0, Number(client.bc_pending || 0));
    const amount = Math.min(DEFERRED_BC_PER_CREDIT * consumed, pending);

    db.prepare(
      `
      UPDATE clients
      SET bc_points = COALESCE(bc_points, 0) + ?,
          bc_pending = COALESCE(bc_pending, 0) - ?,
          updated_at = ?
      WHERE id = ?
    `,
    ).run(amount, amount, nowUnix(), ownerId);

    db.prepare(
      `UPDATE appointments SET bc_points_awarded = 1, bc_points_granted = ?, updated_at = ? WHERE id = ?`,
    ).run(amount, nowUnix(), apptId);

    return true;
  })(clientId, appointmentId);
}

// Annulation/deconfirmation d'un RDV effectue: rend les BC differes au pool.
function revokePointsForAppointment(clientId, appointmentId) {
  return db.transaction((ownerId, apptId) => {
    const appointment = db
      .prepare(`SELECT bc_points_awarded, bc_points_granted FROM appointments WHERE id = ? LIMIT 1`)
      .get(apptId);
    if (!appointment || !appointment.bc_points_awarded) {
      return false;
    }

    const granted = Math.max(0, Number(appointment.bc_points_granted || 0));
    if (granted > 0) {
      const client = db.prepare(`SELECT bc_points FROM clients WHERE id = ? LIMIT 1`).get(ownerId);
      const nextPoints = Math.max(0, Number(client?.bc_points || 0) - granted);
      db.prepare(
        `
        UPDATE clients
        SET bc_points = ?,
            bc_pending = COALESCE(bc_pending, 0) + ?,
            updated_at = ?
        WHERE id = ?
      `,
      ).run(nextPoints, granted, nowUnix(), ownerId);
    }

    db.prepare(
      `UPDATE appointments SET bc_points_awarded = 0, bc_points_granted = 0, updated_at = ? WHERE id = ?`,
    ).run(nowUnix(), apptId);

    return true;
  })(clientId, appointmentId);
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
