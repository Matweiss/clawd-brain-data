// The sandbox link registry: which links exist, whether each is still open,
// and what the customer has done with it. Backed by Redis over the Upstash
// REST API (what Vercel's Marketplace Redis and Vercel KV both expose), with
// no client library so the function ships with no dependencies. Without the
// env vars the store is disabled and the sandbox keeps working statelessly:
// links still open until they expire, there is just nothing to look at.
//
// Keys
//   sbx:link:<id>   hash, one per link (see fields below)
//   sbx:links       sorted set, id scored by creation time, for listing
//   sbx:slug:<slug> string, the short link's slug -> id
//   sbx:deal:<id>   string, the live model behind a link (JSON)
//
// Every write is fire-and-forget from the caller's point of view: a store
// failure must never break a customer's page.

const KEEP_AFTER_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;

function env(name) { return process.env[name] || ''; }

function credentials() {
  const url = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL') || env('SANDBOX_REDIS_URL');
  const token = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN') || env('SANDBOX_REDIS_TOKEN');
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

/* One Redis command over REST. Upstash answers { result } or { error }. */
function redisClient(creds) {
  async function command(args) {
    const r = await fetch(creds.url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + creds.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(args.map((a) => String(a))),
    });
    const body = await r.json();
    if (body.error) throw new Error(body.error);
    return body.result;
  }
  async function pipeline(commands) {
    const r = await fetch(creds.url + '/pipeline', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + creds.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands.map((c) => c.map((a) => String(a)))),
    });
    const body = await r.json();
    if (!Array.isArray(body)) throw new Error(body.error || 'Bad pipeline reply');
    return body.map((x) => x.result);
  }
  return { command, pipeline };
}

/* Flat [k, v, k, v] to an object, numbers restored where they matter. */
const NUMERIC = ['createdAt', 'exp', 'days', 'term', 'opens', 'edits', 'badPass', 'firstOpen', 'lastOpen', 'lastEdit', 'lastBadPass', 'revokedAt', 'notifiedAt', 'sellerUpdates', 'lastSellerUpdate', 'passcodeAt', 'extendedAt'];
function unflatten(flat) {
  if (!flat || !flat.length) return null;
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
  NUMERIC.forEach((k) => { if (out[k] !== undefined) out[k] = Number(out[k]) || 0; });
  ['pass', 'unlockAdd', 'revoked'].forEach((k) => { out[k] = out[k] === '1' || out[k] === 'true'; });
  if (out.lastInputs) { try { out.lastInputs = JSON.parse(out.lastInputs); } catch { out.lastInputs = null; } }
  return out;
}

function flatten(obj) {
  const out = [];
  Object.keys(obj).forEach((k) => {
    let v = obj[k];
    if (v === undefined || v === null) return;
    if (typeof v === 'boolean') v = v ? '1' : '0';
    else if (typeof v === 'object') v = JSON.stringify(v);
    out.push(k, String(v));
  });
  return out;
}

function makeId() {
  const { randomBytes } = require('node:crypto');
  return randomBytes(8).toString('hex');
}
/* A short slug for the customer's link: 8 characters from an alphabet with
   no look-alikes, so it survives being read out or retyped. */
const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
function makeSlug() {
  const { randomBytes } = require('node:crypto');
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return out;
}

/* The store API. `redis` is anything with command/pipeline; tests pass a
   memory implementation. */
