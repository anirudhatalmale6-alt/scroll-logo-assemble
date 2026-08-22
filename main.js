/* ------------------------------------------------------------------
   Scroll-controlled hero -> logo transition
   GSAP 3 + ScrollTrigger, scrub-tied so it plays forwards and
   backwards with the scrollbar.

   All geometry below is in "design pixels" taken straight from the
   supplied 1280 x 741 Figma exports, so the build matches the
   mockups measurement-for-measurement. The .canvas element is
   scaled to the viewport, everything inside it stays in design px.
   ------------------------------------------------------------------ */

gsap.registerPlugin(ScrollTrigger);

const DW = 1280, DH = 741;

/* ---------- 1. the finished logo, decomposed into rectangles ------- */
/* union of these 14 rects === Desktop-1.png, verified pixel by pixel */
const LOGO = {
  // left glyph - four horizontal bars joined by three short connectors
  bar1: { x: 368, y: 238, w: 267, h: 61 },
  bar2: { x: 368, y: 306, w: 267, h: 61 },
  bar3: { x: 368, y: 375, w: 267, h: 61 },
  bar4: { x: 368, y: 443, w: 267, h: 61 },
  con1: { x: 368, y: 299, w: 54, h: 7 },   // bar1 -> bar2, left
  con2: { x: 582, y: 367, w: 53, h: 8 },   // bar2 -> bar3, right
  con3: { x: 368, y: 436, w: 53, h: 7 },   // bar3 -> bar4, left
  // right glyph - four vertical bars, alternating top/bottom connectors
  v1: { x: 643, y: 238, w: 61, h: 266 },
  v2: { x: 711, y: 238, w: 61, h: 266 },
  v3: { x: 780, y: 238, w: 61, h: 266 },
  v4: { x: 849, y: 238, w: 61, h: 266 },
  c1: { x: 704, y: 238, w: 7, h: 61 },     // v1 -> v2, top
  c2: { x: 772, y: 450, w: 8, h: 54 },     // v2 -> v3, bottom
  c3: { x: 841, y: 238, w: 8, h: 61 }      // v3 -> v4, top
};

/* ---------- 2. the four black rectangles in the hero --------------- */
/* measured off Desktop.png; `rot` is the tilt of the carried bar      */
const HERO = {
  bar2: { x: 149.0, y: 242.9, w: 282, h: 44.2, rot: -3.6 },  // carried by the two figures
  bar4: { x: 524.0, y: 399.0, w: 655, h: 47.0, rot: 0 },     // the long bar she sits on
  v4:   { x: 997.0, y: 71.0,  w: 45,  h: 130,  rot: 0 },     // top right, by the tape measure
  v1:   { x: 162.0, y: 487.0, w: 42,  h: 153,  rot: 0 }      // bottom left, being pushed
};

/* ---------- 3. illustrations --------------------------------------- */
const FIGS = [
  { f: 'fig-push-left',   x: 75,   y: 197, w: 106, h: 186, out: { x: -150, y: 40 } },
  { f: 'fig-carry-right', x: 414,  y: 190, w: 109, h: 193, out: { x: -110, y: 70 } },
  { f: 'fig-measure',     x: 1044, y: 70,  w: 102, h: 144, out: { x: 170, y: -60 } },
  { f: 'fig-sit',         x: 718,  y: 303, w: 116, h: 181, out: { x: 60, y: 150 } },
  { f: 'fig-push-bar',    x: 96,   y: 446, w: 98,  h: 204, out: { x: -160, y: 90 } }
];

/* The six connectors are sandwiched between two bars. The design frame is
   scaled by a fractional factor, so two rectangles that merely touch leave
   a sub-pixel hairline. Each connector is bled 1px into the black of the
   bars it joins - invisible, and the seam goes away. */
const BLEED = {
  con1: { y: -1, h: 2 }, con2: { y: -1, h: 2 }, con3: { y: -1, h: 2 },
  c1: { x: -1, w: 2 },   c2: { x: -1, w: 2 },   c3: { x: -1, w: 2 }
};

/* ---------- 4. build the DOM --------------------------------------- */
const canvas = document.querySelector('.canvas');
const el = {};

function rect(id, r) {
  const b = BLEED[id] || {};
  const d = document.createElement('div');
  d.className = 'piece';
  d.id = id;
  d.style.left = (r.x + (b.x || 0)) + 'px';
  d.style.top = (r.y + (b.y || 0)) + 'px';
  d.style.width = (r.w + (b.w || 0)) + 'px';
  d.style.height = (r.h + (b.h || 0)) + 'px';
  canvas.appendChild(d);
  el[id] = d;
  return d;
}

Object.keys(LOGO).forEach(k => rect(k, LOGO[k]));

FIGS.forEach(f => {
  const img = document.createElement('img');
  img.className = 'fig';
  img.src = 'img/' + f.f + '.png';
  img.width = f.w;
  img.height = f.h;
  img.alt = '';
  img.style.left = f.x + 'px';
  img.style.top = f.y + 'px';
  canvas.appendChild(img);
  f.el = img;
});

/* ---------- 5. fit the design frame to the viewport ---------------- */
function fit() {
  const s = Math.min(window.innerWidth / DW, window.innerHeight / DH);
  canvas.style.transform = 'scale(' + s + ')';
}
fit();
window.addEventListener('resize', () => { fit(); ScrollTrigger.refresh(); });

