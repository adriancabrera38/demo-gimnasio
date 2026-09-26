(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var body = document.body;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function onScroll(fn) {
    var t = false;
    window.addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; fn(); }); } }, { passive: true });
    fn();
  }
  function madridNow() {
    try { return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })); }
    catch (e) { return new Date(); }
  }
  function toMin(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }

  /* 1. Nav + menú ------------------------------------------------ */
  function initNav() {
    var nav = $("[data-nav]");
    if (nav) onScroll(function () { nav.classList.toggle("is-scrolled", scrollY > 20); });
    var b = $(".burger"), m = $("#menu");
    if (!b || !m) return;
    function set(open) {
      b.setAttribute("aria-expanded", String(open));
      b.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      m.classList.toggle("is-open", open);
      m.setAttribute("aria-hidden", String(!open));
      document.documentElement.style.overflow = open ? "hidden" : "";
    }
    b.addEventListener("click", function () { set(b.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* 2. Firma: degradado que sigue al ratón (con deriva propia) ---- */
  function initGlow() {
    var glows = $$(".hero-glow");
    if (!glows.length) return;
    var tx = 70, ty = 40, cx = 70, cy = 40, last = 0, t0 = performance.now();
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX / innerWidth * 100;
      ty = e.clientY / innerHeight * 100;
      last = performance.now();
    }, { passive: true });
    (function loop(now) {
      // Sin ratón (móvil o quieto 3 s): el foco de luz deriva solo, despacio
      if (!fineHover || now - last > 3000) {
        var k = (now - t0) / 1000 * (reduced ? 0.12 : 0.35);
        tx = 55 + Math.sin(k) * 25;
        ty = 45 + Math.cos(k * 0.8) * 20;
      }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      glows.forEach(function (g) {
        g.style.setProperty("--mx", cx.toFixed(2) + "%");
        g.style.setProperty("--my", cy.toFixed(2) + "%");
      });
      requestAnimationFrame(loop);
    })(t0);
  }

  /* 3. Reveals --------------------------------------------------- */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-revealed"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-revealed"); });
    }, 6000);
  }

  /* 4. Manifiesto: las palabras se encienden con el scroll -------- */
  function initManifesto() {
    var p = $("[data-words]");
    if (!p || p.dataset.bound) return;
    p.dataset.bound = "1";
    // Envuelve palabras preservando <em> (resaltadas en lima)
    var html = "";
    Array.prototype.forEach.call(p.childNodes, function (n) {
      var hl = n.nodeType === 1;
      var text = n.textContent;
      text.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        html += /^\s+$/.test(w) ? w : '<span class="w' + (hl ? " hl" : "") + '">' + w.replace(/</g, "&lt;") + "</span>";
      });
    });
    p.setAttribute("aria-label", p.textContent.replace(/\s+/g, " ").trim());
    p.innerHTML = html;
    var words = $$(".w", p);
    words.forEach(function (w) { w.setAttribute("aria-hidden", "true"); });
    onScroll(function () {
      var r = p.getBoundingClientRect();
      var prog = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      var n = Math.round(Math.max(0, Math.min(1, prog)) * words.length);
      words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    });
  }

  /* 5. Disciplinas: filas que se despliegan ---------------------- */
  function initDisciplines() {
    $$(".d-row").forEach(function (row) {
      var btn = $(".d-head", row);
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var open = !row.classList.contains("is-open");
        $$(".d-row.is-open").forEach(function (r) { if (r !== row) { r.classList.remove("is-open"); $(".d-head", r).setAttribute("aria-expanded", "false"); } });
        row.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* 6. Contadores ------------------------------------------------ */
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute("data-count")), sup = el.querySelector("sup");
        var supHTML = sup ? sup.outerHTML : "";
        var t0 = performance.now();
        (function tick(t) {
          var p = Math.min(1, (t - t0) / 1500);
          var v = Math.round(to * (1 - Math.pow(1 - p, 3)));
          el.innerHTML = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + supHTML;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* 7. Horario: días, filtros y reservas (demo, en memoria) ------ */
  function initSchedule() {
    var root = $("[data-schedule]");
    if (!root) return;
    var dayBtns = $$(".days button", root), chips = $$(".chips button", root);
    var slots = $$(".slot", root), empty = $(".empty-day", root);
    var toast = $("[data-toast]");
    var day = madridNow().getDay(), type = "todas";
    if (!dayBtns.some(function (b) { return +b.dataset.day === day; })) day = 1;

    function render() {
      dayBtns.forEach(function (b) { b.setAttribute("aria-selected", String(+b.dataset.day === day)); b.tabIndex = +b.dataset.day === day ? 0 : -1; });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.type === type)); });
      var shown = 0;
      slots.forEach(function (s) {
        var ok = +s.dataset.day === day && (type === "todas" || s.dataset.type === type);
        s.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle("is-visible", shown === 0);
    }
    function paintCap(s) {
      var cap = +s.dataset.cap, taken = +s.dataset.taken, left = cap - taken;
      var i = $(".bar i", s), lbl = $(".cap .left", s), btn = $(".book", s);
      i.style.width = (taken / cap * 100) + "%";
      i.classList.toggle("full", left <= 0);
      lbl.textContent = left <= 0 ? "Completa" : left + (left === 1 ? " plaza libre" : " plazas libres");
      if (!btn.classList.contains("is-booked")) btn.disabled = left <= 0;
    }
    slots.forEach(function (s) {
      paintCap(s);
      var btn = $(".book", s);
      btn.addEventListener("click", function () {
        var booked = btn.classList.toggle("is-booked");
        s.dataset.taken = +s.dataset.taken + (booked ? 1 : -1);
        btn.textContent = booked ? "Reservada ✓" : "Reservar";
        paintCap(s);
        if (toast) {
          toast.textContent = booked ? "Plaza reservada en " + $("h3", s).textContent + " (demo)" : "Reserva cancelada";
          toast.classList.add("is-visible");
          clearTimeout(toast._t);
          toast._t = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
        }
      });
    });
    dayBtns.forEach(function (b, idx) {
      b.addEventListener("click", function () { day = +b.dataset.day; render(); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        var n = dayBtns[(idx + d + dayBtns.length) % dayBtns.length];
        n.focus(); n.click();
      });
    });
    chips.forEach(function (c) { c.addEventListener("click", function () { type = c.dataset.type; render(); }); });
    render();
  }

  /* 8. Tarifas: mensual / anual ---------------------------------- */
  function initBilling() {
    var root = $("[data-billing]");
    if (!root) return;
    var btns = $$("button", root), pill = $(".pill", root);
    function set(mode) {
      btns.forEach(function (b) {
        var on = b.dataset.mode === mode;
        b.setAttribute("aria-pressed", String(on));
        if (on && pill) { pill.style.width = b.offsetWidth + "px"; pill.style.transform = "translateX(" + (b.offsetLeft - 5) + "px)"; }
      });
      $$("[data-price]").forEach(function (el) {
        var m = +el.dataset.price;
        var v = mode === "anual" ? Math.round(m * 0.8) : m;
        el.firstChild.nodeValue = v + " €";
      });
      $$("[data-period]").forEach(function (el) { el.textContent = mode === "anual" ? "/ mes · pago anual" : "/ mes"; });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { set(b.dataset.mode); }); });
    set("mensual");
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { set($('[aria-pressed="true"]', root).dataset.mode); });
  }

  /* 9. Abierto ahora + día de hoy -------------------------------- */
  function initOpenStatus() {
    if (!data.hours) return;
    var now = madridNow(), day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
    var slot = null;
    (data.hours[day] || []).forEach(function (s) { if (min >= toMin(s[0]) && min < toMin(s[1])) slot = s; });
    $$("[data-open-status]").forEach(function (el) {
      el.classList.toggle("is-open", !!slot);
      var l = $(".label", el); if (l) l.textContent = slot ? "Abierto ahora · hasta las " + slot[1] : "Ahora cerrado";
    });
    $$('[data-days~="' + day + '"]').forEach(function (el) { el.classList.add("is-today"); });
  }

  /* 10. Formularios (demo) --------------------------------------- */
  function initForms() {
    $$("[data-demo-form]").forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = "1";
      var success = form.parentElement.querySelector("[data-success]");
      function setErr(el, msg) {
        var w = el.closest(".field"); if (!w) return;
        w.classList.toggle("is-invalid", !!msg);
        var e = $(".err", w); if (e) e.textContent = msg || "";
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        $$("[required]", form).forEach(function (el) {
          var v = el.value.trim(), msg = "";
          if (!v) msg = "Campo obligatorio";
          else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Email no válido";
          else if (el.type === "tel" && v.replace(/\D/g, "").length < 9) msg = "Teléfono no válido";
          setErr(el, msg);
          if (msg) ok = false;
        });
        if (!ok) { var bad = $(".is-invalid input", form); if (bad) bad.focus(); return; }
        form.classList.add("is-sending");
        var lbl = $("[data-btn-label]", form); if (lbl) lbl.textContent = "Enviando…";
        setTimeout(function () {
          form.hidden = true;
          if (!success) return;
          var n = form.elements.nombre ? form.elements.nombre.value.trim().split(" ")[0] : "";
          var s = $("[data-name]", success); if (s) s.textContent = n;
          var goal = form.querySelector('input[name="objetivo"]:checked');
          var g = $("[data-goal]", success); if (g && goal) g.textContent = goal.nextElementSibling.textContent.toLowerCase();
          success.classList.add("is-visible");
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: true });
          window.scrollTo({ top: success.getBoundingClientRect().top + scrollY - 160, behavior: reduced ? "auto" : "smooth" });
        }, 900);
      });
    });
  }

  /* Arranque ---------------------------------------------------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initGlow, "initGlow");
    safe(initReveals, "initReveals");
    safe(initManifesto, "initManifesto");
    safe(initDisciplines, "initDisciplines");
    safe(initCounters, "initCounters");
    safe(initSchedule, "initSchedule");
    safe(initBilling, "initBilling");
    safe(initOpenStatus, "initOpenStatus");
    safe(initForms, "initForms");
    if (window.gsap && window.ScrollTrigger) { try { gsap.registerPlugin(ScrollTrigger); } catch (_) {} }
    window.__KB_OK = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.add("is-loaded"); }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
