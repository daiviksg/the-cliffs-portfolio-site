(function () {
  "use strict";
  var cfg = window.CLIFFS_CONFIG || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canObserve = "IntersectionObserver" in window;
  root.classList.add("js"); // also set in <head> so the hero never flashes
  // Motion below the hero only runs for visitors who haven't asked for reduced motion
  if (!reduceMotion && canObserve) root.classList.add("motion");
  // Always open on the hero intro rather than a restored mid-page position
  if ("scrollRestoration" in history && !location.hash) history.scrollRestoration = "manual";

  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  /* ---------- Lenis: smooth, weighted scrolling ----------
     Off for reduced-motion visitors, and touch screens keep their native
     scrolling (Lenis's default). If the script didn't load, lenis stays null
     and everything below falls back to normal scrolling. Lenis moves the real
     scroll position, so the sticky hero, photo wall and scroll effects keep working. */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.9 });
  }
  // Pause page scrolling behind the menu and photo viewer
  function lockScroll(locked) {
    if (lenis) { if (locked) lenis.stop(); else lenis.start(); }
    document.body.style.overflow = locked ? "hidden" : "";
  }
  // In-page links glide to their section and land just below the top bar
  if (lenis) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip") || e.defaultPrevented) return; // the skip link keeps its instant jump for keyboard users
      var hash = a.getAttribute("href");
      var target = hash === "#top" ? 0 : document.querySelector(hash);
      if (target === null) return;
      e.preventDefault();
      var offset = target === 0 ? 0 : -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
      lenis.scrollTo(target, { offset: offset });
      history.pushState(null, "", hash);
    });
  }

  /* ---------- Config → page ---------- */
  function airbnbHref(section) {
    try {
      var url = new URL(cfg.airbnbUrl);
      url.searchParams.set("utm_source", "thecliffs-site");
      url.searchParams.set("utm_medium", "website");
      url.searchParams.set("utm_content", section);
      return url.toString();
    } catch (e) {
      return cfg.airbnbUrl || "#";
    }
  }
  document.querySelectorAll("[data-airbnb-link]").forEach(function (a) {
    a.href = airbnbHref(a.getAttribute("data-airbnb-link") || "site");
    a.target = "_blank";
    a.rel = "noopener";
    var note = document.createElement("span");
    note.className = "sr-only";
    note.textContent = " (opens Airbnb in a new tab)";
    a.appendChild(note);
  });
  document.querySelectorAll("[data-fact]").forEach(function (el) {
    var v = cfg[el.getAttribute("data-fact")];
    if (v !== undefined && v !== "") el.textContent = v;
  });
  document.querySelectorAll("[data-fact-href]").forEach(function (a) {
    var v = cfg[a.getAttribute("data-fact-href")];
    if (v) a.href = v;
  });
  document.querySelectorAll("[data-fact-mail]").forEach(function (a) {
    var v = cfg[a.getAttribute("data-fact-mail")];
    if (v) a.href = "mailto:" + v;
  });
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Structured data for search engines
  var ld = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: cfg.name || "The Cliffs",
    description: "A private clifftop house of glass, timber and stone above the ocean. Sleeps 6.",
    image: new URL("images/property.jpg", location.href).toString(),
    url: cfg.airbnbUrl,
    address: { "@type": "PostalAddress", addressRegion: cfg.region, addressCountry: "AU" },
    priceRange: cfg.priceFrom ? "From " + cfg.priceFrom + " " + (cfg.currency || "") + " per night" : undefined,
    aggregateRating: cfg.rating ? { "@type": "AggregateRating", ratingValue: cfg.rating, reviewCount: cfg.reviewCount, bestRating: 5 } : undefined
  };
  var s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);

  /* ---------- Buttons: label, two arrows and a fill circle for the flow effect ---------- */
  var ARROW = '<svg class="btn__arrow btn__arrow--%s" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  document.querySelectorAll(".btn").forEach(function (btn) {
    var label = document.createElement("span");
    label.className = "btn__label";
    Array.prototype.slice.call(btn.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.classList.contains("sr-only")) return; // keep screen-reader notes as they are
      label.appendChild(node);
    });
    var fill = document.createElement("span");
    fill.className = "btn__fill";
    fill.setAttribute("aria-hidden", "true");
    btn.insertBefore(fill, btn.firstChild);
    btn.insertBefore(label, fill.nextSibling);
    btn.insertAdjacentHTML("afterbegin", ARROW.replace("%s", "in"));
    btn.insertAdjacentHTML("beforeend", ARROW.replace("%s", "out"));
  });

  /* ---------- Menu (phones): opens from the hero nav or the top bar ---------- */
  var menu = document.getElementById("mobile-menu");
  var openers = document.querySelectorAll("[data-menu-open]");
  var menuReturn = null;
  function menuItems() { return menu.querySelectorAll("a, button"); }
  function setMenu(open, opener) {
    if (!menu || open === !menu.hidden) return;
    menu.hidden = !open;
    lockScroll(open);
    openers.forEach(function (b) {
      b.setAttribute("aria-expanded", String(open));
      b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    if (open) {
      menuReturn = opener || document.activeElement;
      menuItems()[1].focus(); // first link (item 0 is the Close button)
    } else if (menuReturn) {
      menuReturn.focus({ preventScroll: true });
    }
  }
  if (menu) {
    openers.forEach(function (b) {
      b.addEventListener("click", function () { setMenu(menu.hidden, b); });
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") || e.target.closest("[data-menu-close]")) setMenu(false);
    });
    // keep keyboard focus inside the open menu
    menu.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var items = menuItems(), first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Stagger indexes (read by CSS as --i) ---------- */
  function index(selector) {
    document.querySelectorAll(selector).forEach(function (el, i) { el.style.setProperty("--i", i); });
  }
  index(".amen li");
  index(".distances > div");

  /* ---------- The house: split the lead into lines so it can arrive line by line ---------- */
  function splitLines(el) {
    var original = el.textContent.trim();
    var words = original.split(/\s+/);
    el.textContent = "";
    var spans = words.map(function (w, i) {
      var sp = document.createElement("span");
      sp.textContent = w;
      el.appendChild(sp);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return sp;
    });
    var lines = [], top = null;
    spans.forEach(function (sp) {
      if (sp.offsetTop !== top) { lines.push([]); top = sp.offsetTop; }
      lines[lines.length - 1].push(sp.textContent);
    });
    el.textContent = "";
    lines.forEach(function (ws, i) {
      var line = document.createElement("span");
      line.className = "line";
      line.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "line__in";
      inner.style.setProperty("--i", i);
      inner.textContent = ws.join(" ");
      line.appendChild(inner);
      el.appendChild(line);
    });
    // screen readers get the paragraph as one piece of text
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = original;
    el.appendChild(sr);
    return original;
  }
  var lineEls = root.classList.contains("motion") ? document.querySelectorAll("[data-lines]") : [];
  if (lineEls.length) {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      lineEls.forEach(function (el) { el.dataset.original = splitLines(el); });
    });
  }
  // once the lines have arrived, restore plain text so it reflows naturally on resize
  function restoreLines(section) {
    section.querySelectorAll("[data-lines]").forEach(function (el) {
      if (!el.dataset.original) return;
      setTimeout(function () { el.textContent = el.dataset.original; delete el.dataset.original; }, 2200);
    });
  }

  /* ---------- One-off arrivals ---------- */
  var revealTargets = ".strata, [data-open], .amen, .distances, .quotes, .day__cta";
  var pending = [];
  var io = null;
  function arrive(el) {
    if (el.classList.contains("is-in")) return;
    el.classList.add("is-in");
    var tile = el.closest(".tile");   // photo-wall names follow their photo
    if (tile) tile.classList.add("is-in");
    if (el.matches(".strata")) restoreLines(el);
    if (io) io.unobserve(el);
  }
  if (root.classList.contains("motion")) {
    pending = Array.prototype.slice.call(document.querySelectorAll(revealTargets));
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) arrive(en.target); });
    }, { rootMargin: "0px 0px -12% 0px" });
    pending.forEach(function (el) { io.observe(el); });
  }
  // Backup for browsers that don't report intersections (checked in the scroll loop):
  // anything whose top has passed 88% of the screen arrives, so nothing stays hidden
  function checkArrivals(vh) {
    if (!pending.length) return;
    var due = [], waiting = [];
    pending.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      (el.getBoundingClientRect().top < vh * 0.88 ? due : waiting).push(el);
    });
    pending = waiting;
    due.forEach(arrive);
  }

  /* ---------- Scroll-driven effects ---------- */
  var xstage = document.querySelector("[data-xhero]");
  var hero = document.querySelector(".xhero");
  var finalSec = document.getElementById("book");
  var finalFrame = document.querySelector(".final__frame");
  var bookbar = document.getElementById("bookbar");
  var topbar = document.getElementById("topbar");
  var strata = document.querySelectorAll(".strata");
  var drifters = document.querySelectorAll("[data-drift]");
  var daySec = document.getElementById("day");
  var skies = daySec ? daySec.querySelectorAll(".sky i") : [];
  var dayItems = daySec ? daySec.querySelectorAll(".day__list li") : [];
  var motionOn = root.classList.contains("motion");
  var ticking = false;

  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;

    /* ---- 1. Read: measure everything before changing anything ---- */
    var heroRect = hero ? hero.getBoundingClientRect() : null;
    var travel = hero && xstage ? hero.offsetHeight - xstage.offsetHeight : 0;
    var finalTop = finalSec ? finalSec.getBoundingClientRect().top : Infinity;
    var sectionRects = [], driftRects = [], dayRect = null, frameRect = null;
    if (motionOn) {
      strata.forEach(function (sec) { sectionRects.push(sec.getBoundingClientRect()); });
      drifters.forEach(function (el) { driftRects.push(el.getBoundingClientRect()); });
      if (daySec) dayRect = daySec.getBoundingClientRect();
      if (finalFrame) frameRect = finalFrame.getBoundingClientRect();
    }

    /* ---- 2. Write ---- */
    // Hero: progress through the tall section drives the card's expansion
    if (xstage && heroRect) {
      var xp = 1;
      if (!reduceMotion) {
        // travel can read 0 before layout settles, so fall back to the closed state
        xp = travel > 0 ? clamp(-heroRect.top / travel) : 0;
        // ease-out so the card opens quickly at first, then settles
        xp = 1 - Math.pow(1 - xp, 2);
      }
      xstage.style.setProperty("--p", xp.toFixed(4));
      xstage.classList.toggle("is-open", xp > 0.92);
      // stop the idle zoom once scrolling begins; it resumes if they return to the top
      xstage.classList.toggle("is-scrolled", xp > 0);
    }

    if (topbar && heroRect) {
      var showTop = heroRect.bottom < 80;
      topbar.classList.toggle("is-visible", showTop);
      topbar.inert = !showTop; // not reachable by keyboard while hidden
    }

    if (bookbar && heroRect) {
      bookbar.classList.toggle("is-visible", heroRect.bottom < vh * 0.4 && finalTop >= vh * 0.9);
    }

    if (!motionOn) return;

    // Tide gauge: how far through each section you've read
    strata.forEach(function (sec, i) {
      var r = sectionRects[i];
      if (r.bottom < 0 || r.top > vh) return;
      sec.style.setProperty("--sp", clamp((vh * 0.5 - r.top) / r.height).toFixed(3));
    });

    // Drift: -1 (below centre) … 1 (above centre) for photos near the screen
    drifters.forEach(function (el, i) {
      var r = driftRects[i];
      if (r.bottom < -100 || r.top > vh + 100) return;
      var d = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty("--d", Math.max(-1, Math.min(1, d)).toFixed(3));
    });

    // A day here: dawn → day → dusk → night as you scroll through the band
    if (dayRect && dayRect.bottom > -50 && dayRect.top < vh + 50) {
      var dp = clamp((vh * 0.7 - dayRect.top) / (dayRect.height + vh * 0.3));
      var x = dp * (skies.length - 1);
      skies.forEach(function (sky, i) { sky.style.opacity = Math.max(0, 1 - Math.abs(x - i)).toFixed(3); });
      var now = dayRect.top < vh * 0.75 ? Math.min(dayItems.length - 1, Math.floor(dp * dayItems.length)) : -1;
      dayItems.forEach(function (li, i) { li.classList.toggle("is-now", i === now); });
      daySec.classList.toggle("is-dusk", now === dayItems.length - 1);
    }

    // Book: the window opens again as it scrolls in, then the lights come on
    if (frameRect && frameRect.top < vh + 50 && frameRect.bottom > 0) {
      var fp = clamp((vh - frameRect.top) / (vh * 0.85));
      fp = 1 - Math.pow(1 - fp, 2);
      finalFrame.style.setProperty("--fp", fp.toFixed(4));
      finalFrame.classList.toggle("is-open", fp > 0.97);
    }

    // one-off arrivals (does its own read-then-write pass)
    checkArrivals(vh);
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", onScroll);
  onScroll();

  /* ---------- Hero: keyboard focus opens the house ---------- */
  var reveal = document.querySelector(".xhero__reveal");
  if (reveal && hero && xstage) {
    reveal.addEventListener("focusin", function () {
      if (xstage.classList.contains("is-open") || reduceMotion) return;
      var end = hero.offsetTop + hero.offsetHeight - xstage.offsetHeight;
      if (lenis) lenis.scrollTo(end, { immediate: true }); else window.scrollTo({ top: end, behavior: "instant" });
    });
  }
  // Keyboard focus on the Reserve button opens the finale straight away
  if (finalFrame) {
    finalFrame.addEventListener("focusin", function () {
      finalFrame.style.setProperty("--fp", "1");
      finalFrame.classList.add("is-open");
    });
  }

  /* ---------- Review carousel ---------- */
  // No auto-rotation: reviews change only when the visitor asks
  var quotes = document.querySelectorAll(".quote");
  var count = document.querySelector("[data-quote-count]");
  var qi = 0;
  function showQuote(i) {
    quotes[qi].classList.remove("is-active");
    qi = (i + quotes.length) % quotes.length;
    quotes[qi].classList.add("is-active");
    if (count) count.textContent = (qi + 1) + " of " + quotes.length;
  }
  if (count) count.textContent = "1 of " + quotes.length;
  document.querySelectorAll("[data-quote]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showQuote(qi + (btn.getAttribute("data-quote") === "next" ? 1 : -1));
    });
  });

  /* ---------- Photo viewer: expands from the photo's place in the grid ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = lb && lb.querySelector("img");
  var lbClose = lb && lb.querySelector(".lightbox__close");
  var lastFocus = null, closing = false;
  var EXPAND = "transform .55s cubic-bezier(.22,.61,.36,1), clip-path .55s cubic-bezier(.22,.61,.36,1)";

  // Transform + clip that make the full image sit exactly over the thumbnail's frame
  function fromThumb(thumb) {
    var t = thumb.getBoundingClientRect(), f = lbImg.getBoundingClientRect();
    var sc = Math.max(t.width / f.width, t.height / f.height);
    var dx = (t.left + t.width / 2) - (f.left + f.width / 2);
    var dy = (t.top + t.height / 2) - (f.top + f.height / 2);
    var ix = Math.max(0, (f.width - t.width / sc) / 2), iy = Math.max(0, (f.height - t.height / sc) / 2);
    return {
      transform: "translate(" + dx + "px," + dy + "px) scale(" + sc + ")",
      clip: "inset(" + iy + "px " + ix + "px round " + (3 / sc) + "px)"
    };
  }

  function openLb(btn) {
    var img = btn.querySelector("img");
    if (!img) return; // photo not added yet
    lastFocus = btn;
    closing = false;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lb.hidden = false;
    lockScroll(true);
    lbClose.focus();
    if (!motionOn) { lb.classList.add("is-open"); return; }
    // wait for the full image to decode, but never longer than 180ms
    var decoded = lbImg.decode ? lbImg.decode().catch(function () {}) : Promise.resolve();
    var ready = Promise.race([decoded, new Promise(function (r) { setTimeout(r, 180); })]);
    ready.then(function () {
      if (lb.hidden || closing) return;
      var start = fromThumb(btn);
      lbImg.style.transition = "none";
      lbImg.style.transform = start.transform;
      lbImg.style.clipPath = start.clip;
      lbImg.getBoundingClientRect(); // commit the start position
      lbImg.style.transition = EXPAND;
      lbImg.style.transform = "none";
      lbImg.style.clipPath = "inset(0 round 3px)";
      lb.classList.add("is-open");
    });
  }

  function finishClose() {
    lb.hidden = true;
    lbImg.style.transition = lbImg.style.transform = lbImg.style.clipPath = "";
    lockScroll(false);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  function closeLb() {
    if (lb.hidden || closing) return;
    closing = true;
    lb.classList.remove("is-open");
    if (!motionOn || !lastFocus) { finishClose(); return; }
    var end = fromThumb(lastFocus);
    lbImg.style.transition = EXPAND;
    lbImg.style.transform = end.transform;
    lbImg.style.clipPath = end.clip;
    setTimeout(finishClose, 560);
  }

  document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
    btn.addEventListener("click", function () { openLb(btn); });
  });
  if (lb) {
    lb.addEventListener("click", function (e) { if (e.target !== lbImg) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Tab" && !lb.hidden) { e.preventDefault(); lbClose.focus(); return; }
      if (e.key !== "Escape") return;
      if (!lb.hidden) closeLb();
      else if (menu && !menu.hidden) setMenu(false);
    });
  }
})();
