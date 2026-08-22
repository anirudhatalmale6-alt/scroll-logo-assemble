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
/* Nobody fades. Each figure leaves the frame under its own steam, and
   only once the rectangle they were holding has actually detached.
   `walk` = rigged walk cycle (see rig.js), `yank` = the tape measure
   retracts and takes him with it, `drop` = the bar shrinks out from
   under her.                                                        */
const FIGS = [
  { f: 'fig-push-bar', x: 96, y: 446, w: 98, h: 204,
    walk: { at: 0.38, dur: 0.75, dist: -215, turn: true, near: 15, far: 15, bob: 3 } },

  /* he is crouched over a tape measure, so he cannot walk - he rocks
     back when his subject vanishes and scurries out still crouching */
  { f: 'fig-measure', x: 1044, y: 70, w: 102, h: 144,
    yank: { at: 0.62, anti: 0.18, dur: 0.55, dx: 235, back: -14, rock: -12, pitch: 15, hops: 2, rise: 13 } },

  { f: 'fig-push-left', x: 75, y: 197, w: 106, h: 186,
    walk: { at: 0.80, dur: 0.70, dist: -200, turn: true, near: 15, far: 15, bob: 3 } },

  { f: 'fig-sit', x: 718, y: 303, w: 116, h: 181,
    drop: { at: 1.05, dur: 0.75, dy: 470, dx: -40, rot: 16 } },

  /* he is the furthest from the left edge, so he leaves last and slowest -
     that also keeps him from walking through her on the way out */
  { f: 'fig-carry-right', x: 414, y: 190, w: 109, h: 193,
    walk: { at: 1.00, dur: 1.05, dist: -540, turn: false, near: 12, far: 9, bob: 4 } }
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

/* Each figure gets three nested boxes so the transforms never fight:
   .fig travels, .fig-flip turns the figure round, .walker bobs.       */
FIGS.forEach(f => {
  const holder = document.createElement('div');
  holder.className = 'fig';
  holder.style.left = f.x + 'px';
  holder.style.top = f.y + 'px';
  holder.style.width = f.w + 'px';
  holder.style.height = f.h + 'px';

  const flip = document.createElement('div');
  flip.className = 'fig-flip';
  holder.appendChild(flip);

  if (f.walk) {
    const wk = buildWalker(f.f, 'img/' + f.f + '.png');
    flip.appendChild(wk.wrap);
    f.parts = wk;
  } else {
    const img = document.createElement('img');
    img.src = 'img/' + f.f + '.png';
    img.width = f.w;
    img.height = f.h;
    img.alt = '';
    img.draggable = false;
    flip.appendChild(img);
  }

  canvas.appendChild(holder);
  f.el = holder;
  f.flip = flip;
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

/* -- the figures leave under their own steam ------------------------- */
/* ?exit=cut swaps the walk-offs for a hard cut the instant each
   rectangle detaches, so both options can be compared side by side */
const CUT = /[?&]exit=cut/.test(location.search);

FIGS.forEach(f => {
  const spec = f.walk || f.yank || f.drop;

  /* once someone has let go, they drop behind the rectangles - so a piece
     flying past crosses in front of them instead of through them */
  tl.set(f.el, { zIndex: 1 }, spec.at);

  if (CUT) {
    tl.set(f.el, { autoAlpha: 0 }, spec.at);
    return;
  }

  if (f.walk) {
    const w = f.walk;
    /* one step per ~62px covered, so the stride rate matches the distance
       travelled rather than the clock - scroll slower, they step slower */
    const steps = Math.max(3, Math.round(Math.abs(w.dist) / 62));
    const stepDur = w.dur / steps;

    if (w.turn) {
      /* squashing through scaleX 0 reads as the figure turning round */
      tl.to(f.flip, { scaleX: -1, ease: 'power2.inOut', duration: 0.16 }, w.at);
    }
    tl.to(f.el, { x: w.dist, ease: 'power1.in', duration: w.dur }, w.at);

    tl.fromTo(f.parts.near, { rotation: w.near },
      { rotation: -w.near, duration: stepDur, repeat: steps - 1, yoyo: true, ease: 'sine.inOut' }, w.at);
    tl.fromTo(f.parts.far, { rotation: -w.far },
      { rotation: w.far, duration: stepDur, repeat: steps - 1, yoyo: true, ease: 'sine.inOut' }, w.at);
    /* the body rises and falls twice per stride */
    tl.fromTo(f.parts.wrap, { y: 0 },
      { y: -w.bob, duration: stepDur / 2, repeat: steps * 2 - 1, yoyo: true, ease: 'sine.inOut' }, w.at);
  }

  if (f.yank) {
    const y = f.yank;
    /* anticipation - he rocks back on his heels as his subject leaves */
    tl.to(f.el, { x: y.back, ease: 'sine.out', duration: y.anti }, y.at)
      .to(f.flip, { rotation: y.rock, ease: 'back.out(1.6)', duration: y.anti }, y.at);
    /* then the tape retracts and takes him with it - he scrambles after
       it rather than sliding, so the exit still reads as self-propelled */
    const go = y.at + y.anti;
    tl.to(f.el, { x: y.dx, ease: 'power2.in', duration: y.dur }, go)
      .to(f.flip, { rotation: y.pitch, ease: 'power2.in', duration: y.dur }, go);
    tl.fromTo(f.el, { y: 0 },
      { y: -y.rise, duration: y.dur / (y.hops * 2), repeat: y.hops * 2 - 1, yoyo: true, ease: 'sine.out' }, go);
  }

  if (f.drop) {
    const d = f.drop;
    /* the bar shrinks out from under her, so she goes straight down */
    tl.to(f.el, { y: d.dy, ease: 'power2.in', duration: d.dur }, d.at)
      .to(f.el, { x: d.dx, ease: 'sine.out', duration: d.dur }, d.at)
      .to(f.flip, { rotation: d.rot, ease: 'sine.in', duration: d.dur }, d.at);
  }
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