function createStore(redis, opts) {
  const now = (opts && opts.now) || (() => Date.now());
  const key = (id) => 'sbx:link:' + id, dealKey = (id) => 'sbx:deal:' + id, slugKey = (slug) => 'sbx:slug:' + slug;
  const ttlFor = (exp) => Math.max(60, Math.round((exp + KEEP_AFTER_EXPIRY_MS - now()) / 1000));

  return {
    enabled: true,
    makeId, makeSlug,
    async create(link) {
      const rec = Object.assign({ opens: 0, edits: 0, badPass: 0, revoked: false }, link);
      const cmds = [
        ['HSET', key(link.id)].concat(flatten(rec)),
        ['EXPIRE', key(link.id), ttlFor(link.exp)],
        ['ZADD', 'sbx:links', link.createdAt, link.id],
      ];
      if (link.slug) cmds.push(['SET', slugKey(link.slug), link.id, 'EX', ttlFor(link.exp)]);
      await redis.pipeline(cmds);
      return rec;
    },
    /* The link behind a short slug, or null. */
    async bySlug(slug) {
      if (!slug || !/^[a-z0-9]{4,16}$/.test(String(slug))) return null;
      const id = await redis.command(['GET', slugKey(slug)]);
      return id ? this.get(id) : null;
    },
    /* Push a link's expiry out. Every key that carries the link moves with it
       so the record, the short slug and the live model outlive the old date. */
    async extend(id, exp) {
      const rec = await this.get(id);
      if (!rec) return null;
      const ttl = ttlFor(exp), cmds = [['HSET', key(id), 'exp', exp, 'extendedAt', now()], ['EXPIRE', key(id), ttl], ['EXPIRE', dealKey(id), ttl]];
      if (rec.slug) cmds.push(['EXPIRE', slugKey(rec.slug), ttl]);
      await redis.pipeline(cmds);
      return Object.assign(rec, { exp, extendedAt: now() });
    },
    async get(id) {
      if (!id) return null;
      return unflatten(await redis.command(['HGETALL', key(id)]));
    },
    async list() {
      const ids = await redis.command(['ZREVRANGE', 'sbx:links', 0, 199]);
      if (!ids || !ids.length) return [];
      const rows = await redis.pipeline(ids.map((id) => ['HGETALL', key(id)]));
      const out = [], gone = [];
      rows.forEach((flat, i) => { const rec = unflatten(flat); if (rec) out.push(rec); else gone.push(ids[i]); });
      // Hashes past their keep-window have expired; drop them from the index.
      if (gone.length) await redis.command(['ZREM', 'sbx:links'].concat(gone)).catch(() => {});
      return out;
    },
    /* A customer opened the page (inputs null) or recomputed with an edit. */
    async touch(id, event, data) {
      const t = now(), cmds = [];
      if (event === 'open') {
        cmds.push(['HINCRBY', key(id), 'opens', 1], ['HSET', key(id), 'lastOpen', t], ['HSETNX', key(id), 'firstOpen', t]);
      } else if (event === 'edit') {
        cmds.push(['HINCRBY', key(id), 'edits', 1], ['HSET', key(id), 'lastEdit', t, 'lastInputs', JSON.stringify(data || {})]);
      } else if (event === 'badPass') {
        cmds.push(['HINCRBY', key(id), 'badPass', 1], ['HSET', key(id), 'lastBadPass', t]);
      } else if (event === 'notified') {
        cmds.push(['HSET', key(id), 'notifiedAt', t]);
      } else if (event === 'sellerUpdate') {
        cmds.push(['HINCRBY', key(id), 'sellerUpdates', 1], ['HSET', key(id), 'lastSellerUpdate', t]);
      } else return null;
      // Only touch links that exist: HINCRBY on a missing key would recreate it.
      const exists = await redis.command(['EXISTS', key(id)]);
      if (!Number(exists)) return null;
      await redis.pipeline(cmds);
      return t;
    },
    /* The seller changes a link's passcode from the dashboard; the customer's
       existing link keeps working with the new one. */
    async setPasscode(id, passcode) {
      const exists = await redis.command(['EXISTS', key(id)]);
      if (!Number(exists)) return false;
      await redis.command(['HSET', key(id), 'passcode', String(passcode), 'pass', '1', 'passcodeAt', now()]);
      return true;
    },
    async revoke(id, on) {
      const exists = await redis.command(['EXISTS', key(id)]);
      if (!Number(exists)) return false;
      await redis.command(['HSET', key(id), 'revoked', on === false ? '0' : '1', 'revokedAt', on === false ? 0 : now()]);
      return true;
    },
    async remove(id) {
      const rec = await this.get(id);
      const cmds = [['DEL', key(id)], ['DEL', dealKey(id)], ['ZREM', 'sbx:links', id]];
      if (rec && rec.slug) cmds.push(['DEL', slugKey(rec.slug)]);
      await redis.pipeline(cmds);
      return true;
    },
    /* The live model behind a link: the seller's deal as last saved, and the
       customer's last inputs on top of it. Kept as one JSON string so a read
       is one round trip. */
    async saveDeal(id, deal, exp) {
      const rec = Object.assign({ version: 1, inputs: null, updatedBy: 'seller', updatedAt: now() }, deal);
      const ttl = exp ? ttlFor(exp) : KEEP_AFTER_EXPIRY_MS / 1000;
      await redis.command(['SET', dealKey(id), JSON.stringify(rec), 'EX', Math.round(ttl)]);
      return rec;
    },
    async getDeal(id) {
      if (!id) return null;
      const raw = await redis.command(['GET', dealKey(id)]);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    /* The customer's latest inputs, kept with the deal so they find their own
       changes again. The version does not move: only the seller moves it. */
    async saveInputs(id, inputs) {
      const cur = await this.getDeal(id);
      if (!cur) return null;
      cur.inputs = inputs || null; cur.inputsAt = now();
      const ttl = await redis.command(['TTL', dealKey(id)]);
      await redis.command(['SET', dealKey(id), JSON.stringify(cur)].concat(Number(ttl) > 0 ? ['EX', ttl] : []));
      return cur;
    },
  };
}

/* An in-memory Redis good enough for the commands above; tests and the dev
   server use it so the dashboard can be exercised without a network. */
function createMemoryRedis() {
  const hashes = new Map(), zset = new Map(), strings = new Map();
  async function command(args) {
    const [op, k, ...rest] = args.map((a) => String(a));
    switch (op) {
      case 'HSET': { const h = hashes.get(k) || {}; for (let i = 0; i < rest.length; i += 2) h[rest[i]] = rest[i + 1]; hashes.set(k, h); return rest.length / 2; }
      case 'HSETNX': { const h = hashes.get(k) || {}; if (h[rest[0]] !== undefined) return 0; h[rest[0]] = rest[1]; hashes.set(k, h); return 1; }
      case 'HINCRBY': { const h = hashes.get(k) || {}; h[rest[0]] = String((Number(h[rest[0]]) || 0) + Number(rest[1])); hashes.set(k, h); return Number(h[rest[0]]); }
      case 'HGETALL': { const h = hashes.get(k); return h ? Object.keys(h).flatMap((f) => [f, h[f]]) : []; }
      case 'EXISTS': return hashes.has(k) || strings.has(k) ? 1 : 0;
      case 'EXPIRE': return hashes.has(k) || strings.has(k) ? 1 : 0;
      case 'TTL': return strings.has(k) || hashes.has(k) ? 1000 : -2;
      case 'SET': strings.set(k, rest[0]); return 'OK';
      case 'GET': return strings.has(k) ? strings.get(k) : null;
      case 'DEL': hashes.delete(k); strings.delete(k); return 1;
      case 'ZADD': zset.set(rest[1], Number(rest[0])); return 1;
      case 'ZREM': rest.forEach((m) => zset.delete(m)); return rest.length;
      case 'ZREVRANGE': return [...zset.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(Number(rest[0]), Number(rest[1]) + 1);
      default: throw new Error('Unsupported in memory redis: ' + op);
    }
  }
  return { command, pipeline: (cmds) => Promise.all(cmds.map(command)), _hashes: hashes };
}

const DISABLED = {
  enabled: false, makeId, makeSlug, async bySlug() { return null; }, async extend() { return null; },
  async create() { return null; }, async get() { return null; }, async list() { return []; },
  async touch() { return null; }, async revoke() { return false; }, async remove() { return false; },
  async saveDeal() { return null; }, async getDeal() { return null; }, async saveInputs() { return null; }, async setPasscode() { return false; },
};

let memorySingleton = null;
/* The store for this process: Redis when configured, the shared memory store
   when SANDBOX_STORE=memory (dev server, tests), otherwise disabled. */
function getStore() {
  const creds = credentials();
  if (creds) return createStore(redisClient(creds));
  if (env('SANDBOX_STORE') === 'memory') {
    if (!memorySingleton) memorySingleton = createStore(createMemoryRedis());
    return memorySingleton;
  }
  return DISABLED;
}

module.exports = { getStore, createStore, createMemoryRedis, redisClient, credentials, makeId, makeSlug, KEEP_AFTER_EXPIRY_MS, _resetMemory() { memorySingleton = null; } };
