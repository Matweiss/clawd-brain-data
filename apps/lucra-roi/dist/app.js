const m = "lucra-roi:deal-state", A = (t) => typeof t == "string" || typeof t == "number" || typeof t == "boolean";
function L(t) {
  if (!t) return null;
  try {
    const e = JSON.parse(t);
    if (!e || typeof e != "object") return null;
    const n = e;
    if (n.version !== 1 || typeof n.updatedAt != "string" || !n.fields || typeof n.fields != "object") return null;
    const a = Object.fromEntries(
      Object.entries(n.fields).filter((i) => A(i[1]))
    );
    return { version: 1, updatedAt: n.updatedAt, fields: a };
  } catch {
    return null;
  }
}
function E(t = document) {
  const e = {};
  return t.querySelectorAll("[id]").forEach((n) => {
    n instanceof HTMLInputElement && ["button", "file", "password", "submit"].includes(n.type) || (e[n.id] = n instanceof HTMLInputElement && n.type === "checkbox" ? n.checked : n.value);
  }), { version: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), fields: e };
}
function w(t, e = document) {
  let n = 0;
  return Object.entries(t.fields).forEach(([a, i]) => {
    const s = e.querySelector(`#${CSS.escape(a)}`);
    s && (s instanceof HTMLInputElement && s.type === "checkbox" ? s.checked = !!i : s.value = String(i), s.dispatchEvent(new Event("input", { bubbles: !0 })), s.dispatchEvent(new Event("change", { bubbles: !0 })), n += 1);
  }), n;
}
function $(t = localStorage, e = document) {
  const n = L(t.getItem(m));
  n ? w(n, e) : t.getItem(m) && t.removeItem(m);
  let a = 0;
  e.addEventListener("input", () => {
    window.clearTimeout(a), a = window.setTimeout(() => t.setItem(m, JSON.stringify(E(e))), 180);
  });
}
const T = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  venue: [0.82, 0.86, 0.94, 1.02, 1.08, 1.12, 1.16, 1.12, 1.04, 0.98, 0.9, 0.96],
  golf: [0.78, 0.82, 0.96, 1.08, 1.16, 1.2, 1.14, 1.1, 1.02, 0.96, 0.9, 0.88],
  multi: [0.9, 0.92, 0.96, 1, 1.04, 1.08, 1.1, 1.08, 1.04, 1, 0.96, 0.92]
};
function p(t) {
  return t.dailyVisitors * 30 * (t.optInPct / 100) * t.arpu * (t.liftPct / 100) * t.locations;
}
function M(t) {
  const e = [...T[t]], n = e.reduce((a, i) => a + i, 0) / e.length;
  return e.map((a) => a / n);
}
function D(t, e, n = 0) {
  const a = p(t), i = t.monthlyFee * t.locations;
  let s = -Math.max(0, n);
  return M(e).map((d, c) => {
    const r = a * d, o = r - i;
    return s += o, { month: c + 1, multiplier: d, grossLift: r, netCashFlow: o, cumulative: s };
  });
}
function x(t, e = 0.2) {
  const n = p(t);
  return [
    ["dailyVisitors", "Daily visitors"],
    ["optInPct", "Opt-in rate"],
    ["liftPct", "ARPU lift"],
    ["arpu", "Current ARPU"]
  ].map(([i, s]) => {
    const d = p({ ...t, [i]: t[i] * (1 - e) }), c = p({ ...t, [i]: t[i] * (1 + e) });
    return { key: i, label: s, low: d, base: n, high: c, swing: c - d };
  }).sort((i, s) => s.swing - i.swing);
}
const g = "lucra-roi:scenarios";
function O(t) {
  if (!t) return [];
  try {
    const e = JSON.parse(t);
    return Array.isArray(e) ? e.filter((n) => {
      if (!n || typeof n != "object") return !1;
      const a = n;
      return typeof a.id == "string" && typeof a.name == "string" && typeof a.createdAt == "string" && typeof a.updatedAt == "string" && !!(a.state && a.state.version === 1 && a.state.fields);
    }) : [];
  } catch {
    return [];
  }
}
class C {
  constructor(e = localStorage) {
    this.storage = e;
  }
  storage;
  list() {
    return O(this.storage.getItem(g)).sort((e, n) => n.updatedAt.localeCompare(e.updatedAt));
  }
  save(e, n = E()) {
    const a = (/* @__PURE__ */ new Date()).toISOString(), i = { id: crypto.randomUUID(), name: e.trim() || `Scenario ${this.list().length + 1}`, createdAt: a, updatedAt: a, state: n };
    return this.write([i, ...this.list()]), i;
  }
  clone(e) {
    const n = this.list().find((a) => a.id === e);
    return n ? this.save(`${n.name} copy`, n.state) : null;
  }
  load(e) {
    const n = this.list().find((a) => a.id === e);
    return n ? w(n.state) : 0;
  }
  remove(e) {
    this.write(this.list().filter((n) => n.id !== e));
  }
  write(e) {
    this.storage.setItem(g, JSON.stringify(e));
  }
}
const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function u(t, e = 0) {
  const n = document.getElementById(t), a = Number(n?.value);
  return Number.isFinite(a) ? a : e;
}
function F() {
  return {
    dailyVisitors: u("i-vis", 1100),
    arpu: u("i-arpu", 45),
    monthlyFee: u("i-fee", 2500),
    optInPct: u("i-opt", 10),
    liftPct: u("i-lift", 15),
    locations: Math.max(1, u("i-loc", 1))
  };
}
function h() {
  const t = document.getElementById("financial-intelligence");
  if (!t) return;
  const e = document.getElementById("seasonality-profile")?.value || "flat", n = u("upfront-investment", 0), a = F(), i = D(a, e, n), s = x(a), d = Math.max(1, ...i.map((l) => Math.abs(l.cumulative))), c = Math.max(1, ...s.map((l) => l.swing)), r = i.find((l) => l.cumulative >= 0)?.month, o = i.map((l) => {
    const v = Math.max(4, Math.round(Math.abs(l.cumulative) / d * 92));
    return `<div class="cash-month"><div class="cash-bar ${l.cumulative >= 0 ? "positive" : "negative"}" style="height:${v}px" aria-hidden="true"></div><span>${l.month}</span><output>${f.format(l.cumulative)}</output></div>`;
  }).join(""), I = s.map((l) => {
    const v = Math.max(10, Math.round(l.swing / c * 100));
    return `<div class="sensitivity-row"><div><strong>${l.label}</strong><span>-20% to +20%</span></div><div class="sensitivity-track"><span style="width:${v}%"></span></div><output>${f.format(l.low)} to ${f.format(l.high)}</output></div>`;
  }).join("");
  t.querySelector("[data-cash-chart]").innerHTML = o, t.querySelector("[data-sensitivity]").innerHTML = I, t.querySelector("[data-payback]").textContent = r ? `Month ${r}` : "Beyond 12 months", t.querySelector("[data-year-net]").textContent = f.format(i.at(-1)?.cumulative ?? 0);
}
function N() {
  const t = document.getElementById("financial-intelligence");
  t && (t.addEventListener("input", h), document.querySelectorAll("#roi input, #roi select").forEach((e) => e.addEventListener("input", h)), h());
}
function S(t) {
  const e = (n, a = "—") => String(t.state.fields[n] ?? a);
  return `${e("i-vis")} visitors · $${e("i-arpu")} ARPU · ${e("i-opt")}% opt-in · ${e("i-lift")}% lift`;
}
function y(t) {
  return t.replace(/[<>&"]/g, "");
}
function k() {
  const t = document.getElementById("scenario-workspace");
  if (!t) return;
  const e = new C(), n = t.querySelector("[data-scenario-list]"), a = t.querySelector("[data-scenario-compare]"), i = t.querySelector("#scenario-name"), s = /* @__PURE__ */ new Set(), d = () => {
    const c = e.list();
    n.innerHTML = c.length ? c.map((o) => `<article class="scenario-row" data-id="${o.id}"><label><input type="checkbox" data-compare ${s.has(o.id) ? "checked" : ""}><span><strong>${y(o.name)}</strong><small>${S(o)}</small></span></label><div><button type="button" data-load>Load</button><button type="button" data-clone>Clone</button><button type="button" data-delete aria-label="Delete ${y(o.name)}">Delete</button></div></article>`).join("") : '<p class="scenario-empty">Save the current deal to create a comparison set.</p>';
    const r = c.filter((o) => s.has(o.id)).slice(0, 3);
    a.innerHTML = r.length > 1 ? r.map((o) => `<div><strong>${y(o.name)}</strong><span>${S(o)}</span></div>`).join("") : "<p>Select two or three saved scenarios to compare their assumptions.</p>";
  };
  t.querySelector("[data-save-scenario]").addEventListener("click", () => {
    e.save(i.value), i.value = "", d();
  }), t.querySelector("#prospect-mode").addEventListener("change", (c) => document.body.classList.toggle("prospect-mode", c.currentTarget.checked)), n.addEventListener("click", (c) => {
    const r = c.target;
    if (r.closest("[data-compare]")) return;
    const o = r.closest("[data-id]");
    o && (r.closest("[data-load]") && e.load(o.dataset.id), r.closest("[data-clone]") && e.clone(o.dataset.id), r.closest("[data-delete]") && (e.remove(o.dataset.id), s.delete(o.dataset.id)), h(), d());
  }), n.addEventListener("change", (c) => {
    const r = c.target.closest("[data-compare]"), o = r?.closest("[data-id]");
    !r || !o || (r.checked && s.size < 3 ? s.add(o.dataset.id) : s.delete(o.dataset.id), d());
  }), d();
}
function q() {
  document.documentElement.dataset.typedClient = "ready", document.dispatchEvent(new CustomEvent("lucra:typed-client-ready"));
}
function b() {
  $(), N(), k(), q();
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", b, { once: !0 }) : b();
//# sourceMappingURL=app.js.map
