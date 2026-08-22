/* ------------------------------------------------------------------
   Walk rig
   ------------------------------------------------------------------
   The illustrations arrived as flat artwork, so each walking figure is
   cut into three layers at run time: back leg, front leg, body. Every
   layer is the same PNG with a different clip-path, so there are no
   extra image assets - only the joint coordinates below.

   The two leg polygons are split by a line through the hip and overlap
   slightly at the top (OVERLAP, tapering over TAPER px) so no sliver of
   background opens up between the thighs as they swing.

   If the illustrator can supply layered SVGs this whole file gets
   thrown away and the limbs animate directly.
   ------------------------------------------------------------------ */

const TAPER = 34;

/* joint coordinates, in each PNG's own pixels */
const RIG = {
  'fig-push-left':   { w: 106, h: 186, hip: [38, 104], hemY: 118, slope: -0.055, overlap: 7, faces: 1 },
  'fig-carry-right': { w: 109, h: 193, hip: [48, 106], hemY: 130, slope: 0.10, overlap: 8, faces: -1 },
  'fig-push-bar':    { w: 98,  h: 204, hip: [33, 100], hemY: 114, slope: 0.0, overlap: 7, faces: 1 }
};

function divX(r, y) {
  return r.hip[0] + (y - r.hip[1]) * r.slope;
}

/* build the three clipped layers for one figure */
function buildWalker(name, src) {
  const r = RIG[name];
  const hem = r.hemY, h = r.h, w = r.w, ov = r.overlap;
  const xa = divX(r, hem), xb = divX(r, hem + TAPER), xc = divX(r, h);

  const wrap = document.createElement('div');
  wrap.className = 'walker';
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';

  function layer(clip, z) {
    const d = document.createElement('div');
    d.className = 'wpart';
    d.style.width = w + 'px';
    d.style.height = h + 'px';
    d.style.backgroundImage = 'url(' + src + ')';
    d.style.backgroundSize = w + 'px ' + h + 'px';
    d.style.clipPath = clip;
    d.style.zIndex = z;
    d.style.transformOrigin = r.hip[0] + 'px ' + r.hip[1] + 'px';
    wrap.appendChild(d);
    return d;
  }

  const px = n => n.toFixed(2) + 'px';
  const legL = layer('polygon(0px ' + px(hem) + ', ' + px(xa + ov) + ' ' + px(hem) + ', ' +
    px(xb) + ' ' + px(hem + TAPER) + ', ' + px(xc) + ' ' + px(h) + ', 0px ' + px(h) + ')', 1);
  const legR = layer('polygon(' + px(xa - ov) + ' ' + px(hem) + ', ' + px(w) + ' ' + px(hem) + ', ' +
    px(w) + ' ' + px(h) + ', ' + px(xc) + ' ' + px(h) + ', ' + px(xb) + ' ' + px(hem + TAPER) + ')', 2);
  const body = layer('inset(0px 0px ' + px(h - hem) + ' 0px)', 3);

  /* the leg on the side the figure faces reads as the near leg */
  const near = r.faces === 1 ? legR : legL;
  const far = r.faces === 1 ? legL : legR;
  near.style.zIndex = 2;
  far.style.zIndex = 1;

  return { wrap, near, far, body, rig: r };
}
