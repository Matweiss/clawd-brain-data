// Shared extractor for the Tournament Payoff pure-calculation block.
// Used by the drift guard so the mirrored copy in calc-functions.js can never
// silently diverge from the code that actually ships in api/app.html.
const fs = require('fs');
const path = require('path');

const START = '/* TP-PURE-START';
const END = '/* TP-PURE-END */';

function extractFromApp(appPath) {
  const src = fs.readFileSync(appPath || path.join(__dirname, '..', 'api', 'app.html'), 'utf8');
  const a = src.indexOf(START);
  if (a < 0) throw new Error('TP-PURE-START marker missing from app.html');
  const b = src.indexOf(END, a);
  if (b < 0) throw new Error('TP-PURE-END marker missing from app.html');
  return src.slice(src.indexOf('\n', a) + 1, b).trim();
}

function extractFromMirror(mirrorPath) {
  const src = fs.readFileSync(mirrorPath || path.join(__dirname, 'calc-functions.js'), 'utf8');
  const a = src.indexOf(START);
  if (a < 0) throw new Error('TP-PURE-START marker missing from calc-functions.js');
  const b = src.indexOf(END, a);
  if (b < 0) throw new Error('TP-PURE-END marker missing from calc-functions.js');
  return src.slice(src.indexOf('\n', a) + 1, b).trim();
}

// Whitespace-insensitive comparison so reformatting is allowed but logic drift is not.
const normalise = (s) => s.replace(/\s+/g, ' ').trim();

module.exports = { extractFromApp, extractFromMirror, normalise };
