# Scroll-controlled hero → logo transition

A scroll-scrubbed GSAP/ScrollTrigger prototype: the hero composition
(typography + illustrations + four loose black rectangles) transforms
into the completed logo mark, centred on the second screen.

Everything is tied to scroll progress, so it assembles as you scroll
down and takes itself apart again as you scroll back up.

## Run it

Any static server:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

No build step, no dependencies to install — GSAP 3.12.5 and the webfont
are vendored in the repo.

## How it is put together

| file | what it does |
|---|---|
| `index.html` | the two screens plus the markup for the headline |
| `style.css`  | the design frame, type positions, piece styling |
| `rig.js`     | the walk rig — joint coordinates and the clip-path cuts |
| `main.js`    | geometry tables + the single scrubbed timeline |
| `img/`       | the five illustrations, cut out with alpha |
| `rig-test.html` | phase sheet for tuning the walk cycle |

### The design frame

Everything inside `.canvas` is authored in **design pixels** — the exact
1280 × 741 coordinate space of the supplied Figma exports — and the whole
frame is scaled to the viewport with one `transform: scale()`. That keeps
the build measurement-for-measurement identical to the mockup and keeps
the animation maths trivial.

### The logo, decomposed

The finished mark is the union of **14 rectangles** (`LOGO` in `main.js`):
four horizontal bars plus three connectors for the left glyph, four
vertical bars plus three connectors for the right one. Those coordinates
were read straight off `Desktop-1.png`, so the assembled result matches
the artwork to the pixel.

### The four travellers

Four of those rectangles already exist in the hero — the tilted bar the
two figures are carrying, the long bar she is sitting on, the tall bar by
the tape measure, and the one being pushed bottom-left. Each is rendered
**at its logo position** and then offset back to its hero position with a
transform, so the animation is a pure `x / y / scaleX / scaleY / rotation`
run to identity. No layout thrash, all GPU.

`x` and `y` run on different eases, so the pieces arc across the screen
rather than sliding down a straight line.

### The rest of the mark

The remaining ten rectangles grow out of the pieces that landed —
each one scales from an edge that touches the piece it is attached to
(`GROW` in `main.js`), in an order that reads as the mark completing
itself rather than as ten shapes fading up.

### The figures

Nobody fades. Each figure leaves the frame under its own steam, and only
once the rectangle they were holding has detached:

* the three standing figures **walk off**, on a real cycle;
* the crouching figure's tape measure **retracts and takes him with it**;
* the long bar **shrinks out from under** the seated figure and she drops.

The moment someone lets go they also drop behind the rectangles, so a
piece flying past crosses in front of them instead of through them.

### The walk cycle

The artwork arrived flat, so `rig.js` cuts each walker into three layers
at run time — back leg, front leg, body. Every layer is the *same* PNG
with a different `clip-path`, so there are no extra image assets, only
the joint coordinates in `RIG`.

The two leg polygons are split by a line through the hip and overlap
slightly at the top, tapering over 34px, so no sliver of background opens
up between the thighs at full swing. The legs counter-rotate about the
hip and the body rises and falls twice per stride.

Stride rate is derived from **distance covered**, not from the clock —
one step per ~62px — so scrolling slower makes them step slower.

`rig-test.html` renders any walker at ten phases side by side, which is
how the joint positions were tuned. `?c=tune` switches it to the
parameter-sweep sheet.

If the illustrator can supply layered SVGs, `rig.js` gets thrown away and
the limbs (including arms) animate directly.

## Notes

* `?exit=cut` replaces the walk-offs with a hard cut the instant each
  rectangle detaches, for comparison.
* `?record=1` drops the scrub smoothing, for frame-accurate screen capture.
* `prefers-reduced-motion` skips straight to the finished state.
* `window.__tl` is exposed so you can step the timeline in the console:
  `__tl.progress(0.6)`.
