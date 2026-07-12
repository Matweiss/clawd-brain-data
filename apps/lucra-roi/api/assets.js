const fs = require('fs');
const path = require('path');

module.exports = async function handler(_req, res) {
  const assetPath = path.join(__dirname, '..', 'dist', 'app.js');
  if (!fs.existsSync(assetPath)) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Client bundle unavailable');
    return;
  }
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end(fs.readFileSync(assetPath, 'utf8'));
};
