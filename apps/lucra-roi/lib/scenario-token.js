const crypto = require('crypto');

const VERSION = 'v1';
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function secretKey(secret) {
  if (!secret || String(secret).length < 32) {
    throw new Error('SCENARIO_SECRET must be at least 32 characters');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function decode(value) {
  return Buffer.from(value, 'base64url');
}

function createScenarioToken(payload, secret, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const ttlSeconds = Math.max(300, Math.min(Number(options.ttlSeconds) || DEFAULT_TTL_SECONDS, 30 * 24 * 60 * 60));
  const body = Buffer.from(JSON.stringify({
    iat: now,
    exp: now + ttlSeconds * 1000,
    data: payload,
  }));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(secret), iv);
  cipher.setAAD(Buffer.from(VERSION));
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, encode(iv), encode(tag), encode(encrypted)].join('.');
}

function parseScenarioToken(token, secret, options = {}) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error('Invalid scenario token');
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(secret), decode(parts[1]));
  decipher.setAAD(Buffer.from(VERSION));
  decipher.setAuthTag(decode(parts[2]));
  const body = JSON.parse(Buffer.concat([decipher.update(decode(parts[3])), decipher.final()]).toString('utf8'));
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  if (!Number.isFinite(body.exp) || body.exp < now) throw new Error('Scenario link expired');
  return body;
}

module.exports = { createScenarioToken, parseScenarioToken, DEFAULT_TTL_SECONDS };
