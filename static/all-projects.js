const config = {
  enableStars: true,
  enableSpotlight: true,
  enableBorderGlow: true,
  spotlightRadius: 300,
  particleCount: 20,
  enableTilt: true,
  glowColor: "132, 0, 255",
  clickEffect: true,
  enableMagnetism: true,
  disableAnimations: false
};

const STAR_PATH = "M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z";

const MOBILE_BREAKPOINT = 768;
let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
const shouldDisableAnimations = () => config.disableAnimations || isMobile;

document.documentElement.style.setProperty('--glow-color', config.glowColor);
document.documentElement.style.setProperty('--glow-radius', `${config.spotlightRadius}px`);

// Inject the 6-star burst markup into every action button, once, instead of
// hand-pasting it in the HTML for every github/launch/docs link.
function injectStarBursts() {
  document.querySelectorAll('.btn-stars').forEach(container => {
    let markup = '';
    for (let i = 1; i <= 6; i++) {
      markup += `<span class="btn-star btn-star-${i}"><svg viewBox="0 0 784.11 815.53"><path class="btn-star-fill" d="${STAR_PATH}"/></svg></span>`;
    }
    container.innerHTML = markup;
  });
}

function createParticle(x, y) {
  const el = document.createElement('span');
  el.className = 'particle';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  return el;
}

function initBoxInteractivity(box) {
  if (shouldDisableAnimations()) return;

  let timeouts = [];
  let activeParticles = [];
  let magnetismTween = null;
  let isHovered = false;

  const spawnParticles = () => {
    if (!isHovered) return;
    const rect = box.getBoundingClientRect();

    for (let i = 0; i < config.particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHovered) return;
        const particle = createParticle(Math.random() * rect.width, Math.random() * rect.height);
        box.appendChild(particle);
        activeParticles.push(particle);

        gsap.fromTo(particle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
        gsap.to(particle, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });
      }, i * 100);
      timeouts.push(timeoutId);
    }
  };

  const clearParticles = () => {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (magnetismTween) magnetismTween.kill();
    activeParticles.forEach(p => gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => p.remove() }));
    activeParticles = [];
  };

  box.addEventListener('mouseenter', () => {
    isHovered = true;
    if (config.enableStars) spawnParticles();
    if (config.enableTilt) {
      gsap.to(box, { rotateX: 3, rotateY: 3, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    }
  });

  box.addEventListener('mouseleave', () => {
    isHovered = false;
    if (config.enableStars) clearParticles();
    if (config.enableTilt) gsap.to(box, { rotateX: 0, rotateY: 0, duration: 0.3, ease: 'power2.out' });
    if (config.enableMagnetism) gsap.to(box, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
  });

  box.addEventListener('mousemove', (e) => {
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (config.enableTilt) {
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      gsap.to(box, { rotateX, rotateY, duration: 0.1, ease: 'power2.out' });
    }

    if (config.enableMagnetism) {
      const magnetX = (x - centerX) * 0.025;
      const magnetY = (y - centerY) * 0.025;
      magnetismTween = gsap.to(box, { x: magnetX, y: magnetY, duration: 0.3, ease: 'power2.out' });
    }
  });

  box.addEventListener('click', (e) => {
    if (!config.clickEffect) return;
    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const maxDistance = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y - rect.height));

    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.width = ripple.style.height = `${maxDistance * 2}px`;
    ripple.style.left = `${x - maxDistance}px`;
    ripple.style.top = `${y - maxDistance}px`;
    box.appendChild(ripple);
    gsap.to(ripple, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => ripple.remove() });
  });
}

function initSpotlight() {
  if (!config.enableSpotlight || shouldDisableAnimations()) return;

  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  document.body.appendChild(spotlight);

  const proximity = config.spotlightRadius * 0.5;
  const fadeDistance = config.spotlightRadius * 0.75;

  document.addEventListener('mousemove', (e) => {
    const boxes = document.querySelectorAll('.bento-box');
    let minDistance = Infinity;

    boxes.forEach(box => {
      const rect = box.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.max(0, Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(rect.width, rect.height) / 2);

      minDistance = Math.min(minDistance, distance);

      let intensity = 0;
      if (distance <= proximity) intensity = 1;
      else if (distance <= fadeDistance) intensity = (fadeDistance - distance) / (fadeDistance - proximity);

      box.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      box.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      box.style.setProperty('--glow-intensity', intensity.toString());
    });

    gsap.to(spotlight, { left: e.clientX, top: e.clientY, duration: 0.1 });
    const targetOpacity = minDistance <= proximity ? 0.8 : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
    gsap.to(spotlight, { opacity: targetOpacity, duration: 0.2 });
  });

  document.addEventListener('mouseleave', () => {
    document.querySelectorAll('.bento-box').forEach(b => b.style.setProperty('--glow-intensity', '0'));
    gsap.to(spotlight, { opacity: 0, duration: 0.3 });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  injectStarBursts();
  document.querySelectorAll('.bento-box').forEach(initBoxInteractivity);
  initSpotlight();
});

window.addEventListener('resize', () => {
  isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
});