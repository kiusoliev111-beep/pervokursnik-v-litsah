(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const c = siteConfig;

  /* Тексты из конфигурации */
  document.querySelectorAll("[data-text]").forEach(el => { el.textContent = c[el.dataset.text]; });
  document.title = c.projectTitle + " — " + c.eventName;
  const paras = Array.isArray(c.description) ? c.description : [c.description];
  paras.forEach(t => { const el = document.createElement("p"); el.textContent = t; $("#aboutText").appendChild(el); });
  $('meta[name="description"]').content = paras[0].length > 160 ? paras[0].slice(0, 157).trim() + "…" : paras[0];
  $("time").setAttribute("datetime", c.dateISO);

  /* Заглушка (SVG), если файла нет */
  const placeholder = n => "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#d9dde2"/>` +
    `<path d="M0 300 L140 170 L220 240 L290 190 L400 300Z" fill="#c4cad1"/><circle cx="300" cy="90" r="26" fill="#c4cad1"/>` +
    `<text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#6b7480">Фото ${n}</text>` +
    `<text x="200" y="178" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b7480">файл не добавлен</text></svg>`);

  const ext = p => (p.match(/\.([a-z0-9]+)$/i) || [, "jpg"])[1].toLowerCase();
  const fname = (p, kind) => `${c.filePrefix}-${p.number}-${kind}.${ext(p[kind])}`;

  let tt; const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 3500); };

  /* Скачивание: сначала проверяем, что файл существует */
  async function download(photo, kind, btn) {
    const url = photo[kind];
    const label = kind === "edited" ? "обработанное фото" : "оригинал";
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      const type = r.headers.get("content-type") || "";
      if (!r.ok || type.includes("text/html")) throw new Error("HTTP " + r.status);
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
  photos.forEach((p, i) => {
    const fig = document.createElement("article");
    fig.className = "card";
    fig.innerHTML =
      `<button class="card__open" aria-label="Открыть фотографию"><span class="card__frame"><img loading="${i < 2 ? "eager" : "lazy"}" decoding="async" width="400" height="300"></span></button>` +
      `<div class="card__meta"><h3><button class="card__title"></button></h3><p class="card__cap"></p>` +
      `<div class="actions"><button class="btn btn--dark" data-k="edited">Скачать обработанное фото</button><button class="btn btn--line" data-k="original">Скачать оригинал</button></div></div>`;
    const img = $("img", fig);
    img.alt = p.alt;
    img.onerror = () => { img.onerror = null; img.src = placeholder(p.number); fig.classList.add("is-empty"); };
    if (p.focus) img.style.objectPosition = p.focus;
    img.src = p.edited;
    $(".card__open", fig).setAttribute("aria-label", "Открыть: " + p.title);
    $(".card__title", fig).textContent = p.title;
    $(".card__cap", fig).textContent = p.caption;
    $(".card__open", fig).addEventListener("click", () => openLb(i));
    $(".card__title", fig).addEventListener("click", () => openLb(i));
    fig.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => download(p, b.dataset.k, b)));
    grid.appendChild(fig);
  });

  /* Обложка: первое фото, если оно есть, иначе тёмный фон */
  const cover = $("#coverBg"), probe = new Image();
  probe.onload = () => { cover.style.backgroundImage = `url("${photos[0].edited}")`; cover.classList.add("has-img"); if (photos[0].focus) cover.style.backgroundPosition = photos[0].focus; };
  probe.fetchPriority = "high"; probe.src = photos[0].edited;

  $("#scrollBtn").addEventListener("click", e => { e.preventDefault(); $("#gallery").scrollIntoView({ behavior: "smooth" }); });

  /* Lightbox */
  const lb = $("#lb"), lbImg = $("#lbImg");
  let cur = 0, opener = null;
  function show(i) {
    cur = (i + photos.length) % photos.length;
    const p = photos[cur];
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = placeholder(p.number); };
    lbImg.src = p.edited; lbImg.alt = p.alt;
    $("#lbTitle").textContent = p.title; $("#lbCaption").textContent = p.caption;
    $("#lbCount").textContent = `${cur + 1} / ${photos.length}`;
    ["lbEdited", "lbOriginal"].forEach(id => { $("#" + id).disabled = false; $("#" + id).title = ""; });
  }
  function openLb(i) {
    opener = document.activeElement;
    show(i); lb.hidden = false;
    document.body.classList.add("lock");
    $("#lbClose").focus();
  }
  function closeLb() {
    if (lb.hidden) return;
    lb.hidden = true; document.body.classList.remove("lock");
    if (opener) opener.focus({ preventScroll: true });
  }
  $("#lbClose").onclick = closeLb;
  $("#lbPrev").onclick = () => show(cur - 1);
  $("#lbNext").onclick = () => show(cur + 1);
  $("#lbEdited").onclick = e => download(photos[cur], "edited", e.currentTarget);
  $("#lbOriginal").onclick = e => download(photos[cur], "original", e.currentTarget);
  $("#lbStage").addEventListener("click", e => { if (e.target === e.currentTarget) closeLb(); });

  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "ArrowRight") show(cur + 1);
    else if (e.key === "Tab") {
      const f = [...lb.querySelectorAll("button:not([disabled])")];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Свайпы */
  let sx = 0, sy = 0;
  lb.addEventListener("touchstart", e => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
