const { db, nowUnix } = require("./index");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function createSignupCode({ email, payload, ttlMinutes = 20 }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = nowUnix();
  const expiresAt = now + Math.max(5, ttlMinutes) * 60;

  db.prepare(
    `
    UPDATE signup_codes
    SET status = 'expired'
    WHERE lower(email) = lower(?)
      AND status = 'pending'
  `,
  ).run(normalizedEmail);

  const info = db
    .prepare(
      `
      INSERT INTO signup_codes (
        email,
        code,
        payload_json,
        status,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, 'pending', ?, ?)
    `,
    )
    .run(normalizedEmail, code, JSON.stringify(payload || {}), expiresAt, now);

  return {
    id: info.lastInsertRowid,
    email: normalizedEmail,
    code,
    expiresAt,
  };
}

function consumeSignupCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
    return null;
  }

  return db.transaction(() => {
    const row =
      db
        .prepare(
          `
          SELECT *
          FROM signup_codes
          WHERE lower(email) = lower(?)
            AND code = ?
            AND status = 'pending'
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        `,
        )
        .get(normalizedEmail, normalizedCode) || null;

    if (!row) return null;
    if (Number(row.expires_at || 0) < nowUnix()) {
      db.prepare(`UPDATE signup_codes SET status = 'expired' WHERE id = ?`).run(row.id);
      return null;
    }

    db.prepare(
      `
      UPDATE signup_codes
      SET status = 'used',
          used_at = ?
      WHERE id = ?
    `,
    ).run(nowUnix(), row.id);

    try {
      return JSON.parse(row.payload_json || "{}");
    } catch (error) {
      return {};
    }
  })();
}

module.exports = {
  consumeSignupCode,
  createSignupCode,
};
