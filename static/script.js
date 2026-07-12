/* ============================================================
   LENIS — Page smooth scroll
   Only what's needed: lerp, multipliers, anchors, progress bar
============================================================ */
let lenis;

document.addEventListener("DOMContentLoaded", () => {
  lenis = new Lenis({
    lerp: 0.03,
    wheelMultiplier: 0.5,
    touchMultiplier: 1,
    syncTouchLerp: 0.075,
    smoothWheel: true,
    anchors: true,
    autoRaf: false,
    autoResize: true,
  });

  // Drive Lenis on GSAP ticker (keeps Lenis + ScrollTrigger in sync)
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on("scroll", ScrollTrigger.update);

  // Top progress bar
  const progressLine = document.getElementById("top-progress-line");
  lenis.on("scroll", (l) => {
    if (progressLine) progressLine.style.width = l.progress * 100 + "%";
  });
});

/* ============================================================
   FEATURE DETECT — desktop-only effects
============================================================ */
const IS_DESKTOP =
  window.matchMedia("(min-width:1024px)").matches &&
  window.matchMedia("(pointer:fine)").matches &&
  !("ontouchstart" in window) &&
  !navigator.maxTouchPoints;

/* ============================================================
   HERO — cursor reveal mask
============================================================ */
if (IS_DESKTOP) {
  const MASK_CFG = {
    maskRadius: 290,
    maskFeather: 80,
    lagSpeed: 0.1,
  };

  const topLayer = document.getElementById("layer-top");
  const imgTop = document.getElementById("img-top");
  const heroEl = document.getElementById("hero");

  let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let msmooth = { x: innerWidth / 2, y: innerHeight / 2 };
  let prevMsm = { x: msmooth.x, y: msmooth.y };
  let stretchX = 0,
    stretchY = 0;
  let heroHovered = false;
  let targetRadius = 0;
  let lastMaskTime = performance.now();

  heroEl.addEventListener("mouseenter", () => (heroHovered = true));
  heroEl.addEventListener("mouseleave", () => (heroHovered = false));
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function buildMask(cx, cy, r, f) {
    const inner = Math.max(0, r - f * 0.4);
    return `radial-gradient(circle ${r + f}px at ${cx}px ${cy}px,
      black 0%, black ${inner}px,
      rgba(0,0,0,0.55) ${r}px,
      rgba(0,0,0,0.12) ${(r + f * 0.65).toFixed(1)}px,
      transparent ${r + f}px)`;
  }

  function maskTick(now) {
    const dt = Math.min((now - lastMaskTime) / 1000, 0.05);
    lastMaskTime = now;

    targetRadius +=
      ((heroHovered ? MASK_CFG.maskRadius : 0) - targetRadius) *
      (heroHovered ? 0.1 : 0.07);

    if (heroHovered) {
      msmooth.x += (mouse.x - msmooth.x) * MASK_CFG.lagSpeed * 60 * dt;
      msmooth.y += (mouse.y - msmooth.y) * MASK_CFG.lagSpeed * 60 * dt;
    }

    const vx = msmooth.x - prevMsm.x;
    const vy = msmooth.y - prevMsm.y;
    stretchX += (vx * 0.014 - stretchX) * 0.1;
    stretchY += (vy * 0.014 - stretchY) * 0.1;
    prevMsm.x = msmooth.x;
    prevMsm.y = msmooth.y;

    const mask = buildMask(
      msmooth.x,
      msmooth.y,
      targetRadius,
      MASK_CFG.maskFeather,
    );
    topLayer.style.webkitMaskImage = mask;
    topLayer.style.maskImage = mask;

    const scX = 1 + Math.abs(stretchX) * 0.25;
    const scY = 1 + Math.abs(stretchY) * 0.25;
    imgTop.style.transform = `translateY(-38px) scale(${scX.toFixed(4)},${scY.toFixed(4)}) translate(${(stretchX * 2.5).toFixed(3)}px,${(stretchY * 2.5).toFixed(3)}px)`;

    requestAnimationFrame(maskTick);
  }
  requestAnimationFrame(maskTick);

  const hint = document.getElementById("hint");
  heroEl.addEventListener(
    "mousemove",
    () => {
      if (hint) hint.style.opacity = "0";
    },
    { once: true },
  );
}

