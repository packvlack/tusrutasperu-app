/* ============================================================
   TUSRUTASPERU — COMPETENCIA.JS
   GPS + cronómetro + checkpoints + guardado en ranking.
   La carrera persiste en localStorage: sobrevive a recargas.
   Todo vive en el dispositivo del corredor.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const GEOFENCE_M = 1200; // coordenadas aproximadas: radio generoso
  const RACE_KEY = "trp_race_v1";

  const state = {
    runner: null,
    gpsOn: false,
    inStartZone: false,
    demoStart: false,
    pos: null,
    watchId: null,
    racing: false,
    startTime: 0,
    timerId: null,
    marks: {},
    finished: false,
    gpsErrorShown: false
  };

  const cps = TRP.checkpoints();
  const esc = (s) => window.TRPEscape ? TRPEscape(s) : String(s);

  /* ---------- Persistencia de la carrera (C1) ---------- */
  function saveRace() {
    if (!state.racing) return;
    try {
      localStorage.setItem(RACE_KEY, JSON.stringify({
        runner: state.runner,
        startTime: state.startTime,
        marks: state.marks,
        demoStart: state.demoStart
      }));
    } catch (e) {}
  }
  function clearRace() { try { localStorage.removeItem(RACE_KEY); } catch (e) {} }
  function loadRace() {
    try {
      const r = JSON.parse(localStorage.getItem(RACE_KEY) || "null");
      return (r && r.runner && r.startTime) ? r : null;
    } catch (e) { return null; }
  }

  /* ---------- Render de checkpoints ---------- */
  function renderCps() {
    const list = $("cpList");
    list.innerHTML = cps.map((p, i) => {
      const marked = state.marks[p.slug] != null;
      const isNext = state.racing && !state.finished &&
        cps.findIndex(q => state.marks[q.slug] == null) === i;
      return `<li class="checkpoint ${marked ? "done" : ""}" id="cp-${p.slug}">
        <span class="cp-num">${p.esMeta ? "🏆" : String(i + 1).padStart(2, "0")}</span>
        <span class="cp-info">
          <strong>${p.nombre}</strong>
          <small>${p.tipoLabel} · ${p.dificultad}${p.lat ? " · 📡 geocerca aprox." : " · ✋ marca manual"}</small>
        </span>
        ${marked ? `<span class="cp-time">${TRP.formatMsShort(state.marks[p.slug])}</span>`
                 : isNext ? `<button class="btn btn-primary btn-small" data-mark="${p.slug}">Marcar llegada</button>`
                          : `<span class="mono" style="font-size:.75rem;color:#666;">—</span>`}
      </li>`;
    }).join("");

    const done = Object.keys(state.marks).length;
    $("progressFill").style.width = (done / cps.length * 100) + "%";
    $("progressLabel").textContent = `${done} de ${cps.length} checkpoints`;

    list.querySelectorAll("[data-mark]").forEach(btn =>
      btn.addEventListener("click", () => markCheckpoint(btn.dataset.mark, "manual"))
    );
  }

  /* ---------- Cronómetro (sin deriva: Date.now) ---------- */
  function tick() {
    const el = Date.now() - state.startTime;
    const s = Math.floor(el / 1000);
    const p = (n) => String(n).padStart(2, "0");
    $("chronoTime").textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
  }
  function elapsed() { return Date.now() - state.startTime; }

  /* ---------- Marcar checkpoint ---------- */
  function markCheckpoint(slug, how) {
    if (!state.racing || state.finished) return;
    const nextIdx = cps.findIndex(q => state.marks[q.slug] == null);
    const idx = cps.findIndex(q => q.slug === slug);
    if (idx !== nextIdx) {
      TRPToast.show("Respeta el orden: el siguiente es " + cps[nextIdx].nombre);
      return;
    }
    const p = cps[idx];
    state.marks[slug] = elapsed();
    saveRace();
    renderCps();
    const el = document.getElementById("cp-" + slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    TRPToast.show(`✔ ${p.nombre} — ${TRP.formatMsShort(state.marks[slug])} ${how === "auto" ? "(auto 📡)" : ""}`);
    if (p.esMeta) finishRace();
  }

  /* ---------- Finalizar ---------- */
  function finishRace() {
    state.finished = true;
    state.racing = false;
    clearInterval(state.timerId);
    stopGps();
    clearRace();
    const total = state.marks["rupac"];
    const trk = window.TRPTrack ? TRPTrack.stats() : null;
    const trkLine = (window.TRPTrack && trk && trk.points > 1) ? TRPTrack.line() : "";
    const trkA = window.TRPTrack ? TRPTrack.analyze() : null; // veredicto anti-trampa (capa 2)
    TRPRanking.save({
      runner: state.runner,
      totalMs: total,
      cps: { ...state.marks },
      date: new Date().toISOString().slice(0, 10),
      demo: state.demoStart
    });
    window.__trpShareData = {
      mode: "circuito",
      runner: state.runner,
      timeMs: total,
      placeName: "Rúpac · Meta",
      startName: "Huaral",
      date: new Date().toISOString().slice(0, 10),
      img: "assets/img/rupac.webp",
      track: trkLine
    };
    window.__trpGlobalData = {
      type: "circuit",
      payload: {
        runner: state.runner,
        totalMs: total,
        cps: { ...state.marks },
        date: new Date().toISOString().slice(0, 10),
        demo: state.demoStart,
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
      if (trkA && trkA.verdict === "rechazado" && !state.demoStart) {
        pub.disabled = true;
        pub.textContent = "⚠ Track inválido — no publicable";
      } else {
        pub.disabled = false; pub.textContent = "🌐 Publicar en ranking global";
      }
    }

    $("chronoStatus").textContent = "Finalizado";
    $("chronoStatus").classList.remove("live");
    $("btnAbort").disabled = true;

    let prev = 0;
    const rows = cps.map((p, i) => {
      const acc = state.marks[p.slug];
      const tramo = acc - prev;
      prev = acc;
      return `<tr><td><span class="pos" style="font-size:1rem;">${i + 1}</span></td><td>${p.nombre}</td><td class="mono">${TRP.formatMsShort(tramo)}</td><td class="mono" style="color:#666;">${TRP.formatMsShort(acc)}</td></tr>`;
    }).join("");
    $("metaTable").innerHTML = `<thead><tr><th>#</th><th>Checkpoint</th><th>Tramo</th><th>Acumulado</th></tr></thead><tbody>${rows}</tbody>`;
    $("metaSummary").innerHTML =
      `<strong class="runner-tag">${esc(state.runner)}</strong><br><br>Tiempo total: <strong class="mono">${TRP.formatMs(total)}</strong><br>12 de 12 checkpoints. Rúpac conquistado.`;
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
        : `<p class="mono mt-2" style="font-size:.85rem;color:#888;">Sin track GPS en esta carrera (modo demo o GPS apagado).</p>`;
    }
    TRPModal.open("modalMeta");
    renderCps();
  }

  /* ---------- GPS ---------- */
  function resetGpsUI() {
    state.gpsOn = false;
    state.inStartZone = false;
    state.pos = null;
    state.gpsErrorShown = false;
    $("dotGps").className = "gps-dot";
    $("gpsStatus").textContent = "Apagado";
    $("gpsCoords").textContent = "—";
    $("gpsAcc").textContent = "—";
    $("gpsDist").textContent = "—";
    $("btnGps").disabled = false;
  }

  function updateGpsUI(pos) {
    state.pos = pos;
    const { latitude, longitude, accuracy } = pos.coords;
    $("dotGps").className = "gps-dot live";
    $("gpsStatus").textContent = "Activo 📡";
    $("gpsCoords").textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    $("gpsAcc").textContent = `±${Math.round(accuracy)} m`;
    const d = TRPGps.distM(latitude, longitude, TRP.START.lat, TRP.START.lng);
    $("gpsDist").textContent = d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`;
    state.inStartZone = d <= TRP.START.radioArranqueM;
    refreshStartBtn();
    if (state.racing && window.TRPTrack) {
      const s = TRPTrack.push(latitude, longitude, pos.coords.altitude, Date.now(), pos.coords.accuracy);
      const tl = $("trackLive");
      if (tl) tl.innerHTML = `📏 ${TRPTrack.fmtKm(s.km)} km · ⛰️ +${s.gainM} m <span style="color:#888;">· track GPS</span>`;
    }
    autoDetect(latitude, longitude);
  }

  function autoDetect(lat, lng) {
    if (!state.racing || state.finished) return;
    const next = cps.find(q => state.marks[q.slug] == null);
    if (!next || next.lat == null) return;
    if (TRPGps.distM(lat, lng, next.lat, next.lng) <= GEOFENCE_M) markCheckpoint(next.slug, "auto");
  }

  function startGps() {
    if (!TRPGps.supported()) { TRPToast.show("Tu dispositivo no soporta geolocalización."); return; }
    $("btnGps").disabled = true;
    $("gpsStatus").textContent = "Buscando señal…";
    const onOk = (pos) => { state.gpsErrorShown = false; updateGpsUI(pos); };
    const onErr = (err) => {
      // I1: no ametrallar toasts; avisar una vez y sugerir salida
      if (!state.gpsErrorShown) {
        state.gpsErrorShown = true;
        $("gpsStatus").textContent = "Sin señal";
        TRPToast.show("Sin señal GPS (" + err.message + "). Muévete a cielo abierto o usa el modo demo para probar.", 4200);
      }
    };
    navigator.geolocation.getCurrentPosition(onOk, onErr, { enableHighAccuracy: true, timeout: 20000 });
    if (state.watchId == null) {
      state.watchId = navigator.geolocation.watchPosition(onOk, onErr, { enableHighAccuracy: true, maximumAge: 5000 });
    }
    state.gpsOn = true;
  }

  function stopGps() {
    if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  function refreshStartBtn() {
    const ready = state.runner && !state.racing && !state.finished &&
      (state.inStartZone || state.demoStart) && state.gpsOn;
    $("btnStart").disabled = !ready;
    if (!state.racing && !state.finished) {
      $("chronoSub").textContent = state.demoStart
        ? "Modo demo: partirás simbólicamente desde Huaral."
        : state.inStartZone
          ? "✔ Estás en Huaral. Listo para arrancar."
          : "Acércate a la Plaza de Armas de Huaral para habilitar el inicio.";
    }
  }

  /* ---------- Corredor ---------- */
  function setRunner(v) {
    state.runner = v;
    $("runnerTag").textContent = v;
    $("runnerEcho").style.display = "block";
    $("panelGps").style.opacity = "1";
    $("btnRunner").disabled = true;
    $("runnerName").disabled = true;
    $("btnChangeRunner").style.display = "";
    refreshStartBtn();
  }

  /* ---------- Reanudar carrera guardada ---------- */
  function resumeRace(saved) {
    setRunner(saved.runner);
    state.demoStart = !!saved.demoStart;
    state.marks = saved.marks || {};
    state.startTime = saved.startTime;
    state.racing = true;
    // GPS: reactivar para seguir con geocerca
    state.gpsOn = true;
    $("dotGps").className = "gps-dot ok";
    $("gpsStatus").textContent = "Reanudado 📡";
    $("panelChrono").style.opacity = "1";
    state.timerId = setInterval(tick, 250);
    tick();
    const st = $("chronoStatus");
    st.textContent = "● En carrera";
    st.classList.add("live");
    $("btnStart").disabled = true;
    $("btnAbort").disabled = false;
    $("chronoSub").textContent = "Carrera reanudada. El cronómetro sigue corriendo.";
    renderCps();
    if (state.demoStart) startGpsSilent();
    TRPToast.show("Carrera reanudada. ¡A seguir!");
  }

  function startGpsSilent() {
    if (!TRPGps.supported() || state.watchId != null) return;
    const onOk = (pos) => updateGpsUI(pos);
    state.watchId = navigator.geolocation.watchPosition(onOk, () => {}, { enableHighAccuracy: true, maximumAge: 8000 });
  }

  /* ---------- Eventos ---------- */
  $("btnRunner").addEventListener("click", () => {
    const v = $("runnerName").value.trim().toUpperCase().slice(0, 16);
    if (!v) { TRPToast.show("Escribe tu nombre de corredor."); return; }
    setRunner(v);
    TRPToast.show("Corredor registrado: " + v);
  });
  $("runnerName").addEventListener("keydown", (e) => { if (e.key === "Enter") $("btnRunner").click(); });
  $("btnChangeRunner").addEventListener("click", () => {
    if (state.racing) { TRPToast.show("No puedes cambiar de corredor en plena carrera."); return; }
    state.runner = null;
    $("runnerName").disabled = false;
    $("runnerName").value = "";
    $("runnerName").focus();
    $("btnRunner").disabled = false;
    $("runnerEcho").style.display = "none";
    $("btnChangeRunner").style.display = "none";
    refreshStartBtn();
  });

  $("btnGps").addEventListener("click", () => {
    startGps();
    $("panelChrono").style.opacity = "1";
    refreshStartBtn();
  });

  $("btnDemoStart").addEventListener("click", () => {
    state.demoStart = true;
    if (!state.gpsOn) { state.gpsOn = true; $("dotGps").className = "gps-dot ok"; $("gpsStatus").textContent = "Demo 📡"; }
    $("panelChrono").style.opacity = "1";
    TRPToast.show("Modo demo activado: partida simulada en Huaral.");
    refreshStartBtn();
  });

  $("btnStart").addEventListener("click", () => {
    if (!state.runner) { TRPToast.show("Primero fija tu nombre de corredor."); return; }
    state.racing = true;
    state.startTime = Date.now();
    if (window.TRPTrack) { TRPTrack.start(); const tl = $("trackLive"); if (tl) tl.innerHTML = "📏 0.00 km · ⛰️ +0 m"; }
    saveRace();
    state.timerId = setInterval(tick, 250);
    tick();
    const st = $("chronoStatus");
    st.textContent = "● En carrera";
    st.classList.add("live");
    $("btnStart").disabled = true;
    $("btnAbort").disabled = false;
    $("chronoSub").textContent = "Cronómetro corriendo desde Huaral. ¡A por el primer checkpoint!";
    renderCps();
    TRPToast.show("🏁 ¡Arrancaste! Destino: " + cps[0].nombre);
    document.getElementById("cp-" + cps[0].slug).scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("btnAbort").addEventListener("click", () => {
    if (!confirm("¿Abandonar la carrera? Se perderá el progreso de este intento.")) return;
    clearInterval(state.timerId);
    stopGps();
    resetGpsUI();
    clearRace();
    if (window.TRPTrack) { TRPTrack.reset(); const tl = $("trackLive"); if (tl) tl.innerHTML = "📏 — · ⛰️ —"; }
    state.racing = false;
    state.finished = false;
    state.demoStart = false;
    state.marks = {};
    $("chronoTime").textContent = "00:00:00";
    const st = $("chronoStatus");
    st.textContent = "En espera";
    st.classList.remove("live");
    $("btnAbort").disabled = true;
    $("panelChrono").style.opacity = ".55";
    renderCps();
    refreshStartBtn();
    TRPToast.show("Carrera abandonada. La montaña te espera para la revancha.");
  });

  /* ---------- Modal reanudar ---------- */
  $("btnNewRace").addEventListener("click", () => location.reload());
  $("btnResume").addEventListener("click", () => {
    const saved = loadRace();
    TRPModal.close("modalResume");
    if (saved) resumeRace(saved);
  });
  $("btnDiscard").addEventListener("click", () => {
    clearRace();
    TRPModal.close("modalResume");
    TRPToast.show("Carrera anterior descartada. Empieza de cero.");
  });

  /* ---------- Init ---------- */
  renderCps();
  const saved = loadRace();
  if (saved) {
    $("resumeInfo").textContent =
      `${saved.runner} · ${Object.keys(saved.marks || {}).length} de 12 checkpoints · inicio ${new Date(saved.startTime).toLocaleString("es-PE")}`;
    TRPModal.open("modalResume");
  }
  /* GPS por defecto: se activa solo al abrir (para los olvidadizos).
     Si hay carrera guardada, el resume ya reactiva el GPS. */
  try {
    if (!saved) {
      startGps();
      $("panelChrono").style.opacity = "1";
      refreshStartBtn();
    }
  } catch (e) {}
})();
