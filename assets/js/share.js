/* ============================================================
   TUSRUTASPERU — SHARE.JS (v2.9)
   Tarjeta de resultado 1080x1920 para TikTok/stories.
   Se genera desde window.__trpShareData al pulsar
   #btnShareResult (modal de meta en competencia.html).
   #btnDownloadResult descarga directo sin pasar por el menú
   de compartir del sistema.
   ============================================================ */
(function () {
  "use strict";

  const W = 1080, H = 1920;
  const INK = "#101010", PAPER = "#f5f2ea", ACID = "#d8ff00", DIM = "#8a877e";

  /* URL que aparece al pie de la tarjeta. Cámbiala aquí si tu
     dominio final es otro. */
  const SITE_URL = "tusrutasperu.com";

  function fitFont(ctx, text, maxW, base, family) {
    let size = base;
    ctx.font = `${size}px ${family}`;
    while (ctx.measureText(text).width > maxW && size > 20) {
      size -= 6;
      ctx.font = `${size}px ${family}`;
    }
    return size;
  }

  function loadImg(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    });
  }

  function drawCover(ctx, img, x, y, w, h) {
    const s = Math.max(w / img.width, h / img.height);
    const dw = img.width * s, dh = img.height * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    // degradado inferior para legibilidad
    const g = ctx.createLinearGradient(0, y + h * 0.45, 0, y + h);
    g.addColorStop(0, "rgba(16,16,16,0)");
    g.addColorStop(1, "rgba(16,16,16,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  async function makeCard(d) {
    try { await document.fonts.ready; } catch (e) {}
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const DISPLAY = '"Archivo Black","Arial Black",sans-serif';
    const MONO = '"Space Mono","Courier New",monospace';

    // fondo + marco
    x.fillStyle = INK;
    x.fillRect(0, 0, W, H);
    x.strokeStyle = ACID;
    x.lineWidth = 10;
    x.strokeRect(28, 28, W - 56, H - 56);

    // cabecera
    x.fillStyle = ACID;
    x.textAlign = "center";
    fitFont(x, "◈ TUSRUTASPERU", W - 200, 72, DISPLAY);
    x.fillText("◈ TUSRUTASPERU", W / 2, 150);
    x.fillStyle = DIM;
    x.font = `34px ${MONO}`;
    x.fillText("CONQUISTA HUARAL · PERÚ", W / 2, 205);

    // foto
    const img = await loadImg(d.img);
    if (img) drawCover(x, img, 60, 250, W - 120, 560);
    else { x.fillStyle = "#1c1c1c"; x.fillRect(60, 250, W - 120, 560); }

    let y = 880;
    // etiqueta de modo
    const tag = d.mode === "crono" ? "⏱ TREK CRONOMETRADO" : "🏁 CIRCUITO · 12 CHECKPOINTS";
    x.font = `40px ${MONO}`;
    const tw = x.measureText(tag).width + 70;
    x.fillStyle = ACID;
    x.fillRect(W / 2 - tw / 2, y, tw, 72);
    x.fillStyle = INK;
    x.fillText(tag, W / 2, y + 49);
    y += 178;

    // lugar (1 o 2 líneas, balanceadas)
    x.fillStyle = PAPER;
    const name = (d.placeName || "").toUpperCase();
    const lines = (() => {
      x.font = `110px ${DISPLAY}`;
      if (x.measureText(name).width <= W - 160) return [name];
      const words = name.split(" ");
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
        x.font = `104px ${DISPLAY}`;
        const w = Math.max(x.measureText(a).width, x.measureText(b).width);
        if (!best || w < best.w) best = { lines: [a, b], w };
      }
      return best ? best.lines : [name];
    })();
    lines.forEach((ln, i) => {
      fitFont(x, ln, W - 160, i === 0 && lines.length === 1 ? 110 : 100, DISPLAY);
      x.fillText(ln, W / 2, y + i * 108);
    });
    y += lines.length === 1 ? 130 : 240;

    if (d.startName) {
      x.fillStyle = ACID;
      x.font = `38px ${MONO}`;
      x.fillText(("DESDE " + d.startName).toUpperCase(), W / 2, y);
      y += 80;
    }

    // tiempo gigante
    const t = window.TRP && TRP.formatMs ? TRP.formatMs(d.timeMs) : "";
    x.fillStyle = ACID;
    fitFont(x, t, W - 140, 185, DISPLAY);
    x.fillText(t, W / 2, y + 140);
    y += 235;

    // track GPS (distancia + desnivel), si viene en los datos
    if (d.track) {
      x.fillStyle = DIM;
      x.font = `38px ${MONO}`;
      x.fillText(d.track, W / 2, y);
      y += 64;
    }

    // corredor
    x.strokeStyle = PAPER;
    x.lineWidth = 4;
    const bw = 760, bh = 140;
    x.strokeRect(W / 2 - bw / 2, y, bw, bh);
    x.fillStyle = DIM;
    x.font = `30px ${MONO}`;
    x.fillText("TREKKER", W / 2, y + 44);
    x.fillStyle = PAPER;
    fitFont(x, (d.runner || "").toUpperCase(), bw - 80, 64, DISPLAY);
    x.fillText((d.runner || "").toUpperCase(), W / 2, y + 104);
    y += 200;

    // fecha + origen
    x.fillStyle = DIM;
    x.font = `34px ${MONO}`;
    x.fillText(`${d.date || ""} · ${SITE_URL}`, W / 2, y);
    y += 60;

    // pie (se limpia la zona antes de dibujar: anti-fantasma)
    x.fillStyle = INK;
    x.fillRect(0, H - 116, W, 116);
    x.fillStyle = ACID;
    x.font = `30px ${MONO}`;
    x.fillText("TREKKEA LA RUTA · CONQUISTA HUARAL", W / 2, H - 70);

    return c;
  }

  async function shareOrDownload(canvas, filename, text) {
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    if (!blob) { TRPToast.show("No se pudo generar la imagen."); return; }
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "TUSRUTASPERU", text });
        TRPToast.show("¡Resultado compartido! 📤");
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return; // el usuario canceló
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    TRPToast.show("Imagen descargada. ¡Súbela a TikTok! 🎬");
  }

  /* Tarjeta en caché por resultado (no regenerar en cada clic) */
  let lastCanvas = null, lastKey = "";
  function slugOf(name) {
    return (name || "resultado").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resultado";
  }
  async function getCard() {
    const d = window.__trpShareData;
    if (!d) return null;
    const key = [d.timeMs, d.placeName, d.runner, d.track].join("|");
    if (!lastCanvas || key !== lastKey) {
      lastCanvas = await makeCard(d);
      lastKey = key;
    }
    return { canvas: lastCanvas, d, filename: `tusrutasperu-${slugOf(d.placeName)}.png` };
  }

  async function downloadCard(btn) {
    const got = await getCard();
    if (!got) { TRPToast.show("Sin resultado para compartir todavía."); return; }
    const blob = await new Promise((r) => got.canvas.toBlob(r, "image/png"));
    if (!blob) { TRPToast.show("No se pudo generar la imagen."); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = got.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    TRPToast.show("Imagen descargada. ¡Súbela a TikTok! 🎬");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnShareResult");
    if (btn) btn.addEventListener("click", async () => {
      const got = await getCard();
      if (!got) { TRPToast.show("Sin resultado para compartir todavía."); return; }
      btn.disabled = true;
      try {
        await shareOrDownload(got.canvas, got.filename,
          `Mi tiempo en ${got.d.placeName}: ${window.TRP ? TRP.formatMs(got.d.timeMs) : ""} ⏱ #TusRutasPeru`);
      } catch (e) {
        TRPToast.show("No se pudo generar la imagen.");
      }
      btn.disabled = false;
    });
    const dl = document.getElementById("btnDownloadResult");
    if (dl) dl.addEventListener("click", async () => {
      dl.disabled = true;
      try { await downloadCard(); }
      catch (e) { TRPToast.show("No se pudo generar la imagen."); }
      dl.disabled = false;
    });
  });
})();
