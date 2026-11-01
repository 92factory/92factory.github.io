/* =========================================================
   92 factory — v2: interações, animações, conteúdo e rastreamento
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const isTouch = matchMedia("(hover: none)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- Conteúdo padrão ---------------- */
  const DEFAULTS = {
    whatsapp: {
      numero: "5521996760833",
      msg_padrao: "Olá! Vim pelo site da 92 factory 🔒 e quero fazer um orçamento de importação.",
      msg_produto: "Olá! Vim pelo site da 92 factory 🔒 e tenho interesse na peça: {produto}. Pode me passar um orçamento?"
    },
    hero: { kicker: "BRASIL * RJ — 2026®", titulo: "Você escolhe. A gente traz.", subtitulo: "A 92 factory compra, importa e entrega na sua porta as peças que não se acha fácil.", cta1: "Quero importar", cta2: "Como funciona" },
    geral: { prazo: "35 a 40 dias", instagram: "https://instagram.com/", tiktok: "" },
    catalogos: { roupas: "https://windvane168.x.yupoo.com/", sneakers: "https://yolo66.x.yupoo.com/" },
    stats: [
      { n: 500, sufixo: "+", label: "Pedidos entregues" },
      { n: 35, sufixo: "–40", label: "Dias de prazo médio" },
      { n: 100, sufixo: "%", label: "Pedidos com fotos de QC" },
      { n: 27, sufixo: "", label: "Estados atendidos" }
    ],
    faq: [
      { q: "Como funciona o orçamento?", a: "Você escolhe a peça no nosso catálogo ou manda uma foto/link de qualquer produto pelo WhatsApp. A gente te passa um orçamento fechado com tudo explicado antes de qualquer pagamento." },
      { q: "Qual é o prazo de entrega?", a: "O prazo médio é de 35 a 40 dias, da compra até a sua porta. Você acompanha cada etapa pelo WhatsApp." },
      { q: "O que são as fotos de QC?", a: "Antes de enviar, a gente fotografa a sua peça de perto (costura, etiqueta, tamanho, detalhes) e te manda. Só segue para o envio depois que você aprovar." },
      { q: "Posso pedir uma peça que não está no site?", a: "Pode. Esse é o ponto da 92: manda a foto ou a referência e a gente encontra pra você." },
      { q: "Entregam em todo o Brasil?", a: "Sim. Entregamos em todos os estados, direto no endereço que você escolher." }
    ],
    products: [
      ["Jordan 1 Low Travis Scott Velvet Brown", "tenis", "LIMITED", "travis-velvet"],
      ["Hoodie Valley", "moletons", "LOTE 01", "hoodie-valley"],
      ["Jaqueta Varsity Supreme", "jaquetas", "RARO", "varsity-supreme"],
      ["T-shirt Valley", "camisetas", "NEW", "tshirt-valley"],
      ["Jordan 1 Low Travis Scott Pink", "tenis", "NEW", "travis-pink"],
      ["Hoodie Supreme Box Logo", "moletons", null, "hoodie-supreme"],
      ["Jordan 1 Low Travis Scott Mocha", "tenis", "RARO", "travis-mocha"],
      ["Zip Hoodie Enfants Riches Déprimés", "moletons", null, "zip-erd"],
      ["Jordan 4 Levi's", "tenis", "LOTE 01", "jordan4-levis"],
      ["Hoodie Enfants Riches Déprimés", "moletons", null, "hoodie-erd"],
      ["On x Loewe Cloudtilt", "tenis", "NEW", "on-loewe"],
      ["On Cloudtilt", "tenis", null, "on-cloud"]
    ].map(([nome, categoria, selo, f]) => ({ nome, categoria, selo, imagem_url: `img/p/${f}-sm.webp` })),
    lookbook: []
  };
  const S = JSON.parse(JSON.stringify(DEFAULTS));
  const CAT = { tenis: "Tênis", moletons: "Moletom", camisetas: "Camiseta", jaquetas: "Jaqueta", acessorios: "Acessório" };

  /* ---------------- Rastreamento ---------------- */
  const T = (() => {
    const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 36);
    let vid, sid;
    try { vid = localStorage.getItem("nf_vid") || rid(); localStorage.setItem("nf_vid", vid); } catch (e) { vid = rid(); }
    try { sid = sessionStorage.getItem("nf_sid") || rid(); sessionStorage.setItem("nf_sid", sid); } catch (e) { sid = rid(); }
    const qs = new URLSearchParams(location.search);
    const w = innerWidth;
    const device = /Mobi|Android|iPhone/i.test(navigator.userAgent) || w < 640 ? "mobile" : (w < 1024 ? "tablet" : "desktop");
    const ref = document.referrer || "";
    let source = qs.get("utm_source");
    if (!source) {
      let host = "";
      try { host = ref ? new URL(ref).hostname : ""; } catch (e) {}
      if (!host || host === location.hostname) source = "direto";
      else if (/instagram/.test(host)) source = "instagram";
      else if (/tiktok/.test(host)) source = "tiktok";
      else if (/google\./.test(host)) source = "google";
      else if (/facebook|fb\./.test(host)) source = "facebook";
      else if (/youtube|youtu\.be/.test(host)) source = "youtube";
      else if (/whatsapp|wa\.me/.test(host)) source = "whatsapp";
      else if (/t\.co|twitter|x\.com/.test(host)) source = "x/twitter";
      else source = host.replace(/^www\./, "");
    }
    try {
      if (qs.get("utm_source")) sessionStorage.setItem("nf_src", source);
      else if (sessionStorage.getItem("nf_src")) source = sessionStorage.getItem("nf_src");
    } catch (e) {}
    const ctx = { visitor_id: vid, session_id: sid, path: location.pathname, referrer: ref.slice(0, 500) || null, source: (source || "direto").slice(0, 80), utm_medium: qs.get("utm_medium"), utm_campaign: qs.get("utm_campaign"), device };
    function track(type, label) {
      if (!window.NF) return;
      NF.db.insert("events", [Object.assign({ type, label: label ? String(label).slice(0, 200) : null }, ctx)]).catch(() => {});
    }
    return { track, ctx };
  })();

  /* ---------------- WhatsApp ---------------- */
  const waLink = (msg) => `https://wa.me/${S.whatsapp.numero}?text=${encodeURIComponent(msg)}`;
  const productMsg = (name) => (S.whatsapp.msg_produto || DEFAULTS.whatsapp.msg_produto).replace("{produto}", name);
  function bindWA(root = document) {
    $$("[data-wa]", root).forEach((a) => {
      a.href = waLink(S.whatsapp.msg_padrao); a.target = "_blank"; a.rel = "noopener";
      if (!a._wa) { a._wa = true; a.addEventListener("click", () => T.track("wa_click", a.dataset.wa)); }
    });
  }

  /* ---------------- Preloader ---------------- */
  function preloader() {
    const pl = $("#preloader"), bar = $("#plBar");
    const start = performance.now(), min = reduce ? 0 : 1300;
    let p = 0, done = false;
    function tick(t) {
      const ready = document.readyState === "complete" || t - start > 2500;
      const target = Math.min(ready ? 1 : 0.9, (t - start) / min);
      p = lerp(p, target, 0.12);
      bar.style.transform = `scaleX(${p})`;
      if (ready && t - start > min && p > 0.985) return finish();
      requestAnimationFrame(tick);
    }
    function finish() {
      if (done) return; done = true;
      bar.style.transform = "scaleX(1)";
      pl.classList.add("is-done"); document.body.classList.remove("is-loading");
      setTimeout(() => $$(".hero .rv").forEach((e) => e.classList.add("is-in")), 150);
      setTimeout(() => $(".wa-float").classList.add("is-on"), 1200);
      setTimeout(() => pl.remove(), 1000);
    }
    requestAnimationFrame(tick);
    setTimeout(finish, 5000);
  }

  /* ---------------- Reveal ---------------- */
  const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  const observe = (root = document) => $$(".rv:not(.is-in)", root).forEach((el) => { if (!el.closest(".hero")) io.observe(el); });

  /* ---------------- Header ---------------- */
  function header() {
    const h = $("#header"); let last = 0;
    const links = $$(".header__nav a");
    const sections = links.map((a) => $(a.getAttribute("href")));
    addEventListener("scroll", () => {
      const y = scrollY;
      h.classList.toggle("is-hidden", y > last && y > 500 && !$("#mmenu").classList.contains("is-open"));
      last = y;
      let cur = -1;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
      links.forEach((a, i) => a.classList.toggle("is-active", i === cur));
    }, { passive: true });
    const burger = $("#burger"), mm = $("#mmenu");
    const toggle = (open) => {
      burger.classList.toggle("is-open", open); mm.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open); mm.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle(!mm.classList.contains("is-open")));
    $$("a", mm).forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---------------- Cursor + magnético ---------------- */
  function cursor() {
    if (isTouch) return;
    const c = $("#cursor"); let x = -100, y = -100, cx = x, cy = y;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; c.classList.add("is-on"); }, { passive: true });
    document.addEventListener("mouseleave", () => c.classList.remove("is-on"));
    (function loop() { cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22); c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", (e) => c.classList.toggle("is-hover", !!e.target.closest("a, button, input, textarea, label, .pc")));
  }
  function magnetic(root = document) {
    if (isTouch) return;
    $$(".magnetic", root).forEach((el) => {
      if (el._mag) return; el._mag = true;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------------- Hero: parallax + flutuação + 3D ---------------- */
  function hero() {
    const frame = $("#heroFrame");
    const items = $$("[data-depth]", frame).map((el) => ({
      el, d: +el.dataset.depth,
      rot: el.classList.contains("hero__item--front") ? -14 : el.classList.contains("hero__item--back") ? 16 : 0,
      ph: Math.random() * Math.PI * 2,
      main: el.id === "heroMain"
    }));
    let mx = 0, my = 0, tx = 0, ty = 0, sy = 0, visible = true;
    if (!isTouch) frame.addEventListener("mousemove", (e) => {
      const r = frame.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
    });
    frame.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(frame);
    if (isTouch && window.DeviceOrientationEvent) {
      addEventListener("deviceorientation", (e) => { if (e.gamma != null) { tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 40) / 80)); } });
    }
    function loop(t) {
      if (visible && !reduce) {
        mx = lerp(mx, tx, 0.06); my = lerp(my, ty, 0.06); sy = scrollY;
        const time = t / 1000;
        items.forEach((it) => {
          const fl = it.el.classList.contains("hero__item") ? Math.sin(time * 0.9 + it.ph) * 10 : 0;
          const px = -mx * 60 * it.d, py = -my * 40 * it.d + fl - sy * 0.12 * it.d;
          if (it.main) it.el.style.transform = `translate3d(${px}px, ${py}px, 0) perspective(1000px) rotateY(${mx * 22}deg) rotateX(${-my * 14}deg)`;
          else it.el.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${it.rot + mx * 6}deg)`;
        });
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  function renderHero() {
    const h = S.hero;
    $("#heroKicker").textContent = h.kicker || DEFAULTS.hero.kicker;
    const t = (h.titulo || DEFAULTS.hero.titulo).trim();
    const parts = t.split(/(?<=[.!?])\s+/);
    $("#heroTitle").innerHTML = parts.map(esc).join("<br>");
    $("#heroSub").textContent = h.subtitulo || DEFAULTS.hero.subtitulo;
    $("#heroCta1 span").textContent = h.cta1 || DEFAULTS.hero.cta1;
    $("#heroCta2").textContent = h.cta2 || DEFAULTS.hero.cta2;
    $$(".js-prazo").forEach((e) => (e.textContent = S.geral.prazo || DEFAULTS.geral.prazo));
    if (S.geral.instagram) $("#igLink").href = S.geral.instagram;
    const c = S.catalogos || DEFAULTS.catalogos;
    if (c.roupas) $("#catRoupas").href = c.roupas;
    if (c.sneakers) $("#catSneakers").href = c.sneakers;
  }
  function catalogs() {
    $$(".cat").forEach((a) => a.addEventListener("click", () => T.track("catalog_click", a.dataset.cat)));
    if (isTouch) return;
    $$(".cat").forEach((a) => {
      a.addEventListener("mousemove", (e) => { const r = a.getBoundingClientRect(); a.style.transform = `translateY(-8px) perspective(1200px) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 6}deg) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 6}deg)`; });
      a.addEventListener("mouseleave", () => (a.style.transform = ""));
    });
  }

  /* ---------------- Sobre: palavras acendem com a rolagem ---------------- */
  function about() {
    const el = $("#aboutText");
    const HL = ["compra", "e", "importação.", "fotos", "de", "QC"];
    const words = el.textContent.trim().split(/\s+/);
    let hlRun = [];
    el.innerHTML = words.map((w, i) => {
      const hl = (w === "compra" && words[i + 1] === "e" && words[i + 2] === "importação.") || (w === "e" && words[i - 1] === "compra" && words[i + 1] === "importação.") || (w === "importação." && words[i - 1] === "e") || (w === "fotos" && words[i + 1] === "de") || (w === "de" && words[i - 1] === "fotos" && words[i + 1] === "QC") || (/^QC/.test(w) && words[i - 1] === "de");
      return `<span class="wd${hl ? " hl" : ""}">${esc(w)}</span>`;
    }).join(" ");
    const spans = $$(".wd", el);
    scrollFx.push(() => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const n = Math.round(p * spans.length * 1.15);
      spans.forEach((s, i) => s.classList.toggle("on", i < n));
    });
  }

  /* ---------------- Scroll FX ---------------- */
  const scrollFx = [];
  function runScrollFx() {
    let tick = false;
    const run = () => { scrollFx.forEach((f) => f()); tick = false; };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener("resize", run); run();
  }

  /* ---------------- Como funciona ---------------- */
  function how() {
    const steps = $$("#howList .step"), num = $("#howN"), bar = $("#howBar");
    let cur = -1;
    const set = (i) => {
      if (i === cur) return; cur = i;
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      num.classList.add("flip");
      setTimeout(() => { num.textContent = String(i + 1).padStart(2, "0"); num.classList.remove("flip"); }, 220);
      bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
    };
    scrollFx.push(() => {
      const mid = innerHeight * 0.5; let best = 0, bd = Infinity;
      steps.forEach((s, i) => { const r = s.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
      set(best);
    });
  }

  /* ---------------- Manda a foto: chat animado ---------------- */
  function chat() {
    const box = $("#chat"), card = $("#floatCard"), status = $("#phStatus");
    const pics = ["travis-pink", "hoodie-valley", "varsity-supreme"];
    let round = 0, running = false, timers = [];
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));
    const add = (html, cls) => { const d = document.createElement("div"); d.className = `msg ${cls}`; d.innerHTML = html; box.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in"))); while (box.children.length > 6) box.firstChild.remove(); return d; };
    const now = () => new Date().toTimeString().slice(0, 5);
    async function play() {
      if (running) return; running = true;
      while (running) {
        const pic = pics[round++ % pics.length];
        box.innerHTML = ""; card.classList.remove("in");
        await wait(500);
        add(`<div class="msg__img"><img src="img/p/${pic}-sm.webp" alt=""></div>Vi essa peça num vídeo. Consegue trazer? <small>${now()} ✓✓</small>`, "msg--me");
        await wait(1300); status.textContent = "digitando...";
        const typing = add("<i></i><i></i><i></i>", "msg--them msg--typing");
        await wait(1600); typing.remove(); status.textContent = "online";
        add(`Consegue sim! 🔒 Já encontramos a sua peça. <small>${now()}</small>`, "msg--them");
        card.classList.add("in");
        await wait(1200); status.textContent = "digitando...";
        const typing2 = add("<i></i><i></i><i></i>", "msg--them msg--typing");
        await wait(1400); typing2.remove(); status.textContent = "online";
        add(`<div class="msg__quote"><b>Orçamento 92 factory</b><br>Peça + importação + entrega<br>Prazo: ${esc(S.geral.prazo || "35 a 40 dias")}</div>Te mando as fotos de QC antes do envio ✅ <small>${now()}</small>`, "msg--them");
        await wait(1500);
        add(`Fechado! 🔥 <small>${now()} ✓✓</small>`, "msg--me");
        await wait(4200);
      }
    }
    const stop = () => { running = false; timers.forEach(clearTimeout); timers = []; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.3 }).observe($("#phone"));
    if (!isTouch) {
      const ph = $("#phone"), wrap = $(".phone-wrap");
      wrap.addEventListener("mousemove", (e) => { const r = wrap.getBoundingClientRect(); ph.style.transform = `rotateY(${((e.clientX - r.left) / r.width - 0.5) * 18}deg) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 10}deg)`; });
      wrap.addEventListener("mouseleave", () => (ph.style.transform = ""));
    }
  }

  /* ---------------- Peças: trilho infinito ---------------- */
  let railState = null;
  function renderRail() {
    const track = $("#railTrack");
    const card = (p) => `
      <article class="pc">
        <div class="pc__media">${p.selo ? `<span class="pc__tag${/LIMITED|RARO/i.test(p.selo) ? " pc__tag--o" : ""}">${esc(p.selo)}</span>` : ""}<img src="${esc(p.imagem_url)}" alt="${esc(p.nome)}" loading="lazy" draggable="false"></div>
        <div class="pc__b"><div><h3 class="pc__name">${esc(p.nome)}</h3><p class="pc__cat">${esc(CAT[p.categoria] || p.categoria)}</p></div>
          <a class="pc__go" href="${waLink(productMsg(p.nome))}" target="_blank" rel="noopener" aria-label="Pedir ${esc(p.nome)} no WhatsApp" data-p="${esc(p.nome)}"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></a></div>
      </article>`;
    const html = S.products.map(card).join("");
    track.innerHTML = html + html;
    $$(".pc__go", track).forEach((a) => a.addEventListener("click", (e) => {
      if (railState && railState.moved) { e.preventDefault(); return; }
      T.track("product_click", a.dataset.p); T.track("wa_click", "produto");
    }));
  }
  function rail() {
    const r = $("#rail"), track = $("#railTrack");
    const st = (railState = { x: 0, v: -0.45, drag: false, sx: 0, ox: 0, moved: false, hover: false, vis: false });
    r.addEventListener("mouseenter", () => (st.hover = true));
    r.addEventListener("mouseleave", () => (st.hover = false));
    new IntersectionObserver(([e]) => (st.vis = e.isIntersecting)).observe(r);
    r.addEventListener("pointerdown", (e) => { st.drag = true; st.moved = false; st.sx = e.clientX; st.ox = st.x; r.classList.add("is-drag"); });
    addEventListener("pointermove", (e) => { if (!st.drag) return; const dx = e.clientX - st.sx; if (Math.abs(dx) > 5) st.moved = true; st.x = st.ox + dx; });
    addEventListener("pointerup", () => { st.drag = false; r.classList.remove("is-drag"); setTimeout(() => (st.moved = false), 50); });
    (function loop() {
      const half = track.scrollWidth / 2;
      if (st.vis && !st.drag && !reduce) st.x += st.hover ? st.v * 0.15 : st.v;
      if (half > 0) { if (st.x <= -half) st.x += half; if (st.x > 0) st.x -= half; }
      track.style.transform = `translate3d(${st.x}px,0,0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- Lookbook (só se houver) ---------------- */
  function renderLook() {
    const sec = $("#lookbook");
    if (!S.lookbook.length) { sec.hidden = true; return; }
    sec.hidden = false;
    $("#lookGrid").innerHTML = S.lookbook.slice(0, 8).map((l) => `<figure class="rv"><img src="${esc(l.imagem_url)}" alt="${esc(l.legenda || "Lookbook 92 factory")}" loading="lazy"></figure>`).join("");
    observe(sec);
  }

  /* ---------------- Números ---------------- */
  function renderStats() {
    const el = $("#stats");
    el.innerHTML = S.stats.map((s) => `<div class="stat rv"><div class="stat__n"><b data-n="${+s.n || 0}">0</b><span>${esc(s.sufixo)}</span></div><div class="stat__l">${esc(s.label)}</div></div>`).join("");
    const cio = new IntersectionObserver((en) => en.forEach((e) => {
      if (!e.isIntersecting) return; cio.unobserve(e.target); e.target.classList.add("is-in");
      const b = $("b", e.target), n = +b.dataset.n, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1600); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: 0.4 });
    $$(".stat", el).forEach((s) => cio.observe(s));
  }

  /* ---------------- FAQ ---------------- */
  function renderFaq() {
    $("#faqList").innerHTML = S.faq.map((f, i) => `
      <div class="qa rv"><button class="qa__q" aria-expanded="false" aria-controls="qa${i}"><span>${esc(f.q)}</span><span class="qa__ic"></span></button>
      <div class="qa__a" id="qa${i}" role="region"><div><p>${esc(f.a)}</p></div></div></div>`).join("");
    $$(".qa").forEach((qa, i) => {
      qa.style.transitionDelay = `${i * 0.05}s`;
      $(".qa__q", qa).addEventListener("click", () => {
        const open = !qa.classList.contains("is-open");
        $$(".qa").forEach((x) => { x.classList.remove("is-open"); $(".qa__q", x).setAttribute("aria-expanded", "false"); });
        qa.classList.toggle("is-open", open); $(".qa__q", qa).setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------------- Formulário de lead ---------------- */
  function leadForm() {
    const f = $("#leadForm"), w = $("#fWhats");
    w.addEventListener("input", () => {
      const d = w.value.replace(/\D/g, "").slice(0, 11);
      w.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = $("#fNome").value.trim(), whats = w.value.replace(/\D/g, ""), email = $("#fEmail").value.trim(), interesse = $("#fInteresse").value.trim(), consent = $("#fConsent").checked;
      let ok = true;
      const mark = (id, bad) => { $(id).closest(".field").classList.toggle("has-err", bad); if (bad) ok = false; };
      mark("#fNome", nome.length < 2); mark("#fWhats", whats.length < 10); mark("#fEmail", !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      $(".err--consent").classList.toggle("show", !consent); if (!consent) ok = false;
      if (!ok) return;
      const btn = $("#leadBtn"); btn.classList.add("is-loading"); $("#formMsg").textContent = "";
      try {
        await NF.db.insert("leads", [{ nome, whatsapp: "+55" + whats, email: email || null, interesse: interesse || null, consentimento: true, utm_source: T.ctx.source, utm_medium: T.ctx.utm_medium, utm_campaign: T.ctx.utm_campaign, referrer: T.ctx.referrer, device: T.ctx.device }]);
        T.track("lead", "formulario");
        f.classList.add("is-sent"); $("#formOk").setAttribute("aria-hidden", "false");
      } catch (err) {
        $("#formMsg").textContent = "Não foi possível enviar agora. Tente de novo ou chame a gente no WhatsApp.";
      } finally { btn.classList.remove("is-loading"); }
    });
  }

  /* ---------------- Banco ---------------- */
  async function loadRemote() {
    if (!window.NF) return false;
    try {
      const [settings, products, lookbook] = await Promise.all([
        NF.db.select("settings", "select=key,value"),
        NF.db.select("products", "select=nome,categoria,selo,imagem_url,destaque,ordem&ativo=eq.true&order=ordem.asc,created_at.asc"),
        NF.db.select("lookbook", "select=imagem_url,legenda,ordem&order=ordem.asc,created_at.asc")
      ]);
      (settings || []).forEach((s) => { if (s.key in S) S[s.key] = Array.isArray(DEFAULTS[s.key]) ? s.value : Object.assign({}, DEFAULTS[s.key], s.value); });
      if (products && products.length) S.products = products;
      S.lookbook = lookbook || [];
      return true;
    } catch (e) { return false; }
  }

  function renderAll() { renderHero(); renderRail(); renderLook(); renderStats(); renderFaq(); bindWA(); observe(); magnetic(); }

  /* ---------------- Init ---------------- */
  preloader(); header(); cursor(); hero(); about(); how(); catalogs(); chat(); rail(); leadForm();
  renderAll(); runScrollFx();
  T.track("pageview");
  loadRemote().then((ok) => { if (ok) renderAll(); });
})();