/* ============================================================
   NAVIGATION — staggered side menu
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const NAV_CFG = {
    position: "right",
    colors: ["#BC002D", "#ffffffff", "#032b22"],
    displaySocials: true,
    displayItemNumbering: true,
    closeOnClickAway: true,
    items: [
      { label: "Home", ariaLabel: "Go to home page", link: "#hero" },
      { label: "About", ariaLabel: "Learn about us", link: "#about" },
      { label: "Projects", ariaLabel: "View my Projects", link: "#projects" },
      { label: "Resources", ariaLabel: "Explore Resources", link: "#resources" },
      { label: "Certificates", ariaLabel: "View my Certificates", link: "#working-style" },
      { label: "Contact", ariaLabel: "Get in touch", link: "#contact" },
    ],
    socialItems: [
      { label: '<i class="fa-brands fa-instagram"></i>', link: "https://instagram.com/yashc.exe" },
      { label: '<i class="fa-brands fa-github"></i>', link: "https://github.com/YashChaurasia01" },
      { label: '<i class="fa-brands fa-linkedin"></i>', link: "https://linkedin.com/in/yashchaurasia01" },
      { label: '<i class="fa-regular fa-envelope"></i>', link: "https://mail.google.com/mail/?view=cm&fs=1&to=xukyosho@gmail.com" },
    ],
  };

  const wrapper = document.getElementById("staggered-menu");
  const preLayersCon = document.getElementById("sm-prelayers");
  const toggleBtn = document.getElementById("sm-toggle-btn");
  const textInner = document.getElementById("sm-toggle-text-inner");
  const icon = document.getElementById("sm-icon");
  const plusV = document.getElementById("sm-plus-v");
  const panel = document.getElementById("staggered-menu-panel");
  const panelList = document.getElementById("sm-panel-list");
  const socialsSection = document.getElementById("sm-socials-section");
  const socialsList = document.getElementById("sm-socials-list");
  const darkToggle = document.getElementById("dark-theme-toggle");

  let isOpen = false,
    isBusy = false;
  let preLayerEls = [],
    openTL = null;

  darkToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-theme", darkToggle.checked);
  });

  // Build DOM
  wrapper.setAttribute("data-position", NAV_CFG.position);
  panelList.setAttribute(
    "data-numbering",
    NAV_CFG.displayItemNumbering ? "true" : "false",
  );

  preLayersCon.innerHTML = "";
  preLayerEls = NAV_CFG.colors.slice(0, 4).map((color) => {
    const el = document.createElement("div");
    el.className = "sm-prelayer";
    el.style.background = color;
    preLayersCon.appendChild(el);
    return el;
  });

  panelList.innerHTML = "";
  NAV_CFG.items.forEach(({ label, ariaLabel, link }) => {
    const li = document.createElement("li");
    li.className = "sm-panel-itemWrap";
    li.innerHTML = `<a class="sm-panel-item" href="${link}" aria-label="${ariaLabel}"><span class="sm-panel-itemLabel">${label}</span></a>`;
    li.querySelector("a").addEventListener("click", () => {
      if (isOpen) toggleMenu();
    });
    panelList.appendChild(li);
  });

  if (NAV_CFG.displaySocials && NAV_CFG.socialItems.length) {
    socialsSection.style.display = "flex";
    socialsList.innerHTML = "";
    NAV_CFG.socialItems.forEach(({ label, link }) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${link}" target="_blank" rel="noopener noreferrer" class="sm-socials-link">${label}</a>`;
      socialsList.appendChild(li);
    });
  } else {
    socialsSection.style.display = "none";
  }

  // Initial GSAP state
  gsap.set([panel, ...preLayerEls], { xPercent: 100, opacity: 1 });
  gsap.set(preLayersCon, { xPercent: 0, opacity: 1 });
  gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
  gsap.set(textInner, { yPercent: 0 });

  function buildOpenTL() {
    if (openTL) openTL.kill();
    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel"));
    const numberEls = Array.from(
      panel.querySelectorAll(
        '.sm-panel-list[data-numbering="true"] .sm-panel-item',
      ),
    );
    const socialTitle = panel.querySelector(".sm-socials-title");
    const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link"));
    const darkRow = panel.querySelector(".sm-dark-row");

    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    gsap.set(numberEls, { "--sm-num-opacity": 0 });
    gsap.set(socialTitle, { opacity: 0 });
    gsap.set(socialLinks, { y: 25, opacity: 0 });
    gsap.set(darkRow, { opacity: 0, y: 15 });

    const tl = gsap.timeline({ paused: true });
    const off = 100;

    preLayerEls.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: off },
        { xPercent: 0, duration: 0.45, ease: "power4.out" },
        i * 0.06,
      );
    });
    const t0 = preLayerEls.length * 0.06 + 0.02;
    tl.fromTo(
      panel,
      { xPercent: off },
      { xPercent: 0, duration: 0.6, ease: "power4.out" },
      t0,
    );
    tl.to(icon, { rotate: 225, duration: 0.6, ease: "power3.out" }, t0);
    tl.to(textInner, { yPercent: -50, duration: 0.4, ease: "power3.out" }, t0);
    tl.to(
      itemEls,
      {
        yPercent: 0,
        rotate: 0,
        duration: 0.75,
        ease: "power4.out",
        stagger: 0.07,
      },
      t0 + 0.15,
    );
    tl.to(
      numberEls,
      {
        "--sm-num-opacity": 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.07,
      },
      t0 + 0.2,
    );
    tl.to(
      darkRow,
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      t0 + 0.35,
    );
    tl.to(socialTitle, { opacity: 1, duration: 0.4 }, t0 + 0.4);
    tl.to(
      socialLinks,
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05 },
      t0 + 0.45,
    );

    openTL = tl;
    return tl;
  }

  function toggleMenu() {
    if (isBusy) return;
    isBusy = true;
    isOpen = !isOpen;

    if (isOpen) {
      wrapper.setAttribute("data-open", "true");
      toggleBtn.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      if (textInner.children.length === 1) {
        const s = document.createElement("span");
        s.className = "sm-toggle-line";
        s.textContent = "Close";
        textInner.appendChild(s);
      }
      buildOpenTL()
        .eventCallback("onComplete", () => (isBusy = false))
        .play(0);
    } else {
      wrapper.removeAttribute("data-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      gsap.to([...preLayerEls, panel], {
        xPercent: 100,
        duration: 0.35,
        ease: "power3.inOut",
        overwrite: "auto",
        onComplete: () => (isBusy = false),
      });
      gsap.to(icon, { rotate: 0, duration: 0.35, ease: "power3.inOut" });
      gsap.to(textInner, { yPercent: 0, duration: 0.35, ease: "power3.inOut" });
    }
  }

  toggleBtn.addEventListener("click", toggleMenu);
  if (NAV_CFG.closeOnClickAway) {
    document.addEventListener("mousedown", (e) => {
      if (isOpen && !panel.contains(e.target) && !toggleBtn.contains(e.target))
        toggleMenu();
    });
  }
});

/* ============================================================
   DECRYPT TEXT — glitch/Japanese shuffle reveal
============================================================ */
const JAPANESE_CHARS =
  "アイエオカキクケコサシスセソタチツテトナニヌネノ" +
  "가나다라마바사아자차카타파하" +
  "あいうえおかきくけこさしすせそたちつてとなにぬねの" +
  "겨녀뎌려며벼셔여져쳐켜텨펴혀";

