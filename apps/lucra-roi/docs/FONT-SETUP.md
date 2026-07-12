# Font setup — Phase 2 Collateral

Verified 2026-06-22:

- Hardcover Variable: https://fonts.adobe.com/fonts/hardcover-variable
- Parabolica: https://fonts.adobe.com/fonts/parabolica

Both pages returned 200 from Adobe Fonts and identify the typefaces as available through Adobe Fonts.

## MVP licensing path

Use an Adobe Fonts Web Project containing both families. Do not download or commit font binaries from mirror sites.

1. In Adobe Fonts, create a Web Project with Hardcover Variable and Parabolica.
2. Copy the generated Typekit project id.
3. In `index.html`, replace `ADOBE_FONTS_PROJECT_ID` in the `https://use.typekit.net/...css` link and remove `disabled`.

## Runtime gates

All html2canvas captures must go through `captureCollateral()`, which waits for `document.fonts.ready` before rendering.

## Email rule

Email leave-behinds are plain text/system font only. No Adobe-hosted font dependency in email.

## OG image rule

OG/social images are rendered from a browser screenshot/canvas. Do not use Satori for Adobe-hosted fonts.
