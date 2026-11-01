/* =========================================================
   92 factory — Painel administrador
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { db, auth, storage } = window.NF;
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");
  const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1).replace(".", ",") + "%" : "0%");
  const dtf = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const CATS = { tenis: "Tênis", moletons: "Moletons", camisetas: "Camisetas", jaquetas: "Jaquetas", acessorios: "Acessórios" };
  const STATUS = { novo: "Novo", contato: "Em contato", orcamento: "Orçamento enviado", fechado: "Fechado", perdido: "Perdido" };
  const ICON = {
    wa: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
  };

  /* ---------------- UI helpers ---------------- */
  let toastT;
  function toast(msg, err) {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function modal(html, onMount) {
    const m = $("#modal"); $("#modalBox").innerHTML = html; m.hidden = false;
    const close = () => { m.hidden = true; $("#modalBox").innerHTML = ""; };
    m.onclick = (e) => { if (e.target === m) close(); };
    $$("[data-close]", m).forEach((b) => (b.onclick = close));
    if (onMount) onMount($("#modalBox"), close);
    return close;
  }
  function confirmBox(text) {
    return new Promise((res) => {
      modal(`<h2>Tem certeza?</h2><p class="muted">${esc(text)}</p><div class="modal__acts"><button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--danger" id="cOk">Excluir</button></div>`,
        (box, close) => { $("#cOk", box).onclick = () => { close(); res(true); }; $$("[data-close]", box).forEach((b) => b.addEventListener("click", () => res(false))); });
    });
  }
  function resolveImg(u) { return u || "img/favicon.png"; }
  function waNumber(n) { const d = String(n || "").replace(/\D/g, ""); return d.startsWith("55") ? d : "55" + d; }

  /* ---------------- Auth ---------------- */
  let signupMode = false;
  async function showAuth() {
    $("#app").hidden = true; $("#auth").hidden = false;
    try {
      const exists = await db.rpc("admin_exists");
      $("#authToggle").hidden = !!exists;
    } catch (e) { $("#authToggle").hidden = true; $("#authMsg").textContent = "Sem conexão com o banco de dados."; }
  }
  $("#authToggle").addEventListener("click", () => {
    signupMode = !signupMode;
    $("#authTitle").textContent = signupMode ? "Criar administrador" : "Painel administrador";
    $("#authSub").textContent = signupMode ? "Use o e-mail autorizado do dono da 92 e crie uma senha (mín. 8 caracteres)." : "Entre com seu e-mail e senha.";
    $("#authBtn").textContent = signupMode ? "Criar conta" : "Entrar";
    $("#authToggle").textContent = signupMode ? "Já tenho conta. Entrar" : "Primeiro acesso? Criar conta de administrador";
    $("#authMsg").textContent = "";
  });
  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#aEmail").value.trim(), pass = $("#aPass").value, msg = $("#authMsg"), btn = $("#authBtn");
    msg.className = "auth__msg"; msg.textContent = "";
    if (!email || pass.length < 8) { msg.textContent = "Preencha o e-mail e uma senha com pelo menos 8 caracteres."; return; }
    btn.disabled = true;
    try {
      if (signupMode) {
        const r = await auth.signUp(email, pass);
        if (!r || !r.access_token) {
          msg.className = "auth__msg ok";
          msg.textContent = "Conta criada! Confirme pelo link enviado ao seu e-mail e depois volte aqui para entrar.";
          btn.disabled = false; return;
        }
      } else {
        await auth.signIn(email, pass);
      }
      const ok = await db.rpc("claim_admin");
      if (!ok) { await auth.signOut(); msg.textContent = "Esta conta não tem acesso ao painel."; btn.disabled = false; return; }
      startApp();
    } catch (err) {
      const m = String(err.message || "");
      msg.textContent = /Invalid login/i.test(m) ? "E-mail ou senha incorretos." : /not confirmed/i.test(m) ? "Confirme seu e-mail pelo link que enviamos antes de entrar." : /registered/i.test(m) ? "Este e-mail já tem conta. Use Entrar." : m;
    }
    btn.disabled = false;
  });
  $("#logout").addEventListener("click", async () => { await auth.signOut(); location.hash = ""; showAuth(); });

  /* ---------------- Router ---------------- */
  const VIEWS = { dashboard: ["Dashboard", vDashboard], leads: ["Leads", vLeads], produtos: ["Produtos", vProducts], lookbook: ["Lookbook", vLookbook], conteudo: ["Conteúdo do site", vContent], config: ["Configurações", vConfig] };
  function route() {
    const k = (location.hash || "#dashboard").slice(1);
    const [title, fn] = VIEWS[k] || VIEWS.dashboard;
    $$(".side__nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.v === (VIEWS[k] ? k : "dashboard")));
    $("#viewTitle").textContent = title; $("#topRight").innerHTML = "";
    const v = $("#view"); v.onclick = null; v.onchange = null; v.innerHTML = '<div class="skel" style="height:120px"></div><div class="skel" style="height:300px;margin-top:14px"></div>';
    v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
    $("#side").classList.remove("is-open");
    fn(v).catch((e) => { v.innerHTML = `<div class="empty-big"><b>Não foi possível carregar.</b>${esc(e.message)}</div>`; });
  }
  $("#sideToggle").addEventListener("click", () => $("#side").classList.toggle("is-open"));
  document.addEventListener("click", (e) => { if ($("#side").classList.contains("is-open") && !e.target.closest("#side") && !e.target.closest("#sideToggle")) $("#side").classList.remove("is-open"); });

  async function refreshBadge() {
    try {
      const r = await db.select("leads", "select=id&status=eq.novo&limit=500");
      const b = $("#leadBadge"); b.textContent = r.length; b.hidden = !r.length;
    } catch (e) {}
  }

  async function startApp() {
    $("#auth").hidden = true; $("#app").hidden = false;
    window.onhashchange = route; route(); refreshBadge();
  }

  /* ---------------- Dashboard ---------------- */
  let range = 7;
  async function vDashboard(v) {
    $("#topRight").innerHTML = `<div class="seg" id="seg">${[[1, "Hoje"], [7, "7 dias"], [30, "30 dias"], [90, "90 dias"]].map(([d, l]) => `<button data-d="${d}" class="${d === range ? "is-active" : ""}">${l}</button>`).join("")}</div>`;
    $$("#seg button").forEach((b) => (b.onclick = () => { range = +b.dataset.d; route(); }));
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (range - 1));
    const s = await db.rpc("admin_stats", { p_from: from.toISOString() });
    const conv = pct(s.leads, s.visitors), convWa = pct(s.wa_visitors, s.visitors);
    v.innerHTML = `
      <div class="kpis">
        <div class="kpi"><div class="kpi__l">Visitas</div><div class="kpi__n">${fmt(s.pageviews)}</div><div class="kpi__s">${fmt(s.sessions)} sessões</div></div>
        <div class="kpi"><div class="kpi__l">Visitantes únicos</div><div class="kpi__n">${fmt(s.visitors)}</div><div class="kpi__s">pessoas diferentes</div></div>
        <div class="kpi kpi--hl"><div class="kpi__l">Cliques no WhatsApp</div><div class="kpi__n">${fmt(s.wa_clicks)}</div><div class="kpi__s">${convWa} dos visitantes</div></div>
        <div class="kpi"><div class="kpi__l">Leads captados</div><div class="kpi__n">${fmt(s.leads)}</div><div class="kpi__s">${fmt(s.leads_novos)} aguardando contato</div></div>
        <div class="kpi"><div class="kpi__l">Conversão em lead</div><div class="kpi__n">${conv}</div><div class="kpi__s">visitantes → leads</div></div>
      </div>
      <div class="row row--2">
        <div class="panel"><h3>Tráfego por dia <span class="legend"><span><i style="background:#fff"></i>Visitantes</span><span><i style="background:var(--orange)"></i>Cliques WhatsApp</span><span><i style="background:#3DDC84"></i>Leads</span></span></h3><div id="chart"></div></div>
        <div class="panel"><h3>Origem do tráfego <small>visitantes</small></h3>${bars(s.sources)}</div>
      </div>
      <div class="row row--3">
        <div class="panel"><h3>Produtos mais clicados</h3>${bars(s.top_products)}</div>
        <div class="panel"><h3>Cliques nos catálogos</h3>${bars((s.catalogs || []).map((x) => ({ k: { roupas: "Catálogo de roupas", sneakers: "Catálogo de sneakers" }[x.k] || x.k, n: x.n })))}</div>
        <div class="panel"><h3>Cliques no WhatsApp por botão</h3>${bars(s.wa_buttons.map((x) => ({ k: WA_LABEL[x.k] || x.k, n: x.n })))}</div>
        <div class="panel"><h3>Dispositivos <small>visitantes</small></h3>${bars(s.devices.map((x) => ({ k: { mobile: "Celular", desktop: "Computador", tablet: "Tablet" }[x.k] || x.k, n: x.n })))}</div>
      </div>`;
    drawChart($("#chart"), s.per_day);
  }
  const WA_LABEL = { header: "Topo do site", hero: "Banner principal", flutuante: "Botão flutuante", produto: "Cards de produto", "vitrine-foto": "Vitrine: mandar foto", "cta-final": "Faixa final", footer: "Rodapé", menu: "Menu do celular", "lead-sucesso": "Após cadastro" };
  function bars(list) {
    if (!list || !list.length) return '<p class="empty">Ainda sem dados no período.</p>';
    const max = Math.max(...list.map((x) => x.n));
    return `<div class="bars">${list.slice(0, 8).map((x) => `<div class="bar"><span class="bar__t">${esc(x.k)}</span><span class="bar__n">${fmt(x.n)}</span><span class="bar__b"><i style="width:${(x.n / max) * 100}%"></i></span></div>`).join("")}</div>`;
  }
  function drawChart(el, days) {
    const W = 760, H = 260, P = { l: 34, r: 10, t: 14, b: 26 };
    const series = [["visitors", "#fff"], ["wa", "#EE5B27"], ["leads", "#3DDC84"]];
    const max = Math.max(4, ...days.flatMap((d) => series.map(([k]) => d[k])));
    const nice = Math.ceil(max / 4) * 4;
    const x = (i) => P.l + (days.length === 1 ? (W - P.l - P.r) / 2 : (i / (days.length - 1)) * (W - P.l - P.r));
    const y = (v) => P.t + (1 - v / nice) * (H - P.t - P.b);
    let g = "";
    for (let i = 0; i <= 4; i++) { const v = (nice / 4) * i; g += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#222"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
    const step = Math.ceil(days.length / 8);
    days.forEach((d, i) => { if (i % step === 0 || i === days.length - 1) { const [yy, mm, dd] = String(d.d).split("-"); g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${dd}/${mm}</text>`; } });
    const area = `M${x(0)},${y(0)} ` + days.map((d, i) => `L${x(i)},${y(d.visitors)}`).join(" ") + ` L${x(days.length - 1)},${y(0)} Z`;
    let paths = `<path d="${area}" fill="url(#ga)"/>`;
    series.forEach(([k, c]) => {
      const d = days.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[k])}`).join(" ");
      paths += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.2s cubic-bezier(.22,1,.36,1) forwards"/>`;
      days.forEach((p, i) => { if (days.length <= 31) paths += `<circle cx="${x(i)}" cy="${y(p[k])}" r="2.5" fill="${c}"><title>${p.d}: ${p[k]}</title></circle>`; });
    });
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><style>@keyframes draw{to{stroke-dashoffset:0}}</style>${g}${paths}</svg>`;
  }

  /* ---------------- Leads ---------------- */
  let leadsCache = [];
  async function vLeads(v) {
    $("#topRight").innerHTML = `<button class="btn btn--ghost btn--sm" id="csv">Exportar Excel (CSV)</button>`;
    leadsCache = await db.select("leads", "select=*&order=created_at.desc&limit=2000");
    v.innerHTML = `
      <div class="toolbar">
        <input class="in" id="lq" placeholder="Buscar nome, WhatsApp, e-mail...">
        <select class="in" id="ls"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select>
        <span class="muted" id="lcount"></span>
      </div>
      <div class="tbl-wrap"><table><thead><tr><th>Lead</th><th>WhatsApp</th><th>Procura</th><th>Origem</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody id="ltb"></tbody></table></div>`;
    const draw = () => {
      const q = $("#lq").value.toLowerCase(), st = $("#ls").value;
      const list = leadsCache.filter((l) => (!st || l.status === st) && (!q || [l.nome, l.whatsapp, l.email, l.interesse].join(" ").toLowerCase().includes(q)));
      $("#lcount").textContent = `${list.length} lead(s)`;
      $("#ltb").innerHTML = list.length ? list.map((l) => `
        <tr data-id="${l.id}">
          <td><b>${esc(l.nome)}</b><div class="sub">${esc(l.email || "—")}</div></td>
          <td>${esc(l.whatsapp)}</td>
          <td style="max-width:240px">${esc(l.interesse || "—")}${l.notas ? `<div class="sub">📝 ${esc(l.notas)}</div>` : ""}</td>
          <td>${esc(l.utm_source || "direto")}<div class="sub">${esc({ mobile: "Celular", desktop: "Computador", tablet: "Tablet" }[l.device] || "")}</div></td>
          <td>${dtf.format(new Date(l.created_at))}</td>
          <td><select class="status" data-s="${l.status}">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${k === l.status ? "selected" : ""}>${t}</option>`).join("")}</select></td>
          <td><div class="acts">
            <a class="icon-btn icon-btn--wa" title="Chamar no WhatsApp" target="_blank" rel="noopener" href="https://wa.me/${waNumber(l.whatsapp)}?text=${encodeURIComponent(`Olá, ${l.nome.split(" ")[0]}! Aqui é da 92 factory 🔒 Vi que você se cadastrou no nosso site.`)}">${ICON.wa}</a>
            <button class="icon-btn" data-a="note" title="Observações">${ICON.note}</button>
            <button class="icon-btn icon-btn--del" data-a="del" title="Excluir">${ICON.del}</button>
          </div></td>
        </tr>`).join("") : `<tr><td colspan="7"><div class="empty-big"><b>Nenhum lead ainda.</b>Quando alguém preencher o formulário da Lista VIP, aparece aqui.</div></td></tr>`;
    };
    draw();
    $("#lq").oninput = draw; $("#ls").onchange = draw;
    $("#ltb").addEventListener("change", async (e) => {
      if (!e.target.matches(".status")) return;
      const id = e.target.closest("tr").dataset.id, status = e.target.value;
      e.target.dataset.s = status;
      try { await db.update("leads", `id=eq.${id}`, { status }); leadsCache.find((l) => l.id === id).status = status; toast("Status atualizado"); refreshBadge(); } catch (err) { toast(err.message, true); }
    });
    $("#ltb").addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-a]"); if (!b) return;
      const id = b.closest("tr").dataset.id, lead = leadsCache.find((l) => l.id === id);
      if (b.dataset.a === "del") {
        if (!(await confirmBox(`Excluir o lead ${lead.nome}?`))) return;
        try { await db.remove("leads", `id=eq.${id}`); leadsCache = leadsCache.filter((l) => l.id !== id); draw(); toast("Lead excluído"); refreshBadge(); } catch (err) { toast(err.message, true); }
      } else {
        modal(`<h2>Observações — ${esc(lead.nome)}</h2><textarea class="in" id="nt" rows="6" placeholder="Ex.: quer tamanho 42, orçamento enviado dia 10...">${esc(lead.notas || "")}</textarea><div class="modal__acts"><button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange" id="ns">Salvar</button></div>`, (box, close) => {
          $("#ns", box).onclick = async () => {
            const notas = $("#nt", box).value.trim() || null;
            try { await db.update("leads", `id=eq.${id}`, { notas }); lead.notas = notas; close(); draw(); toast("Observação salva"); } catch (err) { toast(err.message, true); }
          };
        });
      }
    });
    $("#csv").onclick = () => {
      const cols = [["Nome", "nome"], ["WhatsApp", "whatsapp"], ["E-mail", "email"], ["Procura", "interesse"], ["Status", "status"], ["Observações", "notas"], ["Origem", "utm_source"], ["Dispositivo", "device"], ["Data", "created_at"]];
      const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
      const rows = [cols.map((c) => q(c[0])).join(";")].concat(leadsCache.map((l) => cols.map(([, k]) => q(k === "status" ? STATUS[l.status] : k === "created_at" ? dtf.format(new Date(l.created_at)) : l[k])).join(";")));
      const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `leads-92factory-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };
  }

  /* ---------------- Produtos ---------------- */
  let prods = [];
  async function vProducts(v) {
    $("#topRight").innerHTML = `<button class="btn btn--orange btn--sm" id="padd">+ Novo produto</button>`;
    prods = await db.select("products", "select=*&order=ordem.asc,created_at.asc");
    const draw = () => {
      v.innerHTML = prods.length ? `<p class="muted" style="margin:0 0 14px">Use as setas para mudar a ordem na vitrine. Produtos marcados como <b>Destaque</b> aparecem na seção 3D.</p><div class="pgrid">${prods.map((p, i) => `
        <div class="pcard ${p.ativo ? "" : "is-off"}" data-id="${p.id}">
          <div class="pcard__img"><div class="pcard__tags">${p.selo ? `<span class="pill">${esc(p.selo)}</span>` : ""}${p.destaque ? '<span class="pill pill--w">DESTAQUE</span>' : ""}${p.ativo ? "" : '<span class="pill pill--g">OCULTO</span>'}</div><img src="${esc(resolveImg(p.imagem_url))}" alt="" loading="lazy"></div>
          <div class="pcard__b"><div><b>${esc(p.nome)}</b><span>${esc(CATS[p.categoria] || p.categoria)}</span></div>
            <div class="acts">
              <button class="icon-btn" data-a="up" title="Subir" ${i === 0 ? "disabled" : ""}>${ICON.up}</button>
              <button class="icon-btn" data-a="down" title="Descer" ${i === prods.length - 1 ? "disabled" : ""}>${ICON.down}</button>
              <button class="icon-btn" data-a="edit" title="Editar">${ICON.edit}</button>
            </div></div>
        </div>`).join("")}</div>` : `<div class="empty-big"><b>Nenhum produto.</b>Clique em “Novo produto” para começar.</div>`;
    };
    draw();
    $("#padd").onclick = () => productForm(null, async () => { prods = await db.select("products", "select=*&order=ordem.asc,created_at.asc"); draw(); });
    v.onclick = async (e) => {
      const b = e.target.closest("button[data-a]"); if (!b) return;
      const id = b.closest(".pcard").dataset.id, i = prods.findIndex((p) => p.id === id);
      if (b.dataset.a === "edit") return productForm(prods[i], async () => { prods = await db.select("products", "select=*&order=ordem.asc,created_at.asc"); draw(); });
      const j = b.dataset.a === "up" ? i - 1 : i + 1; if (j < 0 || j >= prods.length) return;
      [prods[i], prods[j]] = [prods[j], prods[i]];
      draw();
      try { await Promise.all(prods.map((p, k) => (p.ordem !== k + 1 ? db.update("products", `id=eq.${p.id}`, { ordem: (p.ordem = k + 1) }) : null))); toast("Ordem salva"); } catch (err) { toast(err.message, true); }
    };
  }
  function uploadField(current, folder) {
    return `<label class="upload" id="up"><img src="${esc(resolveImg(current))}" id="upImg" alt=""><div><b>Trocar imagem</b><div class="muted" style="font-size:12px">Clique ou arraste. Ideal: PNG/WebP com fundo transparente, mín. 1000px.</div></div><input type="file" accept="image/*" id="upFile" data-folder="${folder}"></label>`;
  }
  function bindUpload(box, onUrl) {
    const up = $("#up", box), file = $("#upFile", box);
    const send = async (f) => {
      if (!f) return; if (f.size > 8e6) return toast("Imagem muito grande (máx. 8 MB)", true);
      $("#upImg", box).src = URL.createObjectURL(f);
      try { toast("Enviando imagem..."); const url = await storage.upload(f, file.dataset.folder); onUrl(url); toast("Imagem enviada"); } catch (err) { toast(err.message, true); }
    };
    file.onchange = () => send(file.files[0]);
    up.ondragover = (e) => { e.preventDefault(); up.classList.add("is-drag"); };
    up.ondragleave = () => up.classList.remove("is-drag");
    up.ondrop = (e) => { e.preventDefault(); up.classList.remove("is-drag"); send(e.dataTransfer.files[0]); };
  }
  function productForm(p, done) {
    const isNew = !p; p = p || { nome: "", categoria: "moletons", selo: "", imagem_url: "", ativo: true, destaque: false };
    let img = p.imagem_url;
    modal(`<h2>${isNew ? "Novo produto" : "Editar produto"}</h2>
      <div class="stack">
        ${uploadField(img, "produtos")}
        <label class="fl"><span>Nome da peça</span><input id="pn" value="${esc(p.nome)}" maxlength="80" placeholder="Ex.: Hoodie Vintage Bee"></label>
        <div class="form-grid">
          <label class="fl"><span>Categoria</span><select id="pc">${Object.entries(CATS).map(([k, l]) => `<option value="${k}" ${k === p.categoria ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label class="fl"><span>Selo</span><input id="ps" list="selos" value="${esc(p.selo || "")}" maxlength="20" placeholder="Opcional"><datalist id="selos"><option>NEW</option><option>LOTE 01</option><option>RARO</option><option>LIMITED DROP</option></datalist></label>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <label class="chk"><input type="checkbox" id="pa" ${p.ativo ? "checked" : ""}> Visível no site</label>
          <label class="chk"><input type="checkbox" id="pd" ${p.destaque ? "checked" : ""}> Destaque (seção 3D)</label>
        </div>
      </div>
      <div class="modal__acts">
        ${isNew ? "" : '<button class="btn btn--danger" id="pdel" style="margin-right:auto">Excluir</button>'}
        <button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--orange" id="psave">Salvar</button>
      </div>`, (box, close) => {
      bindUpload(box, (u) => (img = u));
      $("#psave", box).onclick = async () => {
        const row = { nome: $("#pn", box).value.trim(), categoria: $("#pc", box).value, selo: $("#ps", box).value.trim().toUpperCase() || null, imagem_url: img, ativo: $("#pa", box).checked, destaque: $("#pd", box).checked };
        if (!row.nome) return toast("Dê um nome à peça", true);
        if (!row.imagem_url) return toast("Envie uma imagem", true);
        try {
          if (isNew) { row.ordem = (prods.length ? Math.max(...prods.map((x) => x.ordem)) : 0) + 1; await db.insert("products", [row]); }
          else await db.update("products", `id=eq.${p.id}`, row);
          close(); toast("Produto salvo"); done();
        } catch (err) { toast(err.message, true); }
      };
      const del = $("#pdel", box);
      if (del) del.onclick = async () => { close(); if (await confirmBox(`Excluir ${p.nome}?`)) { try { await db.remove("products", `id=eq.${p.id}`); toast("Produto excluído"); done(); } catch (err) { toast(err.message, true); } } };
    });
  }

  /* ---------------- Lookbook ---------------- */
  async function vLookbook(v) {
    $("#topRight").innerHTML = `<label class="btn btn--orange btn--sm" style="cursor:pointer">+ Adicionar fotos<input type="file" accept="image/*" multiple id="ladd" hidden></label>`;
    let items = await db.select("lookbook", "select=*&order=ordem.asc,created_at.asc");
    const draw = () => {
      v.innerHTML = `<p class="muted" style="margin:0 0 14px">Fotos de outfits e clientes usando as peças. Enquanto não houver fotos aqui, o site mostra os produtos no carrossel.</p>` + (items.length ? `<div class="lgrid">${items.map((l) => `
        <div class="lcard" data-id="${l.id}"><img src="${esc(l.imagem_url)}" alt="" loading="lazy">
          <div><input class="in" value="${esc(l.legenda || "")}" placeholder="Legenda" data-a="leg"><button class="icon-btn icon-btn--del" data-a="del">${ICON.del}</button></div></div>`).join("")}</div>`
        : `<div class="empty-big"><b>Nenhuma foto no lookbook.</b>Clique em “Adicionar fotos”.</div>`);
    };
    draw();
    $("#ladd").onchange = async (e) => {
      const files = Array.from(e.target.files); if (!files.length) return;
      toast(`Enviando ${files.length} foto(s)...`);
      try {
        let ordem = items.length ? Math.max(...items.map((x) => x.ordem)) : 0;
        for (const f of files) { const url = await storage.upload(f, "lookbook"); await db.insert("lookbook", [{ imagem_url: url, ordem: ++ordem }]); }
        items = await db.select("lookbook", "select=*&order=ordem.asc,created_at.asc"); draw(); toast("Fotos adicionadas");
      } catch (err) { toast(err.message, true); }
    };
    v.onchange = async (e) => {
      if (e.target.dataset.a !== "leg") return;
      const id = e.target.closest(".lcard").dataset.id;
      try { await db.update("lookbook", `id=eq.${id}`, { legenda: e.target.value.trim() || null }); toast("Legenda salva"); } catch (err) { toast(err.message, true); }
    };
    v.onclick = async (e) => {
      const b = e.target.closest("button[data-a=del]"); if (!b) return;
      const id = b.closest(".lcard").dataset.id;
      if (!(await confirmBox("Remover esta foto do lookbook?"))) return;
      try { await db.remove("lookbook", `id=eq.${id}`); items = items.filter((x) => x.id !== id); draw(); toast("Foto removida"); } catch (err) { toast(err.message, true); }
    };
  }

  /* ---------------- Conteúdo ---------------- */
  async function loadSettings() {
    const rows = await db.select("settings", "select=key,value");
    const o = {}; rows.forEach((r) => (o[r.key] = r.value)); return o;
  }
  async function saveSettings(obj) {
    await db.upsert("settings", Object.entries(obj).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() })));
  }
  async function vContent(v) {
    const s = await loadSettings();
    const hero = s.hero || {}, geral = s.geral || {};
    let stats = s.stats || [], faq = s.faq || [];
    const drawStats = () => stats.map((x, i) => `<div class="list-item" data-i="${i}"><div class="form-grid"><label class="fl"><span>Número</span><input type="number" data-k="n" value="${esc(x.n)}"></label><label class="fl"><span>Complemento (ex.: +, %, –40)</span><input data-k="sufixo" value="${esc(x.sufixo)}" maxlength="8"></label><label class="fl full"><span>Legenda</span><input data-k="label" value="${esc(x.label)}" maxlength="40"></label></div><button class="icon-btn icon-btn--del" data-del-stat="${i}">${ICON.del}</button></div>`).join("");
    const drawFaq = () => faq.map((x, i) => `<div class="list-item" data-i="${i}"><div class="stack"><label class="fl"><span>Pergunta</span><input data-k="q" value="${esc(x.q)}"></label><label class="fl"><span>Resposta</span><textarea data-k="a" rows="3">${esc(x.a)}</textarea></label></div><button class="icon-btn icon-btn--del" data-del-faq="${i}">${ICON.del}</button></div>`).join("");
    v.innerHTML = `
      <div class="panel">
        <h3>Banner principal</h3>
        <div class="form-grid">
          <label class="fl"><span>Texto pequeno acima do título</span><input id="hk" value="${esc(hero.kicker)}"></label>
          <label class="fl"><span>Título</span><input id="ht" value="${esc(hero.titulo)}"><small>A última palavra fica em laranja.</small></label>
          <label class="fl full"><span>Subtítulo</span><input id="hs" value="${esc(hero.subtitulo)}"></label>
          <label class="fl"><span>Botão principal (WhatsApp)</span><input id="hc1" value="${esc(hero.cta1)}"></label>
          <label class="fl"><span>Botão secundário</span><input id="hc2" value="${esc(hero.cta2)}"></label>
        </div>
      </div>
      <div class="panel" style="margin-top:14px">
        <h3>Geral</h3>
        <div class="form-grid">
          <label class="fl"><span>Prazo exibido no site</span><input id="gp" value="${esc(geral.prazo)}"></label>
          <label class="fl full"><span>Faixa animada (separe as frases com *)</span><textarea id="gm" rows="2">${esc(geral.marquee)}</textarea></label>
        </div>
      </div>
      <p class="section-t">Números (contadores)</p>
      <div class="stack" id="statsBox">${drawStats()}</div>
      <button class="btn btn--ghost btn--sm" id="addStat" style="margin-top:10px">+ Adicionar número</button>
      <p class="section-t">Perguntas frequentes</p>
      <div class="stack" id="faqBox">${drawFaq()}</div>
      <button class="btn btn--ghost btn--sm" id="addFaq" style="margin-top:10px">+ Adicionar pergunta</button>
      <div class="save-bar"><span class="muted" id="saveMsg"></span><button class="btn btn--orange" id="saveC">Salvar alterações</button></div>`;
    const sync = () => {
      $$("#statsBox .list-item").forEach((el) => { const i = +el.dataset.i; $$("[data-k]", el).forEach((inp) => (stats[i][inp.dataset.k] = inp.dataset.k === "n" ? Number(inp.value) || 0 : inp.value)); });
      $$("#faqBox .list-item").forEach((el) => { const i = +el.dataset.i; $$("[data-k]", el).forEach((inp) => (faq[i][inp.dataset.k] = inp.value)); });
    };
    v.onclick = (e) => {
      const ds = e.target.closest("[data-del-stat]"), df = e.target.closest("[data-del-faq]");
      if (e.target.id === "addStat") { sync(); stats.push({ n: 0, sufixo: "", label: "" }); $("#statsBox").innerHTML = drawStats(); }
      if (e.target.id === "addFaq") { sync(); faq.push({ q: "", a: "" }); $("#faqBox").innerHTML = drawFaq(); }
      if (ds) { sync(); stats.splice(+ds.dataset.delStat, 1); $("#statsBox").innerHTML = drawStats(); }
      if (df) { sync(); faq.splice(+df.dataset.delFaq, 1); $("#faqBox").innerHTML = drawFaq(); }
    };
    $("#saveC").onclick = async () => {
      sync();
      const out = {
        hero: { kicker: $("#hk").value.trim(), titulo: $("#ht").value.trim(), subtitulo: $("#hs").value.trim(), cta1: $("#hc1").value.trim(), cta2: $("#hc2").value.trim() },
        geral: Object.assign({}, geral, { prazo: $("#gp").value.trim(), marquee: $("#gm").value.trim() }),
        stats: stats.filter((x) => x.label), faq: faq.filter((x) => x.q && x.a)
      };
      try { await saveSettings(out); toast("Conteúdo salvo. Já está no site!"); $("#saveMsg").textContent = "Salvo agora"; } catch (err) { toast(err.message, true); }
    };
  }

  /* ---------------- Configurações ---------------- */
  async function vConfig(v) {
    const s = await loadSettings();
    const w = s.whatsapp || {}, g = s.geral || {}, cat = s.catalogos || { roupas: "https://windvane168.x.yupoo.com/", sneakers: "https://yolo66.x.yupoo.com/" };
    v.innerHTML = `
      <div class="panel">
        <h3>WhatsApp</h3>
        <div class="stack">
          <label class="fl"><span>Número (com DDI e DDD)</span><input id="wn" value="${esc(w.numero)}" inputmode="numeric"><small>Ex.: 5521996760833</small></label>
          <label class="fl"><span>Mensagem padrão (botões gerais)</span><textarea id="wm" rows="3">${esc(w.msg_padrao)}</textarea></label>
          <label class="fl"><span>Mensagem dos produtos</span><textarea id="wp" rows="3">${esc(w.msg_produto)}</textarea><small>Use {produto} onde deve entrar o nome da peça.</small></label>
          <div><p class="muted" style="margin:0 0 8px;font-size:12px">Pré-visualização</p><div class="preview-wa"><div id="wprev"></div></div></div>
        </div>
      </div>
      <div class="panel" style="margin-top:14px">
        <h3>Catálogos</h3>
        <div class="form-grid">
          <label class="fl"><span>Catálogo de roupas (link)</span><input id="cr" value="${esc(cat.roupas)}"></label>
          <label class="fl"><span>Catálogo de sneakers (link)</span><input id="cs" value="${esc(cat.sneakers)}"></label>
        </div>
      </div>
      <div class="panel" style="margin-top:14px">
        <h3>Redes sociais</h3>
        <div class="form-grid">
          <label class="fl"><span>Instagram (link)</span><input id="gi" value="${esc(g.instagram)}" placeholder="https://instagram.com/..."></label>
          <label class="fl"><span>TikTok (link)</span><input id="gtk" value="${esc(g.tiktok)}" placeholder="https://tiktok.com/@..."></label>
        </div>
      </div>
      <div class="panel" style="margin-top:14px">
        <h3>Links rastreáveis <small>para saber de onde vêm as visitas</small></h3>
        <p class="muted" style="margin:0 0 10px">Use estes links na bio e nos anúncios. A origem aparece no Dashboard.</p>
        <div class="stack" id="utm"></div>
      </div>
      <div class="save-bar"><button class="btn btn--orange" id="saveW">Salvar</button></div>`;
    const prev = () => ($("#wprev").textContent = $("#wm").value);
    $("#wm").oninput = prev; prev();
    const base = location.origin + location.pathname.replace(/admin\.html$/, "");
    $("#utm").innerHTML = [["Instagram (bio)", "instagram", "bio"], ["TikTok (bio)", "tiktok", "bio"], ["Anúncio Meta", "meta", "ads"], ["Stories", "instagram", "stories"]].map(([l, s1, m]) => {
      const u = `${base}?utm_source=${s1}&utm_medium=${m}`;
      return `<label class="fl"><span>${l}</span><div style="display:flex;gap:8px"><input class="in" readonly value="${esc(u)}"><button class="btn btn--ghost btn--sm" data-copy="${esc(u)}">Copiar</button></div></label>`;
    }).join("");
    $("#utm").onclick = (e) => { const b = e.target.closest("[data-copy]"); if (b) { navigator.clipboard.writeText(b.dataset.copy).then(() => toast("Link copiado")); } };
    $("#saveW").onclick = async () => {
      const numero = $("#wn").value.replace(/\D/g, "");
      if (numero.length < 12) return toast("Número inválido. Inclua 55 + DDD + número.", true);
      try {
        await saveSettings({ whatsapp: { numero, msg_padrao: $("#wm").value.trim(), msg_produto: $("#wp").value.trim() }, geral: Object.assign({}, g, { instagram: $("#gi").value.trim(), tiktok: $("#gtk").value.trim() }), catalogos: { roupas: $("#cr").value.trim(), sneakers: $("#cs").value.trim() } });
        toast("Configurações salvas");
      } catch (err) { toast(err.message, true); }
    };
  }

  /* ---------------- Boot ---------------- */
  (async function boot() {
    const s = await auth.refresh();
    if (!s) return showAuth();
    try { if (await db.rpc("claim_admin")) return startApp(); } catch (e) {}
    await auth.signOut(); showAuth();
  })();
})();
