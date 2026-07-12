/* ============================================================
           LENIS INIT
           We keep a reference `lenis` in outer scope so all sections
           can access properties, call methods, etc.
        ============================================================ */

let lenis; // outer scope — re-assigned on destroy+reinit

// Current slider values (for reinit)
let currentConfig = {
  lerp: 0.07,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  syncTouchLerp: 0.075,
};

function initLenis(overrides = {}) {
  // If there's already a Lenis instance, destroy it first
  if (lenis) lenis.destroy();

  const config = Object.assign(
    {
      /*
                  autoRaf: false — we drive the raf loop manually below.
                  This gives us control: we can also wire GSAP's ticker.
                  CHANGE to true for the simplest setup (no manual raf needed).
                */
      autoRaf: false,

      /*
                  anchors: true — enables smooth scroll to <a href="#section"> links.
                  The nav links at the top use this.
                  You can also pass an object: anchors: { offset: 80 }
                */
      anchors: true,

      /*
                  lerp: 0.1 — how aggressively the scroll catches up.
                  Lower = silkier. Higher = snappier.
                  Range: 0.01 (very smooth) → 0.5+ (nearly instant)
                  CHANGE this value to adjust the overall scroll feel.
                */
      lerp: currentConfig.lerp,

      /*
                  smoothWheel: true — smooth wheel events (default).
                  Set false to disable smooth scroll for mouse wheel only.
                */
      smoothWheel: true,

      /*
                  wheelMultiplier: 1 — scalar for mouse wheel delta.
                  CHANGE: 2 = double speed, 0.5 = half speed.
                */
      wheelMultiplier: currentConfig.wheelMultiplier,

      /*
                  touchMultiplier: 1 — scalar for touch/swipe delta.
                */
      touchMultiplier: currentConfig.touchMultiplier,

      /*
                  syncTouch: false — if true, Lenis mimics touch momentum
                  on desktop. Can be unstable on iOS < 16.
                  Set true if you want lerp applied on touch devices too.
                */
      syncTouch: false,

      /*
                  syncTouchLerp: 0.075 — lerp applied during touch inertia
                  phase when syncTouch is true.
                  CHANGE: lower = more glide after lifting finger.
                */
      syncTouchLerp: currentConfig.syncTouchLerp,

      /*
                  overscroll: true — allows the rubber-band bounce effect
                  at the top and bottom of the page.
                  CHANGE to false to hard-stop at limits.
                */
      overscroll: true,

      /*
                  stopInertiaOnNavigate: false — if true, clicking a link
                  cancels any in-progress momentum scroll.
                */
      stopInertiaOnNavigate: false,

      /*
                  allowNestedScroll: false — if true, Lenis checks every
                  wheel event's DOM path for scrollable children and allows
                  them to scroll natively. Has performance cost.
                  We're using data-lenis-prevent instead (recommended).
                */
      allowNestedScroll: false,

      /*
                  autoResize: true — Lenis uses ResizeObserver to update
                  its internal dimensions when window/content resizes.
                  Set false if you want to call lenis.resize() manually.
                */
      autoResize: true,

      /*
                  virtual-scroll event listener — intercept raw deltas.
                  Runs BEFORE the smoothing algorithm.
                  Return false → block smooth scroll for this event.
                  Mutate e.deltaY to change effective scroll speed.
        
                  CHANGE examples:
                  (e) => { e.deltaY /= 2 }         → half speed
                  ({ event }) => !event.shiftKey   → block on Shift key
                  (e) => false                     → block all
                */
      virtualScroll: (e) => {
        // Log raw delta to the VS log panel
        const log = document.getElementById("vs-log");
        if (log) {
          log.textContent = `deltaY: ${e.deltaY.toFixed(2)}  deltaX: ${e.deltaX.toFixed(2)}`;
        }
        return true; // allow smooth scroll normally
      },

      /*
                  prevent: (node) => boolean
                  Return true for any DOM node where scroll should NOT be smoothed.
                  This is the programmatic alternative to data-lenis-prevent.
                  Example: prevent modals, fixed panels, nested scroll containers.
                */
      prevent: (node) => {
        // Prevent smooth scroll inside elements with class 'no-lenis'
        return node.classList && node.classList.contains("no-lenis");
      },
    },
    overrides,
  );

  lenis = new Lenis(config);

  // ============================================================
  // SCROLL EVENT — fires every raf tick while scrolling
  // The callback receives the Lenis instance itself.
  // This is how you read all live properties.
  // ============================================================
  lenis.on("scroll", (l) => {
    /*
                  l.scroll — current lerped scroll value (animatedScroll)
                  l.progress — 0 to 1 (scroll / limit)
                  l.velocity — current scroll velocity
                  l.lastVelocity — velocity from previous frame
                  l.direction — 1 (down) or -1 (up)
                  l.isScrolling — 'smooth', 'native', or false
                  l.isStopped — boolean
                  l.limit — maximum scrollable distance
                  l.targetScroll — where scroll is heading
                  l.animatedScroll — same as scroll
                  l.time — milliseconds since instance creation
                */

    // Update fixed scroll indicator (bottom right)
    document.getElementById("si-scroll").textContent = Math.round(l.scroll);
    document.getElementById("si-progress").textContent = l.progress.toFixed(3);
    document.getElementById("si-velocity").textContent = l.velocity.toFixed(3);
    document.getElementById("si-direction").textContent =
      l.direction === 1 ? "↓ down" : l.direction === -1 ? "↑ up" : "—";
    document.getElementById("si-scrolling").textContent = String(l.isScrolling);

    // Velocity bar width (clamp 0–100%)
    const velWidth = Math.min(Math.abs(l.velocity) * 10, 100);
    document.getElementById("velocity-bar").style.width = velWidth + "%";

    // Top progress line
    document.getElementById("top-progress-line").style.width =
      l.progress * 100 + "%";

    // Properties dashboard
    document.getElementById("p-scroll").textContent = Math.round(l.scroll);
    document.getElementById("p-animated").textContent = Math.round(
      l.animatedScroll,
    );
    document.getElementById("p-target").textContent = Math.round(
      l.targetScroll,
    );
    document.getElementById("p-progress").textContent = l.progress.toFixed(3);
    document.getElementById("p-velocity").textContent = l.velocity.toFixed(3);
    document.getElementById("p-lastvel").textContent =
      l.lastVelocity.toFixed(3);
    document.getElementById("p-direction").textContent =
      l.direction === 1 ? "↓" : l.direction === -1 ? "↑" : "—";
    document.getElementById("p-limit").textContent = Math.round(l.limit);
    document.getElementById("p-isscrolling").textContent = String(
      l.isScrolling,
    );
    document.getElementById("p-isstopped").textContent = String(l.isStopped);
    document.getElementById("p-ishoriz").textContent = String(l.isHorizontal);
    document.getElementById("p-time").textContent = Math.round(l.time);

    // Destroy section status panel
    const ls = document.getElementById("ls-scrolling");
    if (ls) ls.textContent = String(l.isScrolling);
    const lss = document.getElementById("ls-stopped");
    if (lss) lss.textContent = String(l.isStopped);

    // Scroll-reveal elements (data-reveal)
    updateReveal(l.scroll);

    // Horizontal section scroll
    updateHorizScroll(l.scroll);

    // Marquee velocity drive
    updateMarquee(l.velocity);
  });

  // ============================================================
  // VIRTUAL-SCROLL EVENT
  // Fires with raw delta before any lerp is applied.
  // ============================================================
  lenis.on("virtual-scroll", ({ deltaX, deltaY, event }) => {
    // Already handled inside virtualScroll option above.
    // This event is the other way to listen — both work.
  });

  // ============================================================
  // RAF LOOP
  // We manually drive lenis.raf(time) each frame.
  // This is required since autoRaf:false.
  // GSAP ticker also calls lenis.raf — see GSAP section below.
  // ============================================================
  function raf(time) {
    /*
                  lenis.raf(time) — must be called every animation frame.
                  time is in milliseconds (DOMHighResTimeStamp from rAF).
                */
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Update status display
  const inst = document.getElementById("ls-instance");
  if (inst) inst.textContent = "active ✓";
  inst && (inst.style.color = "var(--accent2)");

  return lenis;
}

// ============================================================
// INITIAL LENIS CREATION
// ============================================================
lenis = initLenis();

/* ============================================================
           GSAP + SCROLLTRIGGER INTEGRATION
    
           The pattern from the docs:
             lenis.on('scroll', ScrollTrigger.update)
             gsap.ticker.add((time) => lenis.raf(time * 1000))
             gsap.ticker.lagSmoothing(0)
    
           NOTE: since we're also running our own rAF loop, we skip the
           manual raf call inside gsap.ticker to avoid double-calling.
           Instead we only call ScrollTrigger.update from the scroll event.
        ============================================================ */

// Sync Lenis scroll position → GSAP ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);

/*
          gsap.ticker drives GSAP animations.
          We add lenis.raf here instead of a separate rAF loop
          when using GSAP — but since we already have our rAF loop,
          we just pass ScrollTrigger.update above.
    
          If you ONLY use GSAP (no separate rAF):
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
    
          lagSmoothing(0) prevents GSAP from adding extra smoothing
          on top of Lenis's own lerp when the tab is out of focus.
        */
gsap.ticker.lagSmoothing(0);

// Animate st-cards into view with ScrollTrigger
["st-card-1", "st-card-2", "st-card-3", "st-card-4"].forEach((id, i) => {
  gsap.to("#" + id, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: "#" + id,
      start: "top 85%", // when top of card is 85% from viewport top
      end: "top 50%",
      /*
                      scrub: false here — we want a one-shot animation, not scrubbing.
                      CHANGE scrub:true to make it scroll-driven.
                    */
      toggleActions: "play none none reverse",
    },
  });
});

