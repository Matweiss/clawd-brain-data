#!/usr/bin/env python3
"""
Apple Health Local Query Tool
Reads directly from SQLite — no HTTP needed.
Used by Sage and other agents for health context.

Usage:
    python3 health-webhook-query.py
    python3 health-webhook-query.py --period weekly
    python3 health-webhook-query.py --period monthly
    python3 health-webhook-query.py --period daily
    python3 health-webhook-query.py --json          # machine-readable output
    python3 health-webhook-query.py --metric steps  # single metric detail
"""

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path("/root/.apple-health-sync/health_webhook.db")

# ── Human-friendly metric labels ─────────────────────────────────────────────

LABELS = {
    "steps":                    "Steps",
    "distance_walking_running": "Distance (walk/run)",
    "active_energy":            "Active Energy",
    "resting_energy":           "Resting Energy",
    "exercise_minutes":         "Exercise",
    "stand_hours":              "Stand Hours",
    "heart_rate":               "Heart Rate",
    "resting_heart_rate":       "Resting HR",
    "hrv":                      "HRV",
    "respiratory_rate":         "Respiratory Rate",
    "blood_oxygen":             "Blood Oxygen (SpO₂)",
    "sleep_hours":              "Sleep",
    "sleep_in_bed":             "Time in Bed",
    "weight":                   "Weight",
    "bmi":                      "BMI",
    "body_fat":                 "Body Fat",
    "mindful_minutes":          "Mindful Minutes",
    "flights_climbed":          "Flights Climbed",
    "headphone_audio_exposure": "Headphone Audio",
    "walking_heart_rate_avg":   "Walking HR Avg",
    "vo2_max":                  "VO₂ Max",
}

# ── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    if not DB_PATH.exists():
        print(f"[error] Database not found at {DB_PATH}", file=sys.stderr)
        print("[error] Has the webhook server run yet?", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def get_period_days(period: str) -> int:
    return {"daily": 1, "weekly": 7, "monthly": 30}.get(period, 7)

# ── Data fetchers ─────────────────────────────────────────────────────────────

def fetch_summary(period: str) -> dict:
    days   = get_period_days(period)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    with get_db() as conn:
        agg_rows = conn.execute("""
            SELECT
                metric,
                AVG(value)           AS avg,
                MIN(value)           AS min,
                MAX(value)           AS max,
                COUNT(DISTINCT date) AS n,
                unit
            FROM metrics
            WHERE date >= ?
            GROUP BY metric, unit
            ORDER BY metric
        """, (cutoff,)).fetchall()

        # two most recent distinct dates per metric for trend
        metric_names = [r["metric"] for r in agg_rows]
        trend_data   = {}
        for m in metric_names:
            dates = conn.execute("""
                SELECT date, value FROM metrics
                WHERE metric = ? AND date >= ?
                ORDER BY date DESC LIMIT 2
            """, (m, cutoff)).fetchall()
            trend_data[m] = dates

    result = {}
    for r in agg_rows:
        m     = r["metric"]
        dates = trend_data.get(m, [])
        latest_val  = dates[0]["value"] if dates else None
        prev_val    = dates[1]["value"] if len(dates) > 1 else None
        latest_date = dates[0]["date"]  if dates else None

        if latest_val is not None and prev_val is not None:
            diff = latest_val - prev_val
            if abs(diff) < 0.01 * max(abs(latest_val), abs(prev_val), 1):
                trend = "→"
            elif diff > 0:
                trend = "↑"
            else:
                trend = "↓"
        else:
            trend = "·"

        result[m] = {
            "label":       LABELS.get(m, m),
            "latest":      latest_val,
            "latest_date": latest_date,
            "avg":         round(r["avg"], 2),
            "min":         r["min"],
            "max":         r["max"],
            "days":        r["n"],
            "unit":        r["unit"],
            "trend":       trend,
        }

    return result

def fetch_single_metric(metric: str, days: int = 30) -> list:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    with get_db() as conn:
        rows = conn.execute("""
            SELECT date, value, unit, source, updated_at
            FROM metrics
            WHERE metric = ? AND date >= ?
            ORDER BY date DESC
        """, (metric, cutoff)).fetchall()
    return [dict(r) for r in rows]

# ── Formatters ────────────────────────────────────────────────────────────────

def fmt_value(v, unit: str) -> str:
    if v is None:
        return "—"
    if isinstance(v, float):
        if v == int(v):
            return f"{int(v)} {unit}".strip()
        return f"{v:.1f} {unit}".strip()
    return f"{v} {unit}".strip()

def print_summary(summary: dict, period: str):
    days  = get_period_days(period)
    title = f"  Health Summary — {period.capitalize()} ({days}d)  "
    bar   = "─" * (len(title) + 4)

    print(f"\n┌{bar}┐")
    print(f"│  {title}  │")
    print(f"└{bar}┘\n")

    if not summary:
        print("  (no data found for this period)\n")
        return

    # column widths
    max_label = max((len(v["label"]) for v in summary.values()), default=10)
    col_label = max(max_label, 22)

    header = f"  {'Metric':<{col_label}}  {'Latest':>12}  {'7d Avg':>12}  {'Min':>10}  {'Max':>10}  {'Days':>4}  Trend"
    print(header)
    print("  " + "─" * (len(header) - 2))

    for metric, d in sorted(summary.items(), key=lambda x: x[1]["label"]):
        label   = d["label"]
        unit    = d["unit"]
        latest  = fmt_value(d["latest"], unit)
        avg     = fmt_value(d["avg"],    unit)
        mn      = fmt_value(d["min"],    unit)
        mx      = fmt_value(d["max"],    unit)
        days_n  = str(d["days"])
        trend   = d["trend"]

        print(f"  {label:<{col_label}}  {latest:>12}  {avg:>12}  {mn:>10}  {mx:>10}  {days_n:>4}   {trend}")

    print()


def print_health_context(summary: dict, period: str):
    """Condensed one-liner context for Sage."""
    lines = [f"Health ({period}):"]
    for metric, d in sorted(summary.items(), key=lambda x: x[1]["label"]):
        if d["latest"] is None:
            continue
        val = fmt_value(d["latest"], d["unit"])
        lines.append(f"  {d['label']}: {val} {d['trend']}  (avg {fmt_value(d['avg'], d['unit'])})")
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Query Apple Health data from local SQLite")
    parser.add_argument("--period",  default="weekly", choices=["daily", "weekly", "monthly"],
                        help="Time window (default: weekly)")
    parser.add_argument("--json",    action="store_true", help="Machine-readable JSON output")
    parser.add_argument("--metric",  default=None, help="Show detail for a single metric")
    parser.add_argument("--context", action="store_true", help="One-liner context block for Sage")
    args = parser.parse_args()

    if args.metric:
        rows = fetch_single_metric(args.metric, days=30)
        if args.json:
            print(json.dumps(rows, indent=2))
        else:
            label = LABELS.get(args.metric, args.metric)
            print(f"\n  {label} — last 30 days\n")
            for r in rows:
                print(f"  {r['date']}  {r['value']:.2f} {r['unit']}")
            print()
        return

    summary = fetch_summary(args.period)

    if args.json:
        print(json.dumps(summary, indent=2))
        return

    if args.context:
        print(print_health_context(summary, args.period))
        return

    print_summary(summary, args.period)

    # Insights block
    insights = []

    steps = summary.get("steps")
    if steps and steps["latest"] is not None:
        if steps["latest"] < 5000:
            insights.append(f"⚠️  Low step count today ({int(steps['latest'])} steps — goal is 10k)")
        elif steps["latest"] >= 10000:
            insights.append(f"✅  Step goal hit today ({int(steps['latest'])} steps)")

    sleep = summary.get("sleep_hours")
    if sleep and sleep["avg"] is not None:
        if sleep["avg"] < 6.5:
            debt = round(7 - sleep["avg"], 1)
            insights.append(f"😴  Sleep debt: averaging {sleep['avg']:.1f}h vs 7h target ({debt}h/night short)")
        elif sleep["avg"] >= 7.5:
            insights.append(f"✅  Solid sleep avg ({sleep['avg']:.1f}h over the period)")

    hrv = summary.get("hrv")
    if hrv and hrv["trend"] is not None:
        arrow = hrv["trend"]
        if arrow == "↓":
            insights.append(f"🧠  HRV trending down — possible stress/fatigue signal")
        elif arrow == "↑":
            insights.append(f"🧠  HRV trending up — good recovery")

    weight = summary.get("weight")
    if weight and weight["trend"] is not None:
        arrow = weight["trend"]
        if arrow == "↑":
            insights.append(f"⚖️   Weight trending up")
        elif arrow == "↓":
            insights.append(f"⚖️   Weight trending down")

    if insights:
        print("  Insights:")
        for i in insights:
            print(f"    {i}")
        print()


if __name__ == "__main__":
    main()
