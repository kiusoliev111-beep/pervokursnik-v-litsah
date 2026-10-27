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
  async function download(photo, kind, btn) {
    const url = photo[kind], label = kind === "edited" ? "обработанное фото" : "оригинал";
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (!r.ok || (r.headers.get("content-type") || "").includes("text/html")) throw new Error("HTTP " + r.status);
    } catch (e) {
      console.error(`Файл не найден (${label}, ${photo.id}): ${url}`, e);
      toast(`Файл «${label}» для кадра ${photo.number} пока не добавлен.`);
      if (btn) { btn.disabled = true; btn.title = "Файл не добавлен"; }
      return;
    }
    const a = document.createElement("a");
    a.href = url; a.download = fname(photo, kind);
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* Галерея */
  const grid = $("#grid");
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" }) : null;
  photos.forEach((p, i) => {
    const fig = document.createElement("article");
    fig.className = "card";
    fig.innerHTML =
      `<button class="card__open"><span class="card__frame"><img loading="${i < 2 ? "eager" : "lazy"}" decoding="async" width="400" height="300"></span></button>` +
      `<div class="card__meta"><h3><button class="card__title"></button></h3><p class="card__cap"></p>` +
      `<div class="actions"><button class="btn btn--light" data-k="edited">Скачать обработанное фото</button><button class="btn btn--line" data-k="original">Скачать оригинал</button></div></div>`;
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
    fig.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => download(p, b.dataset.k, b)));
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
    ["lbEdited", "lbOriginal"].forEach(id => { $("#" + id).disabled = false; $("#" + id).title = ""; });
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
  $("#lbEdited").onclick = e => download(photos[cur], "edited", e.currentTarget);
  $("#lbOriginal").onclick = e => download(photos[cur], "original", e.currentTarget);
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

  /* Ссылка на конкретный кадр: …/#photo-03 */
  const startIdx = photos.findIndex(p => "#" + p.id === location.hash);
  if (startIdx >= 0) openLb(startIdx, null, true);
})();
