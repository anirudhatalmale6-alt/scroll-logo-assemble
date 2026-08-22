# Webflow integration

Notes for the developer building the site. The animation is a paste-in —
you do not need to read or understand the timeline to install it.

Nobody needs to give me access to the Webflow account. I need one thing
back: the staging URL (`your-site.webflow.io`) so I can test the real
build at real breakpoints.

---

## GSAP licensing

None to buy. GSAP is free, including ScrollTrigger and the former Club
plugins — Webflow acquired GSAP and released the whole toolset for free.
Load it from the CDN, or use Webflow's built-in GSAP option if you are
already on it. Do not ship two copies of GSAP; if the site loads it
already, skip the two `<script>` tags below.

---

## Option A — native build (recommended)

The headline stays real text, editable in the Designer and visible to
search engines. You build the two sections the way you normally would and
put my names on a handful of elements. The script finds them by name,
measures where they actually are on the page, and animates from there —
so if the layout is later nudged in the Designer, the animation follows
it. Nothing is hard-coded to a fixed canvas.

### Structure

```
section          .hero-pin           <- the pinned section
  div            .hero-stage         <- position: relative, full viewport
    heading      .hero-line          <- one per line of the headline
    image        .hero-fig     + id  <- one per illustration
    div          .hero-piece   + id  <- one per black rectangle
section          .logo-screen        <- second screen
  div            .logo-mark          <- position: relative, holds the mark
    div          .logo-piece   + id  <- one per rectangle of the logo
```

`.hero-piece` and `.logo-piece` are plain divs with a black background —
no images. Give each one an ID from the table below.

### IDs

Four rectangles exist in the hero and travel into the mark. Their hero
element and their logo element share the same suffix, and that pairing is
the whole trick:

| hero element | logo element | what it is |
|---|---|---|
| `hero-bar2`  | `logo-bar2` | the tilted bar the two figures carry |
| `hero-bar4`  | `logo-bar4` | the long bar she sits on |
| `hero-v1`    | `logo-v1`   | the tall bar being pushed, bottom left |
| `hero-v4`    | `logo-v4`   | the tall bar by the tape measure |

The remaining ten pieces of the mark exist only on screen two and grow
out of the four that landed:

`logo-bar1` `logo-bar3` `logo-con1` `logo-con2` `logo-con3`
`logo-c1` `logo-c2` `logo-c3` `logo-v2` `logo-v3`

Illustrations:

`fig-push-bar` `fig-measure` `fig-push-left` `fig-sit` `fig-carry-right`

That is the entire contract. Everything else — how you lay the sections
out, what the class names are on the wrappers, your breakpoints — is
yours.

### Where the code goes

Page Settings → Custom Code → Before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="…/scroll-logo.js"></script>
```

and the small CSS block into Page Settings → Inside `<head>`.

`scroll-logo.js` can be hosted on the CDN, uploaded to Webflow assets, or
pasted inline — whichever suits you. It is one file, commented, no build
step and no dependencies beyond GSAP.

### Two things to watch

* Do not set `overflow: hidden` on the pinned section. ScrollTrigger
  inserts a pin-spacer around it and a fixed-height, clipped wrapper
  cannot grow around that — the next section bleeds through. Clip the
  inner stage instead if you need to.
* The pieces must be positioned, not laid out in flow. Absolute inside
  the stage is fine; flex/grid children get re-laid-out mid-animation.

---

## Option B — self-contained embed

The whole composition ships as one Embed element and you touch nothing at
all. Faster to install and impossible to break, but the headline is then
locked inside code rather than editable in the Designer, so it is worth
it only if these two screens are a fixed graphic block.

The current demo is built this way, so it is a drop-in as it stands.

---

## Assets I still need

* the brand typeface (the demo uses a stand-in matched to the mockup's
  measured cap height and tracking — swapping the real font in re-solves
  the letter-spacing);
* the illustrations as layered SVG if the illustrator has them. Flat PNGs
  work — the walk cycle is rigged at runtime with clip-paths — but with
  layers the limbs, including arms, animate directly.

## Mobile

The desktop composition currently scales down as a unit. A proper mobile
composition (fewer travelling pieces, re-stacked headline) is a separate
pass — say the word and I will do it against your real breakpoints.
