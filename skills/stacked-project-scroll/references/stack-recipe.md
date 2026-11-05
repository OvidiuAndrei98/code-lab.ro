# Evidence and proposed implementation

Source: `D:/skills videos/cosmo.mp4`, 48.066633 seconds. SHA-256: `bcaaa52f381bbb18bfa250031708341f0821746aca16d07c0472e278428109ea`. The browser identifies `cosmos.studio`. This is a study of rendered desktop behavior, not its source code.

Around 5.8–11.5 s the work gallery progresses through large, centered project views. Around 11.5 s a new project surface overlaps the lower portion of a previous view. Around 43.3 s, multiple differently colored project surfaces are visible with one layered above another. Their curved upper boundaries and shared horizontal placement make the sequence readable as related surfaces. Small project context remains around the media.

The visible evidence supports overlap and continuity. It does not prove a particular smooth-scroll engine, exact sticky geometry, easing, numeric duration, scale factor or GSAP implementation. No phone or keyboard behavior is shown.

## A practical 2D recipe

Keep the sections in normal flow with enough vertical space for each to become readable. A sticky media wrapper can use a top offset that leaves a narrow part of the previous surface visible. Use a small number of cards; the data index may set geometry without becoming a visible numbered section label.

Where outgoing scaling is useful, explore a subtle 1 to 0.96 correction while the next surface enters. Tie it to one bounded scroll interval with linear progress and a short scrub catch-up. This is a tuning proposal, not a measurement of the recording. Keep captions either in normal flow or on an independently stable layer.

Start the first image in a useful state, resolve the final image completely and release the sequence before the footer. Repeated backward scrolling reverses the same owner; it does not spawn new entrance timelines.

On phones, a small overlap with no scaling, or plain stacked media, often preserves the relationship more reliably. With reduced motion, omit the scroll-specific transforms and present an ordinary sequence. Always verify the exact layout and controls in the implementation.
