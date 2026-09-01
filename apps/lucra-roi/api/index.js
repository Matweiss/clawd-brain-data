// Serves the ROI calculator HTML.
//
// Auth is handled entirely by Edge middleware (middleware.js) which gates
// all routes behind HTTP Basic Auth with fail-closed behavior. The previous
// cookie-based auth layer in this file was redundant and has been removed
// (P0-4: dual authentication consolidation).
//
// Verification: middleware.js matcher '/((?!_next/static|_vercel|favicon\\.ico).*)'
// covers this route and all /api/* routes. The middleware returns 503 if
// SITE_PASSWORD is not configured and 401 for invalid credentials.

const fs = require('fs');
const path = require('path');

// Stamp the page with what it was built from, so "is this live?" can be
// answered by looking at the footer rather than querying the deploy.
// Vercel sets VERCEL_GIT_COMMIT_SHA on git and CLI deploys alike.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_SHA || '').slice(0, 7) || 'local';
const date = new Date().toISOString().slice(0, 10);
const html = fs
  .readFileSync(path.join(__dirname, 'app.html'), 'utf8')
  .replace('__BUILD_SHA__', sha)
  .replace('__BUILD_DATE__', date);

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
};
