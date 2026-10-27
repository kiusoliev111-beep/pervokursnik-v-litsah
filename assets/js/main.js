(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const c = siteConfig, N = photos.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Тексты из конфигурации */
  document.querySelectorAll("[data-text]").forEach(el => { el.textContent = c[el.dataset.text]; });
  document.title = c.projectTitle + " — " + c.eventName + ", " + c.dateLabel;
  $("time").setAttribute("datetime", c.dateISO);
  const paras = Array.isArray(c.description) ? c.description : [c.description];
  $('meta[name="description"]').content = paras[0].length > 160 ? paras[0].slice(0, 157).trim() + "…" : paras[0];

  /* Описание: названия кадров в «» становятся ссылками на фото */
  const byTitle = new Map(photos.map((p, i) => [p.title, i]));
  paras.forEach(t => {
    const el = document.createElement("p");
    t.split(/(«[^»]+»)/).forEach(part => {
      const m = part.match(/^«([^»]+)»$/);
      if (m && byTitle.has(m[1])) {
        const i = byTitle.get(m[1]), a = document.createElement("a");
        a.href = "#" + photos[i].id; a.className = "ref"; a.textContent = part;
        a.addEventListener("click", e => { e.preventDefault(); openLb(i, null); });
        el.appendChild(a);
      } else el.appendChild(document.createTextNode(part));
    });
    $("#aboutText").appendChild(el);
  });

  const placeholder = n => "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#222a31"/>` +
    `<text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#8b949e">Фото ${n}</text>` +
    `<text x="200" y="178" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#8b949e">файл не добавлен</text></svg>`);
  const ext = p => (p.match(/\.([a-z0-9]+)$/i) || [, "jpg"])[1].toLowerCase();
  const fname = (p, kind) => `${c.filePrefix}-${p.number}-${kind}.${ext(p[kind])}`;
  let tt; const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3500); };

  /* Скачивание: сначала проверяем, что файл существует */
  async function download(url, name, btn, label) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (!r.ok || (r.headers.get("content-type") || "").includes("text/html")) throw new Error("HTTP " + r.status);
    } catch (e) {
      console.error(`Файл не найден (${label}): ${url}`, e);
      toast(`${label}: файл пока не добавлен.`);
      if (btn) { btn.disabled = true; btn.title = "Файл не добавлен"; }
      return;
    }
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  const dlPhoto = (p, btn) => download(p.edited, fname(p, "edited"), btn, `Кадр ${p.number}`);

  /* Галерея */
  const grid = $("#grid");
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" }) : null;
  photos.forEach((p, i) => {
    const fig = document.createElement("article");
    fig.className = "card";
    const ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
    fig.innerHTML =
      `<div class="card__media"><button class="card__open"><span class="card__frame"><img loading="${i < 2 ? "eager" : "lazy"}" decoding="async" width="400" height="300"></span></button>` +
      `<button class="card__dl" type="button">${ARROW}</button></div>` +
      `<div class="card__meta"><h3><button class="card__title"></button></h3><p class="card__cap"></p></div>`;
    const img = $("img", fig); let tried = false;
    img.alt = p.alt;
    img.onerror = () => {
      if (!tried && p.thumb) { tried = true; img.src = p.edited; }
      else { img.onerror = null; img.src = placeholder(p.number); fig.classList.add("is-empty"); }
    };
    if (p.focus) img.style.objectPosition = p.focus;
    img.src = p.thumb || p.edited;
    $(".card__open", fig).setAttribute("aria-label", "Открыть: " + p.title);
    $(".card__title", fig).textContent = p.title;
    $(".card__cap", fig).textContent = p.caption;
    const open = () => openLb(i, $(".card__frame", fig));
    $(".card__open", fig).addEventListener("click", open);
    $(".card__title", fig).addEventListener("click", open);
    const dl = $(".card__dl", fig);
    dl.setAttribute("aria-label", "Скачать фото: " + p.title); dl.title = "Скачать фото";
    dl.addEventListener("click", () => dlPhoto(p, dl));
    img.addEventListener("load", () => {   /* подсветка в цвет фотографии */
      try {
        const cv = document.createElement("canvas"); cv.width = cv.height = 8;
        const x = cv.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, 8, 8);
        const d = x.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0;
        for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
        r /= 64; g /= 64; b /= 64;
        const f = Math.min(2.4, 175 / Math.max(r, g, b, 1));
        fig.style.setProperty("--glow", `rgba(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0},.6)`);
      } catch (e) { /* подсветка необязательна */ }
    });
    grid.appendChild(fig);
    if (io) io.observe(fig); else fig.classList.add("in");
  });

  /* Обложка */
  const cover = $("#coverBg"), probe = new Image();
  probe.onload = () => { cover.style.backgroundImage = `url("${photos[0].edited}")`; cover.classList.add("has-img"); if (photos[0].focus) cover.style.backgroundPosition = photos[0].focus; };
  probe.fetchPriority = "high"; probe.src = photos[0].edited;
  $("#scrollBtn").addEventListener("click", e => { e.preventDefault(); $("#gallery").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
  $("#showBtn").addEventListener("click", () => { openLb(0, null); play(true); });

  /* Lightbox */
  const lb = $("#lb"), lbImg = $("#lbImg"), lbStage = $("#lbStage");
  let cur = 0, opener = null, pushed = false, timer = null, playing = false;

  function play(on) {
    clearInterval(timer); playing = on;
    $("#lbPlay").textContent = on ? "Пауза" : "Показ"; $("#lbPlay").setAttribute("aria-pressed", on);
    if (on) timer = setInterval(() => show(cur + 1), 4500);
  }
  function show(i) {
    cur = (i + N) % N;
    const p = photos[cur];
    resetZ();
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = placeholder(p.number); };
    lbImg.src = p.edited; lbImg.alt = p.alt;
    if (!reduce && lbImg.animate) lbImg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    $("#lbTitle").textContent = p.title; $("#lbCaption").textContent = p.caption;
    $("#lbCount").textContent = `${cur + 1} / ${N}`;
    $("#lbDl").disabled = false; $("#lbDl").title = "";
    [1, -1].forEach(d => { new Image().src = photos[(cur + d + N) % N].edited; });
    if (!lb.hidden) history.replaceState({ lb: 1 }, "", "#" + p.id);
    if (playing) play(true);
  }
  function openLb(i, from, fromLoad) {
    if (!lb.hidden) return;
    opener = document.activeElement;
    show(i); lb.hidden = false;
    document.body.classList.add("lock");
    const hash = "#" + photos[cur].id;
    if (fromLoad) { history.replaceState({ lb: 1 }, "", hash); pushed = false; }
    else { history.pushState({ lb: 1 }, "", hash); pushed = true; }
    $("#lbClose").focus({ preventScroll: true });
    if (!reduce && lb.animate) {
      lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      if (from && lbImg.animate) try {
        const r = from.getBoundingClientRect(), st = lbStage.getBoundingClientRect();
        const dx = r.left + r.width / 2 - (st.left + st.width / 2), dy = r.top + r.height / 2 - (st.top + st.height / 2);
        const s = Math.min(1, r.width / Math.max(1, st.width - 24));
        lbImg.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})` }, { transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
      } catch (e) { /* анимация необязательна */ }
    }
  }
  function closeLb(fromPop) {
    if (lb.hidden) return;
    play(false); lb.hidden = true; document.body.classList.remove("lock");
    if (!fromPop) { if (pushed) history.back(); else history.replaceState(null, "", location.pathname + location.search); }
    pushed = false;
    if (opener) opener.focus({ preventScroll: true });
  }
  window.addEventListener("popstate", () => { if (!lb.hidden) closeLb(true); });

  $("#lbClose").onclick = () => closeLb();
  $("#lbPrev").onclick = () => show(cur - 1);
  $("#lbNext").onclick = () => show(cur + 1);
  $("#lbPlay").onclick = () => play(!playing);
  $("#lbCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(location.href); toast("Ссылка на этот кадр скопирована"); }
    catch (e) { toast("Скопируйте адрес из строки браузера"); }
  };
  $("#lbDl").onclick = e => dlPhoto(photos[cur], e.currentTarget);
  lbStage.addEventListener("click", e => { if (e.target === e.currentTarget) closeLb(); });

  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "ArrowRight") show(cur + 1);
    else if (e.key === "Tab") {
      const f = [...lb.querySelectorAll("button:not([disabled])")], first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Жесты: свайп (листание), щипок и двойной тап (масштаб), перетаскивание в увеличении */
  let z = { s: 1, x: 0, y: 0 }, pinch = null, t0 = null, moved = false, lastTap = 0;
  const applyZ = () => { lbImg.style.transform = z.s === 1 ? "" : `translate(${z.x}px,${z.y}px) scale(${z.s})`; };
  function resetZ() { z = { s: 1, x: 0, y: 0 }; pinch = null; applyZ(); }
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  lbStage.addEventListener("touchstart", e => {
    if (e.touches.length === 2) { pinch = { d: dist(e.touches), s: z.s }; t0 = null; }
    else if (e.touches.length === 1) { const t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY, px: t.clientX, py: t.clientY }; moved = false; }
  }, { passive: true });
  lbStage.addEventListener("touchmove", e => {
    if (pinch && e.touches.length === 2) { z.s = Math.min(4, Math.max(1, pinch.s * dist(e.touches) / pinch.d)); applyZ(); e.preventDefault(); }
    else if (t0 && e.touches.length === 1) {
      const t = e.touches[0];
      if (Math.abs(t.clientX - t0.x) > 8 || Math.abs(t.clientY - t0.y) > 8) moved = true;
      if (z.s > 1) {
        const mx = lbImg.clientWidth * (z.s - 1) / 2, my = lbImg.clientHeight * (z.s - 1) / 2;
        z.x = Math.max(-mx, Math.min(mx, z.x + t.clientX - t0.px)); z.y = Math.max(-my, Math.min(my, z.y + t.clientY - t0.py));
        applyZ(); e.preventDefault();
      }
      t0.px = t.clientX; t0.py = t.clientY;
    }
  }, { passive: false });
  lbStage.addEventListener("touchend", e => {
    if (pinch) { if (e.touches.length < 2) { pinch = null; if (z.s < 1.05) resetZ(); } t0 = null; return; }
    if (!t0) return;
    const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    if (z.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
    else if (!moved) {
      const now = Date.now();
      if (now - lastTap < 300) { if (z.s > 1) resetZ(); else { z = { s: 2.5, x: 0, y: 0 }; applyZ(); } lastTap = 0; } else lastTap = now;
    }
    t0 = null;
  });

  /* Скачать все кадры архивом */
  const dls = c.downloads || {};
  $("#dlEdited").addEventListener("click", e => download(dls.edited, `${c.filePrefix}-edited.zip`, e.currentTarget, "Архив с обработанными фото"));
  $("#dlOrig").addEventListener("click", () => {
    if (!dls.originals) { toast("Архив с исходниками пока не добавлен."); return; }
    const a = document.createElement("a"); a.href = dls.originals; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* Обратная связь: значок показывается, только если ссылка заполнена в photos.js */
  const ICON = {
    vk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.8 17.5C7.3 17.5 4.2 13.7 4.1 7.5h2.7c.1 4.6 2.1 6.5 3.7 6.9V7.5h2.6v4c1.6-.2 3.3-2 3.8-4h2.5c-.4 2.5-2.2 4.3-3.4 5 1.2.6 3.2 2.1 4 4.9h-2.8c-.6-1.9-2.1-3.3-4.1-3.5v3.6z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.7 3.6 2.9 10.5c-.9.4-.9 1 0 1.3l4.5 1.4 1.7 5.2c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.2-2.1 4.5 3.3c.8.5 1.4.2 1.7-.8L22 5c.3-1.2-.4-1.8-1.3-1.4zM9.4 13.4l8.4-5.3-6.7 6.4-.3 3.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M6.6 3.5 9 3l1.7 4.2-1.9 1.4a11 11 0 0 0 5.6 5.6l1.4-1.9L20 14l-.5 2.4a2.6 2.6 0 0 1-2.6 2.1C10.3 18.5 5.5 13.700 5.500 6.100a2.600 2.600 0 0 1 1.100-2.600z"/></svg>',
    max: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="18" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="15.2" text-anchor="middle" font-size="8.5" font-weight="700" fill="currentColor" font-family="sans-serif">MAX</text></svg>'
  };
  const ct = c.contacts || {};
  const href = (v, base) => !v ? "" : /^https?:\/\//i.test(v) ? v : base + v.replace(/^@/, "");
  [["vk", "ВКонтакте", href(ct.vk, "https://vk.com/")], ["telegram", "Telegram", href(ct.telegram, "https://t.me/")], ["max", "MAX", href(ct.max, "")],
   ["phone", ct.phone || "", ct.phone ? "tel:" + ct.phone.replace(/[^\d+]/g, "") : ""]]
    .filter(x => x[2]).forEach(([k, label, url]) => {
      const a = document.createElement("a");
      a.className = "soc"; a.href = url; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", label);
      a.innerHTML = ICON[k]; const sp = document.createElement("span"); sp.textContent = label; a.appendChild(sp);
      $("#socials").appendChild(a); $("#contacts").hidden = false;
    });

  /* Ссылка на конкретный кадр: …/#photo-03 */
  const startIdx = photos.findIndex(p => "#" + p.id === location.hash);
  if (startIdx >= 0) openLb(startIdx, null, true);
})();