const SHUFFLE_ROUNDS = 3;
let siteReady = false;

window.addEventListener("load", () => {
  setTimeout(() => {
    siteReady = true;
    document.querySelectorAll(".decrypt-text").forEach((el) => {
      if (el.__isInView && el.__startDecrypt) el.__startDecrypt();
    });
  }, 300);
});

function randChar() {
  return JAPANESE_CHARS[Math.floor(Math.random() * JAPANESE_CHARS.length)];
}
function randWord(len) {
  let s = "";
  for (let i = 0; i < len; i++) s += randChar();
  return s;
}

function setupCharDecrypt(el) {
  const revealSpeed = Number(el.dataset.speed || 150);
  const shuffleSpeed = Number(el.dataset.shuffleSpeed || 50);

  const tpl = document.createElement("template");
  tpl.innerHTML = el.innerHTML.trim();
  el.innerHTML = "";

  const nodes = [];
  tpl.content.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE)
      Array.from(n.textContent).forEach((c) =>
        nodes.push({ type: "char", value: c }),
      );
    else if (n.nodeName === "BR") nodes.push({ type: "br" });
    else if (n.nodeType === Node.ELEMENT_NODE)
      nodes.push({ type: "element", value: n.cloneNode(true) });
  });

  const state = nodes.map((n) => ({
    shuffleCount:
      n.type === "char" && n.value !== " " ?
        SHUFFLE_ROUNDS + Math.floor(Math.random() * 3)
        : 0,
    revealed: false,
    current: n.type === "char" && n.value !== " " ? randChar() : n.value,
  }));

  let sI = null,
    rI = null,
    cursor = 0;

  function render() {
    el.innerHTML = "";
    nodes.forEach((n, i) => {
      if (n.type === "br") {
        el.appendChild(document.createElement("br"));
        return;
      }
      if (n.type === "element") {
        el.appendChild(n.value.cloneNode(true));
        return;
      }
      const s = document.createElement("span");
      s.classList.add("decrypt-char");
      if (n.value === " ") s.innerHTML = "&nbsp;";
      else if (state[i].revealed) s.textContent = n.value;
      else {
        s.textContent = state[i].current;
        s.classList.add("encrypted");
      }
      el.appendChild(s);
    });
  }

  function shuffleTick() {
    nodes.forEach((n, i) => {
      if (n.type === "char" && n.value !== " " && !state[i].revealed)
        state[i].current = randChar();
    });
    render();
  }

  function revealTick() {
    if (cursor >= nodes.length) {
      clearInterval(rI);
      clearInterval(sI);
      render();
      return;
    }
    const n = nodes[cursor];
    if (n.type !== "char" || n.value === " ") {
      state[cursor].revealed = true;
      cursor++;
    } else if (state[cursor].shuffleCount > 0) {
      state[cursor].shuffleCount--;
    } else {
      state[cursor].revealed = true;
      cursor++;
    }
  }

  function start() {
    clearInterval(sI);
    clearInterval(rI);
    cursor = 0;
    nodes.forEach((n, i) => {
      state[i].revealed = false;
      state[i].shuffleCount =
        n.type === "char" && n.value !== " " ?
          SHUFFLE_ROUNDS + Math.floor(Math.random() * 3)
          : 0;
      state[i].current =
        n.type === "char" && n.value !== " " ? randChar() : n.value;
    });
    render();
    sI = setInterval(shuffleTick, shuffleSpeed);
    rI = setInterval(revealTick, revealSpeed);
  }

  function reset() {
    clearInterval(sI);
    clearInterval(rI);
    cursor = 0;
    nodes.forEach((n, i) => {
      state[i].revealed = false;
      state[i].current =
        n.type === "char" && n.value !== " " ? randChar() : n.value;
    });
    render();
  }

  render();
  return { start, reset };
}

