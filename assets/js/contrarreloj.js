/* ============================================================
   TUSRUTASPERU — TREK.JS (v2.12)
   Modo "Trek cronometrado por lugar": el cronómetro arranca en la
   comunidad de partida de cada lugar (geocerca GPS) y se detiene
   en el lugar. Tiempos por lugar en ranking local.
   El trek persiste en localStorage: sobrevive a recargas.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const RACE_KEY = "trp_crono_race_v1";
  const FINISH_GEOFENCE_M = 1200; // igual que el circuito: coords aprox.

  const state = {
    runner: null,
    gpsOn: false,
    demo: false,
    watchId: null,
    slug: null,
    place: null,
    inStartZone: false,
    startDist: null,
    racing: false,
    startTime: 0,
    timerId: null,
    finished: false,
    gpsErrorShown: false
  };

  const esc = (s) => window.TRPEscape ? TRPEscape(s) : String(s);

  /* ---------- Modo: pestañas ---------- */
  const params = new URLSearchParams(location.search);
  const modoParam = params.get("modo");
  /* v2.12: el modo es "trek" (se acepta "crono" como alias de enlaces viejos).
     Sin pestañas: esta página es solo trek cronometrado. */
  const isCrono = modoParam === "trek" || modoParam === "crono" || !modoParam;

  function setModeUI() {
    /* v2.12: sin pestañas; si los elementos existen (compat), se ajustan. */
    const mc = $("modeCircuito"), mt = $("modeCrono");
    const tc = $("tabCircuito"), tt = $("tabCrono");
    if (mc) mc.hidden = isCrono;
    if (mt) mt.hidden = !isCrono;
    if (tc) tc.classList.toggle("btn-dark", !isCrono);
    if (tt) tt.classList.toggle("btn-dark", isCrono);
  }
  const _tc = $("tabCircuito"), _tt = $("tabCrono");
  if (_tc) _tc.addEventListener("click", () => { if (isCrono) location.href = "competencia.html"; });
  if (_tt) _tt.addEventListener("click", () => { if (!isCrono) location.href = "competencia.html?modo=trek"; });
  setModeUI();
  if (!isCrono) return; // el resto solo vive en modo trek

  /* ---------- Persistencia ---------- */
  function saveRace() {
    if (!state.racing) return;
    try {
      localStorage.setItem(RACE_KEY, JSON.stringify({
        runner: state.runner, slug: state.slug,
        startTime: state.startTime, demo: state.demo
      }));
    } catch (e) {}
  }
  function clearRace() { try { localStorage.removeItem(RACE_KEY); } catch (e) {} }
  function loadRace() {
    try {
      const r = JSON.parse(localStorage.getItem(RACE_KEY) || "null");
      return (r && r.runner && r.slug && r.startTime) ? r : null;
    } catch (e) { return null; }
  }

  /* ---------- Selector de lugar ---------- */
  function renderGrid() {
    const grid = $("crPlaceGrid");
    grid.innerHTML = TRP.PLACES.map((p, i) => `
      <button class="btn ${state.slug === p.slug ? "btn-primary" : ""} btn-small cr-place"
        data-slug="${p.slug}" style="justify-content:flex-start;text-align:left;">
        <span class="mono">${String(i + 1).padStart(2, "0")}</span>&nbsp;${p.nombre}
      </button>`).join("");
    grid.querySelectorAll(".cr-place").forEach(b =>
      b.addEventListener("click", () => selectPlace(b.dataset.slug)));
  }

  function selectPlace(slug, silent) {
    if (state.racing) { TRPToast.show("Termina o abandona el trek actual primero."); return; }
    const p = TRP.place(slug);
    if (!p) return;
    state.slug = slug;
    state.place = p;
    state.inStartZone = false;
    state.startDist = null;
    renderGrid();
    renderStartInfo();
    renderBoard();
    refreshStart();
    if (!silent) {
      const url = new URL(location.href);
      url.searchParams.set("lugar", slug);
      history.replaceState(null, "", url);
    }
  }

  function hasStartCoords() {
    const pt = state.place && state.place.partida;
    return !!(pt && pt.lat != null && pt.lng != null);
  }

  function renderStartInfo() {
    const p = state.place;
    if (!p) return;
    const pt = p.partida || {};
    $("crStartName").textContent = pt.nombre
      ? `${pt.nombre}${pt.aprox === false ? "" : " · punto aprox."}` : "—";
    $("crBoardPlace").textContent = p.nombre;
    $("crPlaceHint").innerHTML =
      `Partida: <strong>${esc(pt.nombre || "—")}</strong> → Meta: <strong>${esc(p.nombre)}</strong>. ` +
      (hasStartCoords()
        ? "El GPS habilitará el arranque al llegar a la comunidad."
        : "Coordenada de partida por verificar en campo: el arranque será manual.");
    $("crPanelGps").style.opacity = "1";
    $("crBtnDemo").textContent = pt.nombre ? `Modo demo: simular partida en ${pt.nombre}` : "Modo demo: simular partida";
  }

  /* ---------- Tabla de mejores tiempos del lugar ---------- */
  function renderBoard() {
    const tb = $("crBoard");
    if (!state.slug) {
      tb.innerHTML = `<tr><td class="center" style="padding:1.5rem;color:#777;">Elige un lugar para ver sus tiempos.</td></tr>`;
      return;
    }
    const rows = TRPRanking.cronoByPlace(state.slug).slice(0, 8);
    tb.innerHTML = rows.length
      ? rows.map((r, i) => `<tr class="rank-${i + 1}">
          <td><span class="pos">${i + 1}</span></td>
          <td><strong>${esc(r.runner)}</strong>${r.demo ? ' <span class="tag" style="font-size:.6rem;">demo</span>' : ""}</td>
          <td class="mono"><strong>${TRP.formatMsShort(r.ms)}</strong></td>
          <td class="mono">${r.date || "—"}</td>
        </tr>`).join("")
      : `<tr><td colspan="4" class="center" style="padding:1.5rem;color:#777;">Sin marcas todavía. Sé el primero.</td></tr>`;
  }

  /* ---------- Cronómetro (sin deriva) ---------- */
  function tick() {
    const el = Date.now() - state.startTime;
    const s = Math.floor(el / 1000);
    const p2 = (n) => String(n).padStart(2, "0");
    $("crChronoTime").textContent = `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
  }
  function elapsed() { return Date.now() - state.startTime; }
  function fmtDist(d) {
    if (d == null) return "—";
    return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
  }

  /* ---------- GPS ---------- */
  function updateGpsUI(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    $("crDotGps").className = "gps-dot live";
    $("crGpsStatus").textContent = "Activo 📡";
    $("crGpsAcc").textContent = `±${Math.round(accuracy)} m`;
    if (state.place && hasStartCoords()) {
      const pt = state.place.partida;
      const d = TRPGps.distM(latitude, longitude, pt.lat, pt.lng);
      state.startDist = d;
      state.inStartZone = d <= (pt.radioM || 400);
      $("crGpsDist").textContent = fmtDist(d);
    } else {
      $("crGpsDist").textContent = hasStartCoords() ? fmtDist(state.startDist) : "sin geocerca";
    }
    refreshStart();
    if (state.racing && window.TRPTrack) {
      const s = TRPTrack.push(latitude, longitude, pos.coords.altitude, Date.now(), pos.coords.accuracy);
      const tl = $("crTrackLive");
      if (tl) tl.innerHTML = `📏 ${TRPTrack.fmtKm(s.km)} km · ⛰️ +${s.gainM} m <span style="color:#888;">· track GPS</span>`;
    }
    autoFinish(latitude, longitude);
  }

  function autoFinish(lat, lng) {
    if (!state.racing || state.finished || !state.place) return;
    if (state.place.lat == null || state.place.lng == null) return;
    if (TRPGps.distM(lat, lng, state.place.lat, state.place.lng) <= FINISH_GEOFENCE_M) {
      finish("auto");
    }
  }

  function startGps() {
    if (!TRPGps.supported()) { TRPToast.show("Tu dispositivo no soporta geolocalización."); return; }
    $("crBtnGps").disabled = true;
    $("crGpsStatus").textContent = "Buscando señal…";
    const onOk = (pos) => { state.gpsErrorShown = false; updateGpsUI(pos); };
    const onErr = (err) => {
      if (!state.gpsErrorShown) {
        state.gpsErrorShown = true;
        $("crGpsStatus").textContent = "Sin señal";
        TRPToast.show("Sin señal GPS (" + err.message + "). Muévete a cielo abierto o usa el modo demo.", 4200);
      }
    };
    navigator.geolocation.getCurrentPosition(onOk, onErr, { enableHighAccuracy: true, timeout: 20000 });
    if (state.watchId == null) {
      state.watchId = navigator.geolocation.watchPosition(onOk, onErr, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    }
    state.gpsOn = true;
    requestWakeLock();
    $("crPanelChrono").style.opacity = "1";
    refreshStart();
  }

  var _wakeLock = null;
  function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !_wakeLock) {
        navigator.wakeLock.request("screen").then(function (l) { _wakeLock = l; }).catch(function () {});
      }
    } catch (e) {}
  }
  function releaseWakeLock() {
    try { if (_wakeLock) { _wakeLock.release(); _wakeLock = null; } } catch (e) {}
  }
  function stopGps() {
    if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
    releaseWakeLock();
  }

  function refreshStart() {
    const p = state.place;
    const noFence = p && !hasStartCoords();
    const ready = state.runner && p && state.gpsOn && !state.racing && !state.finished &&
      (state.demo || state.inStartZone || noFence);
    $("crBtnStart").disabled = !ready;
    $("crBtnStart").innerHTML = (p && p.partida && p.partida.nombre)
      ? `🏁 Arrancar desde ${esc(p.partida.nombre)}`
      : "🏁 Arrancar";
    if (state.racing || state.finished) return;
    let msg;
    if (!p) msg = "Elige un lugar y acércate a su comunidad.";
    else if (state.demo) msg = `Modo demo: partirás simbólicamente desde ${p.partida.nombre}.`;
    else if (state.inStartZone) msg = `✔ Estás en ${p.partida.nombre}. ¡Listo para arrancar!`;
    else if (noFence) msg = `Partida sin geocerca verificada: arranque manual desde ${p.partida.nombre}.`;
    else if (!state.gpsOn) msg = `Activa el GPS y acércate a ${p.partida.nombre}.`;
    else msg = `Acércate a ${p.partida.nombre} para habilitar el arranque (${fmtDist(state.startDist)}).`;
    $("crChronoSub").textContent = msg;
  }

  /* ---------- Arrancar / terminar / abandonar ---------- */
  function startRace() {
    if (!state.runner) { TRPToast.show("Primero fija tu nombre de trekker."); return; }
    if (!state.place) { TRPToast.show("Elige un lugar primero."); return; }
    state.racing = true;
    state.finished = false;
    state.startTime = Date.now();
    if (window.TRPTrack) { TRPTrack.start(); const tl = $("crTrackLive"); if (tl) tl.innerHTML = "📏 0.00 km · ⛰️ +0 m"; }
    saveRace();
    state.timerId = setInterval(tick, 250);
    tick();
    const st = $("crChronoStatus");
    st.textContent = "● En carrera";
    st.classList.add("live");
    $("crBtnStart").disabled = true;
    $("crBtnFinish").disabled = false;
    $("crBtnAbort").disabled = false;
    $("crChronoSub").textContent = `Cronómetro corriendo desde ${state.place.partida.nombre}. ¡A por ${state.place.nombre}!`;
    TRPToast.show(`🏁 ¡Arrancaste en ${state.place.partida.nombre}!`);
  }

  function finish(how) {
    if (!state.racing || state.finished) return;
    const ms = elapsed();
    const p = state.place;
    const trk = window.TRPTrack ? TRPTrack.stats() : null;
    const trkLine = (window.TRPTrack && trk && trk.points > 1) ? TRPTrack.line() : "";
    const trkA = window.TRPTrack ? TRPTrack.analyze() : null; // veredicto anti-trampa (capa 2)
    state.finished = true;
    state.racing = false;
    clearInterval(state.timerId);
    stopGps();
    clearRace();
    TRPRanking.cronoSave({
      runner: state.runner, slug: p.slug, ms,
      date: new Date().toISOString().slice(0, 10), demo: state.demo
    });
    /* v2.12 — modelo trekking: completar el trek marca el checkpoint del lugar
       (salvo demo: la demo no marca). */
    if (!state.demo && trkA && trkA.verdict !== "rechazado") {
      TRPRanking.trekDone({
        runner: state.runner, slug: p.slug, ms,
        date: new Date().toISOString().slice(0, 10)
      });
    }
    window.__trpShareData = {
      mode: "crono",
      runner: state.runner,
      timeMs: ms,
      placeName: p.nombre,
      startName: p.partida.nombre,
      date: new Date().toISOString().slice(0, 10),
      img: p.img,
      track: trkLine
    };
    window.__trpGlobalData = {
      type: "crono",
      payload: {
        runner: state.runner,
        slug: p.slug,
        ms,
        date: new Date().toISOString().slice(0, 10),
        demo: state.demo,
        trackKm: trkA ? trkA.km : null,
        trackPoints: trkA ? trkA.points : null,
        avgKmh: trkA ? trkA.avgKmh : null,
        maxSegKmh: trkA ? trkA.maxSegKmh : null,
        teleports: trkA ? trkA.teleports : null,
        verdict: trkA ? trkA.verdict : "sin-datos"
      }
    };
    const pub = document.getElementById("btnPublishGlobal");
    if (pub) {
      if (trkA && trkA.verdict === "rechazado" && !state.demo) {
        pub.disabled = true;
        pub.textContent = "⚠ Track inválido — no publicable";
      } else {
        pub.disabled = false; pub.textContent = "🌐 Publicar en ranking global";
      }
    }

    $("crChronoStatus").textContent = "Finalizado";
    $("crChronoStatus").classList.remove("live");
    $("crBtnFinish").disabled = true;
    $("crBtnAbort").disabled = true;

    const top = TRPRanking.cronoByPlace(p.slug).slice(0, 5);
    $("metaTitle").innerHTML = `¡META!<br>${esc(p.nombre).toUpperCase()}`;
    $("metaSummary").innerHTML =
      `<strong class="runner-tag">${esc(state.runner)}</strong><br><br>` +
      `Trek desde <strong>${esc(p.partida.nombre)}</strong><br>` +
      `Tiempo: <strong class="mono">${TRP.formatMs(ms)}</strong>${how === "auto" ? " <small>(auto 📡)</small>" : ""}`;
    $("metaTable").innerHTML =
      `<thead><tr><th>#</th><th>Trekker</th><th>Tiempo</th><th>Fecha</th></tr></thead><tbody>` +
      top.map((r, i) => `<tr class="rank-${i + 1}">
        <td><span class="pos">${i + 1}</span></td>
        <td><strong>${esc(r.runner)}</strong>${r.demo ? ' <span class="tag" style="font-size:.6rem;">demo</span>' : ""}</td>
        <td class="mono"><strong>${TRP.formatMsShort(r.ms)}</strong></td>
        <td class="mono">${r.date || "—"}</td></tr>`).join("") +
      `</tbody>`;
    document.querySelector("#modalMeta .confetti-stamp").textContent = "¡Meta!";
    const mt = document.getElementById("metaTrack");
    if (mt) {
      mt.innerHTML = (trk && trk.points > 1)
        ? `<div class="board mt-2" style="box-shadow:var(--shadow-sm);">
             <div class="board-head"><span>📡 Track GPS</span><span class="tag">${esc(trkLine)}</span></div>
             <div style="padding:1rem;">${TRPTrack.toSVG(640, 300)}
             <p class="mono mt-2" style="font-size:.8rem;color:#666;">Desnivel +${trk.gainM} m / −${trk.lossM} m${trk.altMax != null ? " · Alt. máx " + trk.altMax + " m" : ""} · ${trk.points} puntos GPS</p>
             ${trkA && trkA.verdict === "ok" ? `<p class="mono mt-2" style="font-size:.8rem;color:#1a7f37;">✓ Track verificado (${trkA.avgKmh} km/h media)</p>` : ""}
             ${trkA && trkA.verdict === "revisar" ? `<p class="mono mt-2" style="font-size:.8rem;color:#9a6700;">⚠ Track marcado para revisión: ${esc(trkA.reasons.join(" · "))}</p>` : ""}
             ${trkA && trkA.verdict === "rechazado" ? `<p class="mono mt-2" style="font-size:.8rem;color:#b00020;">⛔ Track con anomalías: ${esc(trkA.reasons.join(" · "))}. No se puede publicar.</p>` : ""}</div>
           </div>`
        : `<p class="mono mt-2" style="font-size:.85rem;color:#888;">Sin track GPS en este trek (modo demo o GPS apagado).</p>`;
    }
    TRPModal.open("modalMeta");
    renderBoard();
    refreshStart();
  }

  function abortRace() {
    if (!confirm("¿Abandonar el trek? Se perderá este intento.")) return;
    clearInterval(state.timerId);
    stopGps();
    clearRace();
    state.racing = false;
    state.finished = false;
    state.demo = false;
    $("crChronoTime").textContent = "00:00:00";
    const st = $("crChronoStatus");
    st.textContent = "En espera";
    st.classList.remove("live");
    $("crBtnFinish").disabled = true;
    $("crBtnAbort").disabled = true;
    $("crBtnGps").disabled = false;
    $("crGpsStatus").textContent = "Apagado";
    $("crDotGps").className = "gps-dot";
    $("crGpsDist").textContent = "—";
    $("crGpsAcc").textContent = "—";
    state.gpsOn = false;
    state.inStartZone = false;
    if (window.TRPTrack) { TRPTrack.reset(); const tl = $("crTrackLive"); if (tl) tl.innerHTML = "📏 — · ⛰️ —"; }
    refreshStart();
    TRPToast.show("Trek abandonado. La revancha te espera.");
  }

  /* ---------- Reanudar ---------- */
  function resumeRace(saved) {
    const p = TRP.place(saved.slug);
    if (!p) { clearRace(); return; }
    state.runner = saved.runner;
    $("crRunnerName").value = saved.runner;
    $("crRunnerName").disabled = true;
    $("crBtnRunner").disabled = true;
    $("crRunnerTag").textContent = saved.runner;
    $("crRunnerEcho").style.display = "block";
    state.demo = !!saved.demo;
    state.slug = saved.slug;
    state.place = p;
    state.startTime = saved.startTime;
    state.racing = true;
    renderGrid();
    renderStartInfo();
    $("crPanelChrono").style.opacity = "1";
    state.timerId = setInterval(tick, 250);
    tick();
    const st = $("crChronoStatus");
    st.textContent = "● En carrera";
    st.classList.add("live");
    $("crBtnStart").disabled = true;
    $("crBtnFinish").disabled = false;
    $("crBtnAbort").disabled = false;
    $("crChronoSub").textContent = `Trek reanudado: ${p.partida.nombre} → ${p.nombre}.`;
    if (!state.demo && TRPGps.supported()) {
      state.gpsOn = true;
      state.watchId = navigator.geolocation.watchPosition(
        (pos) => updateGpsUI(pos), () => {}, { enableHighAccuracy: true, maximumAge: 8000 });
    } else if (state.demo) {
      state.gpsOn = true;
      $("crGpsStatus").textContent = "Demo 📡";
    }
    renderBoard();
    TRPToast.show("Trek reanudado. ¡A seguir!");
  }

  /* ---------- Eventos ---------- */
  $("crBtnRunner").addEventListener("click", () => {
    const v = $("crRunnerName").value.trim().toUpperCase().slice(0, 16);
    if (!v) { TRPToast.show("Escribe tu nombre de trekker."); return; }
    state.runner = v;
    $("crRunnerTag").textContent = v;
    $("crRunnerEcho").style.display = "block";
    $("crBtnRunner").disabled = true;
    $("crRunnerName").disabled = true;
    refreshStart();
    TRPToast.show("Trekker registrado: " + v);
  });
  $("crRunnerName").addEventListener("keydown", (e) => { if (e.key === "Enter") $("crBtnRunner").click(); });

  $("crBtnGps").addEventListener("click", startGps);
  $("crBtnDemo").addEventListener("click", () => {
    state.demo = true;
    state.gpsOn = true;
    $("crBtnGps").disabled = true;
    $("crDotGps").className = "gps-dot ok";
    $("crGpsStatus").textContent = "Demo 📡";
    $("crPanelChrono").style.opacity = "1";
    TRPToast.show("Modo demo: partida simulada en la comunidad.");
    refreshStart();
  });

  $("crBtnStart").addEventListener("click", startRace);
  $("crBtnFinish").addEventListener("click", () => finish("manual"));
  $("crBtnAbort").addEventListener("click", abortRace);

  $("crBtnResume").addEventListener("click", () => {
    const saved = loadRace();
    TRPModal.close("modalResumeCrono");
    if (saved) resumeRace(saved);
  });
  $("crBtnDiscard").addEventListener("click", () => {
    clearRace();
    TRPModal.close("modalResumeCrono");
    TRPToast.show("Trek anterior descartado.");
  });

  /* ---------- Init ---------- */
  renderGrid();
  renderBoard();
  const deepSlug = params.get("lugar");
  if (deepSlug && TRP.place(deepSlug)) selectPlace(deepSlug, true);
  const saved = loadRace();
  if (saved) {
    const p = TRP.place(saved.slug);
    $("crResumeInfo").textContent =
      `${saved.runner} · ${p ? p.nombre : saved.slug} · inicio ${new Date(saved.startTime).toLocaleString("es-PE")}`;
    TRPModal.open("modalResumeCrono");
  }
  /* GPS por defecto: se activa solo al abrir (para los olvidadizos).
     Si hay carrera guardada, el resume ya reactiva el GPS. */
  try { if (!saved) startGps(); } catch (e) {}
})();