/* ---------- 6. seed the travelling pieces at their hero position ---- */
/* transform-origin is the centre, so a rect of size (w,h) placed at    */
/* its logo slot renders exactly over its hero slot when we apply       */
/* the delta below.                                                     */
function heroState(key) {
  const a = HERO[key], b = LOGO[key];
  return {
    x: (a.x + a.w / 2) - (b.x + b.w / 2),
    y: (a.y + a.h / 2) - (b.y + b.h / 2),
    scaleX: a.w / b.w,
    scaleY: a.h / b.h,
    rotation: a.rot
  };
}

const TRAVELLERS = ['bar2', 'bar4', 'v4', 'v1'];
TRAVELLERS.forEach(k => gsap.set(el[k], heroState(k)));

/* pieces that grow out of the ones that flew in */
const GROW = {
  con1: { transformOrigin: '50% 100%', scaleY: 0 },   // up out of bar2
  bar1: { transformOrigin: '50% 100%', scaleY: 0 },   // up out of con1
  con2: { transformOrigin: '50% 0%',   scaleY: 0 },   // down out of bar2
  bar3: { transformOrigin: '100% 50%', scaleX: 0 },   // wipes left out of con2
  con3: { transformOrigin: '50% 0%',   scaleY: 0 },   // down out of bar3
  c1:   { transformOrigin: '0% 50%',   scaleX: 0 },   // right out of v1
  v2:   { transformOrigin: '50% 0%',   scaleY: 0 },   // down out of c1
  c3:   { transformOrigin: '100% 50%', scaleX: 0 },   // left out of v4
  v3:   { transformOrigin: '50% 0%',   scaleY: 0 },   // down out of c3
  c2:   { transformOrigin: '0% 50%',   scaleX: 0 }    // right out of v2
};
Object.keys(GROW).forEach(k => gsap.set(el[k], GROW[k]));

/* ---------- 7. the timeline ---------------------------------------- */
const lines = gsap.utils.toArray('.line');
const readout = document.querySelector('.readout b');
const readoutBar = document.querySelector('.bar i');

/* ?record=1 removes the scrub smoothing so frames can be grabbed
   deterministically for a screen capture */
const RECORD = /[?&]record=1/.test(location.search);

const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '.pin-wrap',
    start: 'top top',
    end: '+=320%',
    pin: '.pin-wrap',
    scrub: RECORD ? true : 0.6,
    anticipatePin: 1,
    onUpdate: self => {
      const p = Math.round(self.progress * 100);
      if (readout) readout.textContent = p + '%';
      if (readoutBar) readoutBar.style.width = p + '%';
    }
  }
});

/* -- typography clears out ------------------------------------------ */
tl.to('.l1', { y: -180, opacity: 0, ease: 'power2.in', duration: 0.9 }, 0)
  .to('.l2', { x: 240, opacity: 0, ease: 'power2.in', duration: 0.9 }, 0.06)
  .to('.l3', { x: -220, opacity: 0, ease: 'power2.in', duration: 0.9 }, 0.12)
  .to('.l4', { y: 200, opacity: 0, ease: 'power2.in', duration: 0.9 }, 0.18);

/* -- illustrations let go and drift away ----------------------------- */
FIGS.forEach((f, i) => {
  tl.to(f.el, {
    x: f.out.x, y: f.out.y, opacity: 0, scale: 0.94,
    ease: 'power2.in', duration: 1.0
  }, 0.04 * i);
});

/* -- the four rectangles detach and travel --------------------------- */
/* x and y run on different eases so each piece arcs rather than
   sliding on a straight line                                          */
function travel(key, at, dur) {
  tl.to(el[key], { x: 0, ease: 'power2.inOut', duration: dur }, at)
    .to(el[key], { y: 0, ease: 'power3.inOut', duration: dur }, at)
    .to(el[key], {
      scaleX: 1, scaleY: 1, rotation: 0,
      ease: 'power2.inOut', duration: dur * 0.86
    }, at + dur * 0.14);
}
travel('v1',   0.30, 1.85);   // longest journey, leaves first
travel('bar4', 0.48, 1.60);
travel('v4',   0.62, 1.55);
travel('bar2', 0.78, 1.45);

/* -- the mark completes itself out of the pieces that landed --------- */
const ASSEMBLE = [
  ['con1', 2.30, 0.18, 'scaleY'],
  ['bar1', 2.42, 0.34, 'scaleY'],
  ['c1',   2.44, 0.18, 'scaleX'],
  ['v2',   2.56, 0.34, 'scaleY'],
  ['con2', 2.58, 0.18, 'scaleY'],
  ['bar3', 2.68, 0.36, 'scaleX'],
  ['c3',   2.70, 0.18, 'scaleX'],
  ['v3',   2.82, 0.34, 'scaleY'],
  ['con3', 2.98, 0.16, 'scaleY'],
  ['c2',   3.06, 0.20, 'scaleX']
];
ASSEMBLE.forEach(([k, at, dur, prop]) => {
  tl.to(el[k], { [prop]: 1, ease: 'power2.out', duration: dur }, at);
});

/* the scroll cue gets out of the way once the user has started */
tl.to('.hint', { opacity: 0, y: 14, ease: 'power1.in', duration: 0.5 }, 0);

/* a last settle so the finished mark lands rather than stopping dead */
tl.to({}, { duration: 0.35 }, 3.26);

window.__tl = tl;   // handy for stepping through the timeline in the console

/* ---------- 8. reduced motion --------------------------------------- */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  tl.scrollTrigger.kill();
  tl.progress(1);
  gsap.set('.stage', { position: 'relative' });
}