function setupWordDecrypt(el) {
  const revealSpeed = Number(el.dataset.speed || 300);
  const shuffleSpeed = Number(el.dataset.shuffleSpeed || 50);

  const tpl = document.createElement("template");
  tpl.innerHTML = el.innerHTML.trim();
  el.innerHTML = "";

  const words = [];
  tpl.content.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      n.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        /\s+/.test(w) ?
          words.push({ type: "space", value: w })
          : words.push({ type: "word", value: w });
      });
    } else if (n.nodeName === "BR") words.push({ type: "br" });
  });

  const state = words.map((w) => ({
    shuffleCount:
      w.type === "word" ? SHUFFLE_ROUNDS + Math.floor(Math.random() * 3) : 0,
    revealed: false,
    current: w.type === "word" ? randWord(w.value.length) : w.value,
  }));

  let sI = null,
    rI = null,
    cursor = 0;

  function render() {
    el.innerHTML = "";
    words.forEach((w, i) => {
      if (w.type === "br") {
        el.appendChild(document.createElement("br"));
        return;
      }
      if (w.type === "space") {
        el.appendChild(document.createTextNode(w.value));
        return;
      }
      const s = document.createElement("span");
      s.classList.add("decrypt-char");
      if (state[i].revealed) s.textContent = w.value;
      else {
        s.textContent = state[i].current;
        s.classList.add("encrypted");
      }
      el.appendChild(s);
    });
  }

  function shuffleTick() {
    words.forEach((w, i) => {
      if (w.type === "word" && !state[i].revealed)
        state[i].current = randWord(w.value.length);
    });
    render();
  }

  function revealTick() {
    if (cursor >= words.length) {
      clearInterval(rI);
      clearInterval(sI);
      render();
      return;
    }
    const w = words[cursor];
    if (w.type !== "word") {
      state[cursor].revealed = true;
      cursor++;
    } else if (state[cursor].shuffleCount > 0) {
      state[cursor].shuffleCount--;
    } else {
      state[cursor].revealed = true;
      cursor++;
    }
  }

  function start() {
    clearInterval(sI);
    clearInterval(rI);
    cursor = 0;
    words.forEach((w, i) => {
      state[i].revealed = false;
      state[i].shuffleCount =
        w.type === "word" ? SHUFFLE_ROUNDS + Math.floor(Math.random() * 3) : 0;
      state[i].current = w.type === "word" ? randWord(w.value.length) : w.value;
    });
    render();
    sI = setInterval(shuffleTick, shuffleSpeed);
    rI = setInterval(revealTick, revealSpeed);
  }

  function reset() {
    clearInterval(sI);
    clearInterval(rI);
    cursor = 0;
    words.forEach((w, i) => {
      state[i].revealed = false;
      state[i].current = w.type === "word" ? randWord(w.value.length) : w.value;
    });
    render();
  }

  render();
  return { start, reset };
}

