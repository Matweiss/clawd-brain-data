// Serves the ROI calculator HTML.
//
// Auth: HTTP Basic against SITE_PASSWORD, checked here and in every guarded
// function through lib/site-auth.js (middleware.js does the same at the edge
// when the platform runs it, but the functions do not rely on that). 503 if
// SITE_PASSWORD is not configured, 401 for invalid credentials. The customer
// sandbox (/play) and the public scenario page are the only open surfaces.

const fs = require('fs');
const path = require('path');
const { requireSiteAuth } = require('../lib/site-auth');

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
  if (!requireSiteAuth(req, res, { html: true })) return;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
};