// Counter animation for st-card-1
ScrollTrigger.create({
  trigger: "#st-card-1",
  start: "top 80%",
  onEnter: () => {
    // Animate number from 0 to 14000 (lenis github stars ≈)
    gsap.to(
      { val: 0 },
      {
        val: 14000,
        duration: 2,
        ease: "power2.out",
        onUpdate: function () {
          const el = document.getElementById("counter-1");
          if (el)
            el.textContent =
              Math.round(this.targets()[0].val).toLocaleString() + "★";
        },
      },
    );
  },
  once: true,
});

// Scrub bar — drives pin-scrub-fill width from 0→100% as you scroll through gsap-pin-wrap
gsap.to("#pin-scrub-fill", {
  width: "100%",
  ease: "none",
  scrollTrigger: {
    trigger: "#gsap-pin-wrap",
    start: "top 80%",
    end: "bottom 20%",
    /*
                  scrub: 1 — the animation follows scroll, smoothed by 1s lag.
                  CHANGE scrub value: 0 = perfectly sync'd, higher = more lag.
                */
    scrub: 1,
  },
});

/* ============================================================
           SCROLL-REVEAL (data-reveal elements)
           Manual reveal using lenis.scroll — no ScrollTrigger needed.
           More lightweight for simple fade-in effects.
        ============================================================ */
