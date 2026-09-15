// TEMPORARY SITE TAKEDOWN — added at Adam's request because JRD Inclusion
// Football Club isn't ready to go live yet.
//
// This Cloudflare Pages Function runs before every request to every route
// on the site and returns a simple "coming soon" holding page instead of
// the real content. It does NOT touch or delete any of the actual site
// files — the whole site is still here in the repo, untouched.
//
// TO RESTORE THE LIVE SITE: delete this file (functions/_middleware.js)
// and push. That's it — everything comes straight back.

export async function onRequest(context) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Coming Soon | JRD Inclusion Football Club</title>
<meta name="robots" content="noindex, nofollow">
<style>
  :root { color-scheme: dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1b2a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    text-align: center;
    padding: 24px;
  }
  h1 { font-size: 1.6rem; margin-bottom: 12px; }
  p { color: #b0bec5; max-width: 32rem; margin: 0 auto; }
</style>
</head>
<body>
  <div>
    <h1>We're putting the finishing touches on things.</h1>
    <p>JRD Inclusion Football Club's website will be back online shortly. Thanks for your patience.</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Retry-After': '3600',
      'Cache-Control': 'no-store'
    }
  });
}
