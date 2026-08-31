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

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(__dirname, 'app.html'), 'utf8'));
};