const revealElements = document.querySelectorAll("[data-reveal]");

function updateReveal(scrollY) {
  revealElements.forEach((el) => {
    if (el.classList.contains("revealed")) return; // already revealed
    const rect = el.getBoundingClientRect();
    // Reveal when element top is within 85% of viewport height
    if (rect.top < window.innerHeight * 0.85) {
      el.classList.add("revealed");
    }
  });
}
// Initial check (for elements visible on load)
updateReveal(0);

/* ============================================================
           STOP / START BUTTON
           lenis.stop() — pauses all smooth scrolling
           lenis.start() — resumes
        ============================================================ */
const stopBtn = document.getElementById("stop-btn");
let isStopped = false;

stopBtn.addEventListener("click", () => {
  if (!lenis) return;
  if (isStopped) {
    lenis.start(); // resume — isStopped becomes false
    isStopped = false;
    stopBtn.textContent = "⏸ Pause Scroll";
  } else {
    lenis.stop(); // pause — isStopped becomes true
    isStopped = true;
    stopBtn.textContent = "▶ Resume Scroll";
  }
});

/* ============================================================
           LERP PRESET CARDS (Section 2)
           Click a card to re-init Lenis with that preset.
           This demonstrates how changing lerp/duration/easing works.
        ============================================================ */
document.querySelectorAll(".option-card").forEach((card) => {
  card.addEventListener("click", () => {
    // Remove active from all
    document
      .querySelectorAll(".option-card")
      .forEach((c) => c.classList.remove("active"));
    card.classList.add("active");

    const lerp = card.dataset.lerp ? parseFloat(card.dataset.lerp) : undefined;
    const duration = card.dataset.duration
      ? parseFloat(card.dataset.duration)
      : undefined;

    const newConfig = {};

    if (lerp !== undefined) {
      newConfig.lerp = lerp;
      /*
                      When lerp is set, duration/easing are ignored.
                      CHANGE: set duration instead to use timed animation.
                    */
    }

    if (duration !== undefined) {
      newConfig.duration = duration;
      /*
                      Custom easing function — easeInOutQuart.
                      See https://easings.net for more options.
                      CHANGE to any function: t => t*t for easeInQuad, etc.
                    */
      newConfig.easing = (t) =>
        t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
      // When duration is defined, lerp is ignored by Lenis
      delete newConfig.lerp;
    }

    // Save to currentConfig for slider reinit
    if (lerp !== undefined) currentConfig.lerp = lerp;

    // Re-init with merged config
    // Re-register scroll → ScrollTrigger after reinit
    const savedScroll = window.scrollY;
    lenis = initLenis(newConfig);
    lenis.on("scroll", ScrollTrigger.update);
    // Restore scroll position
    lenis.scrollTo(savedScroll, { immediate: true });
  });
});