document.querySelectorAll(".decrypt-text").forEach((el) => {
  const ctrl =
    el.dataset.mode === "words" ? setupWordDecrypt(el) : setupCharDecrypt(el);
  el.__startDecrypt = ctrl.start;
  el.__resetDecrypt = ctrl.reset;
  el.__isInView = false;

  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        el.__isInView = entry.isIntersecting;
        if (!siteReady) return;
        entry.isIntersecting ? ctrl.start() : ctrl.reset();
      });
    },
    { threshold: 0.35 },
  ).observe(el);
});

/* ============================================================
   ABOUT — scroll-spy + sticky nav + boundary handoff
   + vertical progress bar on the right side

   Strategy:
   - .about-content has overflow-y: scroll (native, no Lenis)
   - data-lenis-prevent stops outer Lenis touching it
   - A native wheel listener on the container checks boundaries:
       • inner has room  → let container scroll natively (do nothing)
       • at boundary     → preventDefault + push delta to outer lenis
   - A rAF loop reads container.scrollTop every frame to update
     the vertical progress bar and scroll-spy
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const navBtns = Array.from(document.querySelectorAll(".about-nav .nav-btn"));
  const panels = Array.from(document.querySelectorAll(".content-panel"));
  const container = document.querySelector(".about-content");

  if (!navBtns.length || !panels.length || !container) return;

  /* ── Build vertical progress bar ─────────────────────── */
  const progressBar = document.createElement("div");
  progressBar.className = "about-scroll-track fade-right-item";
  const progressFill = document.createElement("div");
  progressFill.className = "about-scroll-fill";
  progressBar.appendChild(progressFill);
  // Insert it as a sibling right after .about-content inside .about-body
  container.parentElement.appendChild(progressBar);

  /* ── Scroll-spy via IntersectionObserver ─────────────── */
  panels[0].classList.add("active");

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        panels.forEach((p) => p.classList.remove("active"));
        entry.target.classList.add("active");
        navBtns.forEach((b) => b.classList.remove("active"));
        const btn = navBtns.find((b) => b.dataset.target === id);
        if (btn) btn.classList.add("active");
      });
    },
    { root: container, rootMargin: "-30% 0px -30% 0px", threshold: 0 },
  );

  panels.forEach((p) => spy.observe(p));

  /* ── rAF loop: update progress bar from scrollTop ────── */
  const aboutBarQuery = window.matchMedia("(max-width: 768px)");

  function updateProgress() {
    const max = container.scrollHeight - container.clientHeight;
    if (max > 0) {
      const pct = (container.scrollTop / max) * 100 + "%";
      if (aboutBarQuery.matches) {
        progressFill.style.width = pct;
        progressFill.style.height = "100%";
      } else {
        progressFill.style.height = pct;
        progressFill.style.width = "100%";
      }
    }
    requestAnimationFrame(updateProgress);
  }
  requestAnimationFrame(updateProgress);

  /* ── Boundary handoff to outer Lenis ─────────────────── 
     passive:false lets us call preventDefault() to block
     the browser's own scroll when inner has room.
     At the boundary we let it propagate so outer Lenis
     picks it up naturally — no manual lenis.scrollTo needed.
  ─────────────────────────────────────────────────────── */
  /* ── Inner scroll lerp (lerp = 0.03) ─────────────────── */
  let innerTarget = 0;
  let innerCurrent = 0;
  const LERP = 0.03;

  container.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      const maxScroll = container.scrollHeight - container.clientHeight;
      const atTop = innerTarget <= 0;
      const atBottom = innerTarget >= maxScroll - 2;
      const goingUp = e.deltaY < 0;
      const goingDown = e.deltaY > 0;

      if ((atTop && goingUp) || (atBottom && goingDown)) {
        if (lenis)
          lenis.scrollTo(lenis.targetScroll + e.deltaY * 3, { lerp: 0.03 });
        return;
      }

      innerTarget = Math.min(Math.max(innerTarget + e.deltaY, 0), maxScroll);
    },
    { passive: false },
  );

  function lerpTick() {
    innerCurrent += (innerTarget - innerCurrent) * LERP;
    if (Math.abs(innerTarget - innerCurrent) < 0.1) innerCurrent = innerTarget;
    container.scrollTop = innerCurrent;
    requestAnimationFrame(lerpTick);
  }
  requestAnimationFrame(lerpTick);

  /* ── Click nav buttons → scroll to panel ─────────────── */
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      innerTarget = Math.min(Math.max(target.offsetTop - 32, 0), maxScroll);
    });
  });
});

