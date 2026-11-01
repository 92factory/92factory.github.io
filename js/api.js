/* Cliente mínimo do Supabase (REST + Auth + Storage), sem dependências. */
(function () {
  const { SUPABASE_URL: URL_, SUPABASE_KEY: KEY } = window.NF_CONFIG;
  const SESSION_KEY = "nf_admin_session";

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function setSession(s) {
    try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  async function refreshIfNeeded() {
    const s = getSession();
    if (!s) return null;
    if (s.expires_at && Date.now() / 1000 < s.expires_at - 60) return s;
    const r = await fetch(`${URL_}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { setSession(null); return null; }
    const ns = await r.json();
    setSession(ns);
    return ns;
  }

  async function headers(extra) {
    const s = await refreshIfNeeded();
    return Object.assign({
      apikey: KEY,
      Authorization: `Bearer ${s ? s.access_token : KEY}`,
      "Content-Type": "application/json"
    }, extra || {});
  }

  async function req(path, opts) {
    const r = await fetch(`${URL_}${path}`, opts);
    const txt = await r.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
    if (!r.ok) {
      const msg = (data && (data.message || data.msg || data.error_description || data.error)) || `Erro ${r.status}`;
      const err = new Error(msg); err.status = r.status; err.data = data; throw err;
    }
    return data;
  }

  const db = {
    async select(table, query) {
      return req(`/rest/v1/${table}?${query || "select=*"}`, { headers: await headers() });
    },
    async insert(table, rows, { returning = false } = {}) {
      return req(`/rest/v1/${table}`, {
        method: "POST",
        headers: await headers({ Prefer: returning ? "return=representation" : "return=minimal" }),
        body: JSON.stringify(rows)
      });
    },
    async update(table, match, values) {
      return req(`/rest/v1/${table}?${match}`, {
        method: "PATCH",
        headers: await headers({ Prefer: "return=representation" }),
        body: JSON.stringify(values)
      });
    },
    async upsert(table, rows) {
      return req(`/rest/v1/${table}`, {
        method: "POST",
        headers: await headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
        body: JSON.stringify(rows)
      });
    },
    async remove(table, match) {
      return req(`/rest/v1/${table}?${match}`, { method: "DELETE", headers: await headers() });
    },
    async rpc(fn, args) {
      return req(`/rest/v1/rpc/${fn}`, { method: "POST", headers: await headers(), body: JSON.stringify(args || {}) });
    }
  };

  const auth = {
    session: getSession,
    async signIn(email, password) {
      const s = await req(`/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      setSession(s);
      return s;
    },
    async signUp(email, password) {
      const r = await req(`/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (r && r.access_token) setSession(r);
      return r;
    },
    async signOut() {
      const s = getSession();
      if (s) {
        try { await fetch(`${URL_}/auth/v1/logout`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } }); } catch (e) {}
      }
      setSession(null);
    },
    refresh: refreshIfNeeded
  };

  const storage = {
    async upload(file, folder) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const name = `${folder || "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const s = await refreshIfNeeded();
      const r = await fetch(`${URL_}/storage/v1/object/site/${name}`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${s ? s.access_token : KEY}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
        body: file
      });
      if (!r.ok) throw new Error("Falha no upload da imagem");
      return `${URL_}/storage/v1/object/public/site/${name}`;
    }
  };

  window.NF = { db, auth, storage };
})();
