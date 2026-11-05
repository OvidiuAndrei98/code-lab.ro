---
name: clean-editorial-web
description: Build clean, image-led studio and portfolio websites for this user, with editorial typography and smooth, restrained motion. Apply the user's persistent preferences against star decorations, numbered section labels and generic oversized closing CTAs. Use for CODELAB and similar presentation websites, or when the user asks for the Vintila, Breems or FASON direction.
---

# Clean editorial websites

This skill records this user's explicit design preferences, established while rebuilding CODELAB on 2026-10-22. Apply them to this user's presentation websites unless the user later explicitly chooses otherwise. They are personal preferences, not universal design rules and not instructions for unrelated applications.

## Preserve these preferences

- Do not decorate with stars, asterisks, sparkles, starbursts, radial gear shapes or near-identical substitutes. Do not fill unused space with a symbol.
- Do not prefix section labels with decorative `01`, `02`, `03`, `/01` or similar counters. Actual dates, prices and useful measurements are different.
- Do not end the page with the stock giant “Let's talk”, “Have an idea?” or equivalent pitch panel, oversized diagonal arrow and repeated contact slogan. Use a quiet footer with useful navigation and contact access. A reference containing this pattern does not override this preference.
- Default to 2D. Do not add 3D objects, WebGL, animated orbs or abstract rotating shapes to satisfy an “Awwwards” brief.
- Do not return to the rejected combination of lime-on-graphite, an enormous star beside a slogan, a decorative marquee, numbered overlines and a final oversized CTA.

## Compose from the actual material

Study the supplied images or recordings before choosing the hero. For videos, inspect the resting hero, a mid-scroll state, the work overview, navigation and destination transitions. See [reference evidence](references/evidence.md) when adapting the recordings used for CODELAB.

Use a small, shared set of alignments. Establish identity through typography, meaningful images, crop and whitespace. Let images supply color when a neutral interface is enough. Readable body copy stays around 16px; restrained hierarchy does not mean microscopic labels.

Show fewer, more convincing work samples. Keep project identity, scope and destination together; make project links open real destinations. Recompose the image and type relationship for phones instead of shrinking the entire desktop. Do not invent clients, people, ownership, results, testimonials or awards. Label exploratory concepts clearly.

For CODELAB specifically, the business is a small website agency. Show website interfaces, online stores and web applications. Do not position it as an architecture, interior or lifestyle studio by using unrelated photography or invented portfolio entries. A real website screenshot is stronger evidence than the client's photograph with a new wordmark pasted over it. Interactive service examples must be clearly labelled as demos.

CODELAB needs its own typographic identity, distinct from FASON. The user rejected reusing FASON-like serif/editorial typography and requested a more technical direction on 2026-10-22. Choose a deliberate display and text pairing; do not add terminal decorations, code snippets or interface demos just to suggest technology. Keep the copy direct and relevant to website services. When restructuring this site, preserve its right-side revealed menu and smooth incoming page-sheet navigation unless the user explicitly changes that request.

Do not automatically append feature cards, process steps, an accordion, a ticker or a second sales pitch. A section needs specific information that the visitor actually needs. Keep the ending concise.

## Make the motion tangible

When smooth scrolling is requested, use a single Lenis owner. The FASON reference uses `duration: 1.15`, `smoothWheel: true`, `syncTouch: false`, and a GSAP ticker callback converting seconds to milliseconds. Synchronize ScrollTrigger with Lenis. Preserve native touch, keyboard navigation, selection, hash links and scroll history.

Give each moving property one owner. Use GSAP for bounded scroll relationships and coordinated reveals; use CSS transitions for hover and reversible menu states. Prefer transform and opacity. A little image travel, a surface resolving into place and a restrained title entrance can carry the entire motion language.

A side menu can reveal beside a displaced page without changing its layout. Retain scroll position, pause the scroller, keep the page inert, support Escape and restore focus. Route sheet effects must wrap real navigation with working direct links and Back/Forward; a fake modal is not a substitute.

For CODELAB, the user specifically wants the menu attached to the page's right edge throughout opening and closing. Position the closed panel immediately beyond that edge and move both surfaces by the same distance with one animation owner. Do not fade the panel in separately or dismiss it before the return movement finishes. Preserve this relationship when resizing and reversing mid-animation.

With reduced motion, destroy smooth scrolling and spatial scroll effects and retain the useful, composed page. Disable pointer pursuit on touch. Clean up tickers, listeners, timelines and scroll triggers on unmount. Do not let menu changes replay the hero entrance.

## Check the result

Inspect actual desktop and phone renderings, including 320px and a short viewport. Exercise slow and fast scroll, reversal, menu interruption, keyboard focus, real destinations and reduced motion. Check crops, readable contrast, seam alignment and the final static state. Report what was actually tested, without promising an award or a performance score.