/* ============================================================
   WORKFLOW SECTION — horizontal scrolling + progress bar
   ============================================================ */
(function () {
  const wsSection = document.getElementById("working-style");
  const wsTrigger = document.getElementById("ws-trigger");
  const wsSticky = document.getElementById("ws-sticky");
  const wsTrack = document.getElementById("ws-track");
  const wsBar = document.getElementById("ws-progress-bar");

  if (!wsSection || !wsSticky || !wsTrack) return;

  function updateWS() {
    const sectionRect = wsSection.getBoundingClientRect();
    const stickyRect = wsSticky.getBoundingClientRect();

    // Distance from the section's top to #ws-trigger's top. Both rects move
    // together as you scroll, so subtracting them cancels out the scroll
    // offset and leaves a stable distance — no offsetTop/sticky quirks.
    const pinStart = wsTrigger
      ? wsTrigger.getBoundingClientRect().top - sectionRect.top
      : 0;

    const totalScrollRange = sectionRect.height - stickyRect.height - pinStart;
    if (totalScrollRange <= 0) return;

    const currentScroll = -sectionRect.top - pinStart;
    const progress = Math.max(0, Math.min(1, currentScroll / totalScrollRange));

    const maxOffset = wsTrack.scrollWidth - stickyRect.width;
    wsTrack.style.transform = `translateX(${-progress * maxOffset}px)`;
    if (wsBar) {
      wsBar.style.width = `${progress * 100}%`;
    }
  }

  if (typeof lenis !== "undefined" && lenis) {
    lenis.on("scroll", updateWS);
  } else {
    window.addEventListener("scroll", updateWS, { passive: true });
  }

  updateWS();
  window.addEventListener("resize", updateWS);
})();


