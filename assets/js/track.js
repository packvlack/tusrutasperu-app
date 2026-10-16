/* ============================================================
   TUSRUTASPERU — TRACK.JS (v2.9)
   Registro del track GPS durante la carrera:
   - distancia acumulada (haversine, metros)
   - desnivel positivo / negativo (filtro anti-ruido de 3 m)
   - altitud máxima
   - render SVG del recorrido (funciona sin internet)
   - analyze(): veredicto anti-trampa (velocidad imposible,
     teletransportes). Capa 2 de la defensa.
     v2.9: los saltos solo cuentan como teletransporte si superan
     lo que la precisión del GPS puede explicar (adiós falsos
     positivos del jitter urbano).
   Todo vive en memoria durante la carrera; no persiste solo.
   ============================================================ */
(function () {
  "use strict";

  var MIN_MOVE_M = 5;    // ignora micro-movimientos del GPS
  var MIN_DT_MS = 4000;  // …salvo que pasen 4 s sin registrar
  var ALT_GATE_M = 3;    // ignora ruido de altitud menor a 3 m
  var MAX_PTS = 1500;    // tope de puntos en memoria

  /* Umbrales anti-trampa (generosos: solo cazan lo físicamente imposible) */
  var MAX_AVG_KMH = 25;  // nadie promedia esto corriendo en sendero de montaña
  var MAX_SEG_KMH = 60;  // sobre esto, el punto es un teletransporte
  var SUSP_AVG_KMH = 15; // sobre esto: sospechoso, se marca para revisión
  var SUSP_SEG_KMH = 35;

  var pts = [];          // {lat, lng, t, acc}
  var km = 0, gain = 0, loss = 0;
  var altMax = null, lastAlt = null;
  var lastPt = null, lastT = 0;

  function haversineM(lat1, lng1, lat2, lng2) {
    var R = 6371000, r = Math.PI / 180;
    var s1 = Math.sin((lat2 - lat1) * r / 2);
    var s2 = Math.sin((lng2 - lng1) * r / 2);
    var h = s1 * s1 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function reset() {
    pts = []; km = 0; gain = 0; loss = 0;
    altMax = null; lastAlt = null; lastPt = null; lastT = 0;
  }

  /* Alimenta una posición GPS. acc = precisión en metros (opcional).
     Devuelve stats actualizados. */
  function push(lat, lng, alt, t, acc) {
    if (lat == null || lng == null) return stats();
    t = t || Date.now();
    if (lastPt) {
      var dm = haversineM(lastPt.lat, lastPt.lng, lat, lng);
      if (dm < MIN_MOVE_M && (t - lastT) < MIN_DT_MS) return stats();
      km += dm / 1000;
    }
    if (alt != null && !isNaN(alt)) {
      if (altMax == null || alt > altMax) altMax = alt;
      if (lastAlt == null) lastAlt = alt;
      else {
        var d = alt - lastAlt;
        if (d >= ALT_GATE_M) { gain += d; lastAlt = alt; }
        else if (d <= -ALT_GATE_M) { loss += -d; lastAlt = alt; }
      }
    }
    pts.push({ lat: lat, lng: lng, t: t, acc: (acc != null && !isNaN(acc)) ? acc : null });
    if (pts.length > MAX_PTS) {
      var keep = [];
      for (var i = 0; i < pts.length; i += 2) keep.push(pts[i]);
      pts = keep;
    }
    lastPt = { lat: lat, lng: lng };
    lastT = t;
    return stats();
  }

  function stats() {
    return {
      km: km,
      gainM: Math.round(gain),
      lossM: Math.round(loss),
      altMax: altMax == null ? null : Math.round(altMax),
      points: pts.length
    };
  }

  function fmtKm(k) { return (k < 10 ? k.toFixed(2) : k.toFixed(1)); }

  /* "12.40 km · +860 m" para tarjetas y resúmenes */
  function line() {
    var s = stats();
    return fmtKm(s.km) + " km · +" + s.gainM + " m";
  }

  /* Dibuja el recorrido como SVG (sin dependencias, offline). */
  function toSVG(w, h) {
    w = w || 640; h = h || 320;
    var pad = 28;
    function shell(inner) {
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="Mapa del recorrido">' +
        '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#f5f2ea" stroke="#101010" stroke-width="3"/>' +
        inner + '</svg>';
    }
    if (pts.length < 2) {
      return shell('<text x="' + w / 2 + '" y="' + h / 2 + '" text-anchor="middle" ' +
        'font-family="monospace" font-size="15" fill="#8a877e">Sin track GPS registrado</text>');
    }
    var minLat = 90, maxLat = -90, minLng = 180, maxLng = -180, i, p;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }
    var spanLat = (maxLat - minLat) || 1e-6;
    var spanLng = (maxLng - minLng) || 1e-6;
    // escala uniforme para no deformar (grados de lng pesan menos lejos del ecuador)
    var midLat = (minLat + maxLat) / 2;
    var kx = Math.cos(midLat * Math.PI / 180) || 1;
    var sc = Math.min((w - pad * 2) / (spanLng * kx), (h - pad * 2) / spanLat);
    function X(lng) { return pad + (lng - minLng) * kx * sc + ((w - pad * 2) - spanLng * kx * sc) / 2; }
    function Y(lat) { return pad + (maxLat - lat) * sc + ((h - pad * 2) - spanLat * sc) / 2; }
    var dAttr = "";
    for (i = 0; i < pts.length; i++) {
      dAttr += (i ? "L" : "M") + X(pts[i].lng).toFixed(1) + " " + Y(pts[i].lat).toFixed(1);
    }
    var s0 = pts[0], sN = pts[pts.length - 1];
    return shell(
      '<path d="' + dAttr + '" fill="none" stroke="#101010" stroke-width="4" stroke-linejoin="round"/>' +
      '<circle cx="' + X(s0.lng).toFixed(1) + '" cy="' + Y(s0.lat).toFixed(1) + '" r="9" fill="#d8ff00" stroke="#101010" stroke-width="3"/>' +
      '<circle cx="' + X(sN.lng).toFixed(1) + '" cy="' + Y(sN.lat).toFixed(1) + '" r="9" fill="#e63946" stroke="#101010" stroke-width="3"/>'
    );
  }

  /* ---------- Anti-trampa (capa 2) ----------
     Analiza el track y devuelve un veredicto:
     "ok" | "revisar" | "rechazado" | "sin-datos".
     Solo "rechazado" bloquea la publicación; "revisar" la marca. */
  /* ¿El salto entre dos puntos supera lo que su precisión explica?
     El jitter urbano (saltos de 50-200 m con precisión pobre) NO es trampa;
     un fake GPS salta kilómetros con precisión buena. */
  function isTeleport(distM, v, a, b) {
    if (v <= MAX_SEG_KMH) return false;
    var accSum = (a.acc != null && b.acc != null) ? (a.acc + b.acc) : null;
    return accSum != null ? distM > 3 * accSum : distM > 300;
  }
  function isSuspSeg(distM, v, a, b) {
    if (v <= SUSP_SEG_KMH) return false;
    var accSum = (a.acc != null && b.acc != null) ? (a.acc + b.acc) : null;
    return accSum != null ? distM > 2 * accSum : distM > 150;
  }

  function analyze() {
    var s = stats();
    var res = {
      verdict: "sin-datos", reasons: [],
      km: Math.round(s.km * 100) / 100, points: s.points,
      avgKmh: 0, maxSegKmh: 0, teleports: 0
    };
    if (pts.length < 2) return res;
    var i, maxSeg = 0, teleports = 0, suspSeg = 0;
    for (i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var hrs = (b.t - a.t) / 3600000;
      if (hrs <= 0) continue;
      var distM = haversineM(a.lat, a.lng, b.lat, b.lng);
      var v = (distM / 1000) / hrs;
      if (v > maxSeg) maxSeg = v;
      if (isTeleport(distM, v, a, b)) teleports++;
      else if (isSuspSeg(distM, v, a, b)) suspSeg++;
    }
    var spanHrs = (pts[pts.length - 1].t - pts[0].t) / 3600000;
    var avg = spanHrs > 0 ? s.km / spanHrs : 0;
    res.avgKmh = Math.round(avg * 10) / 10;
    res.maxSegKmh = Math.round(maxSeg * 10) / 10;
    res.teleports = teleports;
    if (avg > MAX_AVG_KMH) res.reasons.push("velocidad media imposible (" + res.avgKmh + " km/h)");
    if (teleports > 0) res.reasons.push(teleports + " salto(s) imposible(s) de GPS");
    if (res.reasons.length) { res.verdict = "rechazado"; return res; }
    if (avg > SUSP_AVG_KMH) res.reasons.push("velocidad media alta (" + res.avgKmh + " km/h)");
    if (suspSeg > 0) res.reasons.push(suspSeg + " tramo(s) a velocidad alta");
    res.verdict = res.reasons.length ? "revisar" : "ok";
    return res;
  }

  window.TRPTrack = {
    start: reset, reset: reset, push: push,
    stats: stats, line: line, fmtKm: fmtKm, toSVG: toSVG,
    analyze: analyze
  };
})();
