#!/usr/bin/env python3
"""
Lucra ROI Leave-Behind PDF Generator
Generates co-branded, prospect-personalized ROI PDFs for Lucra sales calls.
Usage: python3 roi-pdf-generator.py --url https://prospect.com --users 500 --current-revenue 5000000 --lift 0.25 --output /tmp/lucra-roi.pdf
"""

import argparse
import base64
import io
import os
import re
import sys
import colorsys
from urllib.parse import urljoin, urlparse

import requests
from jinja2 import Template

# ── Attempt weasyprint import, fall back to reportlab ──────────────────────
USE_WEASYPRINT = False
try:
    from weasyprint import HTML as WeasyprintHTML
    USE_WEASYPRINT = True
except ImportError:
    pass

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    from colorthief import ColorThief
    HAS_COLORTHIEF = True
except ImportError:
    HAS_COLORTHIEF = False


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates", "roi-leave-behind.html")


# ── Color helpers ────────────────────────────────────────────────────────────

def hex_to_rgb(hex_color):
    hex_color = hex_color.strip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"


def lighten_color(hex_color, factor=0.4):
    """Return a lightened version of hex_color."""
    try:
        r, g, b = hex_to_rgb(hex_color)
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        v = min(1.0, v + factor)
        s = max(0.0, s - factor * 0.5)
        nr, ng, nb = [int(x * 255) for x in colorsys.hsv_to_rgb(h, s, v)]
        return rgb_to_hex(nr, ng, nb)
    except Exception:
        return "#a5b4fc"


def darken_color(hex_color, factor=0.2):
    """Return a darkened version of hex_color."""
    try:
        r, g, b = hex_to_rgb(hex_color)
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        v = max(0.0, v - factor)
        nr, ng, nb = [int(x * 255) for x in colorsys.hsv_to_rgb(h, s, v)]
        return rgb_to_hex(nr, ng, nb)
    except Exception:
        return "#4338ca"


def brighten_for_dark_bg(hex_color):
    """Make a color bright enough for display on dark background."""
    try:
        r, g, b = hex_to_rgb(hex_color)
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        v = max(0.8, v)
        s = max(0.5, s)
        nr, ng, nb = [int(x * 255) for x in colorsys.hsv_to_rgb(h, s, v)]
        return rgb_to_hex(nr, ng, nb)
    except Exception:
        return "#818cf8"


def is_valid_color(hex_color):
    """Check if a hex color is valid and not white/black/gray."""
    try:
        r, g, b = hex_to_rgb(hex_color)
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        # Too dark or too light or too desaturated
        if v < 0.15 or v > 0.97 or s < 0.08:
            return False
        return True
    except Exception:
        return False


# ── Scraping helpers ────────────────────────────────────────────────────────

def fetch_html(url, timeout=10):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return resp.text, resp.url
    except Exception as e:
        print(f"  ⚠  Could not fetch {url}: {e}")
        return None, url


