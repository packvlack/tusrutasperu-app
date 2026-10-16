/* ============================================================
   TUSRUTASPERU — APP.JS
   Comportamientos globales: nav, revelado, tickers, modal, toast.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- ESCAPE HTML (anti-XSS en nombres de corredor) ---------- */
  window.TRPEscape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  };

  /* ---------- NAV MÓVIL ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const burger = document.getElementById("burger");
    const nav = document.getElementById("mainNav");
    if (burger && nav) {
      burger.addEventListener("click", () => {
        const open = nav.classList.toggle("mobile-open");
        burger.textContent = open ? "✕" : "☰";
        burger.setAttribute("aria-expanded", open);
        burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      });
      nav.querySelectorAll("a").forEach(a =>
        a.addEventListener("click", () => {
          nav.classList.remove("mobile-open");
          burger.textContent = "☰";
          burger.setAttribute("aria-label", "Abrir menú");
        })
      );
    }

    /* Marcar enlace activo */
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach(a => {
      const href = a.getAttribute("href");
      if (href === here || (here === "" && href === "index.html")) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
    });

    /* ---------- REVELADO POR SCROLL ---------- */
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));

    /* ---------- TICKERS: duplicar contenido para loop perfecto ---------- */
    document.querySelectorAll(".ticker-inner").forEach(t => {
      t.innerHTML += t.innerHTML;
    });

    /* ---------- AÑO ---------- */
    document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

    /* ---------- EFECTO GLITCH: hover, tap y pulso periódico (móvil) ---------- */
    const glitch = (el) => {
      if (el.classList.contains("glitching")) return;
      el.classList.add("glitching");
      setTimeout(() => el.classList.remove("glitching"), 450);
    };
    document.querySelectorAll("[data-glitch]").forEach(el => {
      el.addEventListener("mouseenter", () => glitch(el));
      el.addEventListener("click", () => glitch(el));
    });
    setInterval(() => {
      document.querySelectorAll("[data-glitch]").forEach(el => {
        if (Math.random() < 0.5) glitch(el);
      });
    }, 7000);

    /* ---------- MODAL: gestión de foco accesible ---------- */
    const _open = window.TRPModal.open;
    const _close = window.TRPModal.close;
    window.TRPModal.open = function (id) {
      window.TRPModal._lastFocus = document.activeElement;
      _open(id);
      const m = document.getElementById(id);
      const target = m && (m.querySelector(".btn-primary") || m.querySelector(".modal-close") || m.querySelector("button"));
      if (target) setTimeout(() => target.focus(), 60);
    };
    window.TRPModal.close = function (id) {
      _close(id);
      if (window.TRPModal._lastFocus && window.TRPModal._lastFocus.focus) {
        window.TRPModal._lastFocus.focus();
      }
    };
  });

  /* ---------- PWA: service worker (offline) ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* ---------- MODAL ---------- */
  window.TRPModal = {
    open(id) {
      const m = document.getElementById(id);
      if (m) { m.classList.add("open"); document.body.style.overflow = "hidden"; }
    },
    close(id) {
      const m = document.getElementById(id);
      if (m) { m.classList.remove("open"); document.body.style.overflow = ""; }
    }
  };
  document.addEventListener("click", (e) => {
    if (e.target.classList && e.target.classList.contains("modal-backdrop")) {
      e.target.classList.remove("open");
      document.body.style.overflow = "";
    }
    const closer = e.target.closest && e.target.closest("[data-close-modal]");
    if (closer) TRPModal.close(closer.getAttribute("data-close-modal"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach(m => {
      m.classList.remove("open"); document.body.style.overflow = "";
    });
  });

  /* ---------- TOAST ---------- */
  window.TRPToast = {
    show(msg, ms = 2600) {
      let t = document.getElementById("trp-toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "trp-toast";
        t.setAttribute("role", "status");
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove("show"), ms);
    }
  };

  /* ---------- RANKING: almacenamiento local ---------- */
  const KEY = "trp_rankings_v1";
  const CRONO_KEY = "trp_crono_v1";
  const TREKS_KEY = "trp_treks_v1";
  window.TRPRanking = {
    all() {
      let mine = [];
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
        mine = Array.isArray(raw) ? raw : [];
      } catch (e) { mine = []; }
      return [...mine, ...TRP.SEED_RESULTS].sort((a, b) => a.totalMs - b.totalMs);
    },
    save(result) {
      let mine = [];
      try { mine = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { mine = []; }
      mine.push(result);
      try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {}
    },
    clearMine() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      try { localStorage.removeItem(CRONO_KEY); } catch (e) {}
      try { localStorage.removeItem(TREKS_KEY); } catch (e) {}
    },
    bestByCheckpoint() {
      const best = {};
      this.all().forEach(r => {
        Object.entries(r.cps || {}).forEach(([slug, ms]) => {
          if (!best[slug] || ms < best[slug].ms) best[slug] = { ms, runner: r.runner, date: r.date };
        });
      });
      return best;
    },
    conquistadores() {
      return this.all().filter(r => TRP.CIRCUIT.every(s => r.cps && r.cps[s] != null));
    },

    /* ----- Contrarreloj por lugar (v1.2): un tiempo por intento ----- */
    cronoAll() {
      try {
        const raw = JSON.parse(localStorage.getItem(CRONO_KEY) || "[]");
        return Array.isArray(raw) ? raw : [];
      } catch (e) { return []; }
    },
    cronoSave(entry) {
      const all = this.cronoAll();
      all.push(entry);
      try { localStorage.setItem(CRONO_KEY, JSON.stringify(all)); } catch (e) {}
    },
    cronoByPlace(slug) {
      return this.cronoAll()
        .filter(r => r.slug === slug && r.ms != null)
        .sort((a, b) => a.ms - b.ms);
    },

    /* ----- Treks completados (v2.12): la colección de 12 checkpoints.
       Completar el trek cronometrado de un lugar marca su checkpoint. ----- */
    treks() {
      try {
        const raw = JSON.parse(localStorage.getItem(TREKS_KEY) || "{}");
        return (raw && typeof raw === "object") ? raw : {};
      } catch (e) { return {}; }
    },
    trekDone(entry) {
      const all = this.treks();
      const prev = all[entry.slug];
      if (!prev || (entry.ms != null && entry.ms < prev.ms)) {
        all[entry.slug] = { ms: entry.ms, date: entry.date, runner: entry.runner };
      }
      try { localStorage.setItem(TREKS_KEY, JSON.stringify(all)); } catch (e) {}
      return all;
    },
    treksCount() { return Object.keys(this.treks()).length; }
  };

  /* ---------- GEO: distancia haversina ---------- */
  window.TRPGps = {
    distM(lat1, lon1, lat2, lon2) {
      const R = 6371000, toRad = d => d * Math.PI / 180;
      const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    },
    supported() { return "geolocation" in navigator; }
  };
})();
