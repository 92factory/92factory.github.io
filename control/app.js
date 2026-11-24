/* 92 Factory Control — app.js
   Sistema de gestão: estoque, PDV, vendas, importações/pacotes (rastreio Correios), financeiro, multiempresa. */
(() => {
"use strict";
const CFG = window.CTL_CONFIG;
const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v) => { if (v === "" || v == null) return 0; const s = String(v).trim(); const x = /,\d{1,2}$/.test(s) ? parseFloat(s.replace(/\./g, "").replace(",", ".")) : parseFloat(s.replace(",", ".")); return isFinite(x) ? x : 0; };
const n = (v) => { if (typeof v === "string") return num(v); const x = Number(v); return isFinite(x) ? x : 0; };
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl = (v) => BRL.format(Number(v) || 0);
const cny = (v) => "¥ " + (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => isFinite(v) ? (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%" : "—";
const fdate = (d) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fdt = (d) => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const today = () => new Date().toISOString().slice(0, 10);
const store = { get(k, d) { try { const v = localStorage.getItem("ctl:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("ctl:" + k, JSON.stringify(v)); } catch {} } };

const I = {
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
  sell: '<path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  stock: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  plane: '<path d="M2 16 22 8l-6 12-3-6z"/><path d="m13 14-4 4"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 20c0-3-2-5-5-5.7"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24">${I[k] || ""}</svg>`;

const who = (e) => String(e || "").endsWith("@92factory.local") ? String(e).split("@")[0] : String(e || "");
const toast = (msg, err) => { const t = $("#toast"); t.textContent = msg; t.className = "toast" + (err ? " err" : ""); t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), err ? 5200 : 2600); };
const fail = (e) => { console.error(e); toast(friendly(e), true); };
const friendly = (e) => { const m = e?.message || String(e); if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão com a internet. Tente de novo."; if (/row-level security|permission/i.test(m)) return "Sua conta não tem permissão para isso nesta empresa."; return m; };
async function q(p) { const { data, error } = await p; if (error) throw error; return data; }

/* ---------- constants ---------- */
const SHIP_STATUS = [
  ["comprado", "Comprado", 0], ["armazem", "No armazém", 1], ["enviado", "Enviado", 2], ["em_transito", "Em trânsito", 3],
  ["fiscalizacao", "Fiscalização", 3], ["aguardando_taxa", "Aguardando taxa", 4], ["taxa_paga", "Taxa paga", 4],
  ["saiu_entrega", "Saiu para entrega", 5], ["entregue", "Entregue", 6], ["problema", "Problema", 3],
];
const SHIP_STEPS = ["Comprado", "Armazém", "Enviado", "Trânsito", "Taxa", "Entrega"];
const sLabel = (s) => (SHIP_STATUS.find((x) => x[0] === s) || [s, s])[1];
const sStep = (s) => (SHIP_STATUS.find((x) => x[0] === s) || [0, 0, 0])[2];
const sBadge = (s) => ({ entregue: "ok", aguardando_taxa: "warn", fiscalizacao: "warn", problema: "bad", saiu_entrega: "info", em_transito: "info", taxa_paga: "ok" }[s] || "orange");
const PAY = ["Pix", "Dinheiro", "Crédito", "Débito", "Transferência", "Outro"];
const CHANNELS = ["Instagram", "WhatsApp", "Loja", "Site", "Indicação", "Outro"];
const EXP_CATS = ["Frete nacional", "Embalagem", "Marketing", "Taxas e impostos", "Plataforma / Agente", "Retirada sócio", "Outros"];

/* ---------- state ---------- */
const S = { fixed: [], user: null, companies: [], cid: null, company: null, members: [], products: [], moves: [], shipments: [], sales: [], expenses: [], cart: [], period: store.get("period", "mes"), channel: null, correios: null };

/* ---------- calculations ---------- */
const C = {
  rateOf(shipId) { const sh = S.shipments.find((s) => s.id === shipId); return n(sh?.cny_rate) || n(S.company?.cny_rate) || 0.8; },
  baseCost(p) { return p.cost_brl != null && p.cost_brl !== "" ? n(p.cost_brl) : n(p.cost_cny) * C.rateOf(p.shipment_id); },
  shipCorreios(sh) { return n(sh.correios_fee_brl) + n(sh.import_tax_brl) + n(sh.icms_brl) + S.expenses.filter((e) => e.kind === "correios" && e.shipment_id === sh.id).reduce((a, e) => a + n(e.amount), 0); },
  shipExtras(sh) { return n(sh.freight_brl) + C.shipCorreios(sh) + n(sh.other_fees_brl); },
  shipInfo(sh) {
    const rate = n(sh.cny_rate) || n(S.company?.cny_rate) || 0.8;
    let units = 0, cnyTot = 0, base = 0;
    S.moves.forEach((m) => { if (m.shipment_id !== sh.id || m.type !== "entrada") return; const p = S.products.find((x) => x.id === m.product_id); if (!p) return; units += m.qty; cnyTot += m.qty * n(p.cost_cny); base += m.qty * C.baseCost(p); });
    const freight = n(sh.freight_brl), correios = C.shipCorreios(sh), other = n(sh.other_fees_brl), extras = freight + correios + other;
    return { rate, units, cnyTot, base, freight, correios, other, extras, factor: base > 0 ? extras / base : 0, total: base + extras };
  },
  share(p, amount, k) { return amount && k.units ? amount / k.units : 0; },
  parts(p) {
    const prod = C.baseCost(p); let frete = n(p.freight_brl), correios = n(p.correios_fee_brl), outras = 0;
    const sh = S.shipments.find((s) => s.id === p.shipment_id);
    if (sh) { const k = C.shipInfo(sh); frete += C.share(p, k.freight, k); correios += C.share(p, k.correios, k); outras += C.share(p, k.other, k); }
    return { prod, frete, correios, outras, total: prod + frete + correios + outras };
  },
  landed(p) { return C.parts(p).total; },
  stock(pid) { return S.moves.reduce((a, m) => (m.product_id === pid ? a + m.qty : a), 0); },
  inTransit(pid) { return Math.min(Math.max(C.stock(pid), 0), S.moves.reduce((a, m) => { if (m.product_id !== pid || m.type !== "entrada" || !m.shipment_id) return a; const sh = S.shipments.find((s) => s.id === m.shipment_id); return sh && sh.status !== "entregue" ? a + m.qty : a; }, 0)); },
  itemCost(it) { const p = S.products.find((x) => x.id === it.product_id); return (p ? C.landed(p) : n(it.unit_cost)) * n(it.qty); },
  saleCost(s) { return (s.items || []).reduce((a, it) => a + C.itemCost(it), 0); },
  saleProfit(s) { return n(s.total) - n(s.shipping_charged) - C.saleCost(s); },
  periodRange(p) { const now = new Date(); let from = null; if (p === "mes") from = new Date(now.getFullYear(), now.getMonth(), 1); else if (p === "30") from = new Date(now - 30 * 864e5); else if (p === "ano") from = new Date(now.getFullYear(), 0, 1); return from; },
  inPeriod(d, p) { const f = C.periodRange(p); return !f || new Date(d) >= f; },
  spent(e) { return e.amount != null && !PLANNED.includes(e.status); },
  monthsIn(P, start) { const now = new Date(); const s = new Date((start || today()) + "T00:00:00"); if (s > now) return 0; if (P === "mes" || P === "30") return 1; const from = P === "ano" ? new Date(now.getFullYear(), 0, 1) : s; const f = from < s ? s : from; return (now.getFullYear() - f.getFullYear()) * 12 + now.getMonth() - f.getMonth() + 1; },
  fixedTotal(P) { return S.fixed.filter((f) => f.active && f.amount != null).reduce((a, f) => a + n(f.amount) * C.monthsIn(P, f.start_month), 0); },
  opExp(P) { return S.expenses.filter((e) => e.kind !== "correios" && e.category !== "Retirada sócio" && C.spent(e) && C.inPeriod(e.spent_at, P)); },
  opExpTotal(P) { return C.opExp(P).reduce((a, e) => a + n(e.amount), 0) + C.fixedTotal(P); },
};
const PLANNED = ["Falta comprar", "Falta fazer"];
const LOJA_ST = ["Já tenho", "A caminho", "Pago", "Em andamento", "Falta comprar", "Falta fazer"];
const stBadge = (st) => ({ "Já tenho": "ok", Pago: "ok", "A caminho": "info", "Em andamento": "warn", "Falta comprar": "bad", "Falta fazer": "bad" }[st] || "");
const ctag = (p) => [p.color, p.variant ? "Tam. " + p.variant : ""].filter(Boolean).join(" · ");
const pimg = (p) => p.image_url || (p.photos || [])[0] || "";

/* ---------- auth ---------- */
function showAuth() { $("#boot").hidden = true; $("#app").hidden = true; $("#auth").hidden = false; }
$("#authForm").onsubmit = async (e) => {
  e.preventDefault(); const btn = $("#authBtn"); btn.disabled = true; $("#authMsg").textContent = "";
  const login = $("#authEmail").value.trim().toLowerCase(), password = $("#authPass").value;
  const email = login.includes("@") ? login : login + "@92factory.local";
  try {
    const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error.message.includes("Invalid") ? new Error("Usuário ou senha incorretos.") : error;
  } catch (err) { $("#authMsg").textContent = friendly(err); }
  btn.disabled = false;
};
$("#logoutBtn").onclick = () => sb.auth.signOut();

sb.auth.onAuthStateChange((ev, session) => {
  if (ev === "PASSWORD_RECOVERY") { setTimeout(passwordModal, 300); }
  if (session?.user) { if (!S.user || S.user.id !== session.user.id) { S.user = session.user; start(); } }
  else { S.user = null; stopRealtime(); showAuth(); }
});

/* ---------- loading ---------- */
async function start() {
  $("#auth").hidden = true; $("#boot").hidden = false;
  try {
    S.companies = await q(sb.from("ctl_companies").select("*").order("created_at"));
    if (!S.companies.length) { $("#boot").hidden = true; $("#app").hidden = false; buildNav(); renderNoCompany(); return; }
    const saved = store.get("cid"); S.cid = S.companies.find((c) => c.id === saved) ? saved : S.companies[0].id;
    await loadCompany();
    $("#boot").hidden = true; $("#app").hidden = false; $("#userEmail").textContent = who(S.user.email);
    buildNav(); route();
  } catch (e) { $("#boot").hidden = true; fail(e); showAuth(); }
}
async function loadCompany() {
  S.company = S.companies.find((c) => c.id === S.cid); store.set("cid", S.cid);
  $("#companyName").textContent = $("#companyNameTop").textContent = S.company?.name || "—";
  const cid = S.cid;
  const [members, products, moves, shipments, sales, expenses, fixed] = await Promise.all([
    q(sb.from("ctl_members").select("*").eq("company_id", cid).order("created_at")),
    q(sb.from("ctl_products").select("*").eq("company_id", cid).order("name")),
    q(sb.from("ctl_stock_moves").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(10000)),
    q(sb.from("ctl_shipments").select("*").eq("company_id", cid).order("created_at", { ascending: false })),
    q(sb.from("ctl_sales").select("*").eq("company_id", cid).order("sold_at", { ascending: false }).limit(5000)),
    q(sb.from("ctl_expenses").select("*").eq("company_id", cid).order("spent_at", { ascending: false }).order("created_at")),
    q(sb.from("ctl_fixed_costs").select("*").eq("company_id", cid).order("created_at")),
  ]);
  Object.assign(S, { members, products, moves, shipments, sales, expenses, fixed });
  S.cart = store.get("cart:" + cid, []).filter((c) => products.some((p) => p.id === c.product_id));
  startRealtime();
}
let rtTimer;
function startRealtime() {
  stopRealtime();
  S.channel = sb.channel("ctl-" + S.cid);
  ["ctl_products", "ctl_stock_moves", "ctl_sales", "ctl_shipments", "ctl_expenses", "ctl_members", "ctl_fixed_costs"].forEach((t) =>
    S.channel.on("postgres_changes", { event: "*", schema: "public", table: t, filter: "company_id=eq." + S.cid }, () => { clearTimeout(rtTimer); rtTimer = setTimeout(refresh, 600); }));
  S.channel.subscribe((st) => { $("#sync").classList.toggle("off", st !== "SUBSCRIBED"); $("#sync").title = st === "SUBSCRIBED" ? "Sincronizado em tempo real" : "Reconectando…"; });
}
function stopRealtime() { if (S.channel) { sb.removeChannel(S.channel); S.channel = null; } }
async function refresh() { if ($("#modal").hidden === false) { refresh.pending = true; return; } if (document.activeElement?.matches?.("#main input, #main select, #main textarea")) { clearTimeout(refresh.t); refresh.t = setTimeout(refresh, 1500); return; } try { await loadCompany(); route(); } catch (e) { console.warn(e); } }

/* ---------- navigation ---------- */
const PAGES = [
  ["inicio", "Início", "home", pageHome], ["vender", "Vender", "sell", pagePOS], ["produtos", "Produtos", "box", pageProducts],
  ["estoque", "Estoque", "stock", pageStock], ["vendas", "Vendas", "receipt", pageSales], ["importacoes", "Importações", "plane", pageShipments],
  ["financeiro", "Financeiro", "money", pageFinance], ["ajustes", "Ajustes", "gear", pageSettings], ["mais", "Mais", "more", pageMore],
];
function buildNav() {
  $("#nav").innerHTML = PAGES.filter((p) => p[0] !== "mais").map(([k, l, i]) => `<a href="#${k}" data-k="${k}">${ico(i)}<span>${l}</span>${k === "importacoes" ? '<span class="badge badge--warn" id="navTax" hidden></span>' : ""}</a>`).join("");
  const tabs = ["inicio", "produtos", "vender", "importacoes", "mais"];
  $("#tabbar").innerHTML = tabs.map((k) => { const p = PAGES.find((x) => x[0] === k); return k === "vender" ? `<a href="#vender" data-k="vender" class="sell"><span class="pill">${ico("sell")}</span><em>Vender</em></a>` : `<a href="#${k}" data-k="${k}">${ico(p[2])}<span>${k === "importacoes" ? "Pacotes" : p[1]}</span></a>`; }).join("");
}
function route() {
  if (!S.company) return renderNoCompany();
  const k = (location.hash || "#inicio").slice(1).split("?")[0];
  const page = PAGES.find((p) => p[0] === k) || PAGES[0];
  $$("#nav a, #tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.k === page[0] || (page[0] === "mais" && false) || (["estoque", "vendas", "financeiro", "ajustes"].includes(page[0]) && a.dataset.k === "mais" && innerWidth <= 900)));
  const pending = S.shipments.filter((s) => s.tax_generated && !s.tax_paid).length; const nt = $("#navTax"); if (nt) { nt.hidden = !pending; nt.textContent = pending ? `${pending} taxa` : ""; }
  const main = $("#main"); main.innerHTML = page[3]() || ""; bindPage(page[0]);
  window.scrollTo({ top: 0 });
}
addEventListener("hashchange", route);
const companyPick = () => openModal(`
  <div class="modal__head"><div><h2>Empresas</h2><p class="muted">Troque de empresa ou crie um novo negócio.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <div class="rows">${S.companies.map((c) => `<button class="row" data-cid="${c.id}" style="text-align:left;width:100%"><div><b>${esc(c.name)}</b><div class="cell-sub">${esc(c.segment || "")}</div></div>${c.id === S.cid ? '<span class="badge badge--orange">Atual</span>' : ""}</button>`).join("")}</div>
  <div class="modal__foot"><button class="btn btn--orange" id="newCo">${ico("plus")}Nova empresa</button></div>`, (m) => {
  $$("[data-cid]", m).forEach((b) => (b.onclick = async () => { S.cid = b.dataset.cid; closeModal(); $("#boot").hidden = false; await loadCompany().catch(fail); $("#boot").hidden = true; route(); }));
  $("#newCo", m).onclick = companyForm;
});
$("#companyBtn").onclick = companyPick; $("#companyBtnTop").onclick = companyPick;

function renderNoCompany() {
  $("#main").innerHTML = `<div class="panel" style="max-width:560px;margin:40px auto"><div class="empty"><b>Você ainda não faz parte de nenhuma empresa</b><p>Este usuário ainda não tem acesso a nenhuma empresa. Crie uma empresa agora.</p><button class="btn btn--orange" id="firstCo">${ico("plus")}Criar empresa</button><button class="link" id="reloadCo">Já fui adicionado, recarregar</button></div></div>`;
  $("#firstCo").onclick = companyForm; $("#reloadCo").onclick = start;
}
function companyForm() {
  openModal(`<div class="modal__head"><div><h2>Nova empresa</h2><p class="muted">Cada empresa tem produtos, estoque, vendas e financeiro separados.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <form id="coForm" class="stack"><label class="field"><span>Nome da empresa</span><input id="coName" required placeholder="Ex.: 92 Kids"></label>
  <div class="grid2"><label class="field"><span>Segmento</span><input id="coSeg" placeholder="Ex.: Acessórios"></label><label class="field"><span>Cotação ¥ 1 = R$</span><input id="coRate" inputmode="decimal" value="0,80"></label></div>
  <div class="modal__foot"><button class="btn btn--ghost" type="button" data-close>Cancelar</button><button class="btn btn--orange">Criar empresa</button></div></form>`, (m) => {
    $("#coForm", m).onsubmit = async (e) => { e.preventDefault(); try { const c = await q(sb.from("ctl_companies").insert({ name: $("#coName", m).value.trim(), segment: $("#coSeg", m).value.trim() || null, cny_rate: num($("#coRate", m).value) || 0.8, created_by: S.user.id }).select().single()); S.cid = c.id; store.set("cid", c.id); closeModal(); toast("Empresa criada"); await start(); } catch (err) { fail(err); } };
  });
}

/* ---------- modal ---------- */
function openModal(html, bind, wide) { const m = $("#modal"); $("#modalBody").innerHTML = html; $(".modal__card", m).classList.toggle("wide", !!wide); m.hidden = false; document.body.style.overflow = "hidden"; $$("[data-close]", m).forEach((b) => (b.onclick = closeModal)); bind && bind($("#modalBody")); const f = $("input:not([type=hidden]),select", $("#modalBody")); if (f && innerWidth > 900) f.focus(); }
function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; if (refresh.pending) { refresh.pending = false; refresh(); } }
addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });
function confirmBox(title, text, okLabel, onOk, danger = true) {
  openModal(`<div class="modal__head"><div><h2>${esc(title)}</h2><p class="muted">${text}</p></div></div><div class="modal__foot"><button class="btn btn--ghost" data-close>Voltar</button><button class="btn ${danger ? "btn--danger" : "btn--orange"}" id="okBtn">${esc(okLabel)}</button></div>`, (m) => { $("#okBtn", m).onclick = async () => { $("#okBtn", m).disabled = true; try { await onOk(); closeModal(); } catch (e) { $("#okBtn", m).disabled = false; fail(e); } }; });
}

/* ================= PAGES ================= */
const ph = (eyebrow, title, sub, actions = "") => `<div class="ph"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="ph__actions">${actions}</div></div>`;
const periodSeg = () => `<div class="seg" id="periodSeg">${[["mes", "Este mês"], ["30", "30 dias"], ["ano", "Ano"], ["tudo", "Tudo"]].map(([k, l]) => `<button data-p="${k}" class="${S.period === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
function bindPeriod() { $$("#periodSeg button").forEach((b) => (b.onclick = () => { S.period = b.dataset.p; store.set("period", S.period); route(); })); }

/* ---- Início ---- */
function pageHome() {
  const sales = S.sales.filter((s) => s.status !== "cancelada" && C.inPeriod(s.sold_at, S.period));
  const paid = sales.filter((s) => s.status === "paga");
  const rev = paid.reduce((a, s) => a + n(s.total), 0);
  const profit = paid.reduce((a, s) => a + C.saleProfit(s), 0);
  const exp = C.opExpTotal(S.period);
  const pending = sales.filter((s) => s.status === "pendente").reduce((a, s) => a + n(s.total), 0);
  const active = S.products.filter((p) => p.active);
  let units = 0, stockCost = 0, stockSale = 0, transit = 0;
  active.forEach((p) => { const st = C.stock(p.id); if (st > 0) { units += st; stockCost += st * C.landed(p); stockSale += st * n(p.price); } transit += C.inTransit(p.id); });
  const invested = S.moves.filter((m) => m.type === "entrada").reduce((a, m) => { const p = S.products.find((x) => x.id === m.product_id); return a + m.qty * (p ? C.landed(p) : 0); }, 0);
  const openShips = S.shipments.filter((s) => s.status !== "entregue");
  const taxes = S.shipments.filter((s) => s.tax_generated && !s.tax_paid);
  const low = active.filter((p) => C.stock(p.id) <= n(p.min_stock)).slice(0, 6);
  // top products
  const tops = {}; paid.forEach((s) => (s.items || []).forEach((it) => { const k = it.product_id; tops[k] = tops[k] || { name: it.name, qty: 0, rev: 0 }; tops[k].qty += n(it.qty); tops[k].rev += n(it.qty) * n(it.price); }));
  const topList = Object.values(tops).sort((a, b) => b.rev - a.rev).slice(0, 5); const topMax = topList[0]?.rev || 1;
  const meM = S.members.find((m) => m.email.toLowerCase() === S.user.email.toLowerCase()); const hr = new Date().getHours();
  return ph("Visão geral", `${hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite"}${meM?.display_name ? ", " + esc(meM.display_name.split(" ")[0]) : ""}`, `${esc(S.company.name)} · ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`, periodSeg()) + `
  <div class="stack">
    <div class="kpis">
      <div class="kpi kpi--hero"><span>Faturamento</span><b>${brl(rev)}</b><small>${paid.length} venda${paid.length === 1 ? "" : "s"} paga${paid.length === 1 ? "" : "s"}${pending ? ` · ${brl(pending)} a receber` : ""}</small></div>
      <div class="kpi"><span>Lucro bruto</span><b class="${profit < 0 ? "neg" : ""}">${brl(profit)}</b><small>Margem ${pct(rev ? profit / rev : NaN)} · já com frete e taxas</small></div>
      <div class="kpi"><span>Lucro líquido</span><b class="${profit - exp < 0 ? "neg" : ""}">${brl(profit - exp)}</b><small>Depois de ${brl(exp)} em despesas e custos fixos</small></div>
      <div class="kpi"><span>Ticket médio</span><b>${brl(paid.length ? rev / paid.length : 0)}</b><small>por venda</small></div>
    </div>
    <div class="kpis">
      <div class="kpi"><span>Peças em estoque</span><b>${units}</b><small>${transit ? `${transit} ainda a caminho` : "todas na mão"}</small></div>
      <div class="kpi"><span>Estoque a custo</span><b>${brl(stockCost)}</b><small>Vale ${brl(stockSale)} na venda</small></div>
      <div class="kpi"><span>Lucro em estoque</span><b>${brl(stockSale - stockCost)}</b><small>se vender tudo pelo preço</small></div>
      <div class="kpi"><span>Investido em produtos</span><b>${brl(invested)}</b><small>com frete e taxa dos Correios</small></div>
    </div>
    ${taxes.length ? `<div class="note"><b>${taxes.length === 1 ? "Um pacote gerou taxa" : `${taxes.length} pacotes geraram taxa`} nos Correios:</b> ${taxes.map((t) => esc(t.name)).join(", ")}. <a class="link" href="#importacoes">Ver pacotes</a></div>` : ""}
    <div class="cols">
      <div class="panel"><h2>Vendas por dia <span class="muted" style="font-weight:500;font-size:12px">últimos 30 dias</span></h2>${salesChart()}</div>
      <div class="panel"><h2>Pacotes a caminho <a class="link" href="#importacoes" style="font-size:13px">Ver todos</a></h2>${openShips.length ? `<div class="rows">${openShips.slice(0, 5).map((s) => `<a class="row" href="#importacoes" style="text-decoration:none"><div><b>${esc(s.name)}</b><div class="cell-sub">${esc(s.tracking_code || "Sem código de rastreio")}</div></div><span class="badge badge--${sBadge(s.status)}">${sLabel(s.status)}</span></a>`).join("")}</div>` : `<div class="empty">Nenhum pacote em aberto.</div>`}</div>
    </div>
    <div class="cols">
      <div class="panel"><h2>Mais vendidos</h2>${topList.length ? `<div class="rows">${topList.map((t) => `<div class="row"><div><b>${esc(t.name)}</b><div class="bar" style="margin-top:6px"><i style="width:${(t.rev / topMax) * 100}%"></i></div></div><div class="r"><b>${brl(t.rev)}</b><div class="cell-sub">${t.qty} un.</div></div></div>`).join("")}</div>` : `<div class="empty"><b>Nenhuma venda no período</b><a class="btn btn--orange btn--sm" href="#vender">${ico("sell")}Fazer uma venda</a></div>`}</div>
      <div class="panel"><h2>Estoque baixo</h2>${low.length ? `<div class="rows">${low.map((p) => `<div class="row"><div><b>${esc(p.name)}</b><div class="cell-sub">${esc(p.sku || "")}</div></div><span class="badge badge--${C.stock(p.id) <= 0 ? "bad" : "warn"}">${C.stock(p.id)} un.</span></div>`).join("")}</div>` : `<div class="empty">Tudo certo com o estoque.</div>`}</div>
    </div>
  </div>`;
}
function salesChart() {
  const days = 30, W = 600, H = 190, pad = { l: 8, r: 8, t: 14, b: 22 };
  const buckets = Array.from({ length: days }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - i)); return { d, v: 0 }; });
  S.sales.filter((s) => s.status === "paga").forEach((s) => { const d = new Date(s.sold_at); d.setHours(0, 0, 0, 0); const b = buckets.find((x) => +x.d === +d); if (b) b.v += n(s.total); });
  const max = Math.max(...buckets.map((b) => b.v), 1), bw = (W - pad.l - pad.r) / days;
  const total = buckets.reduce((a, b) => a + b.v, 0);
  if (!total) return `<div class="empty"><b>Sem vendas nos últimos 30 dias</b><span>As vendas registradas no Vender aparecem aqui.</span></div>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${[0.5, 1].map((f) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${pad.t + (H - pad.t - pad.b) * (1 - f)}" y2="${pad.t + (H - pad.t - pad.b) * (1 - f)}" stroke="rgba(255,255,255,.06)"/>`).join("")}
  ${buckets.map((b, i) => { const h = (b.v / max) * (H - pad.t - pad.b); return `<rect x="${pad.l + i * bw + 2}" y="${H - pad.b - h}" width="${bw - 4}" height="${Math.max(h, b.v ? 2 : 0)}" rx="3" fill="${i === days - 1 ? "#EE5B27" : "rgba(238,91,39,.55)"}"><title>${b.d.toLocaleDateString("pt-BR")}: ${brl(b.v)}</title></rect>`; }).join("")}
  ${[0, 10, 20, 29].map((i) => `<text x="${pad.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${buckets[i].d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</text>`).join("")}
  <text x="${W - pad.r}" y="10" text-anchor="end">máx. ${brl(max)}</text></svg>`;
}

/* ---- Produtos ---- */
let pFilter = { q: "", cat: "", view: store.get("pview", "cards") };
function pageProducts() {
  const cats = [...new Set(S.products.map((p) => p.category).filter(Boolean))].sort();
  return ph("Catálogo", "Produtos", `${S.products.length} produto${S.products.length === 1 ? "" : "s"} · custo final já inclui frete e taxas do lote`, `
    <button class="btn btn--ghost btn--sm" id="impBtn">${ico("upload")}Importar planilha</button>
    <button class="btn btn--ghost btn--sm" id="expBtn">${ico("download")}Exportar Excel</button>
    <button class="btn btn--orange btn--sm" id="newProd">${ico("plus")}Novo produto</button>`) + `
  <div class="toolbar"><input class="input" id="pq" placeholder="Buscar por nome ou código" value="${esc(pFilter.q)}">
  <select class="input" id="pcat"><option value="">Todas as categorias</option>${cats.map((c) => `<option ${pFilter.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
  <div class="seg"><button data-v="cards" class="${pFilter.view === "cards" ? "on" : ""}">Cards</button><button data-v="table" class="${pFilter.view === "table" ? "on" : ""}">Tabela</button></div></div>
  <div id="plist"></div>`;
}
function renderProductList() {
  const qq = pFilter.q.toLowerCase();
  const list = S.products.filter((p) => (!pFilter.cat || p.category === pFilter.cat) && (!qq || `${p.name} ${p.sku} ${p.variant} ${p.color || ""}`.toLowerCase().includes(qq)));
  const el = $("#plist"); if (!el) return;
  if (!list.length) { el.innerHTML = `<div class="panel"><div class="empty"><b>${S.products.length ? "Nada encontrado" : "Nenhum produto ainda"}</b>${S.products.length ? "" : `<span>Cadastre um produto ou importe a sua planilha.</span>`}</div></div>`; return; }
  if (pFilter.view === "table") {
    let tu = 0, ts = 0, tc = 0, tp = 0, tcy = 0;
    const fv = (v) => (n(v) ? String(v).replace(".", ",") : "");
    el.innerHTML = `<div class="panel"><p class="muted" style="margin:0 0 12px;font-size:13px">Digite o custo em ¥ e o preço de venda direto na tabela. Salva sozinho.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produto</th><th>Cor · Tam.</th><th class="r">Custo ¥</th><th class="r">Produto R$</th><th class="r">Frete</th><th class="r">Taxa Correios</th><th class="r">Custo final</th><th class="r">Venda R$</th><th class="r">Lucro/un</th><th class="r">Estoque</th></tr></thead><tbody>
    ${list.map((p) => { const k = C.parts(p), st = Math.max(C.stock(p.id), 0), pr = n(p.price), lu = pr - k.total; tu += st; tcy += st * n(p.cost_cny); tc += st * k.total; ts += st * pr; tp += st * lu; return `<tr class="click" data-pid="${p.id}"><td><div class="hstack" style="flex-wrap:nowrap">${pimg(p) ? `<img class="thumb" src="${esc(pimg(p))}" alt="">` : `<span class="thumb thumb--empty">92</span>`}<div><div class="cell-title">${esc(p.name)}</div><div class="cell-sub">${esc([p.sku, p.category].filter(Boolean).join(" · "))}</div></div></div></td><td>${esc(ctag(p).replace("Tam. ", "") || "—")}</td>
      <td class="r"><input class="cell-in" data-edit="cost_cny" data-id="${p.id}" inputmode="decimal" value="${fv(p.cost_cny)}" placeholder="¥ 0" aria-label="Custo em yuan de ${esc(p.name)}"></td><td class="r">${brl(k.prod)}</td><td class="r">${brl(k.frete)}</td><td class="r">${brl(k.correios)}</td><td class="r"><b>${brl(k.total)}</b></td>
      <td class="r"><input class="cell-in" data-edit="price" data-id="${p.id}" inputmode="decimal" value="${fv(p.price)}" placeholder="R$ 0" aria-label="Preço de venda de ${esc(p.name)}"></td><td class="r ${lu < 0 ? "neg" : "pos"}">${pr ? brl(lu) : "—"}</td><td class="r">${stockBadge(p)}</td></tr>`; }).join("")}
    </tbody><tfoot><tr><td colspan="2">Total em estoque (${tu} peças)</td><td class="r">${cny(tcy)}</td><td colspan="3"></td><td class="r">${brl(tc)}</td><td class="r">${brl(ts)}</td><td class="r pos">${brl(tp)}</td><td></td></tr></tfoot></table></div></div>`;
    $$(".cell-in", el).forEach((i) => { i.onclick = (e) => e.stopPropagation(); i.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); const all = $$(`.cell-in[data-edit="${i.dataset.edit}"]`, el); const nx = all[all.indexOf(i) + 1]; (nx || i).focus(); nx?.select?.(); if (!nx) i.blur(); } };
      i.onchange = async () => { const p = S.products.find((x) => x.id === i.dataset.id); const v = num(i.value); try { await q(sb.from("ctl_products").update({ [i.dataset.edit]: v }).eq("id", p.id)); p[i.dataset.edit] = v; i.classList.add("saved"); setTimeout(() => i.classList.remove("saved"), 900); const row = i.closest("tr"); const k = C.parts(p), lu = n(p.price) - k.total; const c = row.children; c[3].textContent = brl(k.prod); c[4].textContent = brl(k.frete); c[5].textContent = brl(k.correios); c[6].innerHTML = `<b>${brl(k.total)}</b>`; c[8].textContent = n(p.price) ? brl(lu) : "—"; c[8].className = "r " + (lu < 0 ? "neg" : "pos"); } catch (err) { fail(err); } }; });
  } else {
    el.innerHTML = `<div class="pgrid">${list.map((p) => { const L = C.landed(p), pr = n(p.price); return `<button class="pcard" data-pid="${p.id}"><div class="pcard__img">${pimg(p) ? `<img src="${esc(pimg(p))}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="ph-ico">92</span>`}${stockBadge(p)}</div><div class="pcard__body"><div><div class="pcard__name">${esc(p.name)}</div><div class="pcard__meta">${esc([ctag(p), p.sku, p.category].filter(Boolean).join(" · "))}</div></div>
      <div class="pcard__row"><span>Custo final</span><b>${brl(L)}</b></div><div class="pcard__row"><span>Lucro/un</span><b class="${pr - L < 0 ? "neg" : "pos"}">${pr ? `${brl(pr - L)} (${pct((pr - L) / pr)})` : "defina o preço"}</b></div><div class="pcard__price num">${pr ? brl(pr) : "Sem preço"}</div></div></button>`; }).join("")}</div>`;
  }
  $$("[data-pid]", el).forEach((b) => (b.onclick = () => productForm(S.products.find((p) => p.id === b.dataset.pid))));
}
function stockBadge(p) { const st = C.stock(p.id), tr = C.inTransit(p.id); const cls = st <= 0 ? "bad" : st <= n(p.min_stock) ? "warn" : tr >= st ? "info" : "ok"; return `<span class="badge badge--${cls}">${st} un.${tr ? ` · ${tr} a caminho` : ""}</span>`; }
function shipOptions(sel) { return `<option value="">Sem lote / comprado no Brasil</option>` + S.shipments.map((s) => `<option value="${s.id}" ${s.id === sel ? "selected" : ""}>${esc(s.name)}${s.tracking_code ? " · " + esc(s.tracking_code) : ""}</option>`).join(""); }
function productForm(p) {
  const isNew = !p; p = p || { name: "", category: "Tênis", cost_cny: "", price: "", min_stock: 0, active: true };
  const st = isNew ? 0 : C.stock(p.id);
  openModal(`<div class="modal__head"><div><h2>${isNew ? "Novo produto" : esc(p.name)}</h2><p class="muted">${isNew ? "O custo em real é calculado pela cotação do lote." : `${st} em estoque · custo final ${brl(C.landed(p))}`}</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <form id="pf" class="stack">
    <div class="grid2"><label class="field" style="grid-column:1/-1"><span>Nome do produto</span><input id="f_name" required value="${esc(p.name)}" placeholder="Ex.: Jordan 4 Brick by Brick"></label>
    <label class="field"><span>Categoria</span><input id="f_cat" list="catList" value="${esc(p.category || "")}"><datalist id="catList">${[...new Set(["Tênis", "Camiseta", "Moletom", "Calça", "Bermuda", "Jaqueta", "Boné", "Sandália", "Acessório", ...S.products.map((x) => x.category).filter(Boolean)])].map((c) => `<option>${esc(c)}</option>`).join("")}</datalist></label>
    <label class="field"><span>Código (SKU)</span><input id="f_sku" value="${esc(p.sku || "")}" placeholder="Automático"></label>
    <label class="field"><span>Cor</span><input id="f_color" list="colorList" value="${esc(p.color || "")}" placeholder="Ex.: Preto e vermelho"><datalist id="colorList">${[...new Set(["Preto", "Branco", "Cinza", "Vermelho", "Azul", "Verde", "Rosa", "Roxo", "Marrom", "Bege", "Amarelo", "Laranja", "Vinho", ...S.products.map((x) => x.color).filter(Boolean)])].map((c) => `<option>${esc(c)}</option>`).join("")}</datalist></label>
    <label class="field"><span>Tamanho</span><input id="f_var" value="${esc(p.variant || "")}" placeholder="Ex.: 42, M, G"></label>
    <label class="field"><span>Lote de importação</span><select id="f_ship">${shipOptions(p.shipment_id)}</select></label></div>
    <div class="grid3"><label class="field"><span>Custo em yuan (¥)</span><input id="f_cny" inputmode="decimal" value="${p.cost_cny === "" ? "" : esc(String(p.cost_cny).replace(".", ","))}" placeholder="0,00"></label>
    <label class="field"><span>Custo em real (R$)</span><input id="f_brl" inputmode="decimal" value="${p.cost_brl != null && p.cost_brl !== "" ? esc(String(p.cost_brl).replace(".", ",")) : ""}" placeholder="pela cotação"><small id="f_brlHint"></small></label>
    <label class="field"><span>Preço de venda (R$)</span><input id="f_price" inputmode="decimal" required value="${p.price === "" ? "" : esc(String(p.price).replace(".", ","))}" placeholder="0,00"></label></div>
    <div class="grid2"><label class="field"><span>Frete por unidade (R$)</span><input id="f_fr" inputmode="decimal" value="${n(p.freight_brl) ? esc(String(p.freight_brl).replace(".", ",")) : ""}" placeholder="0,00"><small>Além do frete do pacote, se tiver</small></label>
    <label class="field"><span>Taxa dos Correios por unidade (R$)</span><input id="f_tc" inputmode="decimal" value="${n(p.correios_fee_brl) ? esc(String(p.correios_fee_brl).replace(".", ",")) : ""}" placeholder="0,00"><small>Além da taxa do pacote, se tiver</small></label></div>
    <div class="panel" style="padding:14px"><div class="kv" id="f_calc"></div></div>
    <div class="grid2">${isNew ? `<label class="field"><span>Quantidade que entrou</span><input id="f_qty" type="number" min="0" value="1"></label>` : ""}<label class="field"><span>Alerta de estoque baixo</span><input id="f_min" type="number" min="0" value="${n(p.min_stock)}"></label>
    ${isNew ? "" : `<div class="field" style="grid-column:1/-1"><span>Fotos</span><div class="photos" id="f_photos">${photoStrip(p)}</div></div>`}
    <label class="field" style="grid-column:1/-1"><span>Link de compra</span><input id="f_link" value="${esc(p.link || "")}" placeholder="Link da Kakobuy, Weidian…"></label>
    <label class="field" style="grid-column:1/-1"><span>Observações</span><textarea id="f_notes">${esc(p.notes || "")}</textarea></label></div>
    <div class="modal__foot">${isNew ? "" : `<button type="button" class="btn btn--danger btn--sm spacer" id="pDel">${ico("trash")}Excluir</button><button type="button" class="btn btn--ghost btn--sm" id="pMove">${ico("stock")}Movimentar estoque</button>`}<button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">${isNew ? "Cadastrar" : "Salvar"}</button></div>
  </form>`, (m) => {
    const calc = () => { const sh = $("#f_ship", m).value || null; const rate = C.rateOf(sh); const c = num($("#f_cny", m).value); const tmp = { id: p.id, shipment_id: sh, cost_cny: c, cost_brl: $("#f_brl", m).value.trim() ? num($("#f_brl", m).value) : null, freight_brl: num($("#f_fr", m).value), correios_fee_brl: num($("#f_tc", m).value) }; const k = C.parts(tmp); const pr = num($("#f_price", m).value); $("#f_brlHint", m).textContent = `¥1 = ${brl(rate)} → ${brl(c * rate)}`;
      $("#f_calc", m).innerHTML = `<span>Produto</span><b>${brl(k.prod)}</b><span>Frete</span><b>${brl(k.frete)}</b><span>Taxa dos Correios</span><b>${brl(k.correios)}</b>${k.outras ? `<span>Outras taxas</span><b>${brl(k.outras)}</b>` : ""}<span>Custo final por unidade</span><b>${brl(k.total)}</b><span>Lucro por unidade</span><b class="${pr - k.total < 0 ? "neg" : "pos"}">${brl(pr - k.total)} · ${pct(pr ? (pr - k.total) / pr : NaN)}</b>`; };
    $$("input,select", m).forEach((i) => i.addEventListener("input", calc)); calc();
    $("#pf", m).onsubmit = async (e) => { e.preventDefault(); const btn = $("button:not([type])", m); btn.disabled = true;
      const row = { company_id: S.cid, name: $("#f_name", m).value.trim(), category: $("#f_cat", m).value.trim() || null, sku: $("#f_sku", m).value.trim() || nextSku(), variant: $("#f_var", m).value.trim() || null, color: $("#f_color", m).value.trim() || null, shipment_id: $("#f_ship", m).value || null, cost_cny: num($("#f_cny", m).value), cost_brl: $("#f_brl", m).value.trim() ? num($("#f_brl", m).value) : null, price: num($("#f_price", m).value), freight_brl: num($("#f_fr", m).value), correios_fee_brl: num($("#f_tc", m).value), min_stock: parseInt($("#f_min", m).value) || 0, link: $("#f_link", m).value.trim() || null, notes: $("#f_notes", m).value.trim() || null };
      try {
        if (isNew) { const np = await q(sb.from("ctl_products").insert(row).select().single()); const qty = parseInt($("#f_qty", m).value) || 0; if (qty) await q(sb.from("ctl_stock_moves").insert({ company_id: S.cid, product_id: np.id, type: "entrada", qty, unit_cost_cny: row.cost_cny, shipment_id: row.shipment_id, note: "Cadastro do produto" })); }
        else await q(sb.from("ctl_products").update(row).eq("id", p.id));
        closeModal(); toast(isNew ? "Produto cadastrado" : "Produto salvo"); await refresh();
      } catch (err) { btn.disabled = false; fail(err); } };
    if (!isNew) bindPhotos($("#f_photos", m), p);
    if (!isNew) { $("#pDel", m).onclick = () => confirmBox("Excluir produto?", `“${esc(p.name)}” e todo o histórico de estoque dele serão apagados. As vendas já feitas continuam registradas.`, "Excluir", async () => { await q(sb.from("ctl_products").delete().eq("id", p.id)); toast("Produto excluído"); await refresh(); }); $("#pMove", m).onclick = () => moveForm(p); }
  });
}
function nextSku() { const pre = (S.company.name.match(/\d+/)?.[0] || S.company.name.slice(0, 3).toUpperCase()); const nums = S.products.map((p) => parseInt(String(p.sku || "").split("-").pop())).filter((x) => !isNaN(x)); return `${pre}-${String((Math.max(0, ...nums) + 1)).padStart(3, "0")}`; }

/* ---- Fotos ---- */
function photoStrip(p) { const ph = p.photos || []; return ph.map((u, i) => `<button type="button" class="photo" data-ph="${i}"><img src="${esc(u)}" alt="" loading="lazy">${u === p.image_url || (!p.image_url && i === 0) ? '<span class="photo__cover">Capa</span>' : ""}</button>`).join("") + `<label class="photo photo--add"><input type="file" accept="image/*" multiple hidden data-up="${p.id}">${ico("plus")}<span>Foto</span></label>`; }
async function shrinkImage(file) { try { const bmp = await createImageBitmap(file); const sc = Math.min(1, 1400 / Math.max(bmp.width, bmp.height)); const c = document.createElement("canvas"); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); const b = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82)); return b || file; } catch { return file; } }
async function uploadPhotos(p, files) {
  const urls = [];
  for (const [i, f] of [...files].entries()) {
    const blob = await shrinkImage(f); const path = `${S.cid}/${p.id}/${Date.now()}-${i}.jpg`;
    const { error } = await sb.storage.from("ctl-fotos").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false }); if (error) throw error;
    urls.push(sb.storage.from("ctl-fotos").getPublicUrl(path).data.publicUrl);
  }
  const photos = [...(p.photos || []), ...urls]; const patch = { photos, image_url: p.image_url || photos[0] || null };
  await q(sb.from("ctl_products").update(patch).eq("id", p.id)); Object.assign(p, patch); return urls.length;
}
function bindPhotos(root, p, after) {
  if (!root) return;
  $$("[data-up]", root).forEach((inp) => (inp.onchange = async () => { if (!inp.files.length) return; const lab = inp.closest(".photo--add"); lab.classList.add("busy"); lab.querySelector("span").textContent = "Enviando…"; try { const nf = await uploadPhotos(p, inp.files); toast(nf === 1 ? "Foto adicionada" : `${nf} fotos adicionadas`); } catch (err) { fail(err); } if (after) after(); else { root.innerHTML = photoStrip(p); bindPhotos(root, p); } }));
  $$("[data-ph]", root).forEach((b) => (b.onclick = () => photoViewer(p, +b.dataset.ph, after)));
}
function photoViewer(p, i, after) {
  const url = p.photos[i];
  openModal(`<div class="modal__head"><div><h2>${esc(p.name)}</h2><p class="muted">Foto ${i + 1} de ${p.photos.length}${p.variant ? " · Tam. " + esc(p.variant) : ""}</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <img src="${esc(url)}" alt="" style="width:100%;border-radius:14px;display:block;max-height:65dvh;object-fit:contain;background:#000">
  <div class="modal__foot"><button class="btn btn--danger btn--sm spacer" id="phDel">${ico("trash")}Apagar foto</button>${url === p.image_url ? "" : `<button class="btn btn--ghost btn--sm" id="phCover">Usar como capa</button>`}<a class="btn btn--ghost btn--sm" href="${esc(url)}" target="_blank" rel="noopener">${ico("ext")}Abrir</a></div>`, (m) => {
    $("#phCover", m) && ($("#phCover", m).onclick = async () => { try { await q(sb.from("ctl_products").update({ image_url: url }).eq("id", p.id)); p.image_url = url; closeModal(); toast("Capa alterada"); after ? after() : route(); } catch (e) { fail(e); } });
    $("#phDel", m).onclick = async () => { const photos = p.photos.filter((_, j) => j !== i); const image_url = p.image_url === url ? photos[0] || null : p.image_url; try { await q(sb.from("ctl_products").update({ photos, image_url }).eq("id", p.id)); const key = url.split("/ctl-fotos/")[1]; if (key) sb.storage.from("ctl-fotos").remove([decodeURIComponent(key)]); Object.assign(p, { photos, image_url }); closeModal(); toast("Foto apagada"); after ? after() : route(); } catch (e) { fail(e); } };
  });
}

/* ---- Estoque ---- */
const MOVE_T = { entrada: ["Entrada", "ok"], saida: ["Saída", "bad"], venda: ["Venda", "orange"], ajuste: ["Ajuste", "info"], devolucao: ["Devolução", "ok"], cancelamento: ["Cancelamento", "info"] };
let mFilter = "", stTab = store.get("stTab", "saldo"), phFilter = "";
function pageStock() {
  const active = S.products.filter((p) => p.active);
  const units = active.reduce((a, p) => a + Math.max(0, C.stock(p.id)), 0);
  const inM = S.moves.filter((m) => m.qty > 0 && C.inPeriod(m.created_at, S.period) && m.type !== "cancelamento").reduce((a, m) => a + m.qty, 0);
  const outM = S.moves.filter((m) => m.qty < 0 && C.inPeriod(m.created_at, S.period)).reduce((a, m) => a - m.qty, 0);
  const list = S.moves.filter((m) => !mFilter || m.type === mFilter).slice(0, 300);
  const tabs = `<div class="seg tabs" id="stTabs">${[["saldo", "Saldo"], ["fotos", "Fotos"], ["hist", "Histórico"]].map(([k, l]) => `<button data-t="${k}" class="${stTab === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const head = ph("Controle", "Estoque", stTab === "fotos" ? "Adicione fotos de cada par. Pelo celular, dá para tirar a foto na hora." : "Tudo o que entrou e saiu, com quem fez e quando.", `${stTab === "hist" ? periodSeg() : ""}<button class="btn btn--orange btn--sm" id="newMove">${ico("plus")}Movimentar</button>`) + tabs;
  if (stTab === "fotos") {
    const withPh = active.filter((p) => (p.photos || []).length).length;
    const shown = active.filter((p) => !phFilter || (phFilter === "sem" ? !(p.photos || []).length : (p.photos || []).length));
    return head + `<div class="stack"><div class="split"><span class="muted">${withPh} de ${active.length} produtos com foto</span><div class="chips">${[["", "Todos"], ["sem", "Sem foto"], ["com", "Com foto"]].map(([k, l]) => `<button class="chip ${phFilter === k ? "on" : ""}" data-phf="${k}">${l}</button>`).join("")}</div></div>
    <div class="phgrid">${shown.map((p) => `<div class="phcard" data-phcard="${p.id}"><div class="phcard__head"><div><b>${esc(p.name)}</b><div class="cell-sub">${esc([ctag(p), p.sku].filter(Boolean).join(" · "))}</div></div>${stockBadge(p)}</div><div class="photos">${photoStrip(p)}</div></div>`).join("") || `<div class="panel"><div class="empty">Nada nesse filtro.</div></div>`}</div></div>`;
  }
  if (stTab === "hist") return head + `<div class="panel"><h2>Histórico <div class="chips">${[["", "Tudo"], ...Object.entries(MOVE_T).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button class="chip ${mFilter === k ? "on" : ""}" data-mf="${k}">${l}</button>`).join("")}</div></h2>
  ${list.length ? `<div class="rows">${list.map((m) => { const p = S.products.find((x) => x.id === m.product_id); const sh = S.shipments.find((s) => s.id === m.shipment_id); const t = MOVE_T[m.type] || [m.type, ""]; return `<div class="row"><div><b>${esc(p?.name || "Produto removido")}</b><div class="cell-sub">${fdt(m.created_at)} · ${esc(who(m.created_by))}${sh ? " · " + esc(sh.name) : ""}${m.note ? " · " + esc(m.note) : ""}</div></div><span class="badge badge--${t[1]}">${t[0]}</span><div class="r" style="min-width:48px"><b class="${m.qty < 0 ? "neg" : "pos"}">${m.qty > 0 ? "+" : ""}${m.qty}</b></div>${m.sale_id ? "" : `<button class="icon-btn" data-delmv="${m.id}" title="Apagar">${ico("trash")}</button>`}</div>`; }).join("")}</div>` : `<div class="empty">Nada por aqui.</div>`}</div>`;
  return head + `
  <div class="stack"><div class="kpis"><div class="kpi"><span>Peças em estoque</span><b>${units}</b><small>${active.length} produtos ativos</small></div><div class="kpi"><span>Entraram</span><b class="${inM ? "pos" : ""}">${inM ? "+" + inM : 0}</b><small>no período</small></div><div class="kpi"><span>Saíram</span><b class="${outM ? "neg" : ""}">${outM ? "−" + outM : 0}</b><small>vendas, saídas e ajustes</small></div><div class="kpi"><span>Zerados</span><b>${active.filter((p) => C.stock(p.id) <= 0).length}</b><small>produtos sem estoque</small></div></div>
  <div class="panel"><h2>Saldo por produto</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produto</th><th>Cor</th><th>Tamanho</th><th class="r">Entradas</th><th class="r">Vendas</th><th class="r">Outras saídas</th><th class="r">Saldo</th><th></th></tr></thead><tbody>
  ${active.map((p) => { const ms = S.moves.filter((m) => m.product_id === p.id); const e = ms.filter((m) => m.qty > 0 && m.type !== "cancelamento").reduce((a, m) => a + m.qty, 0); const v = -ms.filter((m) => m.type === "venda" || m.type === "cancelamento").reduce((a, m) => a + m.qty, 0); const o = -ms.filter((m) => m.qty < 0 && m.type !== "venda").reduce((a, m) => a + m.qty, 0); return `<tr><td><div class="hstack" style="flex-wrap:nowrap">${pimg(p) ? `<img class="thumb" src="${esc(pimg(p))}" alt="">` : `<span class="thumb thumb--empty">92</span>`}<div><div class="cell-title">${esc(p.name)}</div><div class="cell-sub">${esc(p.sku || "")}</div></div></div></td><td><input class="cell-in cell-in--text" data-attr="color" data-id="${p.id}" value="${esc(p.color || "")}" placeholder="Cor" aria-label="Cor de ${esc(p.name)}"></td><td><input class="cell-in cell-in--size" data-attr="variant" data-id="${p.id}" value="${esc(p.variant || "")}" placeholder="Tam." aria-label="Tamanho de ${esc(p.name)}"></td><td class="r">${e}</td><td class="r">${v}</td><td class="r">${o}</td><td class="r">${stockBadge(p)}</td><td class="r"><div class="hstack" style="flex-wrap:nowrap;justify-content:flex-end"><button class="btn btn--ghost btn--sm" data-mv="${p.id}">Movimentar</button><button class="btn btn--danger btn--sm" data-rm="${p.id}">${ico("trash")}Remover</button></div></td></tr>`; }).join("") || `<tr><td colspan="8"><div class="empty">Nenhum produto.</div></td></tr>`}
  </tbody></table></div></div></div>`;
}
function moveForm(p) {
  openModal(`<div class="modal__head"><div><h2>Movimentar estoque</h2><p class="muted">Entrada de mercadoria, saída (brinde, perda, uso) ou ajuste de contagem.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <form id="mf" class="stack"><label class="field"><span>Produto</span><select id="m_p" required>${S.products.map((x) => `<option value="${x.id}" ${p && p.id === x.id ? "selected" : ""}>${esc(x.name)}${ctag(x) ? " · " + esc(ctag(x)) : ""} (${C.stock(x.id)} un.)</option>`).join("")}</select></label>
  <div class="paybtns" id="m_t">${[["entrada", "Entrada"], ["saida", "Saída"], ["ajuste", "Ajustar saldo"]].map(([k, l], i) => `<button type="button" data-t="${k}" class="${i ? "" : "on"}">${l}</button>`).join("")}</div>
  <div class="grid2"><label class="field"><span id="m_ql">Quantidade</span><input id="m_q" type="number" required value="1"></label><label class="field" id="m_shw"><span>Lote de importação</span><select id="m_sh">${shipOptions(p?.shipment_id)}</select></label></div>
  <label class="field"><span>Motivo / observação</span><input id="m_n" placeholder="Ex.: chegou do Lote 02, brinde para cliente…"></label>
  <div class="modal__foot"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">Registrar</button></div></form>`, (m) => {
    let type = "entrada";
    $$("#m_t button", m).forEach((b) => (b.onclick = () => { type = b.dataset.t; $$("#m_t button", m).forEach((x) => x.classList.toggle("on", x === b)); $("#m_shw", m).hidden = type !== "entrada"; $("#m_ql", m).textContent = type === "ajuste" ? "Saldo correto (contagem)" : "Quantidade"; if (type === "ajuste") $("#m_q", m).value = C.stock($("#m_p", m).value); }));
    $("#mf", m).onsubmit = async (e) => { e.preventDefault(); const pid = $("#m_p", m).value, prod = S.products.find((x) => x.id === pid); let qty = parseInt($("#m_q", m).value) || 0;
      if (type === "saida") qty = -Math.abs(qty); if (type === "entrada") qty = Math.abs(qty); if (type === "ajuste") qty = qty - C.stock(pid);
      if (!qty) { toast("Nada para registrar: a quantidade não muda o saldo.", true); return; }
      try { await q(sb.from("ctl_stock_moves").insert({ company_id: S.cid, product_id: pid, type, qty, unit_cost_cny: type === "entrada" ? n(prod.cost_cny) : null, shipment_id: type === "entrada" ? $("#m_sh", m).value || null : null, note: $("#m_n", m).value.trim() || null })); closeModal(); toast("Estoque atualizado"); await refresh(); } catch (err) { fail(err); } };
  });
}

function removeProduct(p) {
  const st = C.stock(p.id), sold = S.sales.some((s) => s.status !== "cancelada" && (s.items || []).some((i) => i.product_id === p.id));
  openModal(`<div class="modal__head"><div><h2>Remover ${esc(p.name)}</h2><p class="muted">${esc([ctag(p), p.sku].filter(Boolean).join(" · "))} · ${st} em estoque</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <div class="stack">
    ${st > 0 ? `<button class="rm-opt" id="rmOut"><b>Tirar do estoque</b><span>Registra a saída de ${st > 1 ? `<input id="rmQty" type="number" min="1" max="${st}" value="${st}" class="cell-in cell-in--size" onclick="event.stopPropagation()">` : "1"} unidade(s). O produto continua cadastrado e aparece no Histórico.</span></button>` : ""}
    <button class="rm-opt rm-opt--danger" id="rmDel"><b>Apagar o produto de vez</b><span>Apaga o cadastro, as fotos e o histórico de estoque dele.${sold ? " As vendas já feitas continuam registradas." : ""} Não dá para desfazer.</span></button>
    <label class="field"><span>Motivo (opcional)</span><input id="rmWhy" placeholder="Ex.: vendido fora do sistema, defeito, troca…"></label>
  </div>
  <div class="modal__foot"><button class="btn btn--ghost" data-close>Cancelar</button></div>`, (m) => {
    $("#rmOut", m) && ($("#rmOut", m).onclick = async () => { const qty = Math.min(st, Math.max(1, parseInt($("#rmQty", m)?.value) || 1)); try { await q(sb.from("ctl_stock_moves").insert({ company_id: S.cid, product_id: p.id, type: "saida", qty: -qty, note: $("#rmWhy", m).value.trim() || "Removido do estoque" })); closeModal(); toast(`${qty} unidade(s) de ${p.name} tirada(s) do estoque`); await refresh(); } catch (e) { fail(e); } });
    $("#rmDel", m).onclick = () => { const why = $("#rmWhy", m).value.trim(); confirmBox("Apagar de vez?", `“${esc(p.name)}”${ctag(p) ? " (" + esc(ctag(p)) + ")" : ""} sai do sistema.${why ? " Motivo: " + esc(why) + "." : ""}`, "Apagar produto", async () => {
      await q(sb.from("ctl_products").delete().eq("id", p.id));
      const keys = (p.photos || []).map((u) => u.split("/ctl-fotos/")[1]).filter(Boolean).map(decodeURIComponent); if (keys.length) sb.storage.from("ctl-fotos").remove(keys);
      toast("Produto apagado"); await refresh(); }); };
  });
}

/* ---- Vender (PDV) ---- */
let posQ = "", posPay = store.get("pay", "Pix"), posCh = store.get("ch", "Instagram");
function saveCart() { store.set("cart:" + S.cid, S.cart); }
function pagePOS() {
  return ph("Ponto de venda", "Vender", "Toque nos produtos para adicionar ao carrinho.") + `
  <div class="pos-layout"><div><div class="toolbar"><input class="input" id="posQ" placeholder="Buscar produto" value="${esc(posQ)}"></div><div class="pos-grid" id="posGrid"></div></div>
  <div class="panel cart glass" id="cart"></div></div>
  <button class="cart-fab" id="cartFab" hidden></button>`;
}
function renderPOSGrid() {
  const qq = posQ.toLowerCase(); const el = $("#posGrid"); if (!el) return;
  const list = S.products.filter((p) => p.active && (!qq || `${p.name} ${p.sku} ${p.variant} ${p.color || ""}`.toLowerCase().includes(qq)));
  el.innerHTML = list.map((p) => { const st = C.stock(p.id) - (S.cart.find((c) => c.product_id === p.id)?.qty || 0); return `<button class="pos-item ${st <= 0 ? "out" : ""}" data-add="${p.id}"><b>${esc(p.name)}</b><span class="cell-sub">${esc([ctag(p), p.sku].filter(Boolean).join(" · "))}</span><span class="price">${brl(p.price)}</span><span class="cell-sub">${st} disponível${st === 1 ? "" : "is"}</span></button>`; }).join("") || `<div class="empty">Nenhum produto encontrado.</div>`;
  $$("[data-add]", el).forEach((b) => (b.onclick = () => { const p = S.products.find((x) => x.id === b.dataset.add); const c = S.cart.find((x) => x.product_id === p.id); const avail = C.stock(p.id) - (c?.qty || 0); if (avail <= 0) { toast(`Sem estoque de ${p.name}. Registre uma entrada antes de vender.`, true); return; } if (c) c.qty++; else S.cart.push({ product_id: p.id, name: p.name, qty: 1, price: n(p.price) }); saveCart(); renderPOSGrid(); renderCart(); }));
}
let posDisc = "", posShip = "", posCust = "", posPhone = "", posStatus = "paga";
function renderCart() {
  const el = $("#cart"); if (!el) return;
  const sub = S.cart.reduce((a, c) => a + c.qty * c.price, 0), disc = num(posDisc), ship = num(posShip), total = Math.max(0, sub - disc + ship);
  const cost = S.cart.reduce((a, c) => a + C.itemCost(c), 0);
  const fab = $("#cartFab"); if (fab) { fab.hidden = !S.cart.length; fab.innerHTML = `<span>${S.cart.reduce((a, c) => a + c.qty, 0)} item(s) no carrinho</span><span>${brl(total)} ↓</span>`; fab.onclick = () => el.scrollIntoView({ behavior: "smooth" }); }
  el.innerHTML = `<h2>Carrinho ${S.cart.length ? `<button class="link" id="clr" style="font-size:13px">Limpar</button>` : ""}</h2>
  ${S.cart.length ? `<div>${S.cart.map((c, i) => `<div class="cart-line"><div><b>${esc(c.name)}</b></div><div class="r"><b class="num">${brl(c.qty * c.price)}</b></div><div class="qty"><button data-dec="${i}" aria-label="Menos">−</button><span>${c.qty}</span><button data-inc="${i}" aria-label="Mais">+</button></div><input class="input" style="height:32px;width:110px;justify-self:end;text-align:right" data-price="${i}" inputmode="decimal" value="${String(c.price).replace(".", ",")}" aria-label="Preço unitário"></div>`).join("")}</div>` : `<div class="empty"><b>Carrinho vazio</b><span>Toque em um produto ao lado.</span></div>`}
  <div class="stack" style="gap:10px;margin-top:10px">
    <div class="grid2"><label class="field"><span>Desconto (R$)</span><input id="c_disc" inputmode="decimal" value="${esc(posDisc)}" placeholder="0,00"></label><label class="field"><span>Frete cobrado (R$)</span><input id="c_ship" inputmode="decimal" value="${esc(posShip)}" placeholder="0,00"></label></div>
    <div class="grid2"><label class="field"><span>Cliente</span><input id="c_cust" value="${esc(posCust)}" placeholder="Nome"></label><label class="field"><span>WhatsApp</span><input id="c_phone" inputmode="tel" value="${esc(posPhone)}" placeholder="(21) 9…"></label></div>
    <div class="field"><span>Pagamento</span><div class="paybtns" id="payB">${PAY.map((p) => `<button type="button" class="${posPay === p ? "on" : ""}">${p}</button>`).join("")}</div></div>
    <div class="grid2"><label class="field"><span>Canal</span><select id="c_ch">${CHANNELS.map((c) => `<option ${posCh === c ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="field"><span>Situação</span><select id="c_st"><option value="paga" ${posStatus === "paga" ? "selected" : ""}>Paga</option><option value="pendente" ${posStatus === "pendente" ? "selected" : ""}>A receber</option></select></label></div>
  </div>
  <div class="sum"><div><span class="muted">Subtotal</span><span>${brl(sub)}</span></div>${disc ? `<div><span class="muted">Desconto</span><span class="neg">−${brl(disc)}</span></div>` : ""}${ship ? `<div><span class="muted">Frete</span><span>${brl(ship)}</span></div>` : ""}<div class="total"><span>Total</span><span>${brl(total)}</span></div><div><span class="muted">Lucro desta venda</span><span class="${sub - disc - cost < 0 ? "neg" : "pos"}">${brl(sub - disc - cost)}</span></div></div>
  <button class="btn btn--orange btn--block" id="finish" style="margin-top:14px;height:50px" ${S.cart.length ? "" : "disabled"}>Finalizar venda · ${brl(total)}</button>`;
  $$("[data-inc]", el).forEach((b) => (b.onclick = () => { const c = S.cart[b.dataset.inc]; if (C.stock(c.product_id) - c.qty <= 0) { toast("Não tem mais unidades em estoque.", true); return; } c.qty++; saveCart(); renderCart(); renderPOSGrid(); }));
  $$("[data-dec]", el).forEach((b) => (b.onclick = () => { const c = S.cart[b.dataset.dec]; c.qty--; if (c.qty <= 0) S.cart.splice(b.dataset.dec, 1); saveCart(); renderCart(); renderPOSGrid(); }));
  $$("[data-price]", el).forEach((i) => (i.onchange = () => { S.cart[i.dataset.price].price = num(i.value); saveCart(); renderCart(); }));
  const keep = (id, set) => { const i = $(id, el); i.onchange = () => { set(i.value); renderCart(); }; };
  keep("#c_disc", (v) => (posDisc = v)); keep("#c_ship", (v) => (posShip = v));
  $("#c_cust", el).oninput = (e) => (posCust = e.target.value); $("#c_phone", el).oninput = (e) => (posPhone = e.target.value);
  $("#c_ch", el).onchange = (e) => { posCh = e.target.value; store.set("ch", posCh); }; $("#c_st", el).onchange = (e) => (posStatus = e.target.value);
  $$("#payB button", el).forEach((b) => (b.onclick = () => { posPay = b.textContent; store.set("pay", posPay); $$("#payB button", el).forEach((x) => x.classList.toggle("on", x === b)); }));
  $("#clr", el) && ($("#clr", el).onclick = () => { S.cart = []; saveCart(); renderCart(); renderPOSGrid(); });
  $("#finish", el).onclick = async () => {
    const btn = $("#finish", el); btn.disabled = true; btn.textContent = "Registrando…";
    const items = S.cart.map((c) => { const p = S.products.find((x) => x.id === c.product_id); return { product_id: c.product_id, name: c.name, sku: p?.sku || null, qty: c.qty, price: c.price, unit_cost: +C.landed(p).toFixed(2) }; });
    try {
      const id = await q(sb.rpc("ctl_create_sale", { p_company: S.cid, p_sale: { items, subtotal: sub, discount: disc, shipping_charged: ship, total, payment_method: posPay, channel: posCh, status: posStatus, customer_name: posCust || null, customer_phone: posPhone || null } }));
      S.cart = []; saveCart(); posDisc = posShip = posCust = posPhone = ""; posStatus = "paga";
      await loadCompany(); route(); const sale = S.sales.find((s) => s.id === id); toast("Venda registrada"); if (sale) saleDetail(sale);
    } catch (err) { btn.disabled = false; btn.textContent = `Finalizar venda · ${brl(total)}`; fail(err); }
  };
}

/* ---- Vendas ---- */
let sQ = "";
function pageSales() {
  const list = S.sales.filter((s) => C.inPeriod(s.sold_at, S.period) && (!sQ || `${s.number} ${s.customer_name} ${(s.items || []).map((i) => i.name).join(" ")}`.toLowerCase().includes(sQ.toLowerCase())));
  const ok = list.filter((s) => s.status !== "cancelada");
  const rev = ok.reduce((a, s) => a + n(s.total), 0), pr = ok.reduce((a, s) => a + C.saleProfit(s), 0), pend = ok.filter((s) => s.status === "pendente").reduce((a, s) => a + n(s.total), 0);
  return ph("Histórico", "Vendas", "Lucro recalculado com o custo final atualizado de cada produto.", `${periodSeg()}<button class="btn btn--ghost btn--sm" id="expSales">${ico("download")}Excel</button><a class="btn btn--orange btn--sm" href="#vender">${ico("plus")}Nova venda</a>`) + `
  <div class="stack"><div class="kpis"><div class="kpi kpi--hero"><span>Faturado</span><b>${brl(rev)}</b><small>${ok.length} vendas</small></div><div class="kpi"><span>Lucro</span><b>${brl(pr)}</b><small>margem ${pct(rev ? pr / rev : NaN)}</small></div><div class="kpi"><span>A receber</span><b>${brl(pend)}</b><small>vendas pendentes</small></div><div class="kpi"><span>Peças vendidas</span><b>${ok.reduce((a, s) => a + (s.items || []).reduce((b, i) => b + n(i.qty), 0), 0)}</b><small>no período</small></div></div>
  <div class="panel"><div class="toolbar"><input class="input" id="sQ" placeholder="Buscar por cliente, número ou produto" value="${esc(sQ)}"></div>
  ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th class="r">Total</th><th class="r">Lucro</th><th></th></tr></thead><tbody>${list.map((s) => `<tr class="click" data-sid="${s.id}"><td><b>#${s.number}</b></td><td>${fdt(s.sold_at)}</td><td>${esc(s.customer_name || "—")}<div class="cell-sub">${esc(s.channel || "")}</div></td><td>${(s.items || []).map((i) => `${i.qty}× ${esc(i.name)}`).join("<br>")}</td><td>${esc(s.payment_method || "")}</td><td class="r"><b>${brl(s.total)}</b></td><td class="r ${C.saleProfit(s) < 0 ? "neg" : "pos"}">${s.status === "cancelada" ? "—" : brl(C.saleProfit(s))}</td><td><span class="badge badge--${{ paga: "ok", pendente: "warn", cancelada: "bad" }[s.status]}">${{ paga: "Paga", pendente: "A receber", cancelada: "Cancelada" }[s.status]}</span></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><b>Nenhuma venda no período</b><a class="btn btn--orange btn--sm" href="#vender">Fazer uma venda</a></div>`}</div></div>`;
}
function saleText(s) { return `*92 FACTORY* — Pedido #${s.number}\n${fdt(s.sold_at)}\n\n${(s.items || []).map((i) => `${i.qty}x ${i.name} — ${brl(i.qty * i.price)}`).join("\n")}\n${n(s.discount) ? `\nDesconto: −${brl(s.discount)}` : ""}${n(s.shipping_charged) ? `\nFrete: ${brl(s.shipping_charged)}` : ""}\n*Total: ${brl(s.total)}*\nPagamento: ${s.payment_method || "—"}\n\nObrigado pela compra! Se é fácil, não é 92.`; }
function saleDetail(s) {
  const cost = C.saleCost(s);
  openModal(`<div class="modal__head"><div><div class="eyebrow">Venda #${s.number}</div><h2>${brl(s.total)}</h2><p class="muted">${fdt(s.sold_at)} · ${esc(who(s.seller_email))}</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <div class="rows">${(s.items || []).map((i) => `<div class="row"><div><b>${i.qty}× ${esc(i.name)}</b><div class="cell-sub">${brl(i.price)} cada</div></div><div class="r">${brl(i.qty * i.price)}</div></div>`).join("")}</div>
  <div class="divider"></div><div class="kv"><span>Cliente</span><b>${esc(s.customer_name || "—")} ${s.customer_phone ? "· " + esc(s.customer_phone) : ""}</b><span>Canal / pagamento</span><b>${esc(s.channel || "—")} · ${esc(s.payment_method || "—")}</b><span>Desconto</span><b>${brl(s.discount)}</b><span>Frete cobrado</span><b>${brl(s.shipping_charged)}</b><span>Custo dos produtos</span><b>${brl(cost)}</b><span>Lucro</span><b class="${C.saleProfit(s) < 0 ? "neg" : "pos"}">${brl(C.saleProfit(s))}</b></div>
  <div class="modal__foot">${s.status !== "cancelada" ? `<button class="btn btn--danger btn--sm spacer" id="sCancel">Cancelar venda</button>` : ""}${s.status === "pendente" ? `<button class="btn btn--ghost btn--sm" id="sPaid">Marcar como paga</button>` : ""}<button class="btn btn--ghost btn--sm" id="sCopy">${ico("copy")}Copiar comprovante</button>${s.customer_phone ? `<a class="btn btn--orange btn--sm" target="_blank" rel="noopener" href="https://wa.me/55${String(s.customer_phone).replace(/\D/g, "").replace(/^55/, "")}?text=${encodeURIComponent(saleText(s))}">Enviar no WhatsApp</a>` : ""}</div>`, (m) => {
    $("#sCopy", m).onclick = async () => { try { await navigator.clipboard.writeText(saleText(s)); toast("Comprovante copiado"); } catch { toast("Não deu para copiar automaticamente.", true); } };
    $("#sPaid", m) && ($("#sPaid", m).onclick = async () => { try { await q(sb.from("ctl_sales").update({ status: "paga" }).eq("id", s.id)); closeModal(); toast("Venda marcada como paga"); await refresh(); } catch (e) { fail(e); } });
    $("#sCancel", m) && ($("#sCancel", m).onclick = () => confirmBox(`Cancelar a venda #${s.number}?`, "Os produtos voltam para o estoque e a venda sai do faturamento.", "Cancelar venda", async () => { await q(sb.rpc("ctl_cancel_sale", { p_sale: s.id })); toast("Venda cancelada e estoque devolvido"); await refresh(); }));
  });
}

/* ---- Importações / Pacotes ---- */
function trackBar(st) { const step = sStep(st); const alert = ["aguardando_taxa", "fiscalizacao", "problema"].includes(st); return `<div class="track">${SHIP_STEPS.map((_, i) => `<i class="${i < step || st === "entregue" ? "on" : i === step && alert ? "alert" : i === step ? "on" : ""}"></i>`).join("")}</div><div class="track-labels">${SHIP_STEPS.map((l) => `<span>${l}</span>`).join("")}</div>`; }
function pageShipments() {
  const open = S.shipments.filter((s) => s.status !== "entregue");
  const allExtras = S.shipments.reduce((a, s) => a + C.shipExtras(s), 0);
  const taxes = S.shipments.reduce((a, s) => a + C.shipCorreios(s), 0), frTot = S.shipments.reduce((a, s) => a + n(s.freight_brl), 0);
  return ph("Logística", "Importações e pacotes", "Cada lote com frete, impostos e rastreio. O custo extra é dividido entre os produtos do lote.", `<button class="btn btn--ghost btn--sm" id="trackAll">${ico("refresh")}Atualizar rastreios</button><button class="btn btn--orange btn--sm" id="newShip">${ico("plus")}Novo pacote</button>`) + `
  <div class="stack"><div class="kpis"><div class="kpi"><span>Pacotes a caminho</span><b>${open.length}</b><small>${S.shipments.length} no total</small></div><div class="kpi"><span>Taxas pendentes</span><b class="${S.shipments.some((s) => s.tax_generated && !s.tax_paid) ? "neg" : ""}">${S.shipments.filter((s) => s.tax_generated && !s.tax_paid).length}</b><small>geradas e não pagas</small></div><div class="kpi"><span>Frete internacional</span><b>${brl(frTot)}</b><small>todas as importações</small></div><div class="kpi"><span>Taxa dos Correios</span><b>${brl(taxes)}</b><small>total com frete: ${brl(allExtras)}</small></div></div>
  ${S.correios && !S.correios.configured ? `<div class="note note--muted">O rastreio automático pela API oficial dos Correios precisa das credenciais do contrato. <a class="link" href="#ajustes">Configurar em Ajustes</a>. Enquanto isso, use os botões “Correios” e “17TRACK” de cada pacote.</div>` : ""}
  <div class="ship-list">${S.shipments.map((s) => { const k = C.shipInfo(s); return `<button class="ship" data-ship="${s.id}"><div class="ship__top"><div><div class="ship__name">${esc(s.name)}</div><div class="ship__code">${esc(s.tracking_code || "Sem código de rastreio")} ${s.platform ? "· " + esc(s.platform) : ""}</div></div><div class="hstack">${s.tax_generated && !s.tax_paid ? '<span class="badge badge--warn">Taxa gerada</span>' : ""}${s.tax_paid ? '<span class="badge badge--ok">Taxa paga</span>' : ""}<span class="badge badge--${sBadge(s.status)}">${sLabel(s.status)}</span></div></div>
    ${trackBar(s.status)}
    <div class="ship__facts"><span><b>${k.units}</b> peças</span><span>Produtos <b>${cny(k.cnyTot)}</b> · ${brl(k.base)}</span><span>Frete <b>${brl(k.freight)}</b></span><span>Taxa Correios <b>${brl(k.correios)}</b></span><span>Custo total <b>${brl(k.total)}</b></span>${s.last_status ? `<span>Último: <b>${esc(s.last_status)}</b>${s.last_location ? " · " + esc(s.last_location) : ""}</span>` : ""}</div></button>`; }).join("") || `<div class="panel"><div class="empty"><b>Nenhum pacote</b><span>Cadastre o primeiro lote para controlar frete, taxas e rastreio.</span></div></div>`}</div></div>`;
}
async function trackShipment(s, quiet) {
  if (!s.tracking_code) { if (!quiet) toast("Adicione o código de rastreio primeiro.", true); return false; }
  const { data, error } = await sb.functions.invoke("ctl-rastreio", { body: { shipment_id: s.id } });
  if (error) { if (!quiet) fail(error); return false; }
  if (!data.ok) { if (data.configured === false) S.correios = { configured: false }; if (!quiet) toast(data.error, true); return false; }
  return true;
}
function shipmentForm(s) {
  const isNew = !s; s = s || { name: `Lote ${String(S.shipments.length + 1).padStart(2, "0")}`, platform: "Kakobuy", status: "comprado", cny_rate: S.company.cny_rate, ordered_at: today() };
  const k = isNew ? null : C.shipInfo(s);
  const items = isNew ? [] : S.moves.filter((m) => m.shipment_id === s.id && m.type === "entrada");
  const fv = (v) => (v == null || v === "" ? "" : String(v).replace(".", ","));
  openModal(`<div class="modal__head"><div><div class="eyebrow">${isNew ? "Novo pacote" : esc(s.platform || "Pacote")}</div><h2>${isNew ? "Cadastrar pacote" : esc(s.name)}</h2>${isNew ? "" : `<p class="muted">${k.units} peças · custo total ${brl(k.total)} · frete ${brl(k.freight)} · taxa dos Correios ${brl(k.correios)} · divididos igualmente: ${brl(k.units ? k.extras / k.units : 0)} por peça</p>`}</div><button class="icon-btn" data-close>${ico("x")}</button></div>
  ${isNew ? "" : `<div class="hstack" style="margin-bottom:16px">${s.tracking_code ? `<button class="btn btn--orange btn--sm" id="trk">${ico("refresh")}Atualizar rastreio</button><a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="https://rastreamento.correios.com.br/app/index.php">${ico("ext")}Correios</a><a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="https://t.17track.net/pt#nums=${encodeURIComponent(s.tracking_code)}">${ico("ext")}17TRACK</a><button class="btn btn--ghost btn--sm" id="cpy">${ico("copy")}Copiar código</button>` : ""}<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="https://www.correios.com.br/receber/encomenda/minhas-importacoes">${ico("ext")}Minhas Importações</a></div>`}
  <form id="sf" class="stack">
    <div class="grid2"><label class="field"><span>Nome do pacote</span><input id="s_name" required value="${esc(s.name)}"></label><label class="field"><span>Plataforma / agente</span><input id="s_plat" value="${esc(s.platform || "")}" placeholder="Kakobuy, CSSBuy…"></label>
    <label class="field"><span>Código de rastreio</span><input id="s_code" value="${esc(s.tracking_code || "")}" placeholder="Ex.: NX123456789BR" style="text-transform:uppercase"></label>
    <label class="field"><span>Situação</span><select id="s_st">${SHIP_STATUS.map(([k2, l]) => `<option value="${k2}" ${s.status === k2 ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="eyebrow" style="margin-top:4px">Custos de importação</div>
    <div class="grid3"><label class="field"><span>Cotação ¥1 = R$</span><input id="s_rate" inputmode="decimal" value="${fv(s.cny_rate)}"></label><label class="field"><span>Frete internacional (R$)</span><input id="s_fr" inputmode="decimal" value="${fv(s.freight_brl)}" placeholder="0,00"></label><label class="field"><span>Taxa dos Correios (R$)</span><input id="s_tc" inputmode="decimal" value="${fv(n(s.correios_fee_brl) + n(s.import_tax_brl) + n(s.icms_brl) || "")}" placeholder="0,00">${(() => { const lx = S.expenses.filter((e) => e.kind === "correios" && e.shipment_id === s.id).reduce((a, e) => a + n(e.amount), 0); return lx ? `<small>+ ${brl(lx)} lançados em Financeiro › Taxa dos Correios</small>` : `<small>Imposto + ICMS + despacho postal</small>`; })()}</label><label class="field"><span>Outras taxas (R$)</span><input id="s_oth" inputmode="decimal" value="${fv(s.other_fees_brl)}" placeholder="despacho, seguro…"></label><label class="field"><span>Peso (kg)</span><input id="s_kg" inputmode="decimal" value="${fv(s.weight_kg)}"></label></div>
    <div class="hstack"><label class="hstack"><input type="checkbox" id="s_tg" ${s.tax_generated ? "checked" : ""}> Taxa gerada</label><label class="hstack" style="margin-left:14px"><input type="checkbox" id="s_tp" ${s.tax_paid ? "checked" : ""}> Taxa paga</label></div>
    <div class="grid3"><label class="field"><span>Data da compra</span><input type="date" id="s_od" value="${s.ordered_at || ""}"></label><label class="field"><span>Data do envio</span><input type="date" id="s_sd" value="${s.shipped_at || ""}"></label><label class="field"><span>Data da entrega</span><input type="date" id="s_dd" value="${s.delivered_at || ""}"></label></div>
    <label class="field"><span>Observações</span><textarea id="s_notes">${esc(s.notes || "")}</textarea></label>
    ${isNew ? "" : `<div class="panel" style="padding:14px"><h2 style="margin-bottom:8px">Rateio do custo por produto</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produto</th><th class="r">Qtd</th><th class="r">Custo ¥</th><th class="r">Produto R$</th><th class="r">Frete/un</th><th class="r">Taxa Correios/un</th><th class="r">Custo final/un</th></tr></thead><tbody>${items.map((m) => { const p = S.products.find((x) => x.id === m.product_id); if (!p) return ""; const pp = C.parts(p); return `<tr><td>${esc(p.name)}${p.variant ? ` <span class="muted">${esc(p.variant)}</span>` : ""}</td><td class="r">${m.qty}</td><td class="r">${cny(p.cost_cny)}</td><td class="r">${brl(pp.prod)}</td><td class="r">${brl(pp.frete)}</td><td class="r">${brl(pp.correios)}</td><td class="r"><b>${brl(pp.total)}</b></td></tr>`; }).join("") || `<tr><td colspan="7" class="muted">Nenhum produto neste pacote ainda. Ao cadastrar produtos, escolha este lote.</td></tr>`}</tbody></table></div></div>
    <div class="panel" style="padding:14px"><h2 style="margin-bottom:12px">Rastreamento ${s.last_checked_at ? `<span class="muted" style="font-size:12px;font-weight:500">atualizado ${fdt(s.last_checked_at)}</span>` : ""}</h2>${(s.events || []).length ? `<div class="timeline">${s.events.map((e) => `<div class="tl"><i></i><div><b>${esc(e.description)}</b><span>${fdt(e.at)}${e.place ? " · " + esc(e.place) : ""}${e.to ? " → " + esc(e.to) : ""}</span>${e.detail ? `<div class="cell-sub">${esc(e.detail)}</div>` : ""}</div></div>`).join("")}</div>` : `<div class="muted" style="font-size:13px">${s.tracking_code ? "Toque em “Atualizar rastreio” para buscar os eventos nos Correios." : "Adicione o código de rastreio quando o agente enviar o pacote."}</div>`}</div>`}
    <div class="modal__foot">${isNew ? "" : `<button type="button" class="btn btn--danger btn--sm spacer" id="sDel">${ico("trash")}Excluir</button>`}<button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">${isNew ? "Cadastrar" : "Salvar"}</button></div>
  </form>`, (m) => {
    $("#sf", m).onsubmit = async (e) => { e.preventDefault();
      const row = { company_id: S.cid, name: $("#s_name", m).value.trim(), platform: $("#s_plat", m).value.trim() || null, tracking_code: $("#s_code", m).value.trim().toUpperCase() || null, status: $("#s_st", m).value, cny_rate: num($("#s_rate", m).value) || null, freight_brl: num($("#s_fr", m).value), correios_fee_brl: num($("#s_tc", m).value), import_tax_brl: 0, icms_brl: 0, other_fees_brl: num($("#s_oth", m).value), weight_kg: $("#s_kg", m).value ? num($("#s_kg", m).value) : null, tax_generated: $("#s_tg", m).checked, tax_paid: $("#s_tp", m).checked, ordered_at: $("#s_od", m).value || null, shipped_at: $("#s_sd", m).value || null, delivered_at: $("#s_dd", m).value || null, notes: $("#s_notes", m).value.trim() || null };
      try { if (isNew) await q(sb.from("ctl_shipments").insert(row)); else await q(sb.from("ctl_shipments").update(row).eq("id", s.id)); closeModal(); toast(isNew ? "Pacote cadastrado" : "Pacote salvo · custos dos produtos atualizados"); await refresh(); } catch (err) { fail(err); } };
    if (!isNew) {
      $("#sDel", m).onclick = () => confirmBox("Excluir pacote?", `Os produtos de “${esc(s.name)}” continuam no estoque, mas perdem o rateio de frete e taxas.`, "Excluir", async () => { await q(sb.from("ctl_shipments").delete().eq("id", s.id)); toast("Pacote excluído"); await refresh(); });
      $("#trk", m) && ($("#trk", m).onclick = async () => { const b = $("#trk", m); b.disabled = true; b.innerHTML = `${ico("refresh")}Consultando…`; const ok = await trackShipment(s); if (ok) { closeModal(); await refresh(); toast("Rastreio atualizado"); shipmentForm(S.shipments.find((x) => x.id === s.id)); } else { b.disabled = false; b.innerHTML = `${ico("refresh")}Atualizar rastreio`; } });
      $("#cpy", m) && ($("#cpy", m).onclick = async () => { try { await navigator.clipboard.writeText(s.tracking_code); toast("Código copiado"); } catch { toast(s.tracking_code); } });
    }
  }, true);
}

/* ---- Financeiro ---- */
let finTab = store.get("finTab", "resumo"), lojaF = "";
function finTabs() { return `<div class="seg tabs" id="finTabs">${[["resumo", "Resumo"], ["loja", "Compras da loja"], ["fixos", "Custos fixos"], ["correios", "Taxa dos Correios"]].map(([k, l]) => `<button data-t="${k}" class="${finTab === k ? "on" : ""}">${l}</button>`).join("")}</div>`; }
function pageFinance() {
  if (finTab === "loja") return pageLoja();
  if (finTab === "fixos") return pageFixed();
  if (finTab === "correios") return pageCorreios();
  const P = S.period;
  const sales = S.sales.filter((s) => s.status === "paga" && C.inPeriod(s.sold_at, P));
  const rev = sales.reduce((a, s) => a + n(s.total), 0), shipIn = sales.reduce((a, s) => a + n(s.shipping_charged), 0);
  const sold = { prod: 0, frete: 0, correios: 0, outras: 0 };
  sales.forEach((s) => (s.items || []).forEach((it) => { const p = S.products.find((x) => x.id === it.product_id); const k = p ? C.parts(p) : { prod: n(it.unit_cost), frete: 0, correios: 0, outras: 0 }; for (const f in sold) sold[f] += k[f] * n(it.qty); }));
  const cogs = sold.prod + sold.frete + sold.correios + sold.outras;
  const exps = S.expenses.filter((e) => C.inPeriod(e.spent_at, P));
  const loja = C.opExp(P).filter((e) => e.kind === "loja").reduce((a, e) => a + n(e.amount), 0);
  const other = C.opExp(P).filter((e) => e.kind !== "loja").reduce((a, e) => a + n(e.amount), 0);
  const fixed = C.fixedTotal(P), withdraw = exps.filter((e) => e.category === "Retirada sócio"), wTot = withdraw.reduce((a, e) => a + n(e.amount), 0);
  const gross = rev - shipIn - cogs, net = gross - loja - fixed - other;
  // investimento total (compras no período)
  const inv = { prod: 0, frete: 0, correios: 0 }; S.moves.filter((m) => m.type === "entrada" && C.inPeriod(m.created_at, P)).forEach((m) => { const p = S.products.find((x) => x.id === m.product_id); if (!p) return; const k = C.parts(p); inv.prod += k.prod * m.qty; inv.frete += k.frete * m.qty; inv.correios += (k.correios + k.outras) * m.qty; });
  const invTot = inv.prod + inv.frete + inv.correios + loja + fixed + other;
  const owners = S.members.filter((m) => m.role !== "equipe" && !m.email.endsWith("@92factory.local")); const split = S.company.settings?.split || {};
  const byPay = {}; sales.forEach((s) => (byPay[s.payment_method || "Outro"] = (byPay[s.payment_method || "Outro"] || 0) + n(s.total)));
  const others = exps.filter((e) => e.kind !== "loja" && e.kind !== "correios");
  return ph("Dinheiro", "Financeiro", "Resultado do período, custos e divisão entre sócios.", `${periodSeg()}<button class="btn btn--orange btn--sm" id="newExp">${ico("plus")}Lançar despesa</button>`) + finTabs() + `
  <div class="stack"><div class="kpis"><div class="kpi kpi--hero"><span>Lucro líquido</span><b>${brl(net)}</b><small>margem ${pct(rev ? net / rev : NaN)}</small></div><div class="kpi"><span>Receita</span><b>${brl(rev)}</b><small>${sales.length} vendas pagas</small></div><div class="kpi"><span>Custos totais</span><b>${brl(invTot)}</b><small>produtos, frete, Correios, loja e fixos</small></div><div class="kpi"><span>Taxa dos Correios</span><b>${brl(inv.correios)}</b><small>já somada nos custos</small></div></div>
  <div class="cols"><div class="stack"><div class="panel"><h2>Custos totais do período</h2><div class="kv">
    <span>Produtos (¥ convertido)</span><b>${brl(inv.prod)}</b><span>Frete</span><b>${brl(inv.frete)}</b><span>Taxa dos Correios</span><b>${brl(inv.correios)}</b><span>Compras da loja</span><b>${brl(loja)}</b><span>Custos fixos (aluguel, condomínio…)</span><b>${brl(fixed)}</b><span>Outras despesas</span><b>${brl(other)}</b>
    <span><b style="text-align:left;color:var(--orange)">Total</b></span><b style="color:var(--orange)">${brl(invTot)}</b></div>${S.fixed.some((f) => f.active && f.amount == null) ? `<p class="muted" style="font-size:12px;margin:10px 0 0">Ainda sem valor: ${S.fixed.filter((f) => f.active && f.amount == null).map((f) => esc(f.name)).join(", ")}. <button class="link" data-goto="fixos">Preencher</button></p>` : ""}</div>
    <div class="panel"><h2>Demonstrativo de vendas</h2><div class="kv">
    <span>Receita bruta das vendas</span><b>${brl(rev)}</b><span>(−) Frete repassado ao cliente</span><b>${brl(-shipIn)}</b><span>(−) Produto</span><b>${brl(-sold.prod)}</b><span>(−) Frete</span><b>${brl(-sold.frete)}</b><span>(−) Taxa dos Correios</span><b>${brl(-(sold.correios + sold.outras))}</b>
    <span><b style="text-align:left">Lucro bruto</b></span><b>${brl(gross)}</b><span>(−) Compras da loja</span><b>${brl(-loja)}</b><span>(−) Custos fixos</span><b>${brl(-fixed)}</b><span>(−) Outras despesas</span><b>${brl(-other)}</b><span><b style="text-align:left;color:var(--orange)">Lucro líquido</b></span><b style="color:var(--orange)">${brl(net)}</b><span>Retiradas dos sócios</span><b>${brl(wTot)}</b></div></div></div>
  <div class="stack"><div class="panel"><h2>Divisão entre sócios</h2>${owners.length ? `<div class="rows">${owners.map((o) => { const sh = split[o.email] ?? 100 / owners.length; const w = withdraw.filter((e) => (e.paid_by || "").toLowerCase() === o.email.toLowerCase()).reduce((a, e) => a + n(e.amount), 0); return `<div class="row"><div><b>${esc(o.display_name || o.email.split("@")[0])}</b><div class="cell-sub">${sh.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% · já retirou ${brl(w)}</div></div><div class="r"><b>${brl(net * sh / 100)}</b><div class="cell-sub">saldo ${brl(net * sh / 100 - w)}</div></div></div>`; }).join("")}</div><p class="muted" style="font-size:12px;margin:10px 0 0">Percentuais em Ajustes › Pessoas. Retiradas: lance uma despesa “Retirada sócio”.</p>` : `<div class="empty">Sem sócios cadastrados.</div>`}</div>
    <div class="panel"><h2>Recebido por forma de pagamento</h2>${Object.keys(byPay).length ? `<div class="rows">${Object.entries(byPay).sort((a, b) => b[1] - a[1]).map(([k2, v]) => `<div class="row"><div><b>${esc(k2)}</b><div class="bar" style="margin-top:6px"><i style="width:${(v / rev) * 100}%"></i></div></div><div class="r">${brl(v)}</div></div>`).join("")}</div>` : `<div class="empty">Nenhum recebimento.</div>`}</div>
    <div class="panel"><h2>Outras despesas</h2>${others.length ? `<div class="rows">${others.map((e) => `<div class="row click" data-exp="${e.id}"><div><b>${esc(e.description || e.category)}</b><div class="cell-sub">${fdate(e.spent_at)} · ${esc(e.category)}${e.paid_by ? " · " + esc(who(e.paid_by)) : ""}</div></div><div class="r"><b>${brl(e.amount)}</b></div></div>`).join("")}</div>` : `<div class="empty"><span>Embalagens, frete para cliente, anúncios…</span></div>`}</div></div></div></div>`;
}
function pageLoja() {
  const all = S.expenses.filter((e) => e.kind === "loja");
  const spent = all.filter(C.spent), planned = all.filter((e) => PLANNED.includes(e.status));
  const tot = spent.reduce((a, e) => a + n(e.amount), 0), prev = planned.reduce((a, e) => a + n(e.amount), 0);
  const list = all.filter((e) => !lojaF || (lojaF === "falta" ? PLANNED.includes(e.status) : e.status === lojaF));
  const areas = [...new Set(list.map((e) => e.area || "Sem ambiente"))];
  return ph("Dinheiro", "Compras da loja", "Tudo o que foi comprado para montar a loja. Entra como gasto no Financeiro.", `<button class="btn btn--ghost btn--sm" id="lojaImp">${ico("upload")}Importar planilha</button><button class="btn btn--orange btn--sm" id="lojaNew">${ico("plus")}Novo item</button>`) + finTabs() + `
  <div class="stack"><div class="kpis"><div class="kpi kpi--hero"><span>Total gasto</span><b>${brl(tot)}</b><small>itens já pagos</small></div><div class="kpi"><span>Itens comprados</span><b>${spent.length}</b><small>${all.filter((e) => e.status === "A caminho").length} a caminho</small></div><div class="kpi"><span>Itens que faltam</span><b>${planned.length}</b><small>comprar ou fazer</small></div><div class="kpi"><span>Previsto pro que falta</span><b>${brl(prev)}</b><small>${planned.filter((e) => e.amount == null).length} sem valor ainda</small></div></div>
  <div class="chips">${[["", "Todos"], ["Já tenho", "Já tenho"], ["A caminho", "A caminho"], ["falta", "Falta"]].map(([k, l]) => `<button class="chip ${lojaF === k ? "on" : ""}" data-lf="${k}">${l}</button>`).join("")}</div>
  ${list.length ? areas.map((a) => { const it = list.filter((e) => (e.area || "Sem ambiente") === a); return `<div class="panel"><h2>${esc(a)} <span class="muted" style="font-size:12px;font-weight:500">${brl(it.filter(C.spent).reduce((x, e) => x + n(e.amount), 0))}</span></h2><div class="rows">${it.map((e) => `<div class="row click" data-exp="${e.id}"><div><b>${esc(e.description)}</b><div class="cell-sub">${esc([e.supplier, e.notes].filter(Boolean).join(" · "))}</div></div><span class="badge badge--${stBadge(e.status)}">${esc(e.status || "—")}</span><div class="r" style="min-width:92px"><b>${e.amount == null ? '<span class="muted">—</span>' : brl(e.amount)}</b></div></div>`).join("")}</div></div>`; }).join("") : `<div class="panel"><div class="empty"><b>Nenhum item</b><span>Importe a planilha de montagem ou adicione um item.</span></div></div>`}</div>`;
}
function pageFixed() {
  const act = S.fixed.filter((f) => f.active); const tot = act.reduce((a, f) => a + n(f.amount), 0); const pend = act.filter((f) => f.amount == null);
  return ph("Dinheiro", "Custos fixos", "Contas que se repetem todo mês. Entram no lucro líquido de cada mês.", `<button class="btn btn--orange btn--sm" id="fixNew">${ico("plus")}Novo custo fixo</button>`) + finTabs() + `
  <div class="stack"><div class="kpis"><div class="kpi kpi--hero"><span>Total por mês</span><b>${brl(tot)}</b><small>${pend.length ? `sem ${pend.map((f) => esc(f.name.toLowerCase())).join(" e ")}` : "todos com valor"}</small></div><div class="kpi"><span>Contas</span><b>${act.length}</b><small>ativas</small></div><div class="kpi"><span>Aguardando valor</span><b>${pend.length}</b><small>${pend.map((f) => esc(f.name)).join(", ") || "nenhuma"}</small></div><div class="kpi"><span>No ano</span><b>${brl(C.fixedTotal("ano"))}</b><small>desde o início de cada conta</small></div></div>
  <div class="panel"><p class="muted" style="margin:0 0 12px;font-size:13px">Quando a conta de luz ou internet chegar, digite o valor e ele entra nos custos.</p><div class="rows">${S.fixed.map((f) => `<div class="row"><div><b>${esc(f.name)}</b><div class="cell-sub">desde ${new Date(f.start_month + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}${f.due_day ? ` · vence dia ${f.due_day}` : ""}${f.active ? "" : " · pausado"}</div></div>${f.amount == null ? '<span class="badge badge--warn">Aguardando valor</span>' : ""}<input class="cell-in" data-fix="${f.id}" inputmode="decimal" value="${f.amount == null ? "" : String(f.amount).replace(".", ",")}" placeholder="R$ 0,00" aria-label="Valor de ${esc(f.name)}"><button class="icon-btn" data-fixedit="${f.id}" title="Editar">${ico("edit")}</button></div>`).join("") || `<div class="empty">Nenhum custo fixo.</div>`}</div></div></div>`;
}
function pageCorreios() {
  const list = S.expenses.filter((e) => e.kind === "correios"); const ships = S.shipments.filter((s) => n(s.correios_fee_brl) + n(s.import_tax_brl) + n(s.icms_brl));
  const tot = list.reduce((a, e) => a + n(e.amount), 0) + ships.reduce((a, s) => a + n(s.correios_fee_brl) + n(s.import_tax_brl) + n(s.icms_brl), 0);
  const units = S.products.reduce((a, p) => a + (C.parts(p).correios ? 1 : 0), 0);
  return ph("Dinheiro", "Taxa dos Correios", "Impostos e taxas pagos para liberar os pacotes. Separados aqui, mas somados no custo final de cada produto.", `<button class="btn btn--orange btn--sm" id="tcNew">${ico("plus")}Lançar taxa</button>`) + finTabs() + `
  <div class="stack"><div class="kpis"><div class="kpi kpi--hero"><span>Total pago aos Correios</span><b>${brl(tot)}</b><small>${list.length + ships.length} lançamento(s)</small></div><div class="kpi"><span>Produtos com a taxa</span><b>${units}</b><small>no custo final</small></div><div class="kpi"><span>Média por produto</span><b>${brl(units ? tot / units : 0)}</b><small>dividida igualmente entre as peças</small></div><div class="kpi"><span>Taxas pendentes</span><b>${S.shipments.filter((s) => s.tax_generated && !s.tax_paid).length}</b><small>pacotes com taxa gerada</small></div></div>
  <div class="panel"><div class="rows">${list.map((e) => { const sh = S.shipments.find((x) => x.id === e.shipment_id); return `<div class="row click" data-exp="${e.id}"><div><b>${esc(e.description || "Taxa dos Correios")}</b><div class="cell-sub">${fdate(e.spent_at)}${sh ? " · dividida entre os produtos de " + esc(sh.name) : " · sem pacote (não entra no custo dos produtos)"}${e.notes ? " · " + esc(e.notes) : ""}</div></div><div class="r"><b>${brl(e.amount)}</b></div></div>`; }).join("")}${ships.map((s) => `<div class="row"><div><b>${esc(s.name)}</b><div class="cell-sub">valor informado no pacote</div></div><div class="r"><b>${brl(n(s.correios_fee_brl) + n(s.import_tax_brl) + n(s.icms_brl))}</b></div></div>`).join("")}${list.length + ships.length ? "" : `<div class="empty">Nenhuma taxa lançada.</div>`}</div></div></div>`;
}
function expenseForm(e, kind) {
  e = e || { kind: kind || "despesa", spent_at: today(), category: kind === "loja" ? "Montagem da loja" : kind === "correios" ? "Taxa dos Correios" : EXP_CATS[0], status: kind === "loja" ? "Já tenho" : kind === "correios" ? "Pago" : null, shipment_id: kind === "correios" ? S.shipments[0]?.id : null };
  const isNew = !e.id, K = e.kind || "despesa"; const fv = (v) => (v == null || v === "" ? "" : String(v).replace(".", ","));
  const title = { loja: "item da loja", correios: "taxa dos Correios", despesa: "despesa" }[K];
  openModal(`<div class="modal__head"><div><h2>${isNew ? "Novo" : "Editar"} ${title}</h2>${K === "correios" ? `<p class="muted">Escolha o pacote: o valor é dividido entre os produtos dele.</p>` : ""}</div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <form id="ef" class="stack"><label class="field"><span>${K === "loja" ? "Item" : "Descrição"}</span><input id="e_desc" value="${esc(e.description || "")}" ${K === "loja" ? "required" : ""} placeholder="${K === "loja" ? "Ex.: Arara para roupas" : "Ex.: 50 caixas de envio"}"></label>
  <div class="grid2"><label class="field"><span>Valor (R$)</span><input id="e_v" inputmode="decimal" value="${fv(e.amount)}" ${K === "loja" ? "" : "required"} placeholder="${K === "loja" ? "deixe vazio se ainda não sabe" : "0,00"}"></label><label class="field"><span>Data</span><input type="date" id="e_d" value="${e.spent_at || today()}"></label>
  ${K === "loja" ? `<label class="field"><span>Status</span><select id="e_st">${LOJA_ST.map((x) => `<option ${e.status === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label class="field"><span>Ambiente</span><input id="e_area" list="areaList" value="${esc(e.area || "")}"><datalist id="areaList">${[...new Set(["Sala", "Banheiro", "Entrada", "Envios", "Área do café", "Geral", ...S.expenses.map((x) => x.area).filter(Boolean)])].map((a) => `<option>${esc(a)}</option>`).join("")}</datalist></label><label class="field" style="grid-column:1/-1"><span>Onde comprou</span><input id="e_sup" value="${esc(e.supplier || "")}" placeholder="Mercado Livre, Shopee…"></label>` : ""}
  ${K === "correios" ? `<label class="field" style="grid-column:1/-1"><span>Pacote</span><select id="e_ship">${S.shipments.map((s) => `<option value="${s.id}" ${s.id === e.shipment_id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}<option value="" ${e.shipment_id ? "" : "selected"}>Nenhum (não entra no custo dos produtos)</option></select></label>` : ""}
  ${K === "despesa" ? `<label class="field"><span>Categoria</span><select id="e_c">${EXP_CATS.map((c) => `<option ${e.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></label><label class="field"><span>Pago por / retirado por</span><select id="e_p"><option value="">Caixa da empresa</option>${S.members.map((m2) => `<option value="${esc(m2.email)}" ${e.paid_by === m2.email ? "selected" : ""}>${esc(m2.display_name || who(m2.email))}</option>`).join("")}</select></label>` : ""}</div>
  <label class="field"><span>Observações</span><input id="e_obs" value="${esc(e.notes || "")}"></label>
  <div class="modal__foot">${isNew ? "" : `<button type="button" class="btn btn--danger btn--sm spacer" id="eDel">${ico("trash")}Apagar</button>`}<button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">${isNew ? "Lançar" : "Salvar"}</button></div></form>`, (m) => {
    $("#ef", m).onsubmit = async (ev) => { ev.preventDefault(); const v = $("#e_v", m).value.trim();
      const row = { company_id: S.cid, kind: K, description: $("#e_desc", m).value.trim() || null, amount: v === "" ? null : num(v), spent_at: $("#e_d", m).value || today(), notes: $("#e_obs", m).value.trim() || null, category: K === "loja" ? "Montagem da loja" : K === "correios" ? "Taxa dos Correios" : $("#e_c", m).value };
      if (K === "loja") Object.assign(row, { status: $("#e_st", m).value, area: $("#e_area", m).value.trim() || null, supplier: $("#e_sup", m).value.trim() || null });
      if (K === "correios") Object.assign(row, { status: "Pago", shipment_id: $("#e_ship", m).value || null });
      if (K === "despesa") Object.assign(row, { paid_by: $("#e_p", m).value || null });
      try { if (isNew) await q(sb.from("ctl_expenses").insert(row)); else await q(sb.from("ctl_expenses").update(row).eq("id", e.id)); closeModal(); toast(isNew ? "Lançado" : "Salvo"); await refresh(); } catch (err) { fail(err); } };
    $("#eDel", m) && ($("#eDel", m).onclick = () => confirmBox("Apagar?", `“${esc(e.description || e.category)}” sai do financeiro.`, "Apagar", async () => { await q(sb.from("ctl_expenses").delete().eq("id", e.id)); toast("Apagado"); await refresh(); }));
  });
}
function fixedForm(f) {
  const isNew = !f; f = f || { name: "", amount: null, start_month: today().slice(0, 8) + "01", active: true };
  openModal(`<div class="modal__head"><div><h2>${isNew ? "Novo custo fixo" : esc(f.name)}</h2></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <form id="ff" class="stack"><div class="grid2"><label class="field"><span>Nome</span><input id="x_n" required value="${esc(f.name)}" placeholder="Ex.: Aluguel"></label><label class="field"><span>Valor por mês (R$)</span><input id="x_v" inputmode="decimal" value="${f.amount == null ? "" : String(f.amount).replace(".", ",")}" placeholder="vazio = aguardando"></label>
  <label class="field"><span>Começa em</span><input type="month" id="x_s" value="${String(f.start_month).slice(0, 7)}"></label><label class="field"><span>Dia do vencimento</span><input id="x_d" type="number" min="1" max="31" value="${f.due_day || ""}"></label></div>
  <label class="hstack"><input type="checkbox" id="x_a" ${f.active ? "checked" : ""}> Ativo</label>
  <div class="modal__foot">${isNew ? "" : `<button type="button" class="btn btn--danger btn--sm spacer" id="xDel">${ico("trash")}Apagar</button>`}<button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">Salvar</button></div></form>`, (m) => {
    $("#ff", m).onsubmit = async (ev) => { ev.preventDefault(); const v = $("#x_v", m).value.trim(); const row = { company_id: S.cid, name: $("#x_n", m).value.trim(), amount: v === "" ? null : num(v), start_month: ($("#x_s", m).value || today().slice(0, 7)) + "-01", due_day: parseInt($("#x_d", m).value) || null, active: $("#x_a", m).checked };
      try { if (isNew) await q(sb.from("ctl_fixed_costs").insert(row)); else await q(sb.from("ctl_fixed_costs").update(row).eq("id", f.id)); closeModal(); toast("Salvo"); await refresh(); } catch (err) { fail(err); } };
    $("#xDel", m) && ($("#xDel", m).onclick = () => confirmBox("Apagar custo fixo?", `“${esc(f.name)}” sai de todos os meses.`, "Apagar", async () => { await q(sb.from("ctl_fixed_costs").delete().eq("id", f.id)); toast("Apagado"); await refresh(); }));
  });
}
function lojaImportModal() {
  openModal(`<div class="modal__head"><div><h2>Importar planilha da loja</h2><p class="muted">Colunas: Item, Status, Valor (R$), Onde comprou, Ambiente, Observações. Itens que já existem são atualizados, sem duplicar. Linhas de taxa dos Correios vão para a aba Taxa dos Correios.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <div class="stack"><label class="field"><span>Arquivo (.xlsx ou .csv)</span><input type="file" id="liF" accept=".xlsx,.xls,.csv"></label><label class="field"><span>Taxas dos Correios vão para o pacote</span><select id="liS">${S.shipments.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}<option value="">Nenhum</option></select></label><div id="liPrev"></div></div>
  <div class="modal__foot"><button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange" id="liGo" disabled>Importar</button></div>`, (m) => {
    let rows = [];
    $("#liF", m).onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return;
      try { const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
        const norm = (x) => String(x).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
        const hi = aoa.findIndex((r) => r.some((c) => /^(item|produto|descricao)/.test(norm(c))) && r.some((c) => /(valor|preco|total)/.test(norm(c))));
        if (hi < 0) throw new Error("Não achei as colunas. A planilha precisa ter “Item” e “Valor”.");
        const H = aoa[hi].map(norm); const col = (re) => H.findIndex((h) => re.test(h));
        const cI = col(/^(item|produto|descricao)/), cS = col(/status|situa/), cV = col(/(valor|preco|total)/), cO = col(/(onde|loja|fornec)/), cA = col(/(ambiente|area|local)/), cN = col(/(obs|nota)/);
        rows = aoa.slice(hi + 1).filter((r) => String(r[cI] ?? "").trim()).map((r) => { const d = String(r[cI]).trim(); const v = r[cV] === "" || r[cV] == null ? null : num(r[cV]); const isC = /correio/i.test(d) && /(taxa|imposto)/i.test(d); return { d, isC, kind: isC ? "correios" : "loja", amount: v, status: cS >= 0 ? String(r[cS]).trim() || null : null, supplier: cO >= 0 ? String(r[cO]).trim() || null : null, area: cA >= 0 ? String(r[cA]).trim() || null : null, notes: cN >= 0 ? String(r[cN]).trim() || null : null }; });
        rows.forEach((r) => (r.match = S.expenses.find((e) => e.kind === r.kind && norm(e.description || "") === norm(r.d))));
        const lj = rows.filter((r) => !r.isC), tc = rows.filter((r) => r.isC);
        $("#liPrev", m).innerHTML = `<div class="note note--muted">${lj.length} itens da loja (${lj.filter((r) => r.match).length} já existem e serão atualizados) · gasto ${brl(lj.filter((r) => r.amount != null && !PLANNED.includes(r.status)).reduce((a, r) => a + r.amount, 0))}${tc.length ? ` · ${tc.length} taxa(s) dos Correios: ${brl(tc.reduce((a, r) => a + n(r.amount), 0))}` : ""}</div>`;
        $("#liGo", m).disabled = !rows.length;
      } catch (err) { $("#liPrev", m).innerHTML = `<div class="note">${esc(friendly(err))}</div>`; $("#liGo", m).disabled = true; } };
    $("#liGo", m).onclick = async () => { const b = $("#liGo", m); b.disabled = true; b.textContent = "Importando…"; const ship = $("#liS", m).value || null;
      try { const ins = [];
        for (const r of rows) { const row = { company_id: S.cid, kind: r.kind, category: r.isC ? "Taxa dos Correios" : "Montagem da loja", description: r.d, amount: r.amount, status: r.status || (r.isC ? "Pago" : null), supplier: r.supplier, area: r.area, notes: r.notes, ...(r.isC ? { shipment_id: ship } : {}) };
          if (r.match) await q(sb.from("ctl_expenses").update(row).eq("id", r.match.id)); else ins.push({ ...row, spent_at: today() }); }
        if (ins.length) await q(sb.from("ctl_expenses").insert(ins));
        closeModal(); toast(`${ins.length} novos · ${rows.length - ins.length} atualizados`); await refresh();
      } catch (err) { b.disabled = false; b.textContent = "Importar"; fail(err); } };
  });
}

/* ---- Ajustes ---- */
function pageSettings() {
  const me = S.members.find((m) => m.email.toLowerCase() === S.user.email.toLowerCase()); const owner = me?.role === "dono";
  const split = S.company.settings?.split || {};
  const c = S.correios || {};
  return ph("Configurações", "Ajustes", `${esc(S.company.name)} · você é ${me ? { dono: "dono", socio: "sócio", equipe: "equipe" }[me.role] : "membro"}`) + `
  <div class="cols"><div class="stack">
    <div class="panel"><h2>Empresa</h2><form id="coF" class="stack"><div class="grid2"><label class="field"><span>Nome</span><input id="co_n" value="${esc(S.company.name)}"></label><label class="field"><span>Segmento</span><input id="co_s" value="${esc(S.company.segment || "")}"></label><label class="field"><span>Cotação padrão ¥1 = R$</span><input id="co_r" inputmode="decimal" value="${String(S.company.cny_rate).replace(".", ",")}"><small>Usada em produtos sem lote e como padrão de novos lotes.</small></label></div><div><button class="btn btn--orange btn--sm">Salvar empresa</button></div></form></div>
    <div class="panel"><h2>Pessoas com acesso ${owner ? `<button class="btn btn--ghost btn--sm" id="addMem">${ico("users")}Adicionar</button>` : ""}</h2><div class="rows">${S.members.map((m) => `<div class="row"><div><b>${esc(m.display_name || m.email)}</b><div class="cell-sub">${esc(m.email.endsWith("@92factory.local") ? "Login compartilhado: " + who(m.email) : m.email)}</div></div><span class="badge badge--${m.role === "dono" ? "orange" : "info"}">${{ dono: "Dono", socio: "Sócio", equipe: "Equipe" }[m.role]}</span>${m.role !== "equipe" && !m.email.endsWith("@92factory.local") ? `<input class="input" style="width:76px;height:34px;text-align:right" data-split="${esc(m.email)}" inputmode="decimal" value="${(split[m.email] ?? 100 / S.members.filter((x) => x.role !== "equipe" && !x.email.endsWith("@92factory.local")).length).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}" title="% do lucro" ${owner ? "" : "disabled"}><span class="muted">%</span>` : ""}${owner && m.email.toLowerCase() !== S.user.email.toLowerCase() ? `<button class="icon-btn" data-rmmem="${esc(m.email)}" title="Remover">${ico("trash")}</button>` : ""}</div>`).join("")}</div><p class="muted" style="font-size:12px;margin:10px 0 0">A pessoa adicionada entra em “Criar conta” com o mesmo e-mail. Os % definem a divisão do lucro no Financeiro.</p></div>
  </div><div class="stack">
    <div class="panel"><h2>Correios · API oficial ${c.configured ? '<span class="badge badge--ok">Conectado</span>' : '<span class="badge">Não configurado</span>'}</h2>
      <p class="muted" style="margin:0 0 12px;font-size:13px">O rastreio automático usa a API oficial dos Correios (CWS). Ela exige conta <b>Pessoa Jurídica</b> no Meu Correios com <b>contrato</b> e um <b>código de acesso às APIs</b>, gerado em cws.correios.com.br. As credenciais ficam guardadas só no servidor.</p>
      ${owner ? `<form id="crF" class="stack"><div class="grid2"><label class="field"><span>Usuário (CNPJ ou idCorreios)</span><input id="cr_u" value="${esc(c.user || "")}"></label><label class="field"><span>Código de acesso às APIs</span><input id="cr_c" type="password" placeholder="${c.configured ? "•••••• (guardado)" : ""}"></label><label class="field" style="grid-column:1/-1"><span>Cartão de postagem (opcional)</span><input id="cr_k" value="${esc(c.card || "")}"></label></div><div><button class="btn btn--orange btn--sm">Salvar credenciais</button></div></form>` : `<p class="muted">Só o dono da empresa altera as credenciais.</p>`}</div>
    <div class="panel"><h2>Dados e backup</h2><div class="hstack"><button class="btn btn--ghost btn--sm" id="bkp">${ico("download")}Baixar backup completo (Excel)</button><button class="btn btn--ghost btn--sm" id="imp2">${ico("upload")}Importar planilha</button></div><p class="muted" style="font-size:12px;margin:10px 0 0">O backup traz produtos, estoque, vendas, pacotes e despesas, cada um numa aba.</p></div>
    <div class="panel"><h2>Instalar no celular</h2><p class="muted" style="font-size:13px;margin:0">iPhone: abra no Safari › Compartilhar › <b>Adicionar à Tela de Início</b>.<br>Android: abra no Chrome › menu ⋮ › <b>Instalar app</b>.<br>Computador: ícone de instalar na barra de endereço do Chrome/Edge.</p></div>
    <div class="panel"><h2>Conta</h2><div class="split"><span class="muted">${esc(who(S.user.email))}</span><div class="hstack"><button class="btn btn--ghost btn--sm" id="chPass">Trocar senha</button><button class="btn btn--danger btn--sm" id="out2">Sair</button></div></div><p class="muted" style="font-size:12px;margin:10px 0 0">92 Factory Control v${CFG.VERSION}</p></div>
  </div></div>`;
}
function passwordModal() {
  openModal(`<div class="modal__head"><div><h2>Nova senha</h2></div><button class="icon-btn" data-close>${ico("x")}</button></div><form id="pwF" class="stack"><label class="field"><span>Nova senha</span><input id="pw" type="password" minlength="6" required autocomplete="new-password"></label><div class="modal__foot"><button class="btn btn--orange">Salvar senha</button></div></form>`, (m) => {
    $("#pwF", m).onsubmit = async (e) => { e.preventDefault(); const { error } = await sb.auth.updateUser({ password: $("#pw", m).value }); if (error) return fail(error); closeModal(); toast("Senha alterada"); };
  });
}

/* ---- Mais (mobile) ---- */
function pageMore() {
  return ph("Menu", "Mais", esc(S.company.name)) + `<div class="more-grid">${[["vender", "Vender", "sell"], ["estoque", "Estoque", "stock"], ["vendas", "Vendas", "receipt"], ["financeiro", "Financeiro", "money"], ["produtos", "Produtos", "box"], ["importacoes", "Pacotes", "plane"], ["ajustes", "Ajustes", "gear"]].map(([k, l, i]) => `<a href="#${k}">${ico(i)}${l}</a>`).join("")}</div>
  <div class="panel" style="margin-top:16px"><div class="split"><span class="muted">${esc(who(S.user.email))}</span><button class="btn btn--danger btn--sm" id="out3">Sair</button></div></div>`;
}

/* ---------- import / export ---------- */
function importModal() {
  openModal(`<div class="modal__head"><div><h2>Importar planilha</h2><p class="muted">Excel (.xlsx) ou CSV. Funciona com a planilha de produtos da 92: colunas Produto, Nome do Produto, Valor (¥), Valor de Revenda e Qtd.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div>
  <div class="stack"><label class="field"><span>Arquivo</span><input type="file" id="imF" accept=".xlsx,.xls,.csv"></label><label class="field"><span>Colocar no lote</span><select id="imS">${shipOptions(S.shipments[0]?.id)}</select></label><div id="imPrev"></div></div>
  <div class="modal__foot"><button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange" id="imGo" disabled>Importar</button></div>`, (m) => {
    let rows = [];
    $("#imF", m).onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
        const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const hi = aoa.findIndex((r) => r.some((c) => /nome/.test(norm(c))) && r.some((c) => /(¥|yuan|cny|custo)/.test(norm(c))));
        if (hi < 0) throw new Error("Não achei as colunas. A planilha precisa ter “Nome” e uma coluna de valor em ¥ / Yuan.");
        const H = aoa[hi].map(norm); const col = (re) => H.findIndex((h) => re.test(h));
        const cName = col(/nome/), cCat = H.findIndex((h, i) => i !== cName && /^(produto|categoria|tipo)/.test(h)), cCny = col(/(¥|yuan|cny)/), cPrice = col(/(revenda|venda|preco)/), cQty = col(/(qtd|quant)/), cSku = col(/(sku|codigo)/), cVar = col(/(tamanho|variac|numer)/);
        const map = new Map();
        aoa.slice(hi + 1).forEach((r) => { const name = String(r[cName] ?? "").trim(); if (!name || /^total|exemplo/i.test(name) || /exemplo/i.test(String(r[cCat] ?? ""))) return; const cost = num(r[cCny]); if (!cost && !num(r[cPrice])) return; const key = name.toLowerCase() + "|" + cost + "|" + (cVar >= 0 ? r[cVar] : ""); const cur = map.get(key) || { name, category: cCat >= 0 ? String(r[cCat]).trim() || null : null, cost_cny: cost, price: cPrice >= 0 ? num(r[cPrice]) : 0, qty: 0, sku: cSku >= 0 ? String(r[cSku]).trim() || null : null, variant: cVar >= 0 ? String(r[cVar]).trim() || null : null }; cur.qty += cQty >= 0 && r[cQty] !== "" ? parseInt(r[cQty]) || 1 : 1; map.set(key, cur); });
        rows = [...map.values()];
        rows.forEach((r) => { r.match = S.products.find((p) => p.name.toLowerCase() === r.name.toLowerCase() && Math.abs(n(p.cost_cny) - r.cost_cny) < 0.01 && (p.variant || null) === (r.variant || null)); });
        $("#imPrev", m).innerHTML = `<div class="note note--muted">${rows.length} produtos · ${rows.reduce((a, r) => a + r.qty, 0)} peças · ${cny(rows.reduce((a, r) => a + r.qty * r.cost_cny, 0))}. ${rows.filter((r) => r.match).length ? `${rows.filter((r) => r.match).length} já existem e só recebem entrada de estoque.` : ""}</div><div class="tbl-wrap" style="max-height:280px;margin-top:10px"><table class="tbl"><thead><tr><th>Produto</th><th class="r">¥</th><th class="r">Venda</th><th class="r">Qtd</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.name)}<div class="cell-sub">${esc(r.category || "")}</div></td><td class="r">${cny(r.cost_cny)}</td><td class="r">${brl(r.price)}</td><td class="r">${r.qty}</td><td>${r.match ? '<span class="badge badge--info">Existe</span>' : '<span class="badge badge--ok">Novo</span>'}</td></tr>`).join("")}</tbody></table></div>`;
        $("#imGo", m).disabled = !rows.length;
      } catch (err) { $("#imPrev", m).innerHTML = `<div class="note">${esc(friendly(err))}</div>`; $("#imGo", m).disabled = true; }
    };
    $("#imGo", m).onclick = async () => {
      const b = $("#imGo", m); b.disabled = true; b.textContent = "Importando…"; const ship = $("#imS", m).value || null;
      try {
        let skuN = Math.max(0, ...S.products.map((p) => parseInt(String(p.sku || "").split("-").pop())).filter((x) => !isNaN(x)));
        const pre = (S.company.name.match(/\d+/)?.[0] || S.company.name.slice(0, 3).toUpperCase());
        const fresh = rows.filter((r) => !r.match).map((r) => ({ company_id: S.cid, name: r.name, category: r.category, cost_cny: r.cost_cny, price: r.price, variant: r.variant, sku: r.sku || `${pre}-${String(++skuN).padStart(3, "0")}`, shipment_id: ship }));
        const created = fresh.length ? await q(sb.from("ctl_products").insert(fresh).select()) : [];
        const moves = rows.map((r) => { const p = r.match || created.find((c) => c.name === r.name && Math.abs(n(c.cost_cny) - r.cost_cny) < 0.01 && (c.variant || null) === (r.variant || null)); return p && r.qty ? { company_id: S.cid, product_id: p.id, type: "entrada", qty: r.qty, unit_cost_cny: r.cost_cny, shipment_id: ship, note: "Importado da planilha" } : null; }).filter(Boolean);
        if (moves.length) await q(sb.from("ctl_stock_moves").insert(moves));
        closeModal(); toast(`${created.length} produtos novos · ${moves.reduce((a, x) => a + x.qty, 0)} peças lançadas`); await refresh();
      } catch (err) { b.disabled = false; b.textContent = "Importar"; fail(err); }
    };
  });
}
function exportXlsx(kind) {
  const wb = XLSX.utils.book_new();
  const prod = S.products.map((p) => { const k = C.parts(p); return { Código: p.sku, Categoria: p.category, Produto: p.name, Cor: p.color, Tamanho: p.variant, "Custo (¥)": n(p.cost_cny), "Produto (R$)": +k.prod.toFixed(2), "Frete (R$)": +k.frete.toFixed(2), "Taxa Correios (R$)": +(k.correios + k.outras).toFixed(2), "Custo final (R$)": +k.total.toFixed(2), Fotos: (p.photos || []).length, "Venda (R$)": n(p.price), "Lucro/un (R$)": +(n(p.price) - C.landed(p)).toFixed(2), Estoque: C.stock(p.id), "A caminho": C.inTransit(p.id), Lote: S.shipments.find((s) => s.id === p.shipment_id)?.name || "" }; });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prod), "Produtos");
  if (kind !== "produtos") {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.sales.map((s) => ({ Nº: s.number, Data: new Date(s.sold_at).toLocaleString("pt-BR"), Cliente: s.customer_name, WhatsApp: s.customer_phone, Canal: s.channel, Pagamento: s.payment_method, Itens: (s.items || []).map((i) => `${i.qty}x ${i.name}`).join("; "), Subtotal: n(s.subtotal), Desconto: n(s.discount), Frete: n(s.shipping_charged), Total: n(s.total), Custo: +C.saleCost(s).toFixed(2), Lucro: +C.saleProfit(s).toFixed(2), Situação: s.status, Vendedor: s.seller_email }))), "Vendas");
    if (kind !== "vendas") {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.moves.map((m) => ({ Data: new Date(m.created_at).toLocaleString("pt-BR"), Produto: S.products.find((p) => p.id === m.product_id)?.name, Tipo: MOVE_T[m.type]?.[0] || m.type, Quantidade: m.qty, "Custo ¥": m.unit_cost_cny, Lote: S.shipments.find((s) => s.id === m.shipment_id)?.name || "", Obs: m.note, Por: m.created_by }))), "Estoque");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.shipments.map((s) => { const k = C.shipInfo(s); return { Pacote: s.name, Plataforma: s.platform, Rastreio: s.tracking_code, Situação: sLabel(s.status), Cotação: k.rate, Peças: k.units, "Produtos (¥)": k.cnyTot, "Produtos (R$)": +k.base.toFixed(2), "Frete (R$)": n(s.freight_brl), "Taxa Correios (R$)": +C.shipCorreios(s).toFixed(2), "Outras taxas (R$)": n(s.other_fees_brl), "Custo total (R$)": +k.total.toFixed(2), "Taxa gerada": s.tax_generated ? "Sim" : "Não", "Taxa paga": s.tax_paid ? "Sim" : "Não", Compra: s.ordered_at, Envio: s.shipped_at, Entrega: s.delivered_at }; })), "Pacotes");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.expenses.filter((e) => e.kind === "loja").map((e) => ({ Item: e.description, Status: e.status, "Valor (R$)": e.amount, "Onde comprou": e.supplier, Ambiente: e.area, Observações: e.notes }))), "Compras da loja");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.expenses.filter((e) => e.kind === "correios").map((e) => ({ Data: e.spent_at, Descrição: e.description, "Valor (R$)": n(e.amount), Pacote: S.shipments.find((s) => s.id === e.shipment_id)?.name || "", Observações: e.notes }))), "Taxa Correios");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.fixed.map((f) => ({ Conta: f.name, "Valor/mês (R$)": f.amount, Desde: f.start_month, Vencimento: f.due_day, Ativo: f.active ? "Sim" : "Não" }))), "Custos fixos");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.expenses.filter((e) => e.kind !== "loja" && e.kind !== "correios").map((e) => ({ Data: e.spent_at, Categoria: e.category, Descrição: e.description, Valor: n(e.amount), "Pago por": e.paid_by }))), "Outras despesas");
    }
  }
  XLSX.writeFile(wb, `${S.company.name.replace(/\W+/g, "_")}_${kind}_${today()}.xlsx`);
}

/* ---------- page bindings ---------- */
function bindPage(k) {
  bindPeriod();
  if (k === "produtos") {
    renderProductList();
    $("#pq").oninput = (e) => { pFilter.q = e.target.value; renderProductList(); };
    $("#pcat").onchange = (e) => { pFilter.cat = e.target.value; renderProductList(); };
    $$(".toolbar .seg button").forEach((b) => (b.onclick = () => { pFilter.view = b.dataset.v; store.set("pview", pFilter.view); $$(".toolbar .seg button").forEach((x) => x.classList.toggle("on", x === b)); renderProductList(); }));
    $("#newProd").onclick = () => productForm(); $("#impBtn").onclick = importModal; $("#expBtn").onclick = () => exportXlsx("produtos");
  }
  if (k === "vender") { renderPOSGrid(); renderCart(); $("#posQ").oninput = (e) => { posQ = e.target.value; renderPOSGrid(); }; }
  if (k === "estoque") {
    $("#newMove").onclick = () => moveForm();
    $$("[data-mv]").forEach((b) => (b.onclick = () => moveForm(S.products.find((p) => p.id === b.dataset.mv))));
    $$("[data-rm]").forEach((b) => (b.onclick = () => removeProduct(S.products.find((p) => p.id === b.dataset.rm))));
    $$("[data-mf]").forEach((b) => (b.onclick = () => { mFilter = b.dataset.mf; route(); }));
    $$("[data-attr]").forEach((i) => { i.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); const all = $$(`[data-attr="${i.dataset.attr}"]`); const nx = all[all.indexOf(i) + 1]; nx ? nx.focus() : i.blur(); } };
      i.onchange = async () => { const p = S.products.find((x) => x.id === i.dataset.id); const v = i.value.trim() || null; try { await q(sb.from("ctl_products").update({ [i.dataset.attr]: v }).eq("id", p.id)); p[i.dataset.attr] = v; i.classList.add("saved"); setTimeout(() => i.classList.remove("saved"), 900); } catch (err) { fail(err); } }; });
    $$("#stTabs button").forEach((b) => (b.onclick = () => { stTab = b.dataset.t; store.set("stTab", stTab); route(); }));
    $$("[data-phf]").forEach((b) => (b.onclick = () => { phFilter = b.dataset.phf; route(); }));
    $$("[data-phcard]").forEach((card) => { const p = S.products.find((x) => x.id === card.dataset.phcard); const strip = $(".photos", card); bindPhotos(strip, p, () => { const y = scrollY; route(); window.scrollTo({ top: y }); }); });
    $$("[data-delmv]").forEach((b) => (b.onclick = () => confirmBox("Apagar movimentação?", "O saldo do produto será recalculado sem ela.", "Apagar", async () => { await q(sb.from("ctl_stock_moves").delete().eq("id", b.dataset.delmv)); toast("Movimentação apagada"); await refresh(); })));
  }
  if (k === "vendas") {
    $$("[data-sid]").forEach((r) => (r.onclick = () => saleDetail(S.sales.find((s) => s.id === r.dataset.sid))));
    $("#sQ").oninput = (e) => { sQ = e.target.value; clearTimeout(bindPage.t); bindPage.t = setTimeout(() => { route(); const i = $("#sQ"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); };
    $("#expSales").onclick = () => exportXlsx("vendas");
  }
  if (k === "importacoes") {
    $("#newShip").onclick = () => shipmentForm();
    $$("[data-ship]").forEach((b) => (b.onclick = () => shipmentForm(S.shipments.find((s) => s.id === b.dataset.ship))));
    $("#trackAll").onclick = async () => { const list = S.shipments.filter((s) => s.tracking_code && s.status !== "entregue"); if (!list.length) return toast("Nenhum pacote com código de rastreio em aberto.", true); const b = $("#trackAll"); b.disabled = true; b.innerHTML = `${ico("refresh")}Consultando ${list.length}…`; let ok = 0; for (const s of list) if (await trackShipment(s, true)) ok++; await refresh(); toast(ok ? `${ok} de ${list.length} pacotes atualizados` : (S.correios?.configured === false ? "Configure a API dos Correios em Ajustes." : "Os Correios não responderam. Tente mais tarde."), !ok); };
    if (!S.correios) sb.rpc("ctl_correios_status", { p_company: S.cid }).then(({ data }) => { if (data) { S.correios = data; if (!data.configured && location.hash === "#importacoes") route(); } });
  }
  if (k === "financeiro") {
    $$("#finTabs button").forEach((b) => (b.onclick = () => { finTab = b.dataset.t; store.set("finTab", finTab); route(); }));
    $$("[data-goto]").forEach((b) => (b.onclick = () => { finTab = b.dataset.goto; store.set("finTab", finTab); route(); }));
    $("#newExp") && ($("#newExp").onclick = () => expenseForm(null, "despesa"));
    $("#lojaNew") && ($("#lojaNew").onclick = () => expenseForm(null, "loja"));
    $("#lojaImp") && ($("#lojaImp").onclick = lojaImportModal);
    $("#tcNew") && ($("#tcNew").onclick = () => expenseForm(null, "correios"));
    $("#fixNew") && ($("#fixNew").onclick = () => fixedForm());
    $$("[data-lf]").forEach((b) => (b.onclick = () => { lojaF = b.dataset.lf; route(); }));
    $$("[data-exp]").forEach((r) => (r.onclick = () => expenseForm(S.expenses.find((e) => e.id === r.dataset.exp))));
    $$("[data-fixedit]").forEach((b) => (b.onclick = () => fixedForm(S.fixed.find((f) => f.id === b.dataset.fixedit))));
    $$("[data-fix]").forEach((i) => { i.onkeydown = (e) => { if (e.key === "Enter") i.blur(); }; i.onchange = async () => { const v = i.value.trim(); try { await q(sb.from("ctl_fixed_costs").update({ amount: v === "" ? null : num(v) }).eq("id", i.dataset.fix)); toast("Valor salvo"); i.blur(); await refresh(); } catch (err) { fail(err); } }; });
  }
  if (k === "ajustes") {
    if (!S.correios) sb.rpc("ctl_correios_status", { p_company: S.cid }).then(({ data }) => { if (data) { S.correios = data; route(); } });
    $("#coF").onsubmit = async (e) => { e.preventDefault(); try { await q(sb.from("ctl_companies").update({ name: $("#co_n").value.trim(), segment: $("#co_s").value.trim() || null, cny_rate: num($("#co_r").value) || 0.8 }).eq("id", S.cid)); S.companies = await q(sb.from("ctl_companies").select("*").order("created_at")); await loadCompany(); route(); toast("Empresa salva"); } catch (err) { fail(err); } };
    $$("[data-split]").forEach((i) => (i.onchange = async () => { const split = { ...(S.company.settings?.split || {}) }; $$("[data-split]").forEach((x) => (split[x.dataset.split] = num(x.value))); const tot = Object.values(split).reduce((a, b) => a + b, 0); if (Math.abs(tot - 100) > 0.5) toast(`A soma está em ${tot.toLocaleString("pt-BR")}%. Ajuste para 100%.`, true); try { await q(sb.from("ctl_companies").update({ settings: { ...(S.company.settings || {}), split } }).eq("id", S.cid)); S.company.settings = { ...(S.company.settings || {}), split }; } catch (err) { fail(err); } }));
    $("#addMem") && ($("#addMem").onclick = () => openModal(`<div class="modal__head"><div><h2>Adicionar pessoa</h2><p class="muted">Ela vai ver todos os dados de ${esc(S.company.name)}.</p></div><button class="icon-btn" data-close>${ico("x")}</button></div><form id="amF" class="stack"><label class="field"><span>E-mail</span><input id="am_e" type="email" required></label><div class="grid2"><label class="field"><span>Nome</span><input id="am_n"></label><label class="field"><span>Papel</span><select id="am_r"><option value="socio">Sócio</option><option value="dono">Dono (pode gerenciar pessoas)</option><option value="equipe">Equipe (sem participação no lucro)</option></select></label></div><div class="modal__foot"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange">Adicionar</button></div></form>`, (m) => { $("#amF", m).onsubmit = async (e) => { e.preventDefault(); try { await q(sb.from("ctl_members").insert({ company_id: S.cid, email: $("#am_e", m).value.trim().toLowerCase(), display_name: $("#am_n", m).value.trim() || null, role: $("#am_r", m).value })); closeModal(); toast("Pessoa adicionada"); await refresh(); } catch (err) { fail(err); } }; }));
    $$("[data-rmmem]").forEach((b) => (b.onclick = () => confirmBox("Remover acesso?", `${esc(b.dataset.rmmem)} deixa de ver ${esc(S.company.name)}.`, "Remover", async () => { await q(sb.from("ctl_members").delete().eq("company_id", S.cid).eq("email", b.dataset.rmmem)); toast("Acesso removido"); await refresh(); })));
    $("#crF") && ($("#crF").onsubmit = async (e) => { e.preventDefault(); try { await q(sb.rpc("ctl_save_correios", { p_company: S.cid, p_user: $("#cr_u").value.trim(), p_code: $("#cr_c").value.trim(), p_card: $("#cr_k").value.trim() })); S.correios = null; toast("Credenciais dos Correios salvas"); route(); } catch (err) { fail(err); } });
    $("#bkp").onclick = () => exportXlsx("backup"); $("#imp2").onclick = importModal; $("#chPass").onclick = passwordModal; $("#out2").onclick = () => sb.auth.signOut();
  }
  if (k === "mais") $("#out3").onclick = () => sb.auth.signOut();
}

/* ---------- PWA ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js?v=5", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
  let reloaded = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
addEventListener("online", () => $("#sync")?.classList.remove("off")); addEventListener("offline", () => { $("#sync")?.classList.add("off"); toast("Você está sem internet. As alterações não serão salvas até reconectar.", true); });

/* ---------- boot ---------- */
sb.auth.getSession().then(({ data }) => { if (!data.session) showAuth(); });
})();
