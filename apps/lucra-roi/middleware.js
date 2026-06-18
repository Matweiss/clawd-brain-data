// Vercel Edge Middleware — gates the entire app (page + /api) behind a password.
//
// This runs at the edge BEFORE any static file or serverless function is served,
// so the protected HTML/JS is never delivered without valid credentials — this is
// real server-side protection, not client-side obscurity.
//
// Configure in Vercel (do NOT hardcode secrets):
//   SITE_PASSWORD   (required)  — the shared access password
//   SITE_USER       (optional)  — username, defaults to "lucra"
//
// Uses HTTP Basic Auth: the browser shows a native login prompt and, once
// authenticated, automatically re-sends credentials on same-origin requests
// (including the same-origin POST to /api/generate).

export const config = {
  // Protect everything except Vercel's internal asset/runtime paths and the favicon.
  matcher: '/((?!_next/static|_vercel|favicon\\.ico).*)',
};

// Length-stable comparison to avoid leaking match position via early exit.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default function middleware(req) {
  const expectedPass = process.env.SITE_PASSWORD;
  const expectedUser = process.env.SITE_USER || 'lucra';

  // Fail closed: if no password is configured, never serve the app.
  if (!expectedPass) {
    return new Response('Access password not configured.', { status: 503 });
  }

  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch (e) {
      decoded = '';
    }
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      // Evaluate both comparisons regardless of the first result.
      const okUser = safeEqual(user, expectedUser);
      const okPass = safeEqual(pass, expectedPass);
      if (okUser && okPass) return; // authorized — continue to the app
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Lucra ROI Calculator", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}
