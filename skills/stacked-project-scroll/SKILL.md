---
name: stacked-project-scroll
description: Build overlapping project-media sequences where the next work surface arrives over the previous one during vertical scrolling, inspired by the user's Cosmos recording. Use for a stacked portfolio showcase, not for ordinary cards, carousels or route-cover transitions.
---

# Stacked work on scroll

Build a bounded sequence of real project surfaces with visible continuity as the next arrives. See [the evidence and implementation recipe](references/stack-recipe.md) for what was observed in the supplied recording and what is an implementation proposal.

## Keep the project real before animating it

Start with one semantic article and one meaningful destination per project. Include a readable identity and useful context. Keep direct links, modified clicks, keyboard activation and Back/Forward working. A screenshot or decorative layer never becomes a second interactive copy of a project.

Choose the media crop, shared card width and reading order first. The next card should visibly belong to the sequence, with a restrained overlap or visible edge. Do not leave a half-cut title or partially hidden previous image as the final resting state.

## Let the surfaces carry the transition

Use the current animation stack. CSS sticky positioning can own the stable card relationship; GSAP ScrollTrigger can own a bounded transform or opacity correction. Never let CSS, a scrub tween and a separate entrance all animate the same transform.

A surface arrives from below, becomes fully legible, and gives way to the next. An optional small scale correction on the outgoing surface can make the handoff clear. Keep text on a stable child when the surface itself moves. Do not introduce 3D rotation, shaders, fake progress counters or decorative stars.

Preserve document scroll. Avoid trapping the visitor in a very long pinned section. Account for sticky offsets and total sequence height; keep the last project and the content after it reachable. Recalculate after the actual fonts and images establish their sizes, not continuously during each frame.

If Lenis already owns smooth scrolling, feed its scroll changes to ScrollTrigger and use the same ticker. Do not install a second scroll owner or animate the body position. Pause the existing owner for modal navigation and resume the current state without replaying the work sequence.

## Recompose on phones and with reduced motion

On short or narrow viewports, reduce the overlap or use normal stacked images. Do not shrink the entire desktop card to fit. Keep titles, captions and targets outside any temporary clipping region when necessary.

With reduced motion, retain the final readable images and normal project links, without pursuit, scrubbed scaling or extended pinning. A visitor must be able to understand the same selection without running the animation.

Check forward and reverse scroll, rapid reversal, the first and last project, navigation while partially overlapped, keyboard focus, direct entry and a short phone viewport. Verify there are no clipping seams, transparent input shields, stale transforms or horizontal overflow. Distinguish code verification from motion feel that still needs a real-device check.
