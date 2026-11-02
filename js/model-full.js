// Full model page: film loops, turntable, roof wipe, gallery, header tone and menu. The build sheet lives in model.js.
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 767px)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let lenis = null;

  // Menu
  const hdr = $("[data-hdr]"), menu = $("[data-menu]"), toggle = $("[data-menu-toggle]"), label = $("[data-menu-label]");
  let menuTimer = 0;
  const setMenu = (open) => {
    clearTimeout(menuTimer);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close" : "Menu";
    doc.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
      lenis && lenis.stop();
      $("a", menu).focus({ preventScroll: true });
    } else {
      menu.classList.remove("is-open");
      menuTimer = setTimeout(() => { menu.hidden = true; }, reduce ? 0 : 500);
      lenis && lenis.start();
    }
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  $$("[data-sheet-open]", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Header tone: later sections sit on top of the held films, so the last match wins
  const toned = $$("[data-tone]:not([data-hdr])").reverse();
  const updateTone = () => {
    const y = (hdr.offsetHeight || 60) / 2;
    const el = toned.find((n) => {
      const r = n.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    const tone = el ? el.dataset.tone : "dark";
    if (hdr.dataset.tone !== tone) hdr.dataset.tone = tone;
  };
  updateTone();

  // Film loops: start at once, stay running while on screen; poster is the first frame
  $$("[data-film]").forEach((v) => {
    const section = v.closest("section");
    const btn = $("[data-vid-toggle]", section);
    const m = mobile.matches;
    if (m) v.poster = v.dataset.posterM;
    v.src = m ? v.dataset.srcM : v.dataset.srcD;
    let held = reduce;
    const show = () => {
      if (!btn) return;
      btn.classList.toggle("is-paused", v.paused);
      btn.setAttribute("aria-label", v.paused ? "Play film" : "Pause film");
    };
    v.addEventListener("play", show);
    v.addEventListener("pause", show);
    show();
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !held) v.play().catch(() => {});
      else if (!e[0].isIntersecting) v.pause();
    }, { rootMargin: "20% 0px" });
    io.observe(v);
    btn && btn.addEventListener("click", () => {
      held = !v.paused;
      if (held) v.pause();
      else v.play().catch(() => {});
    });
  });

  // Turntable: 36 frames. Scroll turns it, dragging and the arrow keys add to that
  const tt = $("[data-tt]");
  const frame = $("[data-tt-frame]");
  const img = $("[data-tt-img]");
  const notes = $$("[data-tt-note]");
  const count = $("[data-tt-count]");
  const N = 36, HOME = 15, dir = mobile.matches ? "m" : "d";
  const url = (k) => `assets/spyder/spin/${dir}${String(k).padStart(2, "0")}.webp`;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  cv.className = "tt__cv";
  cv.setAttribute("aria-hidden", "true");
  const frames = [];
  let scrollTurn = 0, dragTurn = 0, shown = -1;
  const draw = (k) => {
    const f = frames[k];
    if (!f || !f.complete || !f.naturalWidth) return false;
    if (cv.width !== f.naturalWidth) {
      cv.width = f.naturalWidth;
      cv.height = f.naturalHeight;
    }
    ctx.drawImage(f, 0, 0);
    return true;
  };
  const render = () => {
    const raw = HOME + scrollTurn + dragTurn;
    const k = ((Math.round(raw) % N) + N) % N;
    if (k === shown) return;
    if (!draw(k)) return;
    shown = k;
    count.textContent = String(k + 1).padStart(2, "0");
    frame.setAttribute("aria-valuenow", String(k + 1));
    const off = Math.min(Math.abs(k - HOME), N - Math.abs(k - HOME));
    notes.forEach((n) => { n.style.opacity = off === 0 ? 1 : off === 1 ? 0.35 : 0; });
  };
  let loading = false;
  const loadFrames = () => {
    if (loading) return;
    loading = true;
    // outward from the opening frame, so the first turn never waits
    const order = [...Array(N).keys()].sort((a, b) => {
      const d = (x) => Math.min(Math.abs(x - HOME), N - Math.abs(x - HOME));
      return d(a) - d(b);
    });
    let i = 0;
    const next = () => {
      if (i >= N) return;
      const k = order[i++];
      const f = new Image();
      f.decoding = "async";
      f.onload = () => {
        if (k === HOME) {
          draw(k);
          frame.prepend(cv);
          img.style.visibility = "hidden";
          shown = k;
        }
        render();
        next();
      };
      f.onerror = next;
      f.src = url(k);
      frames[k] = f;
    };
    for (let c = 0; c < 4; c++) next();
  };
  new IntersectionObserver((e, o) => {
    if (e[0].isIntersecting) {
      loadFrames();
      o.disconnect();
    }
  }, { rootMargin: "120% 0px" }).observe(tt);
  let held = null;
  frame.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button) return;
    held = { x: e.clientX, turn: dragTurn };
    frame.setPointerCapture(e.pointerId);
    frame.classList.add("is-held");
  });
  frame.addEventListener("pointermove", (e) => {
    if (!held) return;
    dragTurn = held.turn + ((e.clientX - held.x) / frame.clientWidth) * N * 0.9;
    render();
  });
  const release = () => { held = null; frame.classList.remove("is-held"); };
  frame.addEventListener("pointerup", release);
  frame.addEventListener("pointercancel", release);
  frame.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    dragTurn += e.key === "ArrowRight" ? 1 : -1;
    render();
  });

  // Photographs: native scroll on touch, mouse drag on desktop, arrows above the strip
  const gl = $("[data-gl]");
  const rail = $("[data-gl-rail]");
  const items = $$(".gl__it", rail);
  const prev = $("[data-gl-prev]"), next = $("[data-gl-next]"), glN = $("[data-gl-n]");
  const current = () => {
    const x = rail.scrollLeft + rail.clientWidth * 0.08;
    let at = 0;
    items.forEach((it, i) => { if (it.offsetLeft - rail.offsetLeft <= x) at = i; });
    return at;
  };
  const syncRail = () => {
    glN.textContent = String(current() + 1).padStart(2, "0");
    prev.disabled = rail.scrollLeft < 4;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4;
  };
  const go = (d) => {
    const it = items[clamp(current() + d, 0, items.length - 1)];
    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    rail.scrollTo({ left: it.offsetLeft - rail.offsetLeft - pad, behavior: reduce ? "auto" : "smooth" });
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  rail.addEventListener("scroll", syncRail, { passive: true });
  addEventListener("resize", syncRail);
  syncRail();
  let grab = null;
  rail.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button) return;
    grab = { x: e.clientX, left: rail.scrollLeft };
    rail.setPointerCapture(e.pointerId);
    rail.classList.add("is-held");
  });
  rail.addEventListener("pointermove", (e) => { if (grab) rail.scrollLeft = grab.left - (e.clientX - grab.x); });
  const drop = () => { grab = null; rail.classList.remove("is-held"); };
  rail.addEventListener("pointerup", drop);
  rail.addEventListener("pointercancel", drop);
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  const rf = $("[data-rf]");
  const rfTags = { off: $(".rf__tag--off", rf), on: $(".rf__tag--on", rf) };
  const rfFigs = { off: $('[data-rf-fig="off"]', rf), on: $('[data-rf-fig="on"]', rf) };
  const hasLibs = window.gsap && window.ScrollTrigger && window.Lenis;
  if (reduce || !hasLibs) {
    addEventListener("scroll", updateTone, { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  lenis.on("scroll", updateTone);
  gsap.ticker.add((t) => lenis.raf(t * 1e3));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const sheet = $("[data-sheet]");
  if (sheet) new MutationObserver(() => (sheet.open ? lenis.stop() : lenis.start())).observe(sheet, { attributes: true, attributeFilter: ["open"] });

  gsap.context(() => {
    // Held films dim as the next section slides over them
    $$(".ov").forEach((ov) => {
      const film = $(":scope > .vid", ov);
      const over = film.nextElementSibling;
      gsap.to($("[data-dim]", film), { opacity: 0.7, ease: "none", scrollTrigger: { trigger: over, start: "top bottom", end: "top top", scrub: true } });
      const drift = $$("[data-drift]", film);
      if (drift.length) gsap.to(drift, { y: -70, ease: "none", scrollTrigger: { trigger: over, start: "top bottom", end: "top top", scrub: true } });
    });

    // One full turn across the pin, starting and ending on the profile from the bench
    ScrollTrigger.create({
      trigger: "[data-tt-stage]", pin: true, start: "top top", end: () => "+=" + innerHeight * (mobile.matches ? 1.4 : 1.8), anticipatePin: 1,
      onUpdate: (s) => {
        scrollTurn = Math.round(s.progress * N);
        render();
      },
    });

    // Roof goes on: rear to nose, held a moment at each end
    gsap.set(rf, { "--x": "100%" });
    gsap.set(rfFigs.on, { className: "tb__fig is-dim" });
    ScrollTrigger.create({
      trigger: "[data-rf-stage]", pin: true, start: "top top", end: () => "+=" + innerHeight * 1.5, anticipatePin: 1,
      onUpdate: (s) => {
        const p = clamp((s.progress - 0.14) / 0.72, 0, 1);
        const e = p * p * (3 - 2 * p);
        rf.style.setProperty("--x", (100 - e * 100).toFixed(2) + "%");
        rfTags.off.style.opacity = e > 0.86 ? 0 : 1;
        rfTags.on.style.opacity = e < 0.14 ? 0 : 1;
        rfFigs.off.classList.toggle("is-dim", p > 0.5);
        rfFigs.on.classList.toggle("is-dim", p <= 0.5);
      },
    });

    // Plates clear before they reach the header
    $$(".plate").forEach((el) => {
      gsap.to(el, { autoAlpha: 0, ease: "none", scrollTrigger: { trigger: el, start: () => `top ${hdr.offsetHeight + 96}`, end: () => `top ${hdr.offsetHeight + 8}`, scrub: true } });
    });

    // Slow push on held and passing photographs
    $$("[data-zoom]").forEach((el) => {
      gsap.fromTo(el, { scale: 1.1 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el.closest(".ck__bg") ? el.closest(".ck, .ck__blk") : el.closest("figure, section"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Headings rise line by line into a mask
    if (window.SplitText) {
      $$("[data-lines]").forEach((h) => {
        document.fonts.ready.then(() => {
          const split = SplitText.create(h, { type: "lines", mask: "lines", linesClass: "mf-line" });
          gsap.from(split.lines, { yPercent: 104, duration: 1, stagger: 0.09, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%", once: true } });
        });
      });
    }
  });

  // Powertrain, chassis, brakes: the slanted cut and sliding lines from the home page (beatScroll in home_v2.js)
  const lineItems = (root) => {
    const items = [];
    [...root.children].forEach((el) => {
      if (el.matches("h2, p.beat__p, p.bn__p")) items.push(...SplitText.create(el, { type: "lines", linesClass: "slide__line" }).lines);
      else if (el.matches("dl.tb")) items.push(...el.children);
      else items.push(el);
    });
    return items;
  };
  const S = 16;
  const slantCut = (rev) => rev
    ? [`polygon(100% 0%, 100% 0%, ${100 + S}% 100%, 100% 100%)`, `polygon(100% 0%, ${-S}% 0%, 0% 100%, 100% 100%)`]
    : [`polygon(0% 0%, 0% 0%, ${-S}% 100%, 0% 100%)`, `polygon(0% 0%, ${100 + S}% 0%, 100% 100%, 0% 100%)`];
  const beatScroll = (b, desk) => {
    const rev = b.classList.contains("beat--rev");
    const fig = $(".beat__ph", b), img = $("img", fig), dir = rev ? -1 : 1, dx = (desk ? 100 : 28) * dir;
    const items = lineItems($(".beat__tx", b));
    const cut = slantCut(rev);
    const tl = gsap.timeline({ scrollTrigger: { trigger: b, start: "top 90%", end: "bottom 10%", scrub: true, invalidateOnRefresh: true } });
    tl.to({}, { duration: 1 }, 0);
    if (desk) tl.fromTo(fig, { clipPath: cut[0] }, { clipPath: cut[1], duration: 0.42, ease: "power2.inOut" }, 0);
    else tl.fromTo(fig, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0);
    tl.fromTo(img, { scale: 1.18, xPercent: -2 * dir }, { scale: 1, xPercent: 0, duration: 0.55, ease: "power2.out" }, 0);
    tl.fromTo(items, { x: dx, opacity: 0 }, { x: 0, opacity: 1, duration: 0.22, stagger: 0.025, ease: "power2.out" }, 0.12)
      .to(items, { x: dx, opacity: 0, duration: 0.2, stagger: 0.02, ease: "power2.in" }, 0.72);
  };
  // BrakeNode holds its copy while three photographs pass, so the copy enters and leaves on its own triggers
  const brakeScroll = (bn, desk) => {
    const held = matchMedia("(min-width: 1000px)").matches;
    const dx = -(desk ? 100 : 28);
    const items = lineItems($(".bn__in", bn));
    const cue = $(".bn__tx", bn);
    const rule = $("dl.tb", bn);
    gsap.timeline({ scrollTrigger: { trigger: bn, start: "top 88%", end: "top 22%", scrub: true, invalidateOnRefresh: true } })
      .fromTo(rule, { borderTopColor: "rgba(10, 10, 10, 0)" }, { borderTopColor: "rgba(10, 10, 10, 1)", duration: 0.5, ease: "none" }, 0.2)
      .fromTo(items, { x: dx, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out", immediateRender: true }, 0);
    gsap.timeline({ scrollTrigger: held
      ? { trigger: bn, start: "bottom 145%", end: "bottom 102%", scrub: true, invalidateOnRefresh: true }
      : { trigger: cue, start: "bottom 45%", end: "bottom 8%", scrub: true, invalidateOnRefresh: true } })
      .to(items, { x: dx, opacity: 0, duration: 0.5, stagger: 0.04, ease: "power2.in", immediateRender: false }, 0)
      .to(rule, { borderTopColor: "rgba(10, 10, 10, 0)", duration: 0.4, ease: "none", immediateRender: false }, 0.2);
    const cut = slantCut(true);
    $$("figure", bn).forEach((fig) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 96%", end: "top 30%", scrub: true, invalidateOnRefresh: true } });
      if (desk) tl.fromTo(fig, { clipPath: cut[0] }, { clipPath: cut[1], duration: 0.8, ease: "power2.inOut" }, 0);
      else tl.fromTo(fig, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "none" }, 0);
      tl.fromTo($("img", fig), { scale: 1.18, xPercent: 2 }, { scale: 1, xPercent: 0, duration: 1, ease: "power2.out" }, 0);
    });
  };
  if (window.SplitText) {
    document.fonts.ready.then(() => {
      gsap.matchMedia().add({ desk: "(min-width: 768px)", mob: "(max-width: 767px)" }, (ctx) => {
        const desk = ctx.conditions.desk;
        $$(".beat").forEach((b) => beatScroll(b, desk));
        brakeScroll($(".bn"), desk);
      });
      ScrollTrigger.refresh();
    });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
  updateTone();
})();