/* ============================================================
           HORIZONTAL SCROLL (Section 5)
           As you scroll vertically through #horiz-section,
           we compute how far in we are (0→1) and apply
           that as a negative translateX on #horiz-track.
        ============================================================ */
const horizSection = document.getElementById("horiz-section");
const horizTrack = document.getElementById("horiz-track");
const horizProgressBar = document.getElementById("horiz-progress-bar");

function updateHorizScroll(scrollY) {
  if (!horizSection || !horizTrack) return;

  const sectionTop = horizSection.offsetTop;
  // Total scroll range = section height - viewport height
  const sectionHeight = horizSection.offsetHeight;
  const viewportH = window.innerHeight;
  const scrollRange = sectionHeight - viewportH;

  // How far into this section are we? (0 = just entered, 1 = about to leave)
  const progress = Math.max(
    0,
    Math.min(1, (scrollY - sectionTop) / scrollRange),
  );

  // Maximum horizontal offset = track's full scrollable width
  const trackWidth = horizTrack.scrollWidth;
  const viewportW = window.innerWidth;
  const maxOffset = Math.max(0, trackWidth - viewportW);

  /*
              Apply translateX — this is the core of the technique.
              progress 0 = no shift, progress 1 = fully shifted left.
              CHANGE: swap Math.min/max logic or reverse progress for RTL.
            */
  const translateX = -progress * maxOffset;
  horizTrack.style.transform = `translateX(${translateX}px)`;

  // Update progress bar
  horizProgressBar.style.width = progress * 100 + "%";
}

/* ============================================================
           VELOCITY-DRIVEN MARQUEE (Section 11)
           Reads lenis.velocity and adjusts CSS animation duration.
           Faster scroll = faster marquee.
        ============================================================ */
const marqueeTrack = document.getElementById("marquee-track");
const BASE_DURATION = 20; // seconds at rest
// CHANGE: lower base = always-faster marquee

function updateMarquee(velocity) {
  if (!marqueeTrack) return;
  /*
              velocity can be positive (scrolling down) or negative (up).
              We use abs value. Map: vel=0 → 20s, vel=5 → ~4s (faster).
              CHANGE the divisor 0.15 to amplify or dampen the effect.
            */
  const absVel = Math.abs(velocity);
  const newDuration = Math.max(2, BASE_DURATION - absVel / 0.15);
  marqueeTrack.style.animationDuration = newDuration + "s";
}

/* ============================================================
           SCROLLTO BUTTONS (Section 7)
           All scrollTo() options demonstrated.
        ============================================================ */

// scrollTo keyword 'top' — scroll to very top
document.getElementById("btn-to-top").addEventListener("click", () => {
  lenis.scrollTo("top", {
    /*
                  duration: 1.5 — 1.5 second animation regardless of lerp.
                  easing: easeInOutExpo — custom easing for this one call.
                  CHANGE: try 'top' with immediate:true for instant jump.
                */
    duration: 1.5,
    easing: (t) =>
      t === 0
        ? 0
        : t === 1
          ? 1
          : t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2,
  });
});

// scrollTo 'bottom' — slow glide to page end using lerp override
document.getElementById("btn-to-bottom").addEventListener("click", () => {
  lenis.scrollTo("bottom", {
    /*
                  lerp: 0.04 — overrides instance lerp for THIS call only.
                  Creates a glacially slow glide to the bottom.
                  CHANGE to higher value for faster scroll.
                */
    lerp: 0.04,
  });
});

// scrollTo CSS selector with offset + duration
document.getElementById("btn-to-gsap").addEventListener("click", () => {
  lenis.scrollTo("#gsap-section", {
    /*
                  offset: -80 — stops 80px BEFORE the element.
                  Useful when you have a fixed nav (nav is ~60px tall).
                  duration: 1.5 — use duration instead of lerp.
                  CHANGE offset to 0 for exact alignment.
                */
    offset: -80,
    duration: 1.5,
  });
});