def extract_meta(html, prop):
    """Extract content from <meta name/property='prop' content='...'>."""
    patterns = [
        rf'<meta\s+(?:name|property)=["\'](?:og:)?{re.escape(prop)}["\']\s+content=["\'](.*?)["\']',
        rf'<meta\s+content=["\'](.*?)["\']\s+(?:name|property)=["\'](?:og:)?{re.escape(prop)}["\']',
    ]
    for p in patterns:
        m = re.search(p, html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def extract_title(html):
    m = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        # Clean up common separators
        for sep in [' | ', ' - ', ' – ', ' — ', ' :: ', ' · ']:
            if sep in title:
                title = title.split(sep)[0].strip()
        return title
    return None


def scrape_brand_color(html, base_url):
    """Try to extract brand color from various sources."""
    # 1. <meta name="theme-color">
    theme = extract_meta(html, 'theme-color')
    if theme and theme.startswith('#') and is_valid_color(theme):
        return theme, 'theme-color meta tag'

    # 2. CSS variables for brand/primary color
    css_patterns = [
        r'--(?:brand|primary|accent|color-primary|main-color|brand-color)[:\s]+([#][0-9a-fA-F]{3,8})',
        r'--color-brand[:\s]+([#][0-9a-fA-F]{3,8})',
    ]
    for pat in css_patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m and is_valid_color(m.group(1)):
            return m.group(1), 'CSS variable'

    # 3. Try to extract from inline styles (background-color on header/nav)
    header_section = re.search(r'<(?:header|nav)[^>]*style=["\'][^"\']*background(?:-color)?:\s*([#][0-9a-fA-F]{3,8})', html, re.IGNORECASE)
    if header_section and is_valid_color(header_section.group(1)):
        return header_section.group(1), 'header/nav inline style'

    # 4. ColorThief on favicon
    if HAS_COLORTHIEF and HAS_PIL:
        color = try_colorthief_on_favicon(base_url)
        if color:
            return color, 'favicon color extraction'

    return None, None


def try_colorthief_on_favicon(base_url):
    """Use ColorThief to extract dominant color from favicon."""
    favicon_urls = [
        urljoin(base_url, '/favicon.ico'),
        urljoin(base_url, '/favicon.png'),
        urljoin(base_url, '/apple-touch-icon.png'),
        urljoin(base_url, '/apple-touch-icon-precomposed.png'),
    ]
    for furl in favicon_urls:
        try:
            resp = requests.get(furl, headers=HEADERS, timeout=6)
            if resp.status_code == 200 and len(resp.content) > 100:
                img_data = io.BytesIO(resp.content)
                # Convert ICO to PNG if needed
                if HAS_PIL:
                    try:
                        img = Image.open(img_data)
                        # Get largest size for ICO
                        if hasattr(img, 'n_frames') or img.format == 'ICO':
                            sizes = getattr(img, 'ico', {}).get('sizes', [img.size])
                            # Just use as-is
                        img_rgba = img.convert('RGBA')
                        png_buf = io.BytesIO()
                        img_rgba.save(png_buf, format='PNG')
                        png_buf.seek(0)
                        ct = ColorThief(png_buf)
                        palette = ct.get_palette(color_count=6, quality=1)
                        for r, g, b in palette:
                            hex_c = rgb_to_hex(r, g, b)
                            if is_valid_color(hex_c):
                                return hex_c
                    except Exception:
                        pass
        except Exception:
            pass
    return None


def download_logo(html, base_url):
    """Try to download the prospect's logo. Returns (bytes, mime_type) or (None, None)."""
    candidates = []

    # 1. og:image
    og_image = extract_meta(html, 'image')
    if og_image:
        candidates.append(og_image)

    # 2. apple-touch-icon
    m = re.search(r'<link[^>]*rel=["\']apple-touch-icon(?:-precomposed)?["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if m:
        candidates.append(m.group(1))

    # 3. apple-touch-icon (href first)
    m = re.search(r'<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\']apple-touch-icon(?:-precomposed)?["\']', html, re.IGNORECASE)
    if m:
        candidates.append(m.group(1))

    # 4. Favicon PNG
    m = re.search(r'<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']+\.png[^"\']*)["\']', html, re.IGNORECASE)
    if m:
        candidates.append(m.group(1))

    # 5. /favicon.ico as fallback
    candidates.append('/favicon.ico')

    for candidate in candidates:
        try:
            logo_url = urljoin(base_url, candidate)
            resp = requests.get(logo_url, headers=HEADERS, timeout=8)
            if resp.status_code == 200 and len(resp.content) > 200:
                ct = resp.headers.get('content-type', '').split(';')[0].strip()
                if not ct or ct == 'application/octet-stream':
                    # Guess from extension
                    if logo_url.endswith('.ico'):
                        ct = 'image/x-icon'
                    elif logo_url.endswith('.png'):
                        ct = 'image/png'
                    elif logo_url.endswith('.jpg') or logo_url.endswith('.jpeg'):
                        ct = 'image/jpeg'
                    else:
                        ct = 'image/png'

                # Convert to PNG for embedding
                if HAS_PIL:
                    try:
                        img = Image.open(io.BytesIO(resp.content))
                        # For ICO, pick the largest frame
                        if img.format == 'ICO':
                            # Try to get largest size
                            try:
                                img.size  # Triggers load
                            except Exception:
                                pass
                        img_rgba = img.convert('RGBA')
                        out = io.BytesIO()
                        img_rgba.save(out, format='PNG')
                        return out.getvalue(), 'image/png', logo_url
                    except Exception:
                        pass

                return resp.content, ct, logo_url
        except Exception:
            continue

    return None, None, None


def detect_industry(html, company_name, url):
    """Guess the industry vertical from page content."""
    text = (html or '').lower() + (company_name or '').lower() + (url or '').lower()

    verticals = [
        (['sportsbook', 'sports betting', 'daily fantasy', 'dfs', 'draftkings', 'fanduel', 'betmgm', 'pointsbet', 'caesars'], 'sports betting & daily fantasy'),
        (['casino', 'slots', 'blackjack', 'poker', 'roulette', 'igaming', 'online gaming'], 'iGaming & online casino'),
        (['fantasy sport', 'fantasy football', 'fantasy baseball', 'fantasy basketball'], 'fantasy sports'),
        (['esport', 'gaming', 'video game', 'twitch', 'steam'], 'esports & gaming'),
        (['media', 'broadcast', 'streaming', 'content', 'publisher', 'editorial'], 'sports media & content'),
        (['loyalty', 'rewards', 'points program', 'membership'], 'loyalty & rewards'),
        (['league', 'team', 'franchise', 'stadium', 'arena', 'nfl', 'nba', 'mlb', 'nhl', 'mls'], 'professional sports'),
        (['fintech', 'payments', 'wallet', 'financial'], 'fintech'),
    ]

    for keywords, label in verticals:
        if any(kw in text for kw in keywords):
            return label

    return 'sports & entertainment'


def get_why_now(industry):
    """Return contextual 'Why Now' bullets based on industry."""
    industry_lower = industry.lower()

    if 'betting' in industry_lower or 'fantasy' in industry_lower or 'sportsbook' in industry_lower:
        return (
            "Competitors are already integrating engagement layers — first movers capture the most loyal users before the market saturates",
            "Regulatory expansion creates a narrow window: early platforms that lock in engaged users now will dominate the next cycle"
        )
    elif 'casino' in industry_lower or 'igaming' in industry_lower:
        return (
            "Player acquisition costs are at all-time highs — monetizing your existing base delivers 3–5x better unit economics than new user campaigns",
            "Gamification-led engagement is the #1 retention lever for iGaming in 2025, and Lucra deploys in weeks"
        )
    elif 'esport' in industry_lower or 'gaming' in industry_lower:
        return (
            "Gaming audiences have the highest willingness-to-pay in entertainment — activating them with real-money competitions unlocks a premium monetization tier",
            "The window between 'early adopter' and 'table stakes' for competition features is closing fast in 2025"
        )
    elif 'media' in industry_lower or 'content' in industry_lower:
        return (
            "Attention is fragmenting: publishers who add interactive engagement features retain audiences 2–4x longer than editorial-only platforms",
            "Advertising revenue is declining — adding a direct monetization layer via competitions is now a necessity, not a nice-to-have"
        )
    elif 'professional sport' in industry_lower or 'league' in industry_lower or 'team' in industry_lower:
        return (
            "In-stadium and digital fan engagement are converging — teams that activate fans year-round see 40%+ higher merchandise and ticket renewal rates",
            "The 2025 season is the optimal launch window: Lucra integrates before the next schedule drops, maximizing full-season impact"
        )
    else:
        return (
            "User engagement expectations have shifted: audiences now expect interactive, rewarding experiences — static platforms lose ground fast",
            "The cost of waiting is real: each quarter without an engagement layer is compounding lost revenue from your existing user base"
        )


# ── ROI calculation ──────────────────────────────────────────────────────────

def calculate_roi(current_revenue, lift, users):
    engagement_lift_revenue = current_revenue * lift
    annual_roi = engagement_lift_revenue
    monthly_roi = annual_roi / 12
    payback_months = 6
    three_yr_value = annual_roi * 3
    revenue_per_user = annual_roi / users if users > 0 else 0
    return {
        "engagement_lift_revenue": engagement_lift_revenue,
        "annual_roi": annual_roi,
        "monthly_roi": monthly_roi,
        "payback_months": payback_months,
        "three_yr_value": three_yr_value,
        "revenue_per_user": revenue_per_user,
    }


def fmt_currency(value):
    """Format as $X,XXX,XXX."""
    if value >= 1_000_000:
        return f"${value/1_000_000:.1f}M"
    elif value >= 1_000:
        return f"${value:,.0f}"
    else:
        return f"${value:.0f}"


def fmt_users(n):
    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"
    elif n >= 1_000:
        return f"{n:,.0f}"
    return str(n)


# ── PDF generation (weasyprint) ──────────────────────────────────────────────

def render_html(template_str, context):
    tpl = Template(template_str)
    return tpl.render(**context)


def generate_pdf_weasyprint(html_content, output_path):
    WeasyprintHTML(string=html_content).write_pdf(output_path)


def generate_pdf_reportlab(context, output_path):
    """Fallback PDF generation using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    brand_hex = context.get('brand_color', '#6366f1')
    brand_rgb = tuple(x/255 for x in hex_to_rgb(brand_hex))
    brand_color = colors.Color(*brand_rgb)
    lucra_green = colors.Color(0, 0.784, 0.318)

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            rightMargin=20*mm, leftMargin=20*mm,
                            topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=18, textColor=brand_color,
                                  spaceAfter=6)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'],
                                   fontSize=12, textColor=brand_color,
                                   spaceBefore=10, spaceAfter=4)
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                fontSize=10, spaceAfter=4)
    value_style = ParagraphStyle('Value', parent=styles['Normal'],
                                  fontSize=20, textColor=lucra_green,
                                  fontName='Helvetica-Bold', alignment=TA_CENTER)
    label_style = ParagraphStyle('Label', parent=styles['Normal'],
                                  fontSize=8, textColor=colors.grey,
                                  alignment=TA_CENTER)

    # Header
    story.append(Paragraph(f'<font color="#{brand_hex.strip("#")}">{context["company_name"]}</font> × <font color="#00C851">LUCRA</font>', title_style))
    story.append(Paragraph("Confidential ROI Analysis", body_style))
    story.append(HRFlowable(width="100%", thickness=2, color=brand_color))
    story.append(Spacer(1, 8*mm))

    # Hero
    story.append(Paragraph(f'How Lucra Works for {context["company_name"]}', heading_style))
    story.append(Paragraph(
        f"Lucra's engagement platform drives measurable revenue lift for {context['industry_hint']}, "
        f"turning passive users into high-value participants. With {context['users_formatted']} active users "
        f"and a targeted {context['lift_pct']}% engagement lift, {context['company_name']} is positioned "
        f"to unlock significant incremental revenue starting in the first quarter.",
        body_style
    ))
    story.append(Spacer(1, 6*mm))

    # ROI table
    story.append(Paragraph("ROI Summary", heading_style))
    roi_data = [
        ['Monthly Impact', 'Annual Impact', '3-Year Value', 'Payback'],
        [context['monthly_roi'], context['annual_roi'], context['three_yr_value'], f"{context['payback_months']} mo"],
    ]
    roi_table = Table(roi_data, colWidths=[40*mm, 40*mm, 40*mm, 40*mm])
    roi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.1, 0.1, 0.18)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 14),
        ('TEXTCOLOR', (0, 1), (-1, 1), lucra_green),
        ('BACKGROUND', (0, 1), (-1, 1), colors.Color(0.97, 0.98, 1.0)),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(roi_table)
    story.append(Spacer(1, 6*mm))

    # What You Get
    story.append(Paragraph("What You Get", heading_style))
    bullets = [
        f"<b>{context['lift_pct']}% Engagement Lift</b> — Lucra's competition engine drives deeper session frequency and time-on-platform",
        f"<b>{context['annual_roi']} Annual Revenue Impact</b> — Direct uplift from your existing {context['users_formatted']}-user base",
        f"<b>{context['payback_months']}-Month Payback</b> — Integration goes live in weeks, not quarters",
    ]
    for b in bullets:
        story.append(Paragraph(f"▸ {b}", body_style))
    story.append(Spacer(1, 4*mm))

    # Why Now
    story.append(Paragraph("Why Now", heading_style))
    story.append(Paragraph(f"▸ <b>Market window is open:</b> {context['why_now_1']}", body_style))
    story.append(Paragraph(f"▸ <b>{context['why_now_2']}</b>", body_style))
    story.append(Spacer(1, 4*mm))

    if context.get('notes'):
        story.append(Paragraph("Call Notes", heading_style))
        story.append(Paragraph(context['notes'], body_style))
        story.append(Spacer(1, 4*mm))

    # Next Step
    story.append(HRFlowable(width="100%", thickness=1, color=brand_color))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(f"Ready to see {context['company_name']}'s full potential?", heading_style))
    story.append(Paragraph("Let's schedule a technical deep-dive and build your custom implementation plan — live demo included.", body_style))
    story.append(Paragraph("📧 mat.weiss@lucrasports.com", ParagraphStyle('Contact', parent=styles['Normal'],
                                                                           fontSize=11, textColor=brand_color,
                                                                           fontName='Helvetica-Bold')))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    story.append(Paragraph(
        f"Prepared exclusively for {context['company_name']} by Lucra | lucrasports.com",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Lucra ROI Leave-Behind PDF Generator")
    parser.add_argument('--url', required=True, help='Prospect website URL')
    parser.add_argument('--company', default=None, help='Company name (scraped if not provided)')
    parser.add_argument('--users', type=int, required=True, help='Number of users/players')
    parser.add_argument('--current-revenue', type=float, required=True, help='Current annual revenue')
    parser.add_argument('--lift', type=float, required=True, help='Expected engagement lift (0.25 = 25%)')
    parser.add_argument('--notes', default=None, help='Call notes')
    parser.add_argument('--output', default='/tmp/lucra-roi.pdf', help='Output PDF path')
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  LUCRA ROI PDF Generator")
    print(f"{'='*60}")
    print(f"  Target: {args.url}")
    print(f"  Engine: {'WeasyPrint' if USE_WEASYPRINT else 'ReportLab (fallback)'}")
    print(f"{'='*60}\n")

    # ── Step 1: Scrape ──────────────────────────────────────────────────────
    print("📡 Scraping prospect website...")
    html, final_url = fetch_html(args.url)
    base_url = args.url

    company_name = args.company
    tagline = None
    brand_color = None
    color_source = 'fallback'
    logo_data = None
    logo_mime = None
    logo_url_found = None

    if html:
        # Extract company name
        if not company_name:
            og_site = extract_meta(html, 'site_name')
            if og_site:
                company_name = og_site
            else:
                company_name = extract_title(html) or 'Your Company'

        # Extract tagline
        tagline = extract_meta(html, 'description') or ''
        if len(tagline) > 120:
            tagline = tagline[:117] + '...'

        # Extract brand color
        brand_color, color_source = scrape_brand_color(html, base_url)

        # Download logo
        logo_data, logo_mime, logo_url_found = download_logo(html, base_url)
    else:
        company_name = company_name or urlparse(args.url).netloc.replace('www.', '').split('.')[0].title()

    # Defaults
    if not company_name:
        company_name = 'Your Company'
    if not brand_color:
        brand_color = '#6366f1'
        color_source = 'default purple'

    logo_b64 = None
    if logo_data:
        logo_b64 = base64.b64encode(logo_data).decode('utf-8')

    industry = detect_industry(html or '', company_name, args.url)
    why_now_1, why_now_2 = get_why_now(industry)

    print(f"  ✓ Company: {company_name}")
    print(f"  ✓ Industry: {industry}")
    print(f"  ✓ Brand color: {brand_color} (via {color_source})")
    print(f"  ✓ Logo: {'Found (' + logo_url_found + ')' if logo_b64 else 'Not found — using text badge'}")

    # ── Step 2: Calculate ROI ────────────────────────────────────────────────
    print("\n💰 Calculating ROI...")
    roi = calculate_roi(args.current_revenue, args.lift, args.users)

    print(f"  ✓ Monthly Impact:  {fmt_currency(roi['monthly_roi'])}")
    print(f"  ✓ Annual Impact:   {fmt_currency(roi['annual_roi'])}")
    print(f"  ✓ 3-Year Value:    {fmt_currency(roi['three_yr_value'])}")
    print(f"  ✓ Payback Period:  {roi['payback_months']} months")
    print(f"  ✓ Rev/User Uplift: {fmt_currency(roi['revenue_per_user'])}")

    # ── Step 3: Build template context ──────────────────────────────────────
    print("\n🎨 Rendering template...")

    context = {
        "company_name": company_name,
        "industry_hint": industry,
        "tagline": tagline or '',
        "brand_color": brand_color,
        "brand_color_light": lighten_color(brand_color),
        "brand_color_dark": darken_color(brand_color),
        "brand_color_bright": brighten_for_dark_bg(brand_color),
        "prospect_logo_b64": logo_b64,
        "users_formatted": fmt_users(args.users),
        "lift_pct": int(args.lift * 100),
        "current_revenue_fmt": f"{args.current_revenue:,.0f}",
        "monthly_roi": fmt_currency(roi['monthly_roi']),
        "annual_roi": fmt_currency(roi['annual_roi']),
        "three_yr_value": fmt_currency(roi['three_yr_value']),
        "payback_months": roi['payback_months'],
        "revenue_per_user": fmt_currency(roi['revenue_per_user']),
        "why_now_1": why_now_1,
        "why_now_2": why_now_2,
        "notes": args.notes or '',
    }

    # ── Step 4: Render and save PDF ──────────────────────────────────────────
    print(f"\n📄 Generating PDF → {args.output}")

    os.makedirs(os.path.dirname(args.output) if os.path.dirname(args.output) else '.', exist_ok=True)

    if USE_WEASYPRINT:
        # Load HTML template
        with open(TEMPLATE_PATH, 'r') as f:
            template_str = f.read()
        html_rendered = render_html(template_str, context)
        generate_pdf_weasyprint(html_rendered, args.output)
        engine = "WeasyPrint"
    else:
        generate_pdf_reportlab(context, args.output)
        engine = "ReportLab (fallback)"

    size_kb = os.path.getsize(args.output) / 1024

    print(f"\n{'='*60}")
    print(f"  ✅ PDF GENERATED SUCCESSFULLY")
    print(f"{'='*60}")
    print(f"  Company:       {company_name}")
    print(f"  Brand color:   {brand_color} ({color_source})")
    print(f"  Logo found:    {'Yes' if logo_b64 else 'No'}")
    print(f"  Monthly ROI:   {fmt_currency(roi['monthly_roi'])}")
    print(f"  Annual ROI:    {fmt_currency(roi['annual_roi'])}")
    print(f"  3-Year Value:  {fmt_currency(roi['three_yr_value'])}")
    print(f"  Engine:        {engine}")
    print(f"  Output:        {args.output}")
    print(f"  File size:     {size_kb:.1f} KB")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
