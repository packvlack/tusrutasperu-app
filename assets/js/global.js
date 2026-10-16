/* ============================================================
   TUSRUTASPERU — GLOBAL.JS (v2.0)
   Cliente del ranking global (Supabase REST, sin dependencias).
   Lee/escribe las tablas global_circuit y global_crono.
   Si no hay claves en config.js, todo queda en modo local.
   ============================================================ */
(function () {
  "use strict";

  const cfg = () => window.TRP_CONFIG || {};

  function configured() {
    const c = cfg();
    return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
  }

  function base() {
    return cfg().SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/";
  }

  function headers() {
    const k = cfg().SUPABASE_ANON_KEY;
    return {
      "apikey": k,
      "Authorization": "Bearer " + k,
      "Content-Type": "application/json"
    };
  }

  async function req(path, opts) {
    const r = await fetch(base() + path, opts);
    if (!r.ok) throw new Error("global:" + r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  }

  /* ---------- Seguridad: tiempos mínimos anti-trampa ----------
     Solo aplican a tiempos reales (demo queda libre para pruebas).
     Los mismos límites viven en la base de datos (supabase-seguridad.sql). */
  const MIN_CRONO_MS = 600000;      // 10 min: ninguna contrarreloj real baja de esto
  const MIN_CIRCUIT_MS = 21600000;  // 6 h: ningún circuito real baja de esto

  function plausible(type, ms, demo) {
    if (demo) return true;
    ms = Number(ms) || 0;
    return type === "crono" ? ms >= MIN_CRONO_MS : ms >= MIN_CIRCUIT_MS;
  }

  /* ---------- Capa 2: veredicto del track ----------
     a = {verdict, reasons, avgKmh, ...} (lo calcula TRPTrack.analyze()).
     "rechazado" bloquea la publicación; "revisar" la marca; el resto pasa.
     La base de datos aplica la misma regla con los números crudos
     (supabase-antitrampa.sql): el servidor es la autoridad final. */
  function cheatCheck(type, ms, demo, a) {
    if (demo) return { ok: true };
    if (!plausible(type, ms, demo)) return { ok: false, reason: "min" };
    a = a || {};
    if (a.verdict === "rechazado") {
      return { ok: false, reason: "track", detail: (a.reasons || []).join("; ") };
    }
    return { ok: true, verdict: a.verdict || "sin-datos" };
  }

  /* Columnas del track que viajan al servidor (capa 3) */
  function trackCols(p) {
    p = p || {};
    return {
      track_km: p.trackKm != null ? Number(p.trackKm) : null,
      track_points: p.trackPoints != null ? Number(p.trackPoints) : null,
      avg_speed_kmh: p.avgKmh != null ? Number(p.avgKmh) : null,
      max_seg_kmh: p.maxSegKmh != null ? Number(p.maxSegKmh) : null,
      teleports: p.teleports != null ? Number(p.teleports) : null,
      verdict: ["ok", "revisar", "rechazado"].includes(p.verdict) ? p.verdict : "sin-datos"
    };
  }

  window.TRPGlobal = {
    configured,
    plausible,
    cheatCheck,

    /* Subir un resultado del circuito: {runner, totalMs, cps, date, demo, ...track} */
    submitCircuit(res) {
      const chk = cheatCheck("circuit", res.totalMs, res.demo, res);
      if (!chk.ok) {
        const e = new Error(chk.reason === "track" ? "track inverosímil: " + (chk.detail || "") : "tiempo inverosímil");
        e.cheatReason = chk.reason;
        return Promise.reject(e);
      }
      return req("global_circuit", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(Object.assign({
          runner: String(res.runner).slice(0, 16),
          total_ms: res.totalMs,
          cps: res.cps || {},
          date: res.date,
          demo: !!res.demo
        }, trackCols(res)))
      });
    },

    /* Subir una contrarreloj: {runner, slug, ms, date, demo, ...track} */
    submitCrono(e) {
      const chk = cheatCheck("crono", e.ms, e.demo, e);
      if (!chk.ok) {
        const err = new Error(chk.reason === "track" ? "track inverosímil: " + (chk.detail || "") : "tiempo inverosímil");
        err.cheatReason = chk.reason;
        return Promise.reject(err);
      }
      return req("global_crono", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(Object.assign({
          runner: String(e.runner).slice(0, 16),
          slug: e.slug,
          ms: e.ms,
          date: e.date,
          demo: !!e.demo
        }, trackCols(e)))
      });
    },

    /* Reportar un tiempo sospechoso: {tabla: 'circuit'|'crono', runner, refMs, slug, reason} */
    report(rep) {
      return req("global_reports", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          tabla: rep.tabla === "crono" ? "crono" : "circuit",
          runner: String(rep.runner).slice(0, 16),
          ref_ms: Number(rep.refMs) || 0,
          slug: rep.slug ? String(rep.slug).slice(0, 40) : null,
          reason: String(rep.reason || "").slice(0, 120)
        })
      });
    },

    /* Tablas globales (ordenadas por la base de datos) */
    circuitBoard(limit) {
      return req(`global_circuit?select=runner,total_ms,date,demo,verdict&order=total_ms.asc&limit=${limit || 50}`,
        { headers: headers() });
    },
    cronoBoard(slug, limit) {
      return req(`global_crono?select=runner,ms,date,demo,verdict&slug=eq.${encodeURIComponent(slug)}&order=ms.asc&limit=${limit || 50}`,
        { headers: headers() });
    }
  };

  /* ---------- Botón "Publicar en ranking global" (modal de meta) ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnPublishGlobal");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const d = window.__trpGlobalData;
      if (!d) { TRPToast.show("Sin resultado para publicar todavía."); return; }
      if (!configured()) {
        TRPToast.show("El ranking global se activa pronto. Tu tiempo quedó guardado local.");
        return;
      }
      btn.disabled = true;
      try {
        if (d.type === "circuit") await TRPGlobal.submitCircuit(d.payload);
        else await TRPGlobal.submitCrono(d.payload);
        btn.textContent = "✔ Publicado en el ranking global";
        TRPToast.show("🌐 ¡Tiempo publicado para todo el Perú!");
      } catch (e) {
        btn.disabled = false;
        const msg = String((e && e.message) || "");
        const trackCheat = msg.includes("track inveros");
        const minCheat = msg.includes("tiempo inveros");
        TRPToast.show(trackCheat
          ? "⛔ El track GPS muestra anomalías (" + msg.replace("track inverosímil: ", "") + "). No se puede publicar."
          : minCheat
            ? "Ese tiempo está bajo el mínimo permitido. ¿Probabas en modo demo?"
            : "No se pudo publicar. Revisa tu conexión e inténtalo de nuevo.");
      }
    });
  });
})();