// scrollTo with lock:true — prevents user from interrupting scroll
document.getElementById("btn-to-sticky").addEventListener("click", () => {
  lenis.scrollTo("#sticky-section-wrap", {
    /*
                  lock: true — user cannot scroll until target is reached.
                  Force: false is default — won't scroll if lenis is stopped.
                  CHANGE lock to false to allow user to interrupt.
                */
    lock: true,
    duration: 2,
  });
});

// scrollTo pixel value with immediate:true — instant teleport
document.getElementById("btn-to-pixel").addEventListener("click", () => {
  lenis.scrollTo(500, {
    /*
                  immediate: true — ignores duration/lerp/easing.
                  Equivalent to window.scrollTo but Lenis-managed.
                  CHANGE value to any pixel offset.
                */
    immediate: true,
  });
});

// scrollTo with onComplete callback
document.getElementById("btn-to-oncomplete").addEventListener("click", () => {
  lenis.scrollTo("#destroy-section", {
    duration: 2,
    /*
                  onComplete fires when the target scroll position is reached.
                  Useful for triggering animations after navigation.
                  userData is forwarded through scroll events as .userData.
                */
    onComplete: () => {
      const fb = document.getElementById("scrollto-feedback");
      if (fb) {
        fb.textContent =
          "✓ onComplete fired! Reached #destroy-section at " +
          new Date().toLocaleTimeString();
        fb.style.color = "var(--accent2)";
      }
    },
    userData: { source: "scrollto-demo", timestamp: Date.now() },
  });
});

/* ============================================================
           MULTIPLIER SLIDERS (Section 10)
           Update display values live, apply on button click.
        ============================================================ */
function bindSlider(sliderId, displayId, decimals, configKey) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  if (!slider) return;
  slider.addEventListener("input", () => {
    const val = parseFloat(slider.value).toFixed(decimals);
    display.textContent = val;
    if (configKey) currentConfig[configKey] = parseFloat(val);
  });
}

bindSlider("sl-wheel", "sv-wheel", 1, "wheelMultiplier");
bindSlider("sl-touch", "sv-touch", 1, "touchMultiplier");
bindSlider("sl-lerp", "sv-lerp", 2, "lerp");
bindSlider("sl-touchlerp", "sv-touchlerp", 3, "syncTouchLerp");

document.getElementById("apply-multipliers").addEventListener("click", () => {
  const savedScroll = window.scrollY;
  lenis = initLenis(); // reinit with updated currentConfig
  lenis.on("scroll", ScrollTrigger.update);
  lenis.scrollTo(savedScroll, { immediate: true });
  // Flash button feedback
  const btn = document.getElementById("apply-multipliers");
  btn.textContent = "✓ Applied!";
  setTimeout(() => {
    btn.textContent = "✓ Apply & Reinit Lenis";
  }, 1500);
});

/* ============================================================
           DESTROY / REINIT BUTTONS (Section 12)
        ============================================================ */

// Destroy — removes all Lenis listeners, stops smooth scroll
document.getElementById("btn-destroy").addEventListener("click", () => {
  if (lenis) {
    lenis.destroy();
    /*
                  After destroy(), lenis instance is dead.
                  window will fall back to native scroll (no lerp).
                  Call initLenis() to get smooth scroll back.
                */
    lenis = null;
    const inst = document.getElementById("ls-instance");
    if (inst) {
      inst.textContent = "destroyed ✗";
      inst.style.color = "#e53e3e";
    }
  }
});

// Reinit — fresh Lenis instance
document.getElementById("btn-reinit").addEventListener("click", () => {
  const savedScroll = window.scrollY;
  lenis = initLenis();
  lenis.on("scroll", ScrollTrigger.update);
  lenis.scrollTo(savedScroll, { immediate: true });
});

// Manual resize — call when DOM changes and autoResize:false
document.getElementById("btn-resize").addEventListener("click", () => {
  if (lenis) {
    /*
                  lenis.resize() — forces Lenis to recalculate:
                  - document height
                  - scroll limits
                  - all cached dimensions
                  Call after: AJAX content loads, expanding panels, etc.
                  when autoResize:false is set.
                */
    lenis.resize();
    const btn = document.getElementById("btn-resize");
    btn.textContent = "📐 Resized!";
    setTimeout(() => {
      btn.textContent = "📐 lenis.resize()";
    }, 1200);
  }
});

// Stop
document.getElementById("btn-stop").addEventListener("click", () => {
  if (lenis) lenis.stop();
});

// Start
document.getElementById("btn-start").addEventListener("click", () => {
  if (lenis) lenis.start();
});