/* ══════════════════════════════════════════════════════════════
   CONTACT + TOAST — load after script.js, before </body>
   ══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Build the letter-by-letter floating labels ---------- */
  document.querySelectorAll('.form-control label[data-text]').forEach(label => {
    const text = label.dataset.text;
    label.innerHTML = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.transitionDelay = `${i * 25}ms`;
      label.appendChild(span);
    });
  });

  /* ---------- 2. Toast notifications (Apple-style dot → pill) ---------- */
  const stack = document.getElementById('cn-toast-stack');

  function measureWidth(innerHTML) {
    const probe = document.createElement('div');
    probe.className = 'cn-toast cn-show';
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.width = 'auto';
    probe.innerHTML = innerHTML;
    document.body.appendChild(probe);
    const w = probe.offsetWidth;
    probe.remove();
    return w;
  }

  window.showToast = function (message, type = 'success') {
    const icon = type === 'success' ? 'fa-check' : 'fa-triangle-exclamation';
    const inner = `<span class="cn-toast-icon"><i class="fa-solid ${icon}"></i></span><span class="cn-toast-text">${message}</span>`;

    const toast = document.createElement('div');
    toast.className = `cn-toast${type === 'error' ? ' cn-error' : ''}`;
    toast.innerHTML = inner;
    stack.appendChild(toast);

    const targetWidth = Math.min(measureWidth(inner) + 8, window.innerWidth * 0.86, 380);

    // Force layout as a dot first, then expand.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.width = `${Math.max(targetWidth, 44)}px`;
        toast.classList.add('cn-show');
      });
    });

    setTimeout(() => {
      toast.classList.add('cn-hide');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 5000);
  };

  /* ---------- 3. Web3Forms submit (no redirect / no default success page) ---------- */
  const form = document.getElementById('cn-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.cn-submit');
    submitBtn.disabled = true;
    submitBtn.classList.add('sending');

    const formData = new FormData(form);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        showToast('Message sent — thanks for reaching out!', 'success');
        form.reset();
        // Reset floating labels after programmatic clear
        form.querySelectorAll('input, textarea').forEach(el => el.blur());
      } else {
        showToast(data.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('sending');
    }
  });

});

/* ============================================================
   FOOTER TEXT REVEAL — rises up from under .ftr-bottom
   as the user nears the true bottom of the page
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const REVEAL_CFG = {
    triggerRange: 500, // px of scroll, before hitting the very bottom, over which the reveal completes
  };

  document.querySelectorAll('.ftr-reveal').forEach(section => {
    const track = section.querySelector('.ftr-reveal-track');
    const word = section.dataset.word || 'TEXT';
    const letters = [];

    word.split('').forEach(char => {
      const el = document.createElement('span');
      el.className = 'rev-letter';
      el.textContent = char === ' ' ? '\u00A0' : char;
      track.appendChild(el);
      letters.push(el);
    });

    const N = letters.length;

    function update() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const distFromBottom = Math.max(0, maxScroll - scrollY);

      // 0 = far from bottom (hidden), 1 = fully at bottom (revealed)
      const p = 1 - Math.min(1, distFromBottom / REVEAL_CFG.triggerRange);

      letters.forEach((el, i) => {
        const stagger = N > 1 ? i / (N - 1) : 0;
        // each letter has its own arrival point so they don't all land at once
        const arrivalStart = stagger * 0.5;
        const localP = Math.max(0, Math.min(1,
          (p - arrivalStart) / (1 - arrivalStart + 0.001)
        ));
        // 100% = fully below the box (hidden), 0% = landed in place
        const currentDrop = 120 * (1 - localP);
        el.style.transform = `translateY(${currentDrop}%)`;
      });
    }

    if (typeof lenis !== "undefined" && lenis) {
      lenis.on('scroll', update);
    } else {
      window.addEventListener('scroll', update, { passive: true });
    }
    window.addEventListener('resize', update);
    update();
  });
});