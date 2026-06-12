const crypto = require("crypto");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Azerty01@";
const ADMIN_COOKIE_NAME = "bbx_admin_session";
const ADMIN_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  `${ADMIN_PASSWORD}:${process.env.MAIL_ADMIN_TO || "bryan-cars-admin"}`;

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      if (!key) {
        return accumulator;
      }

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function createSessionToken() {
  return crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)
    .digest("hex");
}

function appendSetCookie(res, cookieValue) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, cookieValue]);
    return;
  }

  res.setHeader("Set-Cookie", [current, cookieValue]);
}

function setAdminSession(res) {
  appendSetCookie(
    res,
    `${ADMIN_COOKIE_NAME}=${createSessionToken()}; Max-Age=${ADMIN_COOKIE_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax`,
  );
}

function clearAdminSession(res) {
  appendSetCookie(
    res,
    `${ADMIN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
  );
}

function isAdminAuthenticated(req) {
  const cookies = parseCookies(req.headers?.cookie || "");
  return cookies[ADMIN_COOKIE_NAME] === createSessionToken();
}

function sanitizeNextUrl(nextUrl) {
  if (typeof nextUrl !== "string") {
    return "/admin";
  }

  if (!nextUrl.startsWith("/") || nextUrl.startsWith("//")) {
    return "/admin";
  }

  return nextUrl.startsWith("/admin") ? nextUrl : "/admin";
}

function resolveNextUrl(req) {
  return sanitizeNextUrl(req.query?.next || req.body?.next);
}

function requireAdminApiAuth(req, res, next) {
  if (isAdminAuthenticated(req)) {
    return next();
  }

  return res.status(401).json({
    ok: false,
    error: "unauthorized",
    loginUrl: `/login?next=${encodeURIComponent(req.originalUrl || "/admin")}`,
  });
}

function requireAdminPageAuth(req, res, next) {
  if (isAdminAuthenticated(req)) {
    return next();
  }

  return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl || "/admin")}`);
}

module.exports = {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  clearAdminSession,
  isAdminAuthenticated,
  requireAdminApiAuth,
  requireAdminPageAuth,
  resolveNextUrl,
  setAdminSession,
};
