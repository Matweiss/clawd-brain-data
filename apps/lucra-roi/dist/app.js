const m = "lucra-roi:deal-state", S = (t) => typeof t == "string" || typeof t == "number" || typeof t == "boolean";
function b(t) {
  if (!t) return null;
  try {
    const n = JSON.parse(t);
    if (!n || typeof n != "object") return null;
    const e = n;
    if (e.version !== 1 || typeof e.updatedAt != "string" || !e.fields || typeof e.fields != "object") return null;
    const o = Object.fromEntries(
      Object.entries(e.fields).filter((i) => S(i[1]))
    );
    return { version: 1, updatedAt: e.updatedAt, fields: o };
  } catch {
    return null;
  }
}
function g(t = document) {
  const n = {};
  return t.querySelectorAll("[id]").forEach((e) => {
    e instanceof HTMLInputElement && ["button", "file", "password", "submit"].includes(e.type) || (n[e.id] = e instanceof HTMLInputElement && e.type === "checkbox" ? e.checked : e.value);
  }), { version: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), fields: n };
}
function I(t, n = document) {
  let e = 0;
  return Object.entries(t.fields).forEach(([o, i]) => {
    const a = n.querySelector(`#${CSS.escape(o)}`);
    a && (a instanceof HTMLInputElement && a.type === "checkbox" ? a.checked = !!i : a.value = String(i), a.dispatchEvent(new Event("input", { bubbles: !0 })), a.dispatchEvent(new Event("change", { bubbles: !0 })), e += 1);
  }), e;
}
function w(t = localStorage, n = document) {
  const e = b(t.getItem(m));
  e ? I(e, n) : t.getItem(m) && t.removeItem(m);
  let o = 0;
  n.addEventListener("input", () => {
    window.clearTimeout(o), o = window.setTimeout(() => t.setItem(m, JSON.stringify(g(n))), 180);
  });
}
const A = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  venue: [0.82, 0.86, 0.94, 1.02, 1.08, 1.12, 1.16, 1.12, 1.04, 0.98, 0.9, 0.96],
  golf: [0.78, 0.82, 0.96, 1.08, 1.16, 1.2, 1.14, 1.1, 1.02, 0.96, 0.9, 0.88],
  multi: [0.9, 0.92, 0.96, 1, 1.04, 1.08, 1.1, 1.08, 1.04, 1, 0.96, 0.92]
};
function h(t) {
  return t.dailyVisitors * 30 * (t.optInPct / 100) * t.arpu * (t.liftPct / 100) * t.locations;
}
function L(t) {
  const n = [...A[t]], e = n.reduce((o, i) => o + i, 0) / n.length;
  return n.map((o) => o / e);
}
function M(t, n, e = 0) {
  const o = h(t), i = t.monthlyFee * t.locations;
  let a = -Math.max(0, e);
  return L(n).map((c, l) => {
    const u = o * c, d = u - i;
    return a += d, { month: l + 1, multiplier: c, grossLift: u, netCashFlow: d, cumulative: a };
  });
}
function T(t, n = 0.2) {
  const e = h(t);
  return [
    ["dailyVisitors", "Daily visitors"],
    ["optInPct", "Opt-in rate"],
    ["liftPct", "ARPU lift"],
    ["arpu", "Current ARPU"]
  ].map(([i, a]) => {
    const c = h({ ...t, [i]: t[i] * (1 - n) }), l = h({ ...t, [i]: t[i] * (1 + n) });
    return { key: i, label: a, low: c, base: e, high: l, swing: l - c };
  }).sort((i, a) => a.swing - i.swing);
}
const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function r(t, n = 0) {
  const e = document.getElementById(t), o = Number(e?.value);
  return Number.isFinite(o) ? o : n;
}
function x() {
  return {
    dailyVisitors: r("i-vis", 1100),
    arpu: r("i-arpu", 45),
    monthlyFee: r("i-fee", 2500),
    optInPct: r("i-opt", 10),
    liftPct: r("i-lift", 15),
    locations: Math.max(1, r("i-loc", 1))
  };
}
function v() {
  const t = document.getElementById("financial-intelligence");
  if (!t) return;
  const n = document.getElementById("seasonality-profile")?.value || "flat", e = r("upfront-investment", 0), o = x(), i = M(o, n, e), a = T(o), c = Math.max(1, ...i.map((s) => Math.abs(s.cumulative))), l = Math.max(1, ...a.map((s) => s.swing)), u = i.find((s) => s.cumulative >= 0)?.month, d = i.map((s) => {
    const p = Math.max(4, Math.round(Math.abs(s.cumulative) / c * 92));
    return `<div class="cash-month"><div class="cash-bar ${s.cumulative >= 0 ? "positive" : "negative"}" style="height:${p}px" aria-hidden="true"></div><span>${s.month}</span><output>${f.format(s.cumulative)}</output></div>`;
  }).join(""), E = a.map((s) => {
    const p = Math.max(10, Math.round(s.swing / l * 100));
    return `<div class="sensitivity-row"><div><strong>${s.label}</strong><span>-20% to +20%</span></div><div class="sensitivity-track"><span style="width:${p}%"></span></div><output>${f.format(s.low)} to ${f.format(s.high)}</output></div>`;
  }).join("");
  t.querySelector("[data-cash-chart]").innerHTML = d, t.querySelector("[data-sensitivity]").innerHTML = E, t.querySelector("[data-payback]").textContent = u ? `Month ${u}` : "Beyond 12 months", t.querySelector("[data-year-net]").textContent = f.format(i.at(-1)?.cumulative ?? 0);
}
function D() {
  const t = document.getElementById("financial-intelligence");
  t && (t.addEventListener("input", v), document.querySelectorAll("#roi input, #roi select").forEach((n) => n.addEventListener("input", v)), v());
}
function F() {
  document.documentElement.dataset.typedClient = "ready", document.dispatchEvent(new CustomEvent("lucra:typed-client-ready"));
}
function y() {
  w(), D(), F();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", y, { once: !0 }) : y();
//# sourceMappingURL=app.js.map
